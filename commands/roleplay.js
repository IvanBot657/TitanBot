// =========================================
// 🎭 TITANBOT - ROLEPLAY
// 9 COMANDOS + GIF + MENCIÓN REAL
// =========================================

const axios = require("axios");

const API = "https://api.waifu.pics/sfw";

// =========================================
// ACCIONES
// =========================================

const acciones = {

  abrazar: {
    api: "hug",
    emoji: "🫂",
    texto: "Yo abrazo a"
  },

  saludo: {
    api: "wave",
    emoji: "👋",
    texto: "Yo saludo a"
  },

  felicitar: {
    api: "happy",
    emoji: "🎉",
    texto: "Yo felicito a"
  },

  reir: {
    api: "laugh",
    emoji: "😂",
    texto: "Yo río con"
  },

  "reír": {
    api: "laugh",
    emoji: "😂",
    texto: "Yo río con"
  },

  llorar: {
    api: "cry",
    emoji: "😭",
    texto: "Yo lloro con"
  },

  enojado: {
    api: "angry",
    emoji: "😡",
    texto: "Yo me enojo con"
  },

  enojar: {
    api: "angry",
    emoji: "😡",
    texto: "Yo me enojo con"
  },

  bailar: {
    api: "dance",
    emoji: "💃",
    texto: "Yo bailo con"
  },

  golpear: {
    api: "punch",
    emoji: "👊",
    texto: "Yo golpeo a"
  },

  patada: {
    api: "kick",
    emoji: "🦵",
    texto: "Yo doy una patada a"
  }

};

// =========================================
// OBTENER MENCIÓN REAL
// =========================================

function obtenerMenciones(msg) {

  const contextInfo =
    msg?.message?.extendedTextMessage?.contextInfo ||
    msg?.message?.imageMessage?.contextInfo ||
    msg?.message?.videoMessage?.contextInfo ||
    msg?.message?.documentMessage?.contextInfo ||
    msg?.message?.buttonsResponseMessage?.contextInfo ||
    msg?.message?.listResponseMessage?.contextInfo;

  return contextInfo?.mentionedJid || [];
}

// =========================================
// OBTENER GIF CON AXIOS
// =========================================

async function obtenerGif(tipo) {

  console.log(
    `🎬 Consultando API: ${API}/${tipo}`
  );

  const respuesta = await axios.get(
    `${API}/${tipo}`,
    {
      timeout: 15000,
      headers: {
        "User-Agent": "TITANBOT/3.1"
      }
    }
  );

  if (
    !respuesta.data ||
    !respuesta.data.url
  ) {
    throw new Error(
      "La API no devolvió una URL válida."
    );
  }

  console.log(
    `✅ GIF encontrado: ${respuesta.data.url}`
  );

  return respuesta.data.url;
}

// =========================================
// ROLEPLAY
// =========================================

async function roleplay(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg = null
) {

  const cmd =
    String(comando || "")
      .toLowerCase()
      .trim();

  // =======================================
  // COMPROBAR COMANDO
  // =======================================

  const accion = acciones[cmd];

  if (!accion) {
    return false;
  }

  console.log(
    `🎭 ROLEPLAY: ${cmd}`
  );

  // =======================================
  // OBTENER MENCIÓN
  // =======================================

  const mencionados =
    obtenerMenciones(msg);

  // =======================================
  // SI NO HAY MENCIÓN
  // =======================================

  if (
    !mencionados ||
    mencionados.length === 0
  ) {

    await sock.sendMessage(chat, {
      text:
`❌ Debes mencionar a una persona.

Ejemplo:

.${cmd} @usuario

👉 Selecciona a la persona desde WhatsApp.`
    });

    return true;
  }

  // =======================================
  // USUARIO MENCIONADO
  // =======================================

  const objetivo =
    mencionados[0];

  console.log(
    `👤 Objetivo: ${objetivo}`
  );

  // =======================================
  // TEXTO
  // =======================================

  const texto =
`${accion.emoji} ${accion.texto} @${objetivo.split("@")[0]}`;

  // =======================================
  // OBTENER Y ENVIAR GIF
  // =======================================

  try {

    await sock.sendMessage(chat, {
      text: "🎬 Preparando animación..."
    });

    const gif =
      await obtenerGif(accion.api);

    // =====================================
    // ENVIAR ANIMACIÓN
    // =====================================

    await sock.sendMessage(chat, {

      video: {
        url: gif
      },

      gifPlayback: true,

      caption: texto,

      mentions: [
        objetivo
      ]

    });

    console.log(
      `✅ ROLEPLAY ENVIADO: ${cmd}`
    );

    return true;

  } catch (error) {

    console.log(
      "❌ ERROR ROLEPLAY:"
    );

    console.log(
      error.response?.data ||
      error.message
    );

    await sock.sendMessage(chat, {

      text:
`❌ No pude cargar la animación.

${accion.emoji} ${accion.texto} @${objetivo.split("@")[0]}`,

      mentions: [
        objetivo
      ]

    });

    return true;
  }
}

// =========================================
// EXPORTAR
// =========================================

module.exports = roleplay;
module.exports.roleplay = roleplay;
