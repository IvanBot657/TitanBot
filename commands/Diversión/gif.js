// =========================================
// 🎬 TITANBOT - DIVERSIÓN + GIFS
// =========================================

const axios = require("axios");

const TITANGIF_API = "https://titangif-api.onrender.com";

// =========================================
// 🎭 ACCIONES
// =========================================

const acciones = {
  abrazar: {
    emoji: "🫂",
    texto: "Yo abrazo a"
  },

  saludo: {
    emoji: "👋",
    texto: "Yo saludo a"
  },

  felicitar: {
    emoji: "🎉",
    texto: "Yo felicito a"
  },

  reir: {
    emoji: "😂",
    texto: "Yo río con"
  },

  llorar: {
    emoji: "😭",
    texto: "Yo lloro con"
  },

  enojado: {
    emoji: "😡",
    texto: "Yo me enojo con"
  },

  bailar: {
    emoji: "💃",
    texto: "Yo bailo con"
  },

  golpear: {
    emoji: "👊",
    texto: "Yo golpeo a"
  },

  patada: {
    emoji: "🦵",
    texto: "Yo doy una patada a"
  }
};

// =========================================
// 🎬 OBTENER MENCIÓN REAL
// =========================================

function obtenerMencion(msg) {

  const context =
    msg?.message?.extendedTextMessage?.contextInfo;

  if (!context) {
    return null;
  }

  const mencionados =
    context.mentionedJid || [];

  if (!mencionados.length) {
    return null;
  }

  return mencionados[0];
}

// =========================================
// 🎬 COMANDO GIF
// =========================================

async function gif(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg = null
) {

  const cmd = String(comando || "")
    .toLowerCase()
    .trim();

  // =======================================
  // 🎬 .gif
  // =======================================

  if (cmd === "gif") {

    try {

      await sock.sendMessage(chat, {
        text: "🎬 Buscando GIF..."
      });

      const respuesta =
        await axios.get(
          `${TITANGIF_API}/gif`,
          {
            timeout: 30000
          }
        );

      const datos =
        respuesta.data;

      if (!datos || !datos.gif) {

        await sock.sendMessage(chat, {
          text: "❌ La API no devolvió ningún GIF."
        });

        return true;
      }

      await sock.sendMessage(chat, {

        video: {
          url: datos.gif
        },

        gifPlayback: true,

        caption:
          "🎬 *TITAN GIF*"

      });

    } catch (error) {

      console.log(
        "❌ ERROR TITANGIF-API:"
      );

      console.log(
        error.response?.data ||
        error.message
      );

      await sock.sendMessage(chat, {
        text:
          "❌ No pude conectar con TitanGIF-API."
      });
    }

    return true;
  }

  // =======================================
  // 🎭 ACCIONES
  // =======================================

  if (!acciones[cmd]) {
    return false;
  }

  // =======================================
  // 👤 MANDAR MENCION
  // =======================================

  const objetivo =
    obtenerMencion(msg);

  if (!objetivo) {

    await sock.sendMessage(chat, {
      text:
`❌ Debes mencionar a una persona.

Ejemplo:
.${cmd} @usuario`
    });

    return true;
  }

  try {

    await sock.sendMessage(chat, {
      text: "🎬 Preparando animación..."
    });

    // =====================================
    // 🌐 PEDIR GIF A TITANGIF-API
    // =====================================

    const respuesta =
      await axios.get(
        `${TITANGIF_API}/gif/${cmd}`,
        {
          timeout: 30000
        }
      );

    const datos =
      respuesta.data;

    if (!datos || !datos.gif) {

      await sock.sendMessage(chat, {
        text:
          `❌ No hay GIF disponible para "${cmd}".`
      });

      return true;
    }

    // =====================================
    // 🎬 ENVIAR GIF
    // =====================================

    await sock.sendMessage(chat, {

      video: {
        url: datos.gif
      },

      gifPlayback: true,

      caption:
        `${acciones[cmd].emoji} ${acciones[cmd].texto} @${objetivo.split("@")[0]}`,

      mentions: [
        objetivo
      ]

    });

  } catch (error) {

    console.log(
      "❌ ERROR TITANGIF-API:"
    );

    console.log(
      error.response?.data ||
      error.message
    );

    await sock.sendMessage(chat, {
      text:
        "❌ No pude cargar la animación."
    });
  }

  return true;
}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = gif;
module.exports.gif = gif;
