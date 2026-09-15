// commands/roleplay.js
// TitanBot - Comandos de Roleplay

const comandos = {
  abrazar: {
    emoji: "🤗",
    texto: "le dio un abrazo a",
  },
  besar: {
    emoji: "💋",
    texto: "le dio un beso a",
  },
  saludar: {
    emoji: "👋",
    texto: "saludó a",
  },
  felicitar: {
    emoji: "🎉",
    texto: "felicitó a",
  },
  molestar: {
    emoji: "😈",
    texto: "molestó a",
  },
  golpear: {
    emoji: "👊",
    texto: "golpeó a",
  },
  empujar: {
    emoji: "🫷",
    texto: "empujó a",
  },
  ayudar: {
    emoji: "🤝",
    texto: "ayudó a",
  },
  cuidar: {
    emoji: "🛡️",
    texto: "cuidó a",
  },
  felicitar2: {
    emoji: "🥳",
    texto: "celebró con",
  },
};

function obtenerNombre(m, jid) {
  if (!jid) return "alguien";

  const numero = jid.split("@")[0];

  if (
    m?.pushName &&
    m.key?.participant === jid
  ) {
    return m.pushName;
  }

  return `@${numero}`;
}

async function roleplay(sock, m, comando, args = []) {
  try {
    const accion = comandos[comando];

    if (!accion) return false;

    let objetivo;

    // Persona mencionada
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      objetivo =
        m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    // Persona a la que se respondió
    if (!objetivo) {
      objetivo =
        m.message?.extendedTextMessage?.contextInfo?.participant;
    }

    // Número escrito después del comando
    if (!objetivo && args.length > 0) {
      const numero = args[0].replace(/\D/g, "");

      if (numero.length >= 7) {
        objetivo = `${numero}@s.whatsapp.net`;
      }
    }

    if (!objetivo) {
      await sock.sendMessage(
        m.key.remoteJid,
        {
          text:
            `❌ Debes mencionar a alguien.\n\n` +
            `Ejemplo:\n` +
            `.${comando} @usuario`,
        },
        { quoted: m }
      );

      return true;
    }

    const nombre =
      objetivo === m.key.participant
        ? "sí mismo"
        : obtenerNombre(m, objetivo);

    const texto =
      `${accion.emoji} @${objetivo.split("@")[0]} ${accion.texto} ` +
      `${nombre}.`;

    await sock.sendMessage(
      m.key.remoteJid,
      {
        text: texto,
        mentions: [objetivo],
      },
      { quoted: m }
    );

    return true;
  } catch (error) {
    console.error("❌ Error en roleplay:", error);
    return true;
  }
}

module.exports = {
  comandos,
  roleplay,
};
