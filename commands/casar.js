// ==========================================
// 💍 TITANBOT - SISTEMA DE MATRIMONIO
// ==========================================
// .casar @usuario
// .matrimonio
// .divorcio
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

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

if (!fs.existsSync(databaseFile)) {
  fs.writeFileSync(
    databaseFile,
    JSON.stringify([], null, 2)
  );
}

// ==========================================
// 📖 BASE DE DATOS
// ==========================================

function leerMatrimonios() {
  try {
    const data = fs.readFileSync(
      databaseFile,
      "utf8"
    );

    if (!data.trim()) return [];

    const json = JSON.parse(data);

    return Array.isArray(json) ? json : [];

  } catch (error) {

    console.error(
      "❌ Error leyendo matrimonios:",
      error
    );

    return [];
  }
}

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
// 🆔 LIMPIAR JID
// ==========================================

function limpiarJid(jid) {

  if (!jid) return "";

  return jid
    .replace("@s.whatsapp.net", "")
    .replace("@c.us", "")
    .replace("@lid", "");
}

// ==========================================
// 👤 OBTENER ID
// ==========================================

function obtenerId(id, msg) {

  if (id) return id;

  return (
    msg?.key?.participant ||
    msg?.key?.remoteJid ||
    null
  );
}

// ==========================================
// 🎯 OBTENER MENCIONADO
// ==========================================

function obtenerMencionado(msg, args) {

  try {

    const contexto =
      msg?.message?.extendedTextMessage?.contextInfo;

    if (
      contexto?.mentionedJid &&
      contexto.mentionedJid.length
    ) {

      return contexto.mentionedJid[0];
    }

  } catch (error) {}

  if (Array.isArray(args)) {

    for (const arg of args) {

      if (
        typeof arg === "string" &&
        arg.startsWith("@")
      ) {

        const numero =
          arg.replace(/\D/g, "");

        if (numero) {
          return numero + "@s.whatsapp.net";
        }
      }
    }
  }

  return null;
}

// ==========================================
// 💍 BUSCAR MATRIMONIO
// ==========================================

function buscarMatrimonio(
  datos,
  usuario
) {

  return datos.find(m =>

    m.persona1 === usuario ||
    m.persona2 === usuario

  ) || null;
}

// ==========================================
// ❤️ OBTENER PAREJA
// ==========================================

function obtenerPareja(
  matrimonio,
  usuario
) {

  if (!matrimonio) return null;

  if (matrimonio.persona1 === usuario) {
    return matrimonio.persona2;
  }

  if (matrimonio.persona2 === usuario) {
    return matrimonio.persona1;
  }

  return null;
}

// ==========================================
// 📸 OBTENER FOTO DE WHATSAPP
// ==========================================

async function obtenerFotoPerfil(
  sock,
  jid
) {

  try {

    const url =
      await sock.profilePictureUrl(
        jid,
        "image"
      );

    if (!url) {
      return null;
    }

    const response =
      await axios.get(
        url,
        {
          responseType: "arraybuffer",
          timeout: 10000
        }
      );

    return Buffer.from(
      response.data
    );

  } catch (error) {

    console.log(
      "⚠️ Sin foto de perfil:",
      jid
    );

    return null;
  }
}

// ==========================================
// 🖼️ FOTO POR DEFECTO
// ==========================================

async function fotoDefault() {

  return await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 4,
      background: {
        r: 230,
        g: 230,
        b: 230,
        alpha: 1
      }
    }
  })
    .png()
    .toBuffer();
}

// ==========================================
// ⭕ RECORTAR FOTO EN CÍRCULO
// ==========================================

async function fotoCircular(buffer) {

  const size = 400;

  const mask = Buffer.from(`
    <svg
      width="${size}"
      height="${size}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="200"
        cy="200"
        r="200"
        fill="white"
      />
    </svg>
  `);

  return await sharp(buffer)
    .resize(size, size, {
      fit: "cover"
    })
    .composite([
      {
        input: mask,
        blend: "dest-in"
      }
    ])
    .png()
    .toBuffer();
}

// ==========================================
// 💍 CREAR IMAGEN
// ==========================================

async function crearImagenMatrimonio(
  sock,
  persona1,
  persona2
) {

  try {

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
      foto1 = await fotoDefault();
    }

    if (!foto2) {
      foto2 = await fotoDefault();
    }

    foto1 =
      await fotoCircular(foto1);

    foto2 =
      await fotoCircular(foto2);

    // ======================================
    // DISEÑO
    // ======================================

    const width = 1000;
    const height = 600;

    // Fondo oscuro elegante,
    // NO cuadro rosa.
    const fondo = `
    <svg
      width="${width}"
      height="${height}"
      xmlns="http://www.w3.org/2000/svg"
    >

      <rect
        width="100%"
        height="100%"
        fill="#111111"
      />

      <text
        x="500"
        y="70"
        text-anchor="middle"
        font-family="Arial"
        font-size="42"
        font-weight="bold"
        fill="white"
      >
        💍 MATRIMONIO
      </text>

      <text
        x="500"
        y="115"
        text-anchor="middle"
        font-family="Arial"
        font-size="22"
        fill="#dddddd"
      >
        TITANBOT
      </text>

      <!-- círculos detrás de las fotos -->

      <circle
        cx="300"
        cy="315"
        r="210"
        fill="#222222"
        stroke="white"
        stroke-width="6"
      />

      <circle
        cx="700"
        cy="315"
        r="210"
        fill="#222222"
        stroke="white"
        stroke-width="6"
      />

      <!-- corazón central -->

      <text
        x="500"
        y="335"
        text-anchor="middle"
        font-family="Arial"
        font-size="75"
      >
        ❤️
      </text>

      <text
        x="500"
        y="550"
        text-anchor="middle"
        font-family="Arial"
        font-size="30"
        font-weight="bold"
        fill="white"
      >
        ¡SE HAN CASADO!
      </text>

    </svg>
    `;

    const resultado =
      await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: {
            r: 17,
            g: 17,
            b: 17,
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
          top: 115,
          left: 100
        },

        {
          input: foto2,
          top: 115,
          left: 500
        }

      ])
      .jpeg({
        quality: 95
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
// 💍 COMANDO
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

    const cmd =
      String(comando || "")
        .toLowerCase();

    const usuario =
      obtenerId(id, msg);

    if (!usuario) {
      return true;
    }

    // ======================================
    // 💍 .CASAR
    // ======================================

    if (cmd === "casar") {

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
              "╭─「 💍 CASAMIENTO 」\n" +
              "│\n" +
              "│ Debes mencionar a la persona.\n" +
              "│\n" +
              "│ Ejemplo:\n" +
              "│ .casar @usuario\n" +
              "│\n" +
              "╰──────────────────"
          }
        );

        return true;
      }

      if (
        limpiarJid(usuario) ===
        limpiarJid(objetivo)
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              "😂 No puedes casarte contigo mismo."
          }
        );

        return true;
      }

      const datos =
        leerMatrimonios();

      // ====================================
      // REVISAR USUARIO
      // ====================================

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
              "💍 Ya estás casado/a con @" +
              limpiarJid(pareja) +
              ".",
            mentions: [
              pareja
            ]
          }
        );

        return true;
      }

      // ====================================
      // REVISAR OBJETIVO
      // ====================================

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

      // ====================================
      // GUARDAR
      // ====================================

      const fecha =
        new Date().toLocaleDateString(
          "es-CO"
        );

      datos.push({

        persona1: usuario,

        persona2: objetivo,

        fecha: fecha,

        timestamp: Date.now()

      });

      if (
        !guardarMatrimonios(datos)
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No se pudo guardar el matrimonio."
          }
        );

        return true;
      }

      // ====================================
      // CREAR FOTO
      // ====================================

      const imagen =
        await crearImagenMatrimonio(
          sock,
          usuario,
          objetivo
        );

      // ====================================
      // ENVIAR FOTO
      // ====================================

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
              fecha,

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
              limpiarJid(objetivo),

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
    // 📜 .MATRIMONIO
    // ======================================

    if (cmd === "matrimonio") {

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
              "💔 No tienes un matrimonio registrado."
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
            "╭─「 💍 MATRIMONIO 」\n" +
            "│\n" +
            "│ ❤️ Pareja: @" +
            limpiarJid(pareja) +
            "\n" +
            "│ 📅 Fecha: " +
            matrimonio.fecha +
            "\n" +
            "│\n" +
            "╰──────────────────",

          mentions: [
            pareja
          ]
        }
      );

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
              "💔 No tienes un matrimonio registrado."
          }
        );

        return true;
      }

      const pareja =
        obtenerPareja(
          matrimonio,
          usuario
        );

      const nuevosDatos =
        datos.filter(m =>

          m.persona1 !== usuario &&
          m.persona2 !== usuario

        );

      if (
        !guardarMatrimonios(
          nuevosDatos
        )
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No se pudo realizar el divorcio."
          }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text:
            "╭─「 💔 DIVORCIO 」\n" +
            "│\n" +
            "│ 👤 @" +
            limpiarJid(usuario) +
            "\n" +
            "│ 💔\n" +
            "│ 👤 @" +
            limpiarJid(pareja) +
            "\n" +
            "│\n" +
            "│ 📜 Matrimonio eliminado.\n" +
            "│\n" +
            "╰──────────────────",

          mentions: [
            usuario,
            pareja
          ]
        }
      );

      return true;
    }

    return false;

  } catch (error) {

    console.error(
      "❌ Error en casar.js:",
      error
    );

    await sock.sendMessage(
      chat,
      {
        text:
          "❌ Ocurrió un error en el sistema de matrimonio."
      }
    );

    return true;
  }
}

// ==========================================
// 📤 EXPORTAR
// ==========================================

module.exports = casar;
