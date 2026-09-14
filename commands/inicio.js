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
📦 Versión: ${config.version}

👑 Número:
${config.creador}`
    });
  }

  if (comando === "menu") {

    return sock.sendMessage(chat, {
      text:
`╔════════════════════════════╗
║       🤖 TITANBOT         ║
║          V2.5.0           ║
╚════════════════════════════╝

🎮 INICIO
.ping
.info
.owner
.version
.menu

👤 USUARIO
.perfil
.registrar
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
.depositar
.retirar
.inventario
.tienda
.comprar
.transferir

🎲 JUEGOS
.dado
.moneda
.8ball
.suerte
.numero
.adivina
.ppt
.dados
.juegos

🎌 ANIME
.anime
.animeinfo
.personaje

👥 GRUPOS
.grupo
.admins
.tagall
.miembros
.idgrupo
.reglas
.grupomenu

🛠️ HERRAMIENTAS
.herramientas
.hora
.fecha
.calculadora
.id
.botinfo

⚙️ AJUSTES
.ajustes
.estado
.prefijo
.configgrupo
.bienvenida on/off
.despedida on/off

👑 OWNER
.owner
.ownermenu
.botstatus
.reiniciar

╔════════════════════════════╗
║ 🤖 ${config.nombre}
║ 📦 v${config.version}
║ 🟢 ONLINE
╚════════════════════════════╝`
    });
  }

  return false;
}

module.exports = inicio;
