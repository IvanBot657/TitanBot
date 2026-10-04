// ==========================================
// 💍 TITANBOT - SISTEMA DE MATRIMONIO
// ==========================================
// Comandos:
// .casar @usuario
// .matrimonio
// .divorcio
//
// Guarda los matrimonios en:
// database/matrimonios.json
//
// Compatible con:
// await casar(sock, chat, comando, args, id, msg);
// ==========================================

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");

// ==========================================
// 📁 BASE DE DATOS
// ==========================================

const databaseDir = path.join(__dirname, "..", "database");
const databaseFile = path.join(
  databaseDir,
  "matrimonios.json"
);

// Crear carpeta database si no existe
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, {
    recursive: true
  });
}

// Crear archivo si no existe
if (!fs.existsSync(databaseFile)) {
  fs.writeFileSync(
    databaseFile,
    JSON.stringify([], null, 2)
  );
}

// ==========================================
// 📖 LEER BASE DE DATOS
// ==========================================

function leerMatrimonios() {
  try {
    const contenido = fs.readFileSync(
      databaseFile,
      "utf8"
    );

    if (!contenido.trim()) {
      return [];
    }

    const datos = JSON.parse(contenido);

    return Array.isArray(datos) ? datos : [];

  } catch (error) {

    console.error(
      "❌ Error leyendo matrimonios:",
      error
    );

    return [];
  }
}

// ==========================================
// 💾 GUARDAR BASE DE DATOS
// ==========================================

function guardarMatrimonios(datos) {
  try {

    fs.writeFileSync(
      databaseFile,
      JSON.stringify(datos, null, 2)
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Error guardando matrimonios:",
      error
    );

    return false;
  }
}

// ==========================================
// 🆔 OBTENER JID
// ==========================================

function obtenerJid(texto) {

  if (!texto) {
    return null;
  }

  const numero = texto
    .replace("@", "")
    .replace(/\D/g, "");

  if (!numero) {
    return null;
  }

  return numero + "@s.whatsapp.net";
}

// ==========================================
// 👤 OBTENER MENCIONADO
// ==========================================

function obtenerMencionado(msg, args) {

  // ------------------------------------------
  // 1. Revisar menciones de WhatsApp
  // ------------------------------------------

  try {

    const contexto =
      msg?.message?.extendedTextMessage?.contextInfo ||
      msg?.message?.imageMessage?.contextInfo ||
      msg?.message?.videoMessage?.contextInfo ||
      msg?.message?.conversation?.contextInfo;

    if (
      contexto &&
      contexto.mentionedJid &&
      contexto.mentionedJid.length > 0
    ) {

      return contexto.mentionedJid[0];
    }

  } catch (error) {
    // Continuar con el método alternativo
  }

  // ------------------------------------------
  // 2. Revisar texto @numero
  // ------------------------------------------

  if (Array.isArray(args)) {

    for (const argumento of args) {

      if (argumento.startsWith("@")) {

        const jid = obtenerJid(argumento);

        if (jid) {
          return jid;
        }
      }
    }
  }

  return null;
}

// ==========================================
// 👤 OBTENER ID DEL USUARIO
// ==========================================

function obtenerId(id, msg) {

  if (id) {
    return id;
  }

  try {

    const remoteJid =
      msg?.key?.participant ||
      msg?.key?.remoteJid;

    return remoteJid || null;

  } catch (error) {

    return null;
  }
}

// ==========================================
// 🔢 LIMPIAR JID
// ==========================================

function limpiarJid(jid) {

  if (!jid) {
    return null;
  }

  return jid
    .replace("@s.whatsapp.net", "")
    .replace("@c.us", "")
    .replace("@lid", "");
}

// ==========================================
// 💍 BUSCAR MATRIMONIO DEL USUARIO
// ==========================================

function buscarMatrimonio(datos, usuario) {

  if (!usuario) {
    return null;
  }

  return datos.find(matrimonio => {

    return (
      matrimonio.persona1 === usuario ||
      matrimonio.persona2 === usuario
    );

  }) || null;
}

// ==========================================
// ❤️ OBTENER PAREJA
// ==========================================

function obtenerPareja(matrimonio, usuario) {

  if (!matrimonio) {
    return null;
  }

  if (matrimonio.persona1 === usuario) {
    return matrimonio.persona2;
  }

  if (matrimonio.persona2 === usuario) {
    return matrimonio.persona1;
  }

  return null;
}

// ==========================================
// 🖼️ OBTENER FOTO DE PERFIL
// ==========================================

async function obtenerFotoPerfil(sock, jid) {

  try {

    const url = await sock.profilePictureUrl(
      jid,
      "image"
    );

    if (!url) {
      return null;
    }

    const respuesta = await axios.get(
      url,
      {
        responseType: "arraybuffer",
        timeout: 10000
      }
    );

    return Buffer.from(
      respuesta.data
    );

  } catch (error) {

    console.log(
      "⚠️ No se pudo obtener foto:",
      limpiarJid(jid)
    );

    return null;
  }
}

// ==========================================
// 🖼️ FOTO POR DEFECTO
// ==========================================

async function crearFotoDefault() {

  return await sharp({
    create: {
      width: 500,
      height: 500,
      channels: 4,
      background: {
        r: 220,
        g: 220,
        b: 220,
        alpha: 1
      }
    }
  })
    .png()
    .toBuffer();
}

// ==========================================
// ✂️ REDONDEAR FOTO
// ==========================================

async function hacerCircular(buffer) {

  try {

    const imagen = sharp(buffer);

    const metadata =
      await imagen.metadata();

    const tamaño = Math.min(
      metadata.width || 500,
      metadata.height || 500
    );

    const radio = tamaño / 2;

    const circulo = Buffer.from(`
      <svg width="${tamaño}" height="${tamaño}">
        <circle
          cx="${radio}"
          cy="${radio}"
          r="${radio}"
          fill="white"
        />
      </svg>
    `);

    return await imagen
      .resize(tamaño, tamaño, {
        fit: "cover"
      })
      .composite([
        {
          input: circulo,
          blend: "dest-in"
        }
      ])
      .png()
      .toBuffer();

  } catch (error) {

    return buffer;
  }
}

// ==========================================
// 💍 CREAR IMAGEN DE MATRIMONIO
// ==========================================

async function crearImagenMatrimonio(
  sock,
  persona1,
  persona2
) {

  try {

    console.log(
      "🖼️ Creando imagen de matrimonio..."
    );

    // ----------------------------------------
    // Obtener fotos
    // ----------------------------------------

    let foto1 =
      await obtenerFotoPerfil(
        sock,
        persona1
      );

    let foto2 =
      await obtenerFotoPerfil(
        sock,
        persona2
      );

    if (!foto1) {
      foto1 = await crearFotoDefault();
    }

    if (!foto2) {
      foto2 = await crearFotoDefault();
    }

    // ----------------------------------------
    // Redimensionar
    // ----------------------------------------

    foto1 = await hacerCircular(
      await sharp(foto1)
        .resize(350, 350, {
          fit: "cover"
        })
        .png()
        .toBuffer()
    );

    foto2 = await hacerCircular(
      await sharp(foto2)
        .resize(350, 350, {
          fit: "cover"
        })
        .png()
        .toBuffer()
    );

    // ----------------------------------------
    // Fondo
    // ----------------------------------------

    const ancho = 1000;
    const alto = 650;

    // ----------------------------------------
    // SVG para diseño
    // ----------------------------------------

    const fondo = `
    <svg
      width="${ancho}"
      height="${alto}"
      xmlns="http://www.w3.org/2000/svg"
    >

      <defs>

        <linearGradient
          id="fondo"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >

          <stop
            offset="0%"
            stop-color="#ff758c"
          />

          <stop
            offset="100%"
            stop-color="#ff7eb3"
          />

        </linearGradient>

      </defs>

      <rect
        width="100%"
        height="100%"
        fill="url(#fondo)"
      />

      <text
        x="500"
        y="90"
        text-anchor="middle"
        font-family="Arial"
        font-size="55"
        font-weight="bold"
        fill="white"
      >
        💍 MATRIMONIO 💍
      </text>

      <text
        x="500"
        y="150"
        text-anchor="middle"
        font-family="Arial"
        font-size="30"
        fill="white"
      >
        TITANBOT
      </text>

      <text
        x="500"
        y="560"
        text-anchor="middle"
        font-family="Arial"
        font-size="45"
        font-weight="bold"
        fill="white"
      >
        ❤️ PARA SIEMPRE ❤️
      </text>

      <text
        x="500"
        y="615"
        text-anchor="middle"
        font-family="Arial"
        font-size="25"
        fill="white"
      >
        Que viva el amor
      </text>

    </svg>
    `;

    // ----------------------------------------
    // Crear imagen
    // ----------------------------------------

    const resultado = await sharp({
      create: {
        width: ancho,
        height: alto,
        channels: 4,
        background: {
          r: 255,
          g: 117,
          b: 140,
          alpha: 1
        }
      }
    })
      .composite([

        {
          input: Buffer.from(fondo),
          top: 0,
          left: 0
        },

        {
          input: foto1,
          top: 180,
          left: 120
        },

        {
          input: foto2,
          top: 180,
          left: 530
        }

      ])
      .jpeg({
        quality: 90
      })
      .toBuffer();

    return resultado;

  } catch (error) {

    console.error(
      "❌ Error creando imagen:",
      error
    );

    return null;
  }
}

// ==========================================
// 👤 OBTENER NOMBRE
// ==========================================

function obtenerNombre(
  msg,
  jid,
  esPrimero = false
) {

  try {

    if (
      msg?.pushName &&
      esPrimero
    ) {
      return msg.pushName;
    }

  } catch (error) {}

  return (
    "@" +
    limpiarJid(jid)
  );
}

// ==========================================
// 💍 COMANDO PRINCIPAL
// ==========================================

async function casar(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  try {

    const cmd = String(
      comando || ""
    ).toLowerCase();

    const usuario = obtenerId(
      id,
      msg
    );

    // ======================================
    // 💍 .CASAR
    // ======================================

    if (
      cmd === "casar" ||
      cmd === "matrimonio"
    ) {

      const datos =
        leerMatrimonios();

      // ------------------------------------
      // .matrimonio
      // ------------------------------------

      if (cmd === "matrimonio") {

        const matrimonio =
          buscarMatrimonio(
            datos,
            usuario
          );

        if (!matrimonio) {

          await sock.sendMessage(
            chat,
            {
              text:
                "💔 No estás casado actualmente.\n\n" +
                "💍 Puedes usar:\n" +
                ".casar @usuario"
            }
          );

          return true;
        }

        const pareja =
          obtenerPareja(
            matrimonio,
            usuario
          );

        await sock.sendMessage(
          chat,
          {
            text:
              "💍 *TU MATRIMONIO*\n\n" +
              "❤️ Estado: Casado/a\n" +
              "💑 Pareja: @" +
              limpiarJid(pareja) +
              "\n\n" +
              "📅 Fecha: " +
              matrimonio.fecha +
              "\n\n" +
              "❤️ ¡Que viva el amor!",
            mentions: [
              pareja
            ]
          }
        );

        return true;
      }

      // ------------------------------------
      // .casar
      // ------------------------------------

      const objetivo =
        obtenerMencionado(
          msg,
          args
        );

      if (!objetivo) {

        await sock.sendMessage(
          chat,
          {
            text:
              "💍 *CASAMIENTO*\n\n" +
              "Debes mencionar a la persona con la que quieres casarte.\n\n" +
              "Ejemplo:\n" +
              "`.casar @usuario`"
          }
        );

        return true;
      }

      // ------------------------------------
      // Evitar casarse consigo mismo
      // ------------------------------------

      if (
        limpiarJid(usuario) ===
        limpiarJid(objetivo)
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              "😂 No puedes casarte contigo mismo.\n\n" +
              "Busca una pareja primero. 💍"
          }
        );

        return true;
      }

      // ------------------------------------
      // Revisar si ya está casado
      // ------------------------------------

      const matrimonioUsuario =
        buscarMatrimonio(
          datos,
          usuario
        );

      if (matrimonioUsuario) {

        const pareja =
          obtenerPareja(
            matrimonioUsuario,
            usuario
          );

        await sock.sendMessage(
          chat,
          {
            text:
              "💍 Ya estás casado/a.\n\n" +
              "❤️ Tu pareja es @" +
              limpiarJid(pareja) +
              ".\n\n" +
              "💔 Usa `.divorcio` si quieres terminar ese matrimonio.",
            mentions: [
              pareja
            ]
          }
        );

        return true;
      }

      // ------------------------------------
      // Revisar si objetivo ya está casado
      // ------------------------------------

      const matrimonioObjetivo =
        buscarMatrimonio(
          datos,
          objetivo
        );

      if (matrimonioObjetivo) {

        const pareja =
          obtenerPareja(
            matrimonioObjetivo,
            objetivo
          );

        await sock.sendMessage(
          chat,
          {
            text:
              "💔 Esa persona ya está casada con @" +
              limpiarJid(pareja) +
              ".",
            mentions: [
              pareja
            ]
          }
        );

        return true;
      }

      // ------------------------------------
      // Crear matrimonio
      // ------------------------------------

      const fecha =
        new Date().toLocaleDateString(
          "es-CO"
        );

      const nuevoMatrimonio = {

        persona1: usuario,

        persona2: objetivo,

        fecha: fecha,

        timestamp:
          Date.now()

      };

      datos.push(
        nuevoMatrimonio
      );

      const guardado =
        guardarMatrimonios(
          datos
        );

      if (!guardado) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No se pudo guardar el matrimonio."
          }
        );

        return true;
      }

      // ------------------------------------
      // Crear imagen
      // ------------------------------------

      const imagen =
        await crearImagenMatrimonio(
          sock,
          usuario,
          objetivo
        );

      // ------------------------------------
      // Enviar resultado
      // ------------------------------------

      if (imagen) {

        await sock.sendMessage(
          chat,
          {
            image: imagen,

            caption:
              "💍❤️ *¡MATRIMONIO CONFIRMADO!* ❤️💍\n\n" +

              "👤 @" +
              limpiarJid(usuario) +

              "\n❤️💍❤️\n" +

              "👤 @" +
              limpiarJid(objetivo) +

              "\n\n" +

              "📅 Fecha: " +
              fecha +

              "\n\n" +

              "🎉 ¡Felicidades a los recién casados!\n" +
              "❤️ Que viva el amor.",

            mentions: [
              usuario,
              objetivo
            ]
          }
        );

      } else {

        await sock.sendMessage(
          chat,
          {
            text:
              "💍❤️ *¡MATRIMONIO CONFIRMADO!* ❤️💍\n\n" +

              "👤 @" +
              limpiarJid(usuario) +

              "\n❤️💍❤️\n" +

              "👤 @" +
              limpiarJid(objetivo) +

              "\n\n" +

              "📅 Fecha: " +
              fecha +

              "\n\n" +

              "🎉 ¡Felicidades a los recién casados!",
            mentions: [
              usuario,
              objetivo
            ]
          }
        );
      }

      return true;
    }

    // ======================================
    // 💔 .DIVORCIO
    // ======================================

    if (
      cmd === "divorcio" ||
      cmd === "divorciar"
    ) {

      const datos =
        leerMatrimonios();

      const matrimonio =
        buscarMatrimonio(
          datos,
          usuario
        );

      if (!matrimonio) {

        await sock.sendMessage(
          chat,
          {
            text:
              "💔 No estás casado/a.\n\n" +
              "No puedes divorciarte si no tienes un matrimonio registrado."
          }
        );

        return true;
      }

      const pareja =
        obtenerPareja(
          matrimonio,
          usuario
        );

      // ------------------------------------
      // Eliminar matrimonio
      // ------------------------------------

      const nuevosDatos =
        datos.filter(
          matrimonioActual => {

            return (
              matrimonioActual.persona1 !== usuario &&
              matrimonioActual.persona2 !== usuario
            );

          }
        );

      const guardado =
        guardarMatrimonios(
          nuevosDatos
        );

      if (!guardado) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No se pudo procesar el divorcio."
          }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text:
            "💔 *DIVORCIO COMPLETADO*\n\n" +

            "👤 @" +
            limpiarJid(usuario) +

            "\n💔\n" +

            "👤 @" +
            limpiarJid(pareja) +

            "\n\n" +

            "📜 El matrimonio ha sido eliminado de la base de datos.\n\n" +

            "😔 Fin de la relación.",
          mentions: [
            usuario,
            pareja
          ]
        }
      );

      return true;
    }

    // ======================================
    // No corresponde a este comando
    // ======================================

    return false;

  } catch (error) {

    console.error(
      "❌ Error en commands/casar.js:",
      error
    );

    try {

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ Ocurrió un error ejecutando el sistema de matrimonio."
        }
      );

    } catch (errorEnvio) {

      console.error(
        "❌ No se pudo enviar error:",
        errorEnvio
      );
    }

    return true;
  }
}

// ==========================================
// 📤 EXPORTAR
// ==========================================

module.exports = casar;
