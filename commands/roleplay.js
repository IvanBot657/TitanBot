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
  cuidar: ["🛡️", "cuidó a"]
};

async function roleplay(sock, chat, comando, args = [], id, msg) {
  try {
    if (!sock || !chat) {
      console.error("❌ Datos incorrectos para roleplay");
      return false;
    }

    comando = String(comando || "")
      .toLowerCase()
      .replace(".", "");

    const accion = acciones[comando];

    if (!accion) return false;

    let objetivo = null;

    // Buscar persona mencionada
    const mencionados =
      msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (mencionados?.length) {
      objetivo = mencionados[0];
    }

    // Buscar persona a la que se respondió
    if (!objetivo) {
      objetivo =
        msg?.message?.extendedTextMessage?.contextInfo?.participant;
    }

    // Buscar número escrito
    if (!objetivo && Array.isArray(args) && args.length > 0) {
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
            `Ejemplo:\n` +
            `.${comando} @usuario`
        },
        { quoted: msg }
      );

      return true;
    }

    const numero = objetivo.split("@")[0];

    await sock.sendMessage(
      chat,
      {
        text: `${accion[0]} @${numero} ${accion[1]} 😎`,
        mentions: [objetivo]
      },
      { quoted: msg }
    );

    return true;

  } catch (error) {
    console.error("❌ Error en roleplay:", error);
    return true;
  }
}

module.exports = roleplay;
