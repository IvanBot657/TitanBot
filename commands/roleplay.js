// =========================================
// 🎭 TITANBOT - ROLEPLAY
// 9 comandos + GIF + mención real
// =========================================

// APIs de imágenes animadas
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
// OBTENER CONTEXTO DE LA MENCIÓN
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
// OBTENER GIF
// =========================================

async function obtenerGif(tipo) {

  const respuesta = await fetch(
    `${API}/${tipo}`
  );

  if (!respuesta.ok) {
    throw new Error(
      `La API respondió ${respuesta.status}`
    );
  }

  const datos = await respuesta.json();

  if (!datos?.url) {
    throw new Error(
      "La API no devolvió ninguna imagen."
    );
  }

  return datos.url;

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

  // =======================================
  // BUSCAR MENCIÓN REAL DE WHATSAPP
  // =======================================

  const mencionados =
    obtenerMenciones(msg);

  // =======================================
  // SI NO MENCIONÓ A NADIE
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

👉 Selecciona a la persona desde WhatsApp para que sea una mención real.`
    });

    return true;
  }

  // =======================================
  // PRIMER USUARIO MENCIONADO
  // =======================================

  const objetivo =
    mencionados[0];

  // =======================================
  // TEXTO DE LA MENCIÓN
  // =======================================

  const numero =
    objetivo.split("@")[0];

  const texto =
`${accion.emoji} ${accion.texto} @${numero}`;

  // =======================================
  // OBTENER GIF
  // =======================================

  try {

    await sock.sendMessage(chat, {
      text: "🎬 Preparando animación..."
    });

    const gif =
      await obtenerGif(accion.api);

    // =====================================
    // ENVIAR GIF
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

    return true;

  } catch (error) {

    console.log(
      "❌ ERROR ROLEPLAY:",
      error.message
    );

    // =====================================
    // MENSAJE DE ERROR
    // =====================================

    await sock.sendMessage(chat, {

      text:
`❌ No pude cargar la animación.

${accion.emoji} ${accion.texto} @${numero}`,

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
