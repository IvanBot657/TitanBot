// =========================================
// 🎭 TITANBOT - ROLEPLAY
// 9 comandos + mención real de WhatsApp
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
// 🔎 BUSCAR MENCIÓN REAL
// =========================================

function obtenerMenciones(msg) {

  const mensajes = [
    msg?.message?.extendedTextMessage,
    msg?.message?.imageMessage,
    msg?.message?.videoMessage,
    msg?.message?.documentMessage
  ];

  for (const mensaje of mensajes) {

    const menciones =
      mensaje?.contextInfo?.mentionedJid;

    if (
      Array.isArray(menciones) &&
      menciones.length > 0
    ) {
      return menciones;
    }

  }

  return [];

}

// =========================================
// 🎭 ROLEPLAY
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
  // COMPROBAR SI ES ROLEPLAY
  // =======================================

  const accion =
    acciones[cmd];

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
  // SIN MENCIÓN
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

👉 Selecciona a la persona directamente desde WhatsApp.`
    });

    return true;
  }

  // =======================================
  // PERSONA MENCIONADA
  // =======================================

  const objetivo =
    mencionados[0];

  // =======================================
  // TEXTO
  // =======================================

  const texto =
`${accion.emoji} ${accion.texto} @${objetivo.split("@")[0]}`;

  console.log(
    `👤 Persona mencionada: ${objetivo}`
  );

  // =======================================
  // POR AHORA MOSTRAMOS EL TEXTO
  // =======================================
  //
  // El GIF lo conectaremos después
  // con TitanGIF-API.
  //

  await sock.sendMessage(chat, {

    text: texto,

    mentions: [
      objetivo
    ]

  });

  return true;
}

// =========================================
// EXPORTAR
// =========================================

module.exports = roleplay;
module.exports.roleplay = roleplay;
