const config = require("../config");

async function inicio(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin
) {

  // =========================
  // MENU
  // =========================

  if (comando === "menu") {

    return sock.sendMessage(chat, {
      text:
`╔══════════════════════╗
║      🤖 TITANBOT     ║
║       v${config.version}       ║
╚══════════════════════╝

👤 USUARIO
.registrar
.perfil
.nivel
.xp
.rank
.top
.misiones

💰 ECONOMÍA
.saldo
.daily
.trabajar
.minar
.pescar
.casino
.apostar
.transferir
.inventario
.mercado

🎲 JUEGOS
.dado
.moneda
.slot
.trivia
.ruleta

🎌 ANIME
.anime
.personaje
.manga
.waifu

👥 GRUPOS
.admins
.tagall
.reglas
.antilink
.antispam

🛠️ HERRAMIENTAS
.hora
.fecha
.calculadora
.id
.qr

⚙️ AJUSTES
.bienvenida
.despedida
.configgrupo

👑 OWNER
.botstatus
.reiniciar
.broadcast

╔══════════════════════╗
║ 🟢 TitanBot Online   ║
╚══════════════════════╝`
    });
  }


  // =========================
  // PING
  // =========================

  if (comando === "ping") {

    return sock.sendMessage(chat, {
      text:
`🏓 PONG

🤖 Bot:
${config.nombre}

📦 Versión:
${config.version}

🟢 Estado:
Online`
    });
  }


  // =========================
  // INFO
  // =========================

  if (comando === "info") {

    return sock.sendMessage(chat, {
      text:
`🤖 INFORMACIÓN

Nombre:
${config.nombre}

Versión:
${config.version}

Prefijo:
${config.prefijo}

Moneda:
${config.moneda}

Creador:
${config.creador}`
    });
  }


  // =========================
  // VERSION
  // =========================

  if (comando === "version") {

    return sock.sendMessage(chat, {
      text:
`📦 TitanBot

Versión actual:

${config.version}`
    });
  }


  // =========================
  // OWNER
  // =========================

  if (comando === "owner") {

    return sock.sendMessage(chat, {
      text:
`👑 OWNER

Contacto:

${config.creador}`
    });
  }


  // =========================
  // BOT
  // =========================

  if (comando === "bot") {

    return sock.sendMessage(chat, {
      text:
`🤖 TITANBOT

🟢 Estado: Online
📦 Versión: ${config.version}
💰 Moneda: ${config.moneda}
⚡ Prefijo: ${config.prefijo}`
    });
  }

  return false;
}

module.exports = inicio;
