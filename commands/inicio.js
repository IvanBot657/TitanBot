const config = require("../config");

async function inicio(sock, chat, comando) {

  if (comando === "ping") {
    return sock.sendMessage(chat, {
      text: "🏓 Pong!\n⚡ TitanBot está funcionando."
    });
  }

  if (comando === "info") {
    return sock.sendMessage(chat, {
      text:
`🤖 ${config.nombre}

📦 Versión: ${config.version}
🟢 Estado: Online
⚡ Sistema: WhatsApp`
    });
  }

  if (comando === "version") {
    return sock.sendMessage(chat, {
      text: `📦 ${config.nombre} v${config.version}`
    });
  }

  if (comando === "owner") {
    return sock.sendMessage(chat, {
      text:
`👑 CREADOR

🤖 ${config.nombre}
📦 Versión: ${config.version}`
    });
  }

  if (comando === "menu") {
    return sock.sendMessage(chat, {
      text:
`╔══════════════════════╗
║     🤖 TITANBOT      ║
║        V2.5          ║
╚══════════════════════╝

🎮 INICIO
.ping
.info
.owner
.version

👤 USUARIO
.perfil
.nivel
.xp
.rank
.top

💰 ECONOMÍA
.saldo
.daily
.trabajar
.minar
.pescar
.inventario
.tienda
.comprar

🎲 JUEGOS
.dado
.moneda
.8ball

🛠️ HERRAMIENTAS
.hora
.fecha
.calculadora`
    });
  }

  return false;
}

module.exports = inicio;
