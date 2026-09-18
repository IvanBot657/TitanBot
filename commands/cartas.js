// =========================================
// 🃏 TITANBOT - SISTEMA DE CARTAS
// =========================================

const fs = require("fs");
const path = require("path");

// =========================================
// 👤 SISTEMA DE USUARIOS
// =========================================
// datosUsuarios.js está dentro de /commands/
const {
  obtenerUsuario,
  guardarUsuario
} = require("./datosUsuarios");

// =========================================
// 🖼️ IMÁGENES DE CARTAS
// =========================================

function obtenerImagen(id) {
  // Carta #20 - Mago de Hielo
  if (id === 20) {
    return "https://raw.githubusercontent.com/IvanBot657/TitanBot/main/Cartas/mago_hielo_20.png";
  }

  // Las demás cartas todavía no tienen imagen
  return null;
}

// =========================================
// 🎴 LISTA DE 50 CARTAS
// =========================================

const cartas = [

  // ⚪ COMUNES
  { id: 1, nombre: "Guerrero Novato", rareza: "⚪ Común" },
  { id: 2, nombre: "Arquero del Bosque", rareza: "⚪ Común" },
  { id: 3, nombre: "Aprendiz de Magia", rareza: "⚪ Común" },
  { id: 4, nombre: "Explorador", rareza: "⚪ Común" },
  { id: 5, nombre: "Guardián del Pueblo", rareza: "⚪ Común" },
  { id: 6, nombre: "Cazador", rareza: "⚪ Común" },
  { id: 7, nombre: "Pescador", rareza: "⚪ Común" },
  { id: 8, nombre: "Campesino", rareza: "⚪ Común" },
  { id: 9, nombre: "Viajero", rareza: "⚪ Común" },
  { id: 10, nombre: "Aventurero", rareza: "⚪ Común" },

  // 🟢 POCO COMUNES
  { id: 11, nombre: "Guerrero Verde", rareza: "🟢 Poco común" },
  { id: 12, nombre: "Mago del Bosque", rareza: "🟢 Poco común" },
  { id: 13, nombre: "Lobo Guardián", rareza: "🟢 Poco común" },
  { id: 14, nombre: "Halcón Dorado", rareza: "🟢 Poco común" },
  { id: 15, nombre: "Caballero Verde", rareza: "🟢 Poco común" },
  { id: 16, nombre: "Monje", rareza: "🟢 Poco común" },
  { id: 17, nombre: "Alquimista", rareza: "🟢 Poco común" },
  { id: 18, nombre: "Pirata", rareza: "🟢 Poco común" },

  // 🔵 RARAS
  { id: 19, nombre: "Caballero Azul", rareza: "🔵 Rara" },
  { id: 20, nombre: "Mago de Hielo", rareza: "🔵 Rara" },
  { id: 21, nombre: "Dragón Marino", rareza: "🔵 Rara" },
  { id: 22, nombre: "Guardián de Cristal", rareza: "🔵 Rara" },
  { id: 23, nombre: "Ninja de la Niebla", rareza: "🔵 Rara" },
  { id: 24, nombre: "Fénix Azul", rareza: "🔵 Rara" },
  { id: 25, nombre: "Cazador Nocturno", rareza: "🔵 Rara" },
  { id: 26, nombre: "Rey de los Lobos", rareza: "🔵 Rara" },

  // 🟣 ÉPICAS
  { id: 27, nombre: "Guerrero Oscuro", rareza: "🟣 Épica" },
  { id: 28, nombre: "Hechicera Carmesí", rareza: "🟣 Épica" },
  { id: 29, nombre: "Dragón de Fuego", rareza: "🟣 Épica" },
  { id: 30, nombre: "Caballero de la Luz", rareza: "🟣 Épica" },
  { id: 31, nombre: "Rey Demonio", rareza: "🟣 Épica" },
  { id: 32, nombre: "Titán de Piedra", rareza: "🟣 Épica" },
  { id: 33, nombre: "Guardián Celestial", rareza: "🟣 Épica" },
  { id: 34, nombre: "Fénix Dorado", rareza: "🟣 Épica" },

  // 🟠 LEGENDARIAS
  { id: 35, nombre: "Rey Dragón", rareza: "🟠 Legendaria" },
  { id: 36, nombre: "Dios del Trueno", rareza: "🟠 Legendaria" },
  { id: 37, nombre: "Señor de las Sombras", rareza: "🟠 Legendaria" },
  { id: 38, nombre: "Ángel Supremo", rareza: "🟠 Legendaria" },
  { id: 39, nombre: "Bestia Ancestral", rareza: "🟠 Legendaria" },
  { id: 40, nombre: "Guardián del Tiempo", rareza: "🟠 Legendaria" },

  // 🔴 MÍTICAS
  { id: 41, nombre: "Dragón Ancestral", rareza: "🔴 Mítica" },
  { id: 42, nombre: "Dios de los Cielos", rareza: "🔴 Mítica" },
  { id: 43, nombre: "Titán Cósmico", rareza: "🔴 Mítica" },
  { id: 44, nombre: "Rey del Universo", rareza: "🔴 Mítica" },
  { id: 45, nombre: "Guardián Absoluto", rareza: "🔴 Mítica" },
  { id: 46, nombre: "Fénix Inmortal", rareza: "🔴 Mítica" },
  { id: 47, nombre: "Señor del Multiverso", rareza: "🔴 Mítica" },
  { id: 48, nombre: "Entidad Eterna", rareza: "🔴 Mítica" },
  { id: 49, nombre: "TITÁN SUPREMO", rareza: "🔴 Mítica" },
  { id: 50, nombre: "TITÁN LEGENDARIO", rareza: "🔴 Mítica" }

];

// =========================================
// 🎲 PROBABILIDADES
// =========================================

function obtenerRareza() {

  const numero = Math.random() * 100;

  if (numero < 45) {
    return "⚪ Común";
  }

  if (numero < 70) {
    return "🟢 Poco común";
  }

  if (numero < 85) {
    return "🔵 Rara";
  }

  if (numero < 94) {
    return "🟣 Épica";
  }

  if (numero < 99) {
    return "🟠 Legendaria";
  }

  return "🔴 Mítica";
}

// =========================================
// 🎴 CARTA ALEATORIA
// =========================================

function obtenerCartaAleatoria() {

  const rareza = obtenerRareza();

  const disponibles = cartas.filter(
    carta => carta.rareza === rareza
  );

  if (disponibles.length === 0) {
    return null;
  }

  return disponibles[
    Math.floor(Math.random() * disponibles.length)
  ];
}

// =========================================
// 📊 TOTAL DE CARTAS
// =========================================

function obtenerTotalCartas(usuario) {

  if (!usuario || !Array.isArray(usuario.cartas)) {
    return 0;
  }

  return usuario.cartas.reduce(
    (total, carta) => {
      return total + (Number(carta.cantidad) || 0);
    },
    0
  );
}

// =========================================
// 📚 CARTAS DIFERENTES
// =========================================

function obtenerCartasDiferentes(usuario) {

  if (!usuario || !Array.isArray(usuario.cartas)) {
    return 0;
  }

  return usuario.cartas.length;
}

// =========================================
// 🃏 EJECUTAR SISTEMA DE CARTAS
// =========================================

async function ejecutarCartas(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  // =====================================
  // 🃏 .CARTA
  // =====================================

  if (comando === "carta") {

    const carta = obtenerCartaAleatoria();

    if (!carta) {

      await sock.sendMessage(
        chat,
        {
          text: "❌ No se pudo generar una carta."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    let usuario;

    try {

      usuario = obtenerUsuario(id);

    } catch (error) {

      console.error(
        "❌ Error obteniendo usuario:",
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No se pudo acceder a los datos del usuario."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    if (!usuario) {
      usuario = {};
    }

    if (!Array.isArray(usuario.cartas)) {
      usuario.cartas = [];
    }

    // Buscar si ya tiene la carta
    const existente = usuario.cartas.find(
      c => Number(c.id) === carta.id
    );

    const nuevaCarta = !existente;

    if (existente) {

      existente.cantidad =
        (Number(existente.cantidad) || 0) + 1;

    } else {

      usuario.cartas.push({
        id: carta.id,
        cantidad: 1
      });
    }

    // Guardar colección
    try {

      guardarUsuario(id, usuario);

    } catch (error) {

      console.error(
        "❌ Error guardando usuario:",
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ La carta se generó, pero no se pudo guardar la colección."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    const imagen = obtenerImagen(carta.id);

    const diferentes =
      obtenerCartasDiferentes(usuario);

    const total =
      obtenerTotalCartas(usuario);

    const caption =
`🃏 *¡CARTA OBTENIDA!*

🛡️ *${carta.nombre}*
✨ Rareza: *${carta.rareza}*
🔢 Carta: *#${carta.id}*

${
  nuevaCarta
    ? "🎉 ¡NUEVA CARTA PARA TU COLECCIÓN!"
    : "♻️ ¡HAS CONSEGUIDO OTRA COPIA!"
}

📚 Colección: *${diferentes}/50*
📦 Cartas totales: *${total}*`;

    // =================================
    // 🖼️ ENVIAR IMAGEN
    // =================================

    if (imagen) {

      try {

        await sock.sendMessage(
          chat,
          {
            image: {
              url: imagen
            },
            caption: caption
          },
          {
            quoted: msg
          }
        );

      } catch (error) {

        console.error(
          "❌ Error enviando imagen de carta:",
          error
        );

        await sock.sendMessage(
          chat,
          {
            text:
              caption +
              "\n\n⚠️ No se pudo cargar la imagen."
          },
          {
            quoted: msg
          }
        );
      }

    } else {

      await sock.sendMessage(
        chat,
        {
          text:
            caption +
            "\n\n🖼️ Imagen de esta carta pendiente."
        },
        {
          quoted: msg
        }
      );
    }

    return true;
  }

  // =====================================
  // 📚 .CARTAS
  // =====================================

  if (comando === "cartas") {

    let usuario;

    try {

      usuario = obtenerUsuario(id);

    } catch (error) {

      console.error(
        "❌ Error obteniendo usuario:",
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No se pudo cargar tu colección."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    if (
      !usuario ||
      !Array.isArray(usuario.cartas) ||
      usuario.cartas.length === 0
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`🃏 *MI COLECCIÓN*

Todavía no tienes cartas.

🎴 Usa *.carta* para conseguir una.`
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    let texto =
`🃏 *MI COLECCIÓN*

`;

    for (const coleccion of usuario.cartas) {

      const carta = cartas.find(
        c => c.id === Number(coleccion.id)
      );

      if (!carta) {
        continue;
      }

      texto +=
`${carta.rareza} #${carta.id} ${carta.nombre} ×${Number(coleccion.cantidad) || 0}\n`;
    }

    const diferentes =
      obtenerCartasDiferentes(usuario);

    const total =
      obtenerTotalCartas(usuario);

    texto +=
`
━━━━━━━━━━━━━━━━━━
📚 Diferentes: *${diferentes}/50*
📦 Cartas totales: *${total}*

🎴 Usa *.carta* para conseguir otra.`;

    await sock.sendMessage(
      chat,
      {
        text: texto
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  // =====================================
  // 🔎 .CARTAINFO
  // =====================================

  if (comando === "cartainfo") {

    const numero = parseInt(args[0], 10);

    if (
      isNaN(numero) ||
      numero < 1 ||
      numero > 50
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *CARTA INVÁLIDA*

Debes indicar un número del *1 al 50*.

Ejemplo:

*.cartainfo 20*`
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    const carta = cartas.find(
      c => c.id === numero
    );

    if (!carta) {

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No se encontró esa carta."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    const imagen = obtenerImagen(carta.id);

    const texto =
`🃏 *INFORMACIÓN DE CARTA*

🛡️ *${carta.nombre}*
✨ Rareza: *${carta.rareza}*
🔢 Carta: *#${carta.id}*`;

    if (imagen) {

      try {

        await sock.sendMessage(
          chat,
          {
            image: {
              url: imagen
            },
            caption: texto
          },
          {
            quoted: msg
          }
        );

      } catch (error) {

        console.error(
          "❌ Error enviando imagen de carta:",
          error
        );

        await sock.sendMessage(
          chat,
          {
            text:
              texto +
              "\n\n⚠️ No se pudo cargar la imagen."
          },
          {
            quoted: msg
          }
        );
      }

    } else {

      await sock.sendMessage(
        chat,
        {
          text:
            texto +
            "\n\n🖼️ Imagen todavía no disponible."
        },
        {
          quoted: msg
        }
      );
    }

    return true;
  }

  // =====================================
  // 🏆 .CARTASRANKING
  // =====================================

  if (comando === "cartasranking") {

    const archivo = path.join(
      __dirname,
      "../usuarios.json"
    );

    let usuarios = {};

    try {

      if (fs.existsSync(archivo)) {

        const contenido =
          fs.readFileSync(
            archivo,
            "utf8"
          );

        if (contenido.trim()) {

          usuarios =
            JSON.parse(contenido);

        }
      }

    } catch (error) {

      console.error(
        "❌ Error leyendo usuarios.json:",
        error
      );

      usuarios = {};
    }

    const ranking =
      Object.entries(usuarios)
        .map(([jid, usuario]) => {

          const coleccion =
            Array.isArray(usuario.cartas)
              ? usuario.cartas
              : [];

          const diferentes =
            coleccion.length;

          const copias =
            coleccion.reduce(
              (suma, carta) => {
                return (
                  suma +
                  (Number(carta.cantidad) || 0)
                );
              },
              0
            );

          return {
            jid,
            diferentes,
            copias
          };
        })
        .filter(
          jugador =>
            jugador.diferentes > 0
        )
        .sort((a, b) => {

          if (
            b.diferentes !==
            a.diferentes
          ) {

            return (
              b.diferentes -
              a.diferentes
            );
          }

          return (
            b.copias -
            a.copias
          );

        })
        .slice(0, 10);

    let texto =
`🏆 *RANKING DE COLECCIONISTAS*

`;

    if (ranking.length === 0) {

      texto +=
        "Todavía nadie tiene cartas.";

    } else {

      ranking.forEach(
        (jugador, index) => {

          const numero =
            String(
              jugador.jid.split("@")[0]
            );

          texto +=
`${index + 1}. @${numero}
🃏 ${jugador.diferentes}/50 diferentes
📦 ${jugador.copias} copias

`;
        }
      );
    }

    await sock.sendMessage(
      chat,
      {
        text: texto,
        mentions: ranking.map(
          jugador => jugador.jid
        )
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  // =====================================
  // ❌ COMANDO NO ENCONTRADO
  // =====================================

  return false;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = ejecutarCartas;
