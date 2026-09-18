// ==========================================
// TITANBOT v3.1
// INICIO.JS
// ==========================================

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
  const cmd = comando.toLowerCase();

  // ==============================
  // .menu
  // ==============================
  if (cmd === "menu" || cmd === "menú") {
    await sock.sendMessage(chat, {
      text:
`╔══════════════════════════╗
        🤖 *${config.nombre}*
          ⚡ v3.1.0
╚══════════════════════════╝

👋 *MENÚ PRINCIPAL*

╭━━━〔 🏠 INICIO 〕━━━╮
┃ • .menu
┃ • .ping
┃ • .info
┃ • .version
┃ • .owner
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👤 USUARIO 〕━━━╮
┃ • .registrar
┃ • .perfil
┃ • .nivel
┃ • .xp
┃ • .rank
┃ • .top
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 💰 ECONOMÍA 〕━━━╮
┃ • .saldo
┃ • .daily
┃ • .trabajar
┃ • .minar
┃ • .pescar
┃ • .inventario
┃ • .mercado
┃ • .comprar
┃ • .transferir
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎮 JUEGOS 〕━━━╮
┃ • .juegos
┃ • .dado
┃ • .moneda
┃ • .adivina
┃ • .ppt
┃ • .trivia
┃ • .numero
┃ • .suerte
┃ • .8ball
╰━━━━━━━━━━━━━━━━━━━━╯

━━〔 🔮 PREDICCIÓN 〕━━━╮
┃ • .prediccion
┃ • .amor
┃ • .suerte
┃ • .random
┃ • .dinero
┃ • .gamer
┃ • .social
┃ • .nocturna
┃ • .epica
┃ • .troll
╰━━━━━━━━━━━━━━━━━━━━╯

━━〔 🎭 PERSONALIDAD 〕━━━╮
┃ • .personalidad
┃ • .aventurero
┃ • .intelectual
┃ • .gracioso
┃ • .travieso
┃ • .heroe
┃ • .misterioso
┃ • .energetico
┃ • .tranquilo
┃ • .lider
┃ • .creativo
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎭 ROLEPLAY 〕━━━╮
┃ • .abrazar
┃ • .besar
┃ • .golpear
┃ • .patada
┃ • .saludar
┃ • .felicitar
┃ • .reir
┃ • .llorar
┃ • .enojado
┃ • .bailar
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎉 DIVERSIÓN 〕━━━╮
┃ • .ship
┃ • .compatibilidad
┃ • .gay
┃ • .crush
┃ • .suerte
┃ • .frase
┃ • .chiste
┃ • .verdad
┃ • .reto
┃ • .8ball
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎌 ANIME 〕━━━╮
┃ • .anime
┃ • .animebuscar
┃ • .animeinfo
┃ • .personaje
┃ • .manga
┃ • .waifu
┃ • .husbando
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎵 MÚSICA 〕━━━╮
┃ • .play
┃ • .lyrics
┃ • .playlist
┃ • .cancionrandom
┃ • .artista
┃ • .album
┃ • .topmusic
┃ • .genero
┃ • .musica
┃ • .recomendacion
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👥 GRUPOS 〕━━━╮
┃ • .admins
┃ • .tagall
┃ • .hidetag
┃ • .reglas
┃ • .bienvenida
┃ • .despedida
┃ • .antilink
┃ • .antispam
╰━━━━━━━━━━━━━━━━━━━━╯

━〔 📅 EVENTOS DEL GRUPO 〕━━━╮
┃ • .evento
┃ • .evento crear
┃ • .evento lista
┃ • .evento info
┃ • .evento participar
┃ • .evento borrar
┃ • .evento ayuda
┃
┃ 📊 ENCUESTAS
┃ • .encuesta
┃ • .votar
┃
┃ 🎉 SORTEOS
┃ • .sorteo
╰━━━━━━━━━━━━━━━━━━━━╯

━〔 🎨 STICKERS 〕━━━━━━╮
┃ • .sticker
┃ • .stickertexto
┃ • .toimg
┃ • .take
╰━━━━━━━━━━━━━━━━━━━━╯

━━〔 📖 HISTORIA 〕━━━╮
┃ • .historia
┃ • .origen
┃ • .aventura
┃ • .progreso
┃ • .niveles
┃ • .logros
┃ • .capitulos
┃ • .destino
┃ • .futuro
┃ • .leyenda
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👑 RANKING PREMIUM 〕━━━╮
┃
┃ 🏆 COMANDOS DISPONIBLES
┃
┃ 👑 .rankingpremium
┃ 📊 Ver el ranking premium
┃
┃ 🥇 .top
┃ 📈 Ver los mejores usuarios
┃
┃ 👤 .mi-ranking
┃ 🎖️ Ver tu posición
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🛡️ ADMINISTRACIÓN 〕━━━╮
┃ • .promote @usuario
┃ • .demote @usuario
┃ • .kick @usuario
┃ • .add número
┃ • .mute
┃ • .unmute
┃ • .warn @usuario
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ⚙️ CONFIGURACIÓN DEL GRUPO 〕━━━╮
┃ • .linkgrupo
┃ • .setnombre
┃ • .setdescripcion
┃ • .grupo
┃ • .cerrar
┃ • .abrir
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🛠️ HERRAMIENTAS 〕━━━╮
┃ • .hora
┃ • .fecha
┃ • .id
┃ • .random
┃ • .calculadora
┃ • .mayusculas
┃ • .minusculas
┃ • .ping
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ⚙️ AJUSTES 〕━━━╮
┃ • .configgrupo
┃ • .estadogrupo
┃ • .bienvenidaestado
┃ • .despedidaestado
┃ • .antilinkestado
┃ • .antispamestado
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 👑 OWNER 〕━━━╮
┃ • .botstatus
┃ • .broadcast
┃ • .shutdown
╰━━━━━━━━━━━━━━━━━━━━╯

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
