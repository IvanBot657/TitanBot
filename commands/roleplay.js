// ==============================
// ROLEPLAY - TITANBOT v3.1
// ==============================

function obtenerMencion(msg) {
  try {
    const mensaje =
      msg?.message?.extendedTextMessage;

    const contexto =
      mensaje?.contextInfo;

    if (
      contexto?.mentionedJid &&
      contexto.mentionedJid.length > 0
    ) {
      return contexto.mentionedJid[0];
    }

    return null;

  } catch {
    return null;
  }
}

async function roleplay(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const cmd =
    String(comando || "").toLowerCase();

  const usuario =
    obtenerMencion(msg);

  // ==============================
  // ABRAZAR
  // ==============================

  if (cmd === "abrazar") {

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "🤗 Menciona a alguien.\n\nEjemplo:\n.abrazar @usuario"
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
        `🤗 @${id.split("@")[0]} abrazó a @${usuario.split("@")[0]}`,
      mentions: [id, usuario]
    });

    return true;
  }

  // ==============================
  // BESAR
  // ==============================

  if (cmd === "besar") {

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "💋 Menciona a alguien.\n\nEjemplo:\n.besar @usuario"
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
        `💋 @${id.split("@")[0]} besó a @${usuario.split("@")[0]}`,
      mentions: [id, usuario]
    });

    return true;
  }

  // ==============================
  // GOLPEAR
  // ==============================

  if (cmd === "golpear") {

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "🥊 Menciona a alguien.\n\nEjemplo:\n.golpear @usuario"
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
        `🥊 @${id.split("@")[0]} golpeó a @${usuario.split("@")[0]}`,
      mentions: [id, usuario]
    });

    return true;
  }

  // ==============================
  // PATADA
  // ==============================

  if (cmd === "patada") {

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "🦵 Menciona a alguien.\n\nEjemplo:\n.patada @usuario"
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
        `🦵 @${id.split("@")[0]} le dio una patada a @${usuario.split("@")[0]}`,
      mentions: [id, usuario]
    });

    return true;
  }

  // ==============================
  // SALUDAR
  // ==============================

  if (cmd === "saludar") {

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "👋 Menciona a alguien.\n\nEjemplo:\n.saludar @usuario"
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
        `👋 @${id.split("@")[0]} saludó a @${usuario.split("@")[0]}`,
      mentions: [id, usuario]
    });

    return true;
  }

  // ==============================
  // FELICITAR
  // ==============================

  if (cmd === "felicitar") {

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "🎉 Menciona a alguien.\n\nEjemplo:\n.felicitar @usuario"
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
        `🎉 @${id.split("@")[0]} felicitó a @${usuario.split("@")[0]}`,
      mentions: [id, usuario]
    });

    return true;
  }

  // ==============================
  // REIR
  // ==============================

  if (cmd === "reir") {

    await sock.sendMessage(chat, {
      text:
        `😂 @${id.split("@")[0]} está riéndose sin parar.`,
      mentions: [id]
    });

    return true;
  }

  // ==============================
  // LLORAR
  // ==============================

  if (cmd === "llorar") {

    await sock.sendMessage(chat, {
      text:
        `😭 @${id.split("@")[0]} está llorando.`,
      mentions: [id]
    });

    return true;
  }

  // ==============================
  // ENOJADO
  // ==============================

  if (cmd === "enojado") {

    await sock.sendMessage(chat, {
      text:
        `😡 @${id.split("@")[0]} está muy enojado.`,
      mentions: [id]
    });

    return true;
  }

  // ==============================
  // BAILAR
  // ==============================

  if (cmd === "bailar") {

    await sock.sendMessage(chat, {
      text:
        `💃 @${id.split("@")[0]} está bailando.`,
      mentions: [id]
    });

    return true;
  }

  return false;
}

module.exports = roleplay;
module.exports.roleplay = roleplay;
