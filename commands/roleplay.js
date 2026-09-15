const axios = require("axios");

// ==========================================
// 🎭 TITANBOT - ROLEPLAY
// ==========================================

const acciones = {
  abrazar: {
    emoji: "🫂",
    texto: "abraza"
  },

  besar: {
    emoji: "💋",
    texto: "le da un beso a"
  },

  golpear: {
    emoji: "👊",
    texto: "golpea a"
  },

  patada: {
    emoji: "🦵",
    texto: "le da una patada a"
  },

  saludo: {
    emoji: "👋",
    texto: "saluda a"
  },

  felicitar: {
    emoji: "🎉",
    texto: "felicita a"
  },

  reir: {
    emoji: "😂",
    texto: "se ríe con"
  },

  llorar: {
    emoji: "😭",
    texto: "llora con"
  },

  enojado: {
    emoji: "😠",
    texto: "se enoja con"
  },

  bailar: {
    emoji: "💃",
    texto: "baila con"
  }
};

// ==========================================
// 🖼️ OBTENER IMAGEN
// ==========================================

async function obtenerImagen() {
  try {

    const respuesta = await axios.get(
      "https://api.waifu.pics/sfw/hug",
      {
        timeout: 15000
      }
    );

    return respuesta.data?.url || null;

  } catch (error) {

    console.log(
      "❌ ERROR IMAGEN ROLEPLAY:",
      error.message
    );

    return null;
  }
}

// ==========================================
// 🎭 ROLEPLAY
// ==========================================

async function roleplay(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg = null
) {

  const cmd = String(comando || "")
    .toLowerCase()
    .replace(".", "")
    .trim();

  // Comprobar acción
  if (!acciones[cmd]) {
    return false;
  }

  const accion = acciones[cmd];

  // ========================================
  // 📌 DETECTAR @ REAL
  // ========================================

  let mentionedJid = [];

  try {

    const contextInfo =
      msg?.message?.extendedTextMessage?.contextInfo ||
      msg?.message?.imageMessage?.contextInfo ||
      msg?.message?.videoMessage?.contextInfo ||
      msg?.message?.conversation?.contextInfo;

    mentionedJid =
      contextInfo?.mentionedJid || [];

  } catch (error) {

    console.log(
      "❌ ERROR MENCIONES:",
      error.message
    );
  }

  // ========================================
  // ❌ SIN @
  // ========================================

  if (!mentionedJid.length) {

    await sock.sendMessage(chat, {
      text:
`❌ *Debes mencionar a una persona.*

Ejemplo:

${cmd} @usuario

🎭 Usa una mención real de WhatsApp.`
    });

    return true;
  }

  // ========================================
  // 👤 OBTENER PERSONA MENCIONADA
  // ========================================

  const objetivo = mentionedJid[0];

  const numero =
    objetivo.split("@")[0];

  const nombre =
    `@${numero}`;

  // ========================================
  // 👤 USUARIO QUE EJECUTA
  // ========================================

  let autor = "Alguien";

  try {

    const participant =
      msg?.key?.participant ||
      msg?.key?.remoteJid;

    if (participant) {
      autor = `@${participant.split("@")[0]}`;
    }

  } catch {}

  // ========================================
  // 🖼️ OBTENER IMAGEN
  // ========================================

  const imagen = await obtenerImagen();

  // ========================================
  // 📝 TEXTO
  // ========================================

  const texto =
`${accion.emoji} ${autor} ${accion.texto} ${nombre}`;

  // ========================================
  // 📤 ENVIAR
  // ========================================

  if (imagen) {

    await sock.sendMessage(chat, {
      image: {
        url: imagen
      },
      caption:
`${texto}

🎭 *TITANBOT ROLEPLAY*`,
      mentions: [
        objetivo
      ]
    });

  } else {

    await sock.sendMessage(chat, {
      text: texto,
      mentions: [
        objetivo
      ]
    });
  }

  return true;
}

// ==========================================
// 📦 EXPORTAR
// ==========================================

module.exports = roleplay;
module.exports.roleplay = roleplay;
module.exports.acciones = acciones;
