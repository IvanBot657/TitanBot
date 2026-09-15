// commands/roleplay.js

const acciones = {
  abrazar: ["🤗", "abrazó"],
  besar: ["😊", "saludó con cariño a"],
  saludar: ["👋", "saludó a"],
  felicitar: ["🎉", "felicitó a"],
  molestar: ["😈", "molestó a"],
  golpear: ["👊", "le dio un golpe de juego a"],
  empujar: ["🫷", "empujó de juego a"],
  ayudar: ["🤝", "ayudó a"],
  cuidar: ["🛡️", "cuidó a"],
};

async function roleplay(sock, m, comando, args = []) {
  try {
    // Compatibilidad por si index.js manda los argumentos en otro orden
    if (!sock || !m || !m.key) {
      console.error("❌ roleplay recibió parámetros incorrectos");
      return true;
    }

    const chat = m.key.remoteJid;

    if (!chat) return true;

    comando = String(comando || "").toLowerCase().replace(".", "");

    const accion = acciones[comando];

    if (!accion) return false;

    let objetivo = null;

    const contexto =
      m.message?.extendedTextMessage?.contextInfo;

    // Si respondió a un mensaje
    if (contexto?.participant) {
      objetivo = contexto.participant;
    }

    // Si mencionó a alguien
    if (contexto?.mentionedJid?.length) {
      objetivo = contexto.mentionedJid[0];
    }

    // Si escribió un número
    if (!objetivo && Array.isArray(args) && args.length) {
      const numero = String(args[0]).replace(/\D/g, "");

      if (numero.length >= 7) {
        objetivo = `${numero}@s.whatsapp.net`;
      }
    }

    if (!objetivo) {
      await sock.sendMessage(
        chat,
        {
          text:
            `❌ Menciona a alguien para usar *.${comando}*\n\n` +
            `Ejemplo:\n.${comando} @usuario`,
        },
        { quoted: m }
      );

      return true;
    }

    const numero = objetivo.split("@")[0];

    const texto =
      `${accion[0]} @${numero} ${accion[1]} 😎`;

    await sock.sendMessage(
      chat,
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

module.exports = roleplay;
