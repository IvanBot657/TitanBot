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
  image: fs.readFileSync("./titanbot.png"),  
  caption: `

🎃👻 𝓗𝓐𝓟𝓟𝓨 𝓗𝓐𝓛𝓛𝓞𝓦𝓔𝓔𝓝 👻🎃

꧁༺ 𝓐𝓸𝓲 𝓜𝓲𝔃𝓾𝓷𝓸 ༻꧂
🌙 Guardiana de la noche de Halloween.

👻 ¡Bienvenido a la noche de los espíritus! Las sombras despiertan, los misterios comienzan y una aventura terrorífica te espera junto a TITANBOT. 🦇

🕸️━━━━━━━━━━━━━━━━━━━━🕸️

🎃🕸️ 𝕋𝕀𝕋𝔸ℕ𝔹𝕆𝕋 🕸️🎃
🦇 EDICIÓN ESPECIAL • OCTUBRE
🌕 Versión: 3.1.0 🌕

🕯️☠️ MENÚ PRINCIPAL ☠️🕯️
╔══════════════════════════╗
║ 🎃 ¡BIENVENIDO AL TERROR! ║
╚══════════════════════════╝

🦇🕸️╞══════🎃══════╡🕸️🦇
━━〔 🏆 TEMPORADA TITAN 〕━━━╮
┃ • .temporada
┃ • .temporadatop
┃ • .temporadarecompensas
┃ • .temporadamision
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🏠 INICIO 〕━━━╮
┃ • .menu
┃ • .ping
┃ • .info
┃ • .version
┃ • .owner
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 👤 USUARIO 〕━━━╮
┃ • .registrar
┃ • .perfil
┃ • .nivel
┃ • .xp
┃ • .rank
┃ • .top
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
━〔 ⚔️ DUELO TITAN 〕━━━╮
┃ • .duelo @usuario
┃ • .aceptarduelo
┃ • .rechazar
┃ • .atacar
┃ • .defender
┃ • .habilidad
┃ • .especial
┃ • .curar
┃ • .cargar
┃ • .riesgo
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🐾 MASCOTAS 〕━━━╮
┃ • .mascota
┃ • .crearmascota
┃ • .alimentar
┃ • .jugar
┃ • .bañar
┃ • .dormir
┃ • .estado
┃ • .evolucionar
┃ • .tienda
┃ • .comprar
┃ • .inventario
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
━━━〔 🎯 MISIONES 〕━━━╮
┃ • .misiones
┃ • .mision
┃ • .misionesinfo
┃ • .misioncompletar
┃ • .misionreclamar
╰━━━━━━━━━━━━━━━━
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

╭━━━ 🎰 RULETA ━━━╮
┃ • .ruleta
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 💍 MATRIMONIO 〕━━━╮
┃
┃ 💍 .casar @usuario
┃ 📜 .matrimonio
┃ 💔 .divorcio
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🎌 ANIME 〕━━━╮
┃ • .reclamar
┃ • .mispersonajes
┃ • .personajes
┃ • .liberar
┃ • .animebuscar
┃ • .anime
┃ • .animeinfo
┃ • .personaje
┃ • .manga
┃ • .waifu
┃ • .husbando
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

╭━━━ ⚔️ BATALLAS ━━━╮
┃ • .batalla @usuario
┃ • .aceptar
┃ • .rechazar
┃ • .atacar
┃ • .defender
┃ • .habilidad
┃ • .batallainfo
┃ • .rendirse
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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

🦇🕸️╞══════🎃══════╡🕸️🦇

━━〔 👻 HALLOWEEN TITAN 〕━━━╮
┃ • .dulce 🍡 
┃ • .asustar 😱
┃ • .bailar 💃
┃ • .comer 🍭
┃ • .invocar 🔮
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🕷️🦇═══════🎃═══════🦇🕷️

🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
━〔 🎨 STICKERS 〕━━━━━━╮
┃ • .sticker
┃ • .stickertexto
┃ • .toimg
┃ • .take
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🐾 RACHA ANIMAL 〕━━━╮
┃
┃ 🔥 .racha
┃ ┗ Registra tu racha diaria
┃
┃ 📊 .rachaestado
┃ ┗ Mira tu racha y récord
┃
┃ 🐾 .rachalista
┃ ┗ Mira los 50 animales
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🎖️ TÍTULOS 〕━━━╮
┃
┃ 🎖️ .titulo
┃ ┗ Ver tu título actual
┃
┃ 📜 .titulos
┃ ┗ Ver todos los títulos
┃
┃ 📊 .tituloestado
┃ ┗ Ver tu progreso
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🃏 CARTAS 〕━━━╮
┃
┃ 🎴 .carta
┃ ┗ Obtener una carta aleatoria
┃
┃ 📚 .cartas
┃ ┗ Ver tu colección
┃
┃ 🔎 .cartainfo 1
┃ ┗ Ver información de una carta
┃
┃ 🏆 .cartasranking
┃ ┗ Ranking de coleccionistas
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🏆 EJÉRCITO DORADO 〕━━━╮
┃ • .ejercito
┃ • .reclutar
┃ • .atacar @usuario
┃ • .defender
┃ • .fortaleza
┃ • .entrenar
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🛡️ ADMINISTRACIÓN 〕━━━╮
┃ • .promote @usuario
┃ • .demote @usuario
┃ • .kick @usuario
┃ • .add número
┃ • .mute
┃ • .unmute
┃ • .warn @usuario
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🏝️ ISLA 〕━━━╮
┃ • .isla
┃ • .adoptar
┃ • .explorar
┃ • .construir
┃ • .inventario
┃ • .islastats
┃ • .islaranking
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🎃📖 LIBRO PROHIBIDO 〕━━━╮
┃ 🕯️ .libro
┃ 🪄 .hechizo
┃ 🪄 .hechizo @usuario
┃ 👁️ .ojo
┃ 🌑 .invocar
┃ 💀 .maldicion @usuario
┃ 🛡️ .proteccion
┃ 🔥 .ritual
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
━━〔 👹 BOSS 〕━━━━━━━━╮
┃ • .boss
┃ • .bossestado
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 🎉 EVENTOS 〕━━━╮
┃ • .evento
┃ • .eventos
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 ⚙️ CONFIGURACIÓN DEL GRUPO 〕━━━╮
┃ • .linkgrupo
┃ • .setnombre
┃ • .setdescripcion
┃ • .grupo
┃ • .cerrar
┃ • .abrir
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
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
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 ⚙️ AJUSTES 〕━━━╮
┃ • .configgrupo
┃ • .estadogrupo
┃ • .bienvenidaestado
┃ • .despedidaestado
┃ • .antilinkestado
┃ • .antispamestado
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

🦇🕸️╞══════🎃══════╡🕸️🦇
╭━━━〔 👑 OWNER 〕━━━╮
┃ • .botstatus
┃ • .broadcast
┃ • .shutdown
╰━━━━━━━━━━━━━━━━━━━━╯
🪵🦇═══════🎃═══════🦇🪵

╔══════════════════════════════╗
🦇🕸️═══════🎃═══════🕸️🦇
🦇 ${config.nombre} • HALLOWEEN 🎃
🌕 Sistema v3.1.0
🕸️ Que comiencen las sombras... 🕸️
╚══════════════════════════════╝`
});

return true;

}

// ==============================
// .ping
// ==============================
if (cmd === "ping") {
  await sock.sendMessage(chat, {
    text: `🏓 *PONG!*

🤖 ${config.nombre}
⚡ Bot activo
🚀 Versión: ${config.version}`
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
🤖 ${config.nombre}
╚════════════════════╝

📌 Información del bot

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
`🤖 ${config.nombre}

📦 Versión actual:
${config.version}

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
`👑 CREADOR DE ${config.nombre}

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
`🤖 ${config.nombre}

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
`📚 AYUDA - ${config.nombre}

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
