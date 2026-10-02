// ==========================================
// TITANBOT v3.1
// INICIO.JS
// ==========================================

const config = require("../config");
const fs = require("fs");

async function inicio(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin
) {
  const cmd = comando.toLowerCase();

  // ==============================
  // .menu
  // ==============================
  if (cmd === "menu" || cmd === "menú") {

   await sock.sendMessage(chat, {
  video: fs.readFileSync("./menu.gif"), // o tu .mp4
  gifPlayback: true,
  caption: `
🤖 *TITANBOT*
⚡ *Versión:* 3.1.0

👋 *MENÚ PRINCIPAL*

...TODO TU MENÚ...

⚡ *${config.nombre}*
🚀 *Sistema v3.1.0*
`
});

⚡ *${config.nombre}*
🚀 *Sistema v3.1.0*`
    });

    return true;
  }

  // ==============================
  // .ping
  // ==============================
  if (cmd === "ping") {
    await sock.sendMessage(chat, {
      text: `🏓 *PONG!*\n\n🤖 ${config.nombre}\n⚡ Bot activo\n🚀 Versión: ${config.version}`
    });

    return true;
  }

  // ==============================
  // .info
  // ==============================
  if (cmd === "info") {
    await sock.sendMessage(chat, {
      text:
`╔════════════════════╗
      🤖 *${config.nombre}*
╚════════════════════╝

📌 *Información del bot*

⚡ Versión: ${config.version}
💰 Moneda: ${config.moneda}
🔧 Prefijo: ${config.prefijo}
🌐 Web: ${config.web}

📡 Estado: 🟢 Online
`
    });

    return true;
  }

  // ==============================
  // .version
  // ==============================
  if (cmd === "version") {
    await sock.sendMessage(chat, {
      text:
`🤖 *${config.nombre}*

📦 Versión actual:
*${config.version}*

🟢 Estado: Funcionando
⚡ Sistema: TitanBot v3.1`
    });

    return true;
  }

  // ==============================
  // .owner
  // ==============================
  if (cmd === "owner") {
    await sock.sendMessage(chat, {
      text:
`👑 *CREADOR DE ${config.nombre}*

📞 Contacto:
+${config.creador}

🤖 Bot: ${config.nombre}
⚡ Versión: ${config.version}`
    });

    return true;
  }

  // ==============================
  // .bot
  // ==============================
  if (cmd === "bot") {
    await sock.sendMessage(chat, {
      text:
`🤖 *${config.nombre}*

🟢 El bot está funcionando correctamente.
⚡ Versión: ${config.version}`
    });

    return true;
  }

// ==============================
// .ayuda
// ==============================
if (cmd === "ayuda" || cmd === "help") {
  await sock.sendMessage(chat, {
    text:
`📚 *AYUDA - ${config.nombre}*

Usa:

.menu
Para ver todos los comandos.

.ping
Para comprobar si el bot está activo.

.info
Para ver información del bot.

.version
Para ver la versión actual.`
  });

  return true;
}

// ==============================
// FIN DEL MÓDULO
// ==============================

return false;
}

// ==============================
// EXPORTACIÓN
// ==============================

module.exports = inicio;
module.exports.inicio = inicio;
