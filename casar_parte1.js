// ==========================================
// 💍 PROPUESTAS - PARTE 1
// ==========================================

if (cmd === "casar") {

  const objetivo =
    msg?.message?.extendedTextMessage
    ?.contextInfo?.mentionedJid?.[0];

  if (!objetivo) {
    await sock.sendMessage(chat, {
      text:
        "💍 Debes mencionar a alguien.\n\nEjemplo:\n.casar @usuario"
    });
    return true;
  }

  if (objetivo === id) {
    await sock.sendMessage(chat, {
      text: "😂 No puedes casarte contigo mismo."
    });
    return true;
  }

  const propuestas = read(propuestasFile);
  const matrimonios = read(matrimoniosFile);

  const yaCasado = matrimonios.find(m =>
    m.persona1 === id || m.persona2 === id
  );

  if (yaCasado) {
    await sock.sendMessage(chat, {
      text: "💍 Ya estás casado."
    });
    return true;
  }

  propuestas.push({
    solicitante: id,
    objetivo,
    chat,
    timestamp: Date.now()
  });

  write(propuestasFile, propuestas);

  await sock.sendMessage(chat, {
    text:
      "╭━━━〔 💍 PROPUESTA DE MATRIMONIO 〕━━━╮\n" +
      "┃ ❤️ @" + id.split("@")[0] + " quiere casarse con\n" +
      "┃ 💕 @" + objetivo.split("@")[0] + "\n" +
      "┃ ✅ aceptar\n" +
      "┃ ❌ rechazar\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━╯",
    mentions: [id, objetivo]
  });

  return true;
}
