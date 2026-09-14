const config = require("../config");

async function owner(
  sock,
  chat,
  comando,
  args,
  id
) {

  // =========================
  // COMPROBAR OWNER
  // =========================

  const numeroUsuario =
    String(id)
      .split("@")[0]
      .replace(/\D/g, "");

  const numeroOwner =
    String(config.creador)
      .replace(/\D/g, "");

  const esOwner =
    numeroUsuario === numeroOwner;

  // =========================
  // INFORMACIÓN DEL OWNER
  // =========================

  if (comando === "owner") {

    return sock.sendMessage(chat, {
      text:
`👑 CREADOR DE TITANBOT

🤖 Bot:
${config.nombre}

📦 Versión:
${config.version}

👑 Creador:
${config.creador}`
    });
  }

  // =========================
  // MENÚ OWNER
  // =========================

  if (comando === "ownermenu") {

    if (!esOwner) {
      return sock.sendMessage(chat, {
        text:
          "❌ Este comando es exclusivo del creador."
      });
    }

    return sock.sendMessage(chat, {
      text:
`👑 MENÚ OWNER

🤖 ${config.nombre}
📦 v${config.version}

🛠️ COMANDOS

.owner
.ownermenu
.botstatus
.reiniciar`
    });
  }

  // =========================
  // ESTADO DEL BOT
  // =========================

  if (comando === "botstatus") {

    if (!esOwner) {
      return sock.sendMessage(chat, {
        text:
          "❌ Este comando es exclusivo del creador."
      });
    }

    return sock.sendMessage(chat, {
      text:
`🤖 ESTADO DEL BOT

🟢 Estado: ONLINE

📦 Versión:
${config.version}

⚡ Plataforma:
WhatsApp

🔧 Sistema:
Baileys

👑 Owner:
${config.creador}`
    });
  }

  // =========================
  // REINICIAR
  // =========================

  if (comando === "reiniciar") {

    if (!esOwner) {
      return sock.sendMessage(chat, {
        text:
          "❌ Este comando es exclusivo del creador."
      });
    }

    await sock.sendMessage(chat, {
      text:
        "🔄 TitanBot se está reiniciando..."
    });

    setTimeout(() => {
      process.exit(0);
    }, 1000);

    return true;
  }

  return false;
}

module.exports = owner;
