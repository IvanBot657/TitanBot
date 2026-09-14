async function grupos(
  sock,
  chat,
  comando,
  args,
  id,
  isGroup,
  isAdmin
) {

  // ==============================
  // SOLO GRUPOS
  // ==============================

  if (!isGroup) {

    return sock.sendMessage(chat, {
      text:
        "❌ Este comando solo funciona en grupos."
    });

  }

  // ==============================
  // INFORMACIÓN DEL GRUPO
  // ==============================

  if (comando === "grupo") {

    const metadata =
      await sock.groupMetadata(chat);

    return sock.sendMessage(chat, {
      text:
`👥 INFORMACIÓN DEL GRUPO

📌 Nombre:
${metadata.subject}

👤 Miembros:
${metadata.participants.length}

🆔 ID:
${chat}`
    });

  }

  // ==============================
  // ADMINISTRADORES
  // ==============================

  if (comando === "admins") {

    const metadata =
      await sock.groupMetadata(chat);

    const admins =
      metadata.participants
        .filter(
          p =>
            p.admin === "admin" ||
            p.admin === "superadmin"
        );

    if (!admins.length) {

      return sock.sendMessage(chat, {
        text:
          "❌ No se encontraron administradores."
      });

    }

    const lista =
      admins
        .map(
          (p, i) =>
            `${i + 1}. @${p.id.split("@")[0]}`
        )
        .join("\n");

    const menciones =
      admins.map(p => p.id);

    return sock.sendMessage(chat, {
      text:
`👑 ADMINISTRADORES

${lista}`,
      mentions: menciones
    });

  }

  // ==============================
  // TAG ALL
  // ==============================

  if (comando === "tagall") {

    const metadata =
      await sock.groupMetadata(chat);

    const participantes =
      metadata.participants || [];

    const menciones =
      participantes
        .map(p => p.id)
        .filter(Boolean);

    const texto =
      participantes
        .map(
          (p, i) =>
            `${i + 1}. @${p.id.split("@")[0]}`
        )
        .join("\n");

    return sock.sendMessage(chat, {
      text:
`📢 MENCIONANDO AL GRUPO

${texto}`,
      mentions: menciones
    });

  }

  // ==============================
  // MIEMBROS
  // ==============================

  if (comando === "miembros") {

    const metadata =
      await sock.groupMetadata(chat);

    return sock.sendMessage(chat, {
      text:
`👥 MIEMBROS

📌 Grupo:
${metadata.subject}

👤 Total:
${metadata.participants.length}`
    });

  }

  // ==============================
  // ID DEL GRUPO
  // ==============================

  if (comando === "idgrupo") {

    return sock.sendMessage(chat, {
      text:
`🆔 ID DEL GRUPO

${chat}`
    });

  }

  // ==============================
  // REGLAS
  // ==============================

  if (comando === "reglas") {

    return sock.sendMessage(chat, {
      text:
`📜 REGLAS DEL GRUPO

1️⃣ Respeta a los demás.
2️⃣ No hagas spam.
3️⃣ No compartas contenido peligroso.
4️⃣ No molestes a otros miembros.
5️⃣ Sigue las indicaciones de los administradores.

🤖 TitanBot`
    });

  }

  // ==============================
  // AYUDA
  // ==============================

  if (comando === "grupomenu") {

    return sock.sendMessage(chat, {
      text:
`👥 COMANDOS DE GRUPO

👥 .grupo
👑 .admins
📢 .tagall
👤 .miembros
🆔 .idgrupo
📜 .reglas`
    });

  }

  return false;
}

module.exports = grupos;
