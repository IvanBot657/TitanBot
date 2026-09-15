const config = require("../config");

// ==============================
// INICIO - TITANBOT v3.1
// ==============================

async function inicio(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin
) {
  const cmd = String(comando || "").toLowerCase();

  // ==============================
  // .menu
  // ==============================

  if (cmd === "menu" || cmd === "menú") {
    const menu = `
╔════════════════════════════╗
        🤖 *${config.nombre}*
           *v${config.version}*
╚════════════════════════════╝

👤 *USUARIO*
━━━━━━━━━━━━━━━━━━━━
.registrar [nombre]
.perfil
.nivel
.xp
.rank
.top

💰 *ECONOMÍA*
━━━━━━━━━━━━━━━━━━━━
.saldo
.daily
.trabajar
.minar
.pescar
.transferir @usuario cantidad
.inventario
.mercado
.comprar madera
.comprar pico
.comprar caña

🎮 *JUEGOS*
━━━━━━━━━━━━━━━━━━━━
.dado
.moneda
.adivina
.ppt
.trivia
.triviarespuesta
.numero
.suerte
.8ball
.juegos

🎌 *ANIME*
━━━━━━━━━━━━━━━━━━━━
.anime
.animebuscar
.animeinfo [nombre]
.personaje [nombre]
.manga [nombre]
.waifu
.husbando

👥 *GRUPOS*
━━━━━━━━━━━━━━━━━━━━
.admins
.tagall
.reglas
.bienvenida on/off
.despedida on/off
.antilink on/off
.antispam on/off

🛡️ *MODERACIÓN*
━━━━━━━━━━━━━━━━━━━━
.kick @usuario
.promote @usuario
.demote @usuario
.mute
.unmute
.warn @usuario

🛠️ *HERRAMIENTAS*
━━━━━━━━━━━━━━━━━━━━
.herramientas
.hora
.fecha
.id
.random
.calculadora
.mayusculas
.minusculas
.ping

⚙️ *AJUSTES*
━━━━━━━━━━━━━━━━━━━━
.ajustes
.configgrupo
.estadogrupo
.bienvenidaestado
.despedidaestado
.antilinkestado
.antispamestado

👑 *OWNER*
━━━━━━━━━━━━━━━━━━━━
.owner
.ownermenu
.botstatus
.broadcast
.shutdown

ℹ️ *INFORMACIÓN*
━━━━━━━━━━━━━━━━━━━━
.info
.version
.bot
.ayuda

━━━━━━━━━━━━━━━━━━━━
🤖 *${config.nombre}*
⚡ *Sistema v${config.version}*
`;

    await sock.sendMessage(chat, {
      text: menu
    });

    return true;
  }

  // ==============================
  // .ping
  // ==============================

  if (cmd === "ping") {
    await sock.sendMessage(chat, {
      text: "🏓 *PONG!*\n\n🤖 TitanBot está activo."
    });

    return true;
  }

  // ==============================
  // .info
  // ==============================

  if (cmd === "info") {
    await sock.sendMessage(chat, {
      text:
`🤖 *INFORMACIÓN DEL BOT*

📛 Nombre: ${config.nombre}
🔢 Versión: ${config.version}
💰 Moneda: ${config.moneda}
⚡ Prefijo: ${config.prefijo}

🟢 Estado: Activo`
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

📦 Versión: ${config.version}

🟢 Sistema funcionando correctamente.`
    });

    return true;
  }

  // ==============================
  // .owner
  // ==============================

  if (cmd === "owner") {
    await sock.sendMessage(chat, {
      text:
`👑 *OWNER DE ${config.nombre}*

📱 Contacto:
https://wa.me/${config.creador}

🤖 ${config.nombre} v${config.version}`
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

🟢 Estado: Online
⚡ Versión: ${config.version}
💰 Moneda: ${config.moneda}

¡Todo funcionando correctamente!`
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
Para comprobar que el bot está activo.

.info
Para ver información del bot.

.version
Para ver la versión actual.

👥 Para administrar grupos:

.kick @usuario
.promote @usuario
.demote @usuario
.mute
.unmute
.warn @usuario

Escribe *.menu* para ver la lista completa.`
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
