async function grupos(sock, chat, comando, args, id, isGroup, isAdmin) {

  if (!isGroup) {
    return sock.sendMessage(chat, {
      text: "❌ Este comando solo funciona en grupos."
    });
  }

  if (comando === "admins") {
    return sock.sendMessage(chat, {
      text: "👑 Los administradores del grupo pueden usar los comandos de administración."
    });
  }

  if (comando === "tagall") {
    const metadata = await sock.groupMetadata(chat);

    const participantes = metadata.participants || [];

    const menciones = participantes
      .map(p => p.id)
      .filter(Boolean);

    const texto = participantes
      .map((p, i) => `${i + 1}. @${p.id.split("@")[0]}`)
      .join("\n");

    return sock.sendMessage(chat, {
      text: `📢 MENCIONANDO AL GRUPO\n\n${texto}`,
      mentions: menciones
    });
  }

  if (comando === "grupo") {
    const metadata = await sock.groupMetadata(chat);

    return sock.sendMessage(chat, {
      text:
`👥 INFORMACIÓN DEL GRUPO

📌 Nombre: ${metadata.subject}
👤 Miembros: ${metadata.participants.length}`
    });
  }

  return false;
}

module.exports = grupos;
