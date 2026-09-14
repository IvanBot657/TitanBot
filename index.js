const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

const PORT = process.env.PORT || 3000;
const PAIRING_NUMBER = (process.env.PAIRING_NUMBER || "").replace(/\D/g, "");

const BOT_NAME = "TITANBOT";
const FRASE = "⚡ Más que un bot, tu compañero digital.";
const PREFIX = ".";

let sock = null;
let conectado = false;
let solicitandoCodigo = false;
let reconectando = false;
const inicio = Date.now();

const perfiles = {};
const perfilesEnProceso = {};
const personajesReclamados = {};
const usuarios = {};
const grupos = {};

const personajes = [
  "Naruto Uzumaki",
  "Goku",
  "Monkey D. Luffy",
  "Tanjiro Kamado",
  "Gojo Satoru",
  "Saitama",
  "Levi Ackerman",
  "Ichigo Kurosaki",
  "Eren Yeager",
  "Mikasa Ackerman",
  "Sasuke Uchiha",
  "Itachi Uchiha",
  "Kakashi Hatake",
  "Killua Zoldyck",
  "Gon Freecss",
  "Light Yagami",
  "Edward Elric",
  "Meliodas",
  "Deku",
  "Bakugo"
];

/* =========================
   SERVIDOR PARA RENDER
========================= */

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end(
    conectado
      ? "TitanBot conectado correctamente 🤖"
      : "TitanBot funcionando..."
  );
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor iniciado en puerto ${PORT}`);
});

/* =========================
   FUNCIONES GENERALES
========================= */

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const numero = jid => String(jid || "").split("@")[0];

const elegir = lista =>
  lista[Math.floor(Math.random() * lista.length)];

const dinero = cantidad =>
  Number(cantidad || 0).toLocaleString("es-CO");

function nombreUsuario(jid) {
  return perfiles[numero(jid)]?.nombre || "Sin registrar";
}

function iniciarUsuario(jid) {
  const n = numero(jid);

  if (!usuarios[n]) {
    usuarios[n] = {
      monedas: 100,
      xp: 0,
      nivel: 1,
      racha: 0,
      diario: 0,
      trabajo: 0,
      inventario: []
    };
  }

  return usuarios[n];
}

function agregarXP(jid, cantidad = 5) {
  const usuario = iniciarUsuario(jid);

  usuario.xp += cantidad;

  const nivelNuevo =
    Math.floor(usuario.xp / 100) + 1;

  if (nivelNuevo > usuario.nivel) {
    usuario.nivel = nivelNuevo;
    return nivelNuevo;
  }

  return 0;
}

function tiempoActivo() {
  const segundos =
    Math.floor((Date.now() - inicio) / 1000);

  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const secs = segundos % 60;

  return `${dias}d ${horas}h ${minutos}m ${secs}s`;
}

async function enviar(jid, texto, extra = {}) {
  if (!sock) return;

  return sock.sendMessage(jid, {
    text: texto,
    ...extra
  });
}

async function obtenerFoto(jid) {
  try {
    return await sock.profilePictureUrl(jid, "image");
  } catch {
    return null;
  }
}

async function obtenerGrupo(jid) {
  try {
    if (!jid.endsWith("@g.us")) return null;

    return await sock.groupMetadata(jid);
  } catch {
    return null;
  }
}

async function esAdmin(jid, usuario) {
  const grupo = await obtenerGrupo(jid);

  if (!grupo) return false;

  const participante = grupo.participants.find(
    p => p.id === usuario || p.lid === usuario
  );

  return Boolean(participante?.admin);
}

async function botEsAdmin(jid) {
  const grupo = await obtenerGrupo(jid);

  if (!grupo || !sock?.user) return false;

  const miNumero =
    sock.user.id.split(":")[0] +
    "@s.whatsapp.net";

  const participante = grupo.participants.find(
    p =>
      p.id === miNumero ||
      p.lid === miNumero
  );

  return Boolean(participante?.admin);
}

async function comprobarAdmin(jid, usuario) {
  if (!jid.endsWith("@g.us")) {
    await enviar(
      jid,
      "👥 Este comando solo funciona en grupos."
    );

    return false;
  }

  if (!(await esAdmin(jid, usuario))) {
    await enviar(
      jid,
      "⛔ Solo los administradores pueden usar este comando."
    );

    return false;
  }

  return true;
}

async function comprobarBotAdmin(jid) {
  if (!(await botEsAdmin(jid))) {
    await enviar(
      jid,
      "⚠️ Necesito ser administrador del grupo."
    );

    return false;
  }

  return true;
}

function obtenerMencion(texto, contexto) {
  if (contexto?.mentionedJid?.length) {
    return contexto.mentionedJid[0];
  }

  const encontrado =
    texto.match(/@(\d{7,15})/);

  if (encontrado) {
    return `${encontrado[1]}@s.whatsapp.net`;
  }

  return null;
}

function calcular(expresion) {
  if (!expresion) return null;

  if (
    !/^[0-9+\-*/%().\s]+$/.test(expresion)
  ) {
    return null;
  }

  try {
    const resultado = Function(
      `"use strict"; return (${expresion})`
    )();

    return Number.isFinite(resultado)
      ? resultado
      : null;
  } catch {
    return null;
  }
}

/* =========================
   MENÚ
========================= */

const MENU = `
╭━━━〔 🤖 TITANBOT 〕━━━╮
┃
┃ ${FRASE}
┃
┃ 📌 GENERALES
┃ .menu
┃ .ping
┃ .bot
┃ .info
┃ .estado
┃ .hora
┃ .fecha
┃ .ayuda
┃ .uptime
┃ .version
┃
┃ 🪪 PERFIL
┃ .id
┃ .completarperfil
┃ .perfilanime
┃ .claim
┃ .unclaim
┃ .nivel
┃ .xp
┃ .ranking
┃ .rank
┃ .topxp
┃ .logros
┃ .mislogros
┃ .premios
┃ .racha
┃ .misstats
┃ .estadisticas
┃
┃ 🎴 ANIME
┃ .s
┃ .buscaranime
┃ .waifu
┃ .randomanime
┃ .animes
┃ .personaje
┃ .animeinfo
┃ .animequote
┃ .manga
┃ .topanime
┃
┃ 🎮 JUEGOS
┃ .dado
┃ .moneda
┃ .8ball
┃ .reto
┃ .verdad
┃ .ppt
┃ .quiz
┃ .trivia
┃ .adivina
┃ .memoria
┃ .numerosecreto
┃ .palabra
┃ .ahorcado
┃ .matematicas
┃ .batalla
┃
┃ 🛠️ HERRAMIENTAS
┃ .mayus
┃ .minus
┃ .contador
┃ .calcular
┃ .texto
┃ .traducir
┃ .emoji
┃ .reverse
┃ .repetir
┃ .codigo
┃ .qr
┃ .acortar
┃ .sorteo
┃ .temporizador
┃ .recordatorio
┃
┃ 👥 GRUPOS
┃ .grupo
┃ .miembros
┃ .admins
┃ .reglas
┃ .tagall
┃ .hidetag
┃ .promover
┃ .degradar
┃ .kick
┃ .add
┃ .link
┃ .welcome
┃ .goodbye
┃ .antilink
┃ .antispam
┃
┃ 💰 ECONOMÍA
┃ .saldo
┃ .diario
┃ .trabajar
┃ .robar
┃ .pagar
┃ .tienda
┃ .comprar
┃ .inventario
┃ .regalar
┃ .topmonedas
┃
╰━━━━━━━━━━━━━━━━━━━━╯
⚡ TITANBOT
${FRASE}
`;

/* =========================
   COMANDOS
========================= */

async function ejecutarComando(
  jid,
  usuario,
  comando,
  argumentos,
  contexto
) {
  const u = iniciarUsuario(usuario);

  agregarXP(usuario, 2);

  /* ========= GENERALES ========= */

  if (comando === ".menu") {
    return enviar(jid, MENU);
  }

  if (comando === ".ping") {
    return enviar(
      jid,
      "🏓 Pong!\n\n🤖 TitanBot está funcionando."
    );
  }

  if (comando === ".bot") {
    return enviar(
      jid,
      `🤖 *TITANBOT*\n\n${FRASE}\n\n🟢 Estado: ${
        conectado ? "ONLINE" : "OFFLINE"
      }`
    );
  }

  if (comando === ".info") {
    return enviar(
      jid,
      `🤖 *TITANBOT*

${FRASE}

📱 WhatsApp Bot
📊 100 funciones
🟢 Estado: ${conectado ? "ONLINE" : "OFFLINE"}
⏱️ Uptime: ${tiempoActivo()}`
    );
  }

  if (comando === ".estado") {
    return enviar(
      jid,
      `📡 *ESTADO TITANBOT*

🟢 Bot: ${conectado ? "ONLINE" : "OFFLINE"}
⏱️ Tiempo activo: ${tiempoActivo()}`
    );
  }

  if (comando === ".hora") {
    return enviar(
      jid,
      `🕐 Hora Colombia:\n${new Date().toLocaleTimeString(
        "es-CO",
        {
          timeZone: "America/Bogota"
        }
      )}`
    );
  }

  if (comando === ".fecha") {
    return enviar(
      jid,
      `📅 Fecha Colombia:\n${new Date().toLocaleDateString(
        "es-CO",
        {
          timeZone: "America/Bogota"
        }
      )}`
    );
  }

  if (comando === ".ayuda") {
    return enviar(
      jid,
      `❓ *AYUDA TITANBOT*

Usa *.menu* para ver todos los comandos.

Ejemplos:

.ping
.id
.s
.claim
.dado
.calcular 10+5
.saldo
.diario`
    );
  }

  if (comando === ".uptime") {
    return enviar(
      jid,
      `⏱️ TitanBot lleva activo:\n${tiempoActivo()}`
    );
  }

  if (comando === ".version") {
    return enviar(
      jid,
      "🤖 TitanBot v2.0\n⚡ Sistema de 100 funciones"
    );
  }

  /* ========= PERFIL ========= */

  if (comando === ".id") {
    const p = perfiles[numero(usuario)];

    if (!p) {
      return enviar(
        jid,
        `🪪 *TITAN ID*

❌ No tienes un perfil.

Usa:
*.completarperfil*`
      );
    }

    const foto = await obtenerFoto(usuario);

    const tarjeta = `
╭━━━〔 🪪 TITAN ID 〕━━━╮
┃
┃ 👤 Nombre: ${p.nombre}
┃ 🎂 Edad: ${p.edad}
┃ 📅 Cumpleaños: ${p.cumpleanos}
┃
┃ 💬 Frase favorita:
┃ "${p.frase}"
┃
╰━━━━━━━━━━━━━━━━━━━━╯
🤖 TITANBOT
`;

    if (foto) {
      return sock.sendMessage(jid, {
        image: {
          url: foto
        },
        caption: tarjeta
      });
    }

    return enviar(jid, tarjeta);
  }

  if (comando === ".completarperfil") {
    perfilesEnProceso[numero(usuario)] = {
      paso: 1,
      datos: {}
    };

    return enviar(
      jid,
      `🪪 *CREAR PERFIL TITANBOT*

👤 ¿Cuál es tu nombre?`
    );
  }

  if (comando === ".perfilanime") {
    const personaje =
      personajesReclamados[numero(usuario)] ||
      "Ninguno";

    return enviar(
      jid,
      `🎴 *PERFIL ANIME*

👤 ${nombreUsuario(usuario)}
🎴 Personaje: ${personaje}
⚡ Nivel: ${u.nivel}
✨ XP: ${u.xp}
💰 Monedas: ${dinero(u.monedas)}`
    );
  }

  if (comando === ".claim") {
    const n = numero(usuario);

    if (personajesReclamados[n]) {
      return enviar(
        jid,
        `🎴 Ya tienes a *${personajesReclamados[n]}*.`
      );
    }

    const libres = personajes.filter(
      p => !Object.values(personajesReclamados)
        .includes(p)
    );

    const personaje = libres.length
      ? elegir(libres)
      : elegir(personajes);

    personajesReclamados[n] = personaje;

    u.xp += 25;

    return enviar(
      jid,
      `╭━━━〔 🎴 CLAIM 〕━━━╮
┃
┃ 🔥 Personaje:
┃ ${personaje}
┃
┃ ✨ +25 XP
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
    );
  }

  if (comando === ".unclaim") {
    const n = numero(usuario);

    if (!personajesReclamados[n]) {
      return enviar(
        jid,
        "❌ No tienes ningún personaje."
      );
    }

    const personaje =
      personajesReclamados[n];

    delete personajesReclamados[n];

    return enviar(
      jid,
      `✅ Liberaste a *${personaje}*.`
    );
  }

  if (
    comando === ".nivel" ||
    comando === ".rank"
  ) {
    return enviar(
      jid,
      `⚡ *NIVEL*

🎚️ Nivel: ${u.nivel}
✨ XP: ${u.xp}
📈 Próximo nivel: ${u.nivel * 100} XP`
    );
  }

  if (comando === ".xp") {
    return enviar(
      jid,
      `✨ Tienes *${u.xp} XP*.`
    );
  }

  if (
    comando === ".ranking" ||
    comando === ".topxp"
  ) {
    const ranking = Object.entries(usuarios)
      .sort((a, b) =>
        b[1].xp - a[1].xp
      )
      .slice(0, 10);

    if (!ranking.length) {
      return enviar(
        jid,
        "🏆 Todavía no hay jugadores."
      );
    }

    return enviar(
      jid,
      `🏆 *TOP XP*

${ranking
  .map(
    (x, i) =>
      `${i + 1}. @${x[0]} — ${x[1].xp} XP`
  )
  .join("\n")}`
    );
  }

  if (
    comando === ".logros" ||
    comando === ".mislogros"
  ) {
    return enviar(
      jid,
      `🏆 *LOGROS TITANBOT*

🌟 Primer paso
🎮 Jugador
🎴 Coleccionista
⚡ Veterano
👑 Leyenda

Sigue usando el bot para desbloquearlos.`
    );
  }

  if (comando === ".premios") {
    return enviar(
      jid,
      `🏆 *PREMIOS*

🥉 Nivel 3 — 100 monedas
🥈 Nivel 5 — 250 monedas
🥇 Nivel 10 — 1.000 monedas`
    );
  }

  if (comando === ".racha") {
    return enviar(
      jid,
      `🔥 Tu racha actual es: *${u.racha}*`
    );
  }

  if (
    comando === ".misstats" ||
    comando === ".estadisticas"
  ) {
    return enviar(
      jid,
      `📊 *ESTADÍSTICAS*

⚡ Nivel: ${u.nivel}
✨ XP: ${u.xp}
💰 Monedas: ${dinero(u.monedas)}
🔥 Racha: ${u.racha}
🎴 Personaje: ${
        personajesReclamados[numero(usuario)] ||
        "Ninguno"
      }`
    );
  }

  /* ========= ANIME ========= */

  if (
    comando === ".s" ||
    comando === ".randomanime"
  ) {
    const personaje =
      personajesReclamados[numero(usuario)] ||
      elegir(personajes);

    return enviar(
      jid,
      `╭━━━〔 🎴 ANIME CARD 〕━━━╮
┃
┃ 👤 ${nombreUsuario(usuario)}
┃
┃ 🎴 Personaje:
┃ *${personaje}*
┃
┃ ⚡ TITANBOT
╰━━━━━━━━━━━━━━━━━━━━╯`
    );
  }

  if (
    comando === ".buscaranime" ||
    comando === ".animeinfo" ||
    comando === ".personaje"
  ) {
    return enviar(
      jid,
      `🎴 *ANIME INFO*

🔎 Búsqueda:
${argumentos || "No especificada"}

Usa *.personaje nombre* para indicar un personaje.`
    );
  }

  if (comando === ".waifu") {
    return enviar(
      jid,
      `💖 Waifu aleatoria:

*${elegir([
        "Hinata Hyuga",
        "Nezuko Kamado",
        "Asuna Yuuki",
        "Rem",
        "Nami"
      ])}*`
    );
  }

  if (comando === ".animes") {
    return enviar(
      jid,
      `🎴 *ANIMES POPULARES*

1️⃣ Naruto
2️⃣ One Piece
3️⃣ Dragon Ball
4️⃣ Demon Slayer
5️⃣ Jujutsu Kaisen`
    );
  }

  if (comando === ".animequote") {
    return enviar(
      jid,
      `💬 *FRASE ANIME*

"${elegir([
        "Nunca te rindas.",
        "Sigue avanzando.",
        "Confía en ti.",
        "El esfuerzo cuenta."
      ])}"`
    );
  }

  if (comando === ".manga") {
    return enviar(
      jid,
      `📚 Manga:
${argumentos || "No especificado"}`
    );
  }

  if (comando === ".topanime") {
    const lista =
      Object.entries(personajesReclamados);

    if (!lista.length) {
      return enviar(
        jid,
        "🎴 Nadie ha reclamado un personaje todavía."
      );
    }

    return enviar(
      jid,
      `🏆 *TOP ANIME*

${lista
  .map(
    (x, i) =>
      `${i + 1}. @${x[0]} — ${x[1]}`
  )
  .join("\n")}`
    );
  }

  /* ========= JUEGOS ========= */

  if (comando === ".dado") {
    return enviar(
      jid,
      `🎲 Resultado:
*${Math.floor(Math.random() * 6) + 1}*`
    );
  }

  if (comando === ".moneda") {
    return enviar(
      jid,
      `🪙 Cayó:
*${elegir(["CARA", "SELLO"])}*`
    );
  }

  if (comando === ".8ball") {
    return enviar(
      jid,
      `🎱 ${elegir([
        "Sí.",
        "No.",
        "Probablemente.",
        "Definitivamente.",
        "Pregunta después."
      ])}`
    );
  }

  if (comando === ".reto") {
    return enviar(
      jid,
      `🔥 *RETO*

${elegir([
        "Cuenta un chiste.",
        "Di una verdad divertida.",
        "Envía 3 emojis que te representen.",
        "Di cuál es tu videojuego favorito."
      ])}`
    );
  }

  if (comando === ".verdad") {
    return enviar(
      jid,
      `🗣️ *VERDAD*

${elegir([
        "¿Cuál es tu meta principal?",
        "¿Cuál es tu juego favorito?",
        "¿Qué talento quieres aprender?",
        "¿Cuál es tu anime favorito?"
      ])}`
    );
  }

  if (comando === ".ppt") {
    return enviar(
      jid,
      `✊ *PIEDRA PAPEL TIJERA*

Tu elección:
${argumentos || "No especificada"}

TitanBot:
${elegir(["Piedra", "Papel", "Tijera"])}`
    );
  }

  if (
    comando === ".quiz" ||
    comando === ".trivia"
  ) {
    return enviar(
      jid,
      `🧠 *QUIZ*

¿Cuál es la capital de Colombia?

A) Cali
B) Bogotá
C) Medellín

Responde A, B o C.`
    );
  }

  if (comando === ".adivina") {
    return enviar(
      jid,
      `🔮 Piensa un número del 1 al 10...

TitanBot dice:
*${Math.floor(Math.random() * 10) + 1}*`
    );
  }

  if (comando === ".memoria") {
    return enviar(
      jid,
      `🧠 Memoriza:

🍎 🚀 ⭐ 🎮

Ahora intenta repetirlo.`
    );
  }

  if (comando === ".numerosecreto") {
    return enviar(
      jid,
      `🔢 Número secreto:
*${Math.floor(Math.random() * 100) + 1}*`
    );
  }

  if (comando === ".palabra") {
    return enviar(
      jid,
      `🔤 Palabra:
*${elegir([
        "computadora",
        "programacion",
        "robot",
        "anime",
        "tecnologia"
      ])}*`
    );
  }

  if (comando === ".ahorcado") {
    return enviar(
      jid,
      `🎯 *AHORCADO*

_ _ _ _ _
Pista: tecnología`
    );
  }

  if (comando === ".matematicas") {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;

    return enviar(
      jid,
      `🧮 ¿Cuánto es?

${a} × ${b} = ?`
    );
  }

  if (comando === ".batalla") {
    return enviar(
      jid,
      `⚔️ *BATALLA*

👤 Tu poder:
${Math.floor(Math.random() * 100) + 1}

🤖 TitanBot:
${Math.floor(Math.random() * 100) + 1}`
    );
  }

  /* ========= HERRAMIENTAS ========= */

  if (comando === ".mayus") {
    return enviar(
      jid,
      (argumentos || "").toUpperCase()
    );
  }

  if (comando === ".minus") {
    return enviar(
      jid,
      (argumentos || "").toLowerCase()
    );
  }

  if (comando === ".contador") {
    const palabras = argumentos.trim()
      ? argumentos.trim().split(/\s+/).length
      : 0;

    return enviar(
      jid,
      `🔢 Caracteres: ${argumentos.length}
📝 Palabras: ${palabras}`
    );
  }

  if (comando === ".calcular") {
    const resultado = calcular(argumentos);

    return enviar(
      jid,
      resultado === null
        ? "❌ Operación no válida."
        : `🧮 Resultado: *${resultado}*`
    );
  }

  if (comando === ".texto") {
    return enviar(
      jid,
      argumentos || "📝 Escribe un texto."
    );
  }

  if (comando === ".traducir") {
    return enviar(
      jid,
      `🌐 Traductor preparado.

Ejemplo:
.traducir hola ingles`
    );
  }

  if (comando === ".emoji") {
    return enviar(
      jid,
      argumentos ||
        "😀 😎 🔥 ⚡ 🤖 🎮 🎴 🚀 ⭐"
    );
  }

  if (comando === ".reverse") {
    return enviar(
      jid,
      argumentos.split("").reverse().join("")
    );
  }

  if (comando === ".repetir") {
    return enviar(
      jid,
      argumentos || "Escribe algo para repetir."
    );
  }

  if (comando === ".codigo") {
    return enviar(
      jid,
      `💻 *CÓDIGO*

${argumentos || "Escribe el código después del comando."}`
    );
  }

  if (comando === ".qr") {
    return enviar(
      jid,
      `📱 Generador QR preparado.

Texto:
${argumentos || "Sin texto"}`
    );
  }

  if (comando === ".acortar") {
    return enviar(
      jid,
      `🔗 Enlace recibido:

${argumentos || "No especificado"}`
    );
  }

  if (comando === ".sorteo") {
    return enviar(
      jid,
      `🎉 *SORTEO*

Ganador:
@${numero(usuario)}`
    );
  }

  if (comando === ".temporizador") {
    const segundos = Math.max(
      1,
      Math.min(
        parseInt(argumentos) || 10,
        3600
      )
    );

    await enviar(
      jid,
      `⏳ Temporizador iniciado: ${segundos}s`
    );

    setTimeout(() => {
      enviar(
        jid,
        `⏰ ¡Tiempo terminado! @${numero(usuario)}`
      );
    }, segundos * 1000);

    return;
  }

  if (comando === ".recordatorio") {
    const segundos = Math.max(
      1,
      Math.min(
        parseInt(argumentos) || 60,
        86400
      )
    );

    await enviar(
      jid,
      `⏰ Recordatorio programado en ${segundos}s.`
    );

    setTimeout(() => {
      enviar(
        jid,
        `🔔 Recordatorio para @${numero(usuario)}.`
      );
    }, segundos * 1000);

    return;
  }

  // ==================== GRUPOS ====================

if (comando === ".grupo") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");

  const grupo = await obtenerGrupo(contexto);
  if (!grupo) return enviar("❌ No pude obtener la información del grupo.");

  return enviar(
    `👥 *INFORMACIÓN DEL GRUPO*\n\n` +
    `📌 Nombre: ${grupo.subject || "Sin nombre"}\n` +
    `👤 Miembros: ${grupo.participants?.length || 0}\n` +
    `🆔 ID: ${contexto.chat}`
  );
}

if (comando === ".miembros") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");

  const grupo = await obtenerGrupo(contexto);
  if (!grupo) return enviar("❌ No pude obtener los miembros.");

  const lista = (grupo.participants || [])
    .map((p, i) => `${i + 1}. @${(p.id || p.lid || "").split("@")[0]}`)
    .join("\n");

  const menciones = (grupo.participants || [])
    .map(p => p.id || p.lid)
    .filter(Boolean);

  return enviar(
    `👥 *MIEMBROS DEL GRUPO*\n\n${lista || "No hay miembros."}`,
    { mentions: menciones }
  );
}

if (comando === ".admins") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");

  const grupo = await obtenerGrupo(contexto);
  if (!grupo) return enviar("❌ No pude obtener los administradores.");

  const admins = (grupo.participants || []).filter(
    p => p.admin === "admin" || p.admin === "superadmin"
  );

  if (!admins.length) return enviar("❌ No encontré administradores.");

  const lista = admins
    .map((p, i) => `${i + 1}. @${(p.id || p.lid || "").split("@")[0]}`)
    .join("\n");

  const menciones = admins
    .map(p => p.id || p.lid)
    .filter(Boolean);

  return enviar(
    `🛡️ *ADMINISTRADORES*\n\n${lista}`,
    { mentions: menciones }
  );
}

if (comando === ".reglas") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");

  return enviar(
    `📜 *REGLAS DEL GRUPO*\n\n` +
    `1️⃣ Respeta a todos.\n` +
    `2️⃣ No hagas spam.\n` +
    `3️⃣ No compartas contenido inapropiado.\n` +
    `4️⃣ No envíes enlaces sospechosos.\n` +
    `5️⃣ Respeta las decisiones de los administradores.\n\n` +
    `⚡ ${BOT_NAME}`
  );
}

if (comando === ".tagall" || comando === ".hidetag") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;

  const grupo = await obtenerGrupo(contexto);
  if (!grupo) return enviar("❌ No pude obtener los miembros.");

  const menciones = (grupo.participants || [])
    .map(p => p.id || p.lid)
    .filter(Boolean);

  if (!menciones.length) return enviar("❌ No hay miembros para mencionar.");

  const texto = argumentos || "📢 Atención grupo";

  return enviar(
    `📢 *${texto}*\n\n` +
    menciones.map(id => `@${id.split("@")[0]}`).join(" "),
    { mentions: menciones }
  );
}

if (comando === ".promover") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;
  if (!(await botEsAdmin(contexto))) return;

  const objetivo = obtenerMencion(argumentos, contexto);

  if (!objetivo) {
    return enviar("❌ Menciona al usuario que quieres promover.");
  }

  try {
    await sock.groupParticipantsUpdate(
      contexto.chat,
      [objetivo],
      "promote"
    );

    return enviar(
      `🛡️ @${objetivo.split("@")[0]} ahora es administrador.`,
      { mentions: [objetivo] }
    );
  } catch (error) {
    return enviar("❌ No pude promover al usuario.");
  }
}

if (comando === ".degradar") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;
  if (!(await botEsAdmin(contexto))) return;

  const objetivo = obtenerMencion(argumentos, contexto);

  if (!objetivo) {
    return enviar("❌ Menciona al administrador que quieres degradar.");
  }

  try {
    await sock.groupParticipantsUpdate(
      contexto.chat,
      [objetivo],
      "demote"
    );

    return enviar(
      `⬇️ @${objetivo.split("@")[0]} ya no es administrador.`,
      { mentions: [objetivo] }
    );
  } catch (error) {
    return enviar("❌ No pude degradar al usuario.");
  }
}

if (comando === ".kick") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;
  if (!(await botEsAdmin(contexto))) return;

  const objetivo = obtenerMencion(argumentos, contexto);

  if (!objetivo) {
    return enviar("❌ Menciona al usuario que quieres expulsar.");
  }

  try {
    await sock.groupParticipantsUpdate(
      contexto.chat,
      [objetivo],
      "remove"
    );

    return enviar(
      `👢 Usuario @${objetivo.split("@")[0]} expulsado del grupo.`,
      { mentions: [objetivo] }
    );
  } catch (error) {
    return enviar("❌ No pude expulsar al usuario.");
  }
}

if (comando === ".add") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;
  if (!(await botEsAdmin(contexto))) return;

  const numeroAgregar = argumentos.replace(/\D/g, "");

  if (!numeroAgregar) {
    return enviar("❌ Escribe el número que quieres agregar.");
  }

  const objetivo = `${numeroAgregar}@s.whatsapp.net`;

  try {
    await sock.groupParticipantsUpdate(
      contexto.chat,
      [objetivo],
      "add"
    );

    return enviar(
      `➕ Usuario agregado: @${numeroAgregar}`,
      { mentions: [objetivo] }
    );
  } catch (error) {
    return enviar("❌ No pude agregar al usuario.");
  }
}

if (comando === ".link") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;
  if (!(await botEsAdmin(contexto))) return;

  try {
    const codigo = await sock.groupInviteCode(contexto.chat);

    return enviar(
      `🔗 *ENLACE DEL GRUPO*\n\n` +
      `https://chat.whatsapp.com/${codigo}`
    );
  } catch (error) {
    return enviar("❌ No pude obtener el enlace del grupo.");
  }
}

if (comando === ".welcome") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;

  const idGrupo = contexto.chat;

  if (!grupos[idGrupo]) grupos[idGrupo] = {};

  grupos[idGrupo].welcome = !grupos[idGrupo].welcome;

  return enviar(
    grupos[idGrupo].welcome
      ? "👋 *WELCOME ACTIVADO*"
      : "❌ *WELCOME DESACTIVADO*"
  );
}

if (comando === ".goodbye") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;

  const idGrupo = contexto.chat;

  if (!grupos[idGrupo]) grupos[idGrupo] = {};

  grupos[idGrupo].goodbye = !grupos[idGrupo].goodbye;

  return enviar(
    grupos[idGrupo].goodbye
      ? "👋 *GOODBYE ACTIVADO*"
      : "❌ *GOODBYE DESACTIVADO*"
  );
}

if (comando === ".antilink") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;

  const idGrupo = contexto.chat;

  if (!grupos[idGrupo]) grupos[idGrupo] = {};

  grupos[idGrupo].antilink = !grupos[idGrupo].antilink;

  return enviar(
    grupos[idGrupo].antilink
      ? "🔒 *ANTILINK ACTIVADO*"
      : "🔓 *ANTILINK DESACTIVADO*"
  );
}

if (comando === ".antispam") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;

  const idGrupo = contexto.chat;

  if (!grupos[idGrupo]) grupos[idGrupo] = {};

  grupos[idGrupo].antispam = !grupos[idGrupo].antispam;

  return enviar(
    grupos[idGrupo].antispam
      ? "🛡️ *ANTISPAM ACTIVADO*"
      : "🔓 *ANTISPAM DESACTIVADO*"
  );
}


// ==================== ECONOMÍA ====================

if (comando === ".saldo") {
  const usuario = iniciarUsuario(numero);

  return enviar(
    `💰 *TU SALDO*\n\n` +
    `👤 ${nombreUsuario(contexto)}\n` +
    `💵 Monedas: ${dinero(usuario.monedas)}\n` +
    `⭐ Nivel: ${usuario.nivel}\n` +
    `✨ XP: ${usuario.xp}`
  );
}

if (comando === ".diario") {
  const usuario = iniciarUsuario(numero);
  const ahora = Date.now();
  const espera = 24 * 60 * 60 * 1000;

  if (usuario.ultimoDiario && ahora - usuario.ultimoDiario < espera) {
    const restante = espera - (ahora - usuario.ultimoDiario);
    const horas = Math.floor(restante / 3600000);
    const minutos = Math.floor((restante % 3600000) / 60000);

    return enviar(
      `⏳ Ya reclamaste tu recompensa diaria.\n\n` +
      `Vuelve en *${horas}h ${minutos}m*.`
    );
  }

  const recompensa = 500 + Math.floor(Math.random() * 501);

  usuario.monedas += recompensa;
  usuario.ultimoDiario = ahora;

  agregarXP(numero, 25);

  return enviar(
    `🎁 *RECOMPENSA DIARIA*\n\n` +
    `💰 Ganaste: *${dinero(recompensa)} monedas*\n` +
    `💵 Saldo actual: *${dinero(usuario.monedas)} monedas*\n\n` +
    `✨ +25 XP`
  );
}

if (comando === ".trabajar") {
  const usuario = iniciarUsuario(numero);

  const trabajos = [
    "👨‍💻 Programador",
    "🎮 Desarrollador de videojuegos",
    "🔧 Técnico electrónico",
    "🎨 Diseñador",
    "🧑‍🍳 Cocinero",
    "🚗 Mecánico",
    "📱 Técnico de celulares",
    "🛠️ Ingeniero"
  ];

  const trabajo = elegir(trabajos);
  const recompensa = 200 + Math.floor(Math.random() * 801);

  usuario.monedas += recompensa;

  agregarXP(numero, 15);

  return enviar(
    `💼 *TRABAJO COMPLETADO*\n\n` +
    `${trabajo}\n\n` +
    `💰 Ganaste: *${dinero(recompensa)} monedas*\n` +
    `💵 Saldo: *${dinero(usuario.monedas)} monedas*\n` +
    `✨ +15 XP`
  );
}

if (comando === ".robar") {
  const usuario = iniciarUsuario(numero);

  if (usuario.monedas < 100) {
    return enviar(
      `🚨 Necesitas al menos *100 monedas* para intentar robar.`
    );
  }

  const exito = Math.random() < 0.45;

  if (exito) {
    const ganancia = 100 + Math.floor(Math.random() * 501);

    usuario.monedas += ganancia;

    return enviar(
      `🕵️ *¡LO LOGRASTE!*\n\n` +
      `💰 Ganaste: *${dinero(ganancia)} monedas*\n` +
      `💵 Saldo: *${dinero(usuario.monedas)} monedas*`
    );
  }

  const perdida = Math.min(
    usuario.monedas,
    100 + Math.floor(Math.random() * 301)
  );

  usuario.monedas -= perdida;

  return enviar(
    `🚨 *¡TE ATRAPARON!*\n\n` +
    `💸 Perdiste: *${dinero(perdida)} monedas*\n` +
    `💵 Saldo: *${dinero(usuario.monedas)} monedas*`
  );
}

if (comando === ".pagar") {
  const usuario = iniciarUsuario(numero);

  const objetivo = obtenerMencion(argumentos, contexto);
  const cantidad = parseInt(argumentos.replace(/\D/g, ""), 10);

  if (!objetivo) {
    return enviar("❌ Menciona a la persona a la que quieres pagar.");
  }

  if (!cantidad || cantidad <= 0) {
    return enviar("❌ Escribe una cantidad válida.");
  }

  if (usuario.monedas < cantidad) {
    return enviar("❌ No tienes suficientes monedas.");
  }

  const receptor = iniciarUsuario(objetivo.split("@")[0]);

  usuario.monedas -= cantidad;
  receptor.monedas += cantidad;

  return enviar(
    `💸 *PAGO REALIZADO*\n\n` +
    `👤 Destinatario: @${objetivo.split("@")[0]}\n` +
    `💰 Cantidad: *${dinero(cantidad)} monedas*\n` +
    `💵 Tu saldo: *${dinero(usuario.monedas)} monedas*`,
    { mentions: [objetivo] }
  );
}

if (comando === ".tienda") {
  return enviar(
    `🛒 *TIENDA TITANBOT*\n\n` +
    `1️⃣ 🍀 Amuleto — 1.000 monedas\n` +
    `2️⃣ ⚔️ Espada — 2.500 monedas\n` +
    `3️⃣ 🛡️ Escudo — 3.500 monedas\n` +
    `4️⃣ 👑 Corona — 5.000 monedas\n\n` +
    `Usa *.comprar <objeto>*`
  );
}

if (comando === ".comprar") {
  const usuario = iniciarUsuario(numero);
  const objeto = argumentos.toLowerCase();

  const tienda = {
    "amuleto": 1000,
    "1": 1000,
    "espada": 2500,
    "2": 2500,
    "escudo": 3500,
    "3": 3500,
    "corona": 5000,
    "4": 5000
  };

  if (!tienda[objeto]) {
    return enviar(
      `❌ Producto no encontrado.\n\nUsa *.tienda* para ver los productos.`
    );
  }

  const precio = tienda[objeto];

  if (usuario.monedas < precio) {
    return enviar(
      `❌ No tienes suficientes monedas.\n\n` +
      `💰 Precio: ${dinero(precio)}\n` +
      `💵 Tienes: ${dinero(usuario.monedas)}`
    );
  }

  usuario.monedas -= precio;

  if (!usuario.inventario) usuario.inventario = [];

  usuario.inventario.push(objeto);

  return enviar(
    `✅ *COMPRA REALIZADA*\n\n` +
    `🛒 Producto: ${objeto}\n` +
    `💰 Precio: ${dinero(precio)}\n` +
    `💵 Saldo restante: ${dinero(usuario.monedas)}`
  );
}

if (comando === ".inventario") {
  const usuario = iniciarUsuario(numero);

  if (!usuario.inventario || !usuario.inventario.length) {
    return enviar(
      `🎒 *INVENTARIO*\n\n` +
      `Tu inventario está vacío.`
    );
  }

  return enviar(
    `🎒 *TU INVENTARIO*\n\n` +
    usuario.inventario
      .map((item, i) => `${i + 1}. ${item}`)
      .join("\n")
  );
}

if (comando === ".regalar") {
  const usuario = iniciarUsuario(numero);
  const objetivo = obtenerMencion(argumentos, contexto);

  if (!objetivo) {
    return enviar("❌ Menciona a la persona a la que quieres regalar algo.");
  }

  if (!usuario.inventario || !usuario.inventario.length) {
    return enviar("🎒 No tienes objetos para regalar.");
  }

  const objeto = usuario.inventario.shift();
  const receptor = iniciarUsuario(objetivo.split("@")[0]);

  if (!receptor.inventario) receptor.inventario = [];

  receptor.inventario.push(objeto);

  return enviar(
    `🎁 *REGALO ENVIADO*\n\n` +
    `🎁 Objeto: ${objeto}\n` +
    `👤 Para: @${objetivo.split("@")[0]}`,
    { mentions: [objetivo] }
  );
}

if (comando === ".topmonedas") {
  const lista = Object.entries(usuarios)
    .sort((a, b) => (b[1].monedas || 0) - (a[1].monedas || 0))
    .slice(0, 10);

  if (!lista.length) {
    return enviar("💰 Todavía no hay usuarios registrados.");
  }

  const texto = lista
    .map(
      ([id, u], i) =>
        `${i + 1}. @${id} — ${dinero(u.monedas || 0)} 💰`
    )
    .join("\n");

  return enviar(
    `🏆 *TOP MONEDAS*\n\n${texto}`
  );
}


// ==================== XP Y LOGROS ====================

if (
  comando === ".rank" ||
  comando === ".nivel" ||
  comando === ".xp"
) {
  const usuario = iniciarUsuario(numero);

  const progreso =
    usuario.xp % 100;

  return enviar(
    `📊 *TU RANGO*\n\n` +
    `👤 ${nombreUsuario(contexto)}\n` +
    `⭐ Nivel: *${usuario.nivel}*\n` +
    `✨ XP: *${usuario.xp}*\n` +
    `📈 Progreso: *${progreso}/100 XP*`
  );
}

if (comando === ".topxp") {
  const lista = Object.entries(usuarios)
    .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0))
    .slice(0, 10);

  if (!lista.length) {
    return enviar("🏆 Todavía no hay usuarios con XP.");
  }

  const texto = lista
    .map(
      ([id, u], i) =>
        `${i + 1}. @${id} — Nivel ${u.nivel || 1} — ${u.xp || 0} XP`
    )
    .join("\n");

  return enviar(
    `🏆 *TOP XP*\n\n${texto}`
  );
}

if (
  comando === ".logros" ||
  comando === ".mislogros"
) {
  const usuario = iniciarUsuario(numero);

  const logros = [];

  if (usuario.xp >= 100) logros.push("🥉 Primer nivel");
  if (usuario.xp >= 500) logros.push("🥈 Experto");
  if (usuario.xp >= 1000) logros.push("🥇 Maestro");
  if (usuario.monedas >= 5000) logros.push("💰 Rico");
  if (usuario.monedas >= 10000) logros.push("👑 Millonario");

  return enviar(
    `🏅 *TUS LOGROS*\n\n` +
    (logros.length
      ? logros.map((l, i) => `${i + 1}. ${l}`).join("\n")
      : "🔒 Todavía no tienes logros desbloqueados.")
  );
}

if (comando === ".premios") {
  return enviar(
    `🏆 *PREMIOS TITANBOT*\n\n` +
    `🥉 100 XP — Primer nivel\n` +
    `🥈 500 XP — Experto\n` +
    `🥇 1.000 XP — Maestro\n` +
    `💰 5.000 monedas — Rico\n` +
    `👑 10.000 monedas — Millonario`
  );
}

if (comando === ".racha") {
  const usuario = iniciarUsuario(numero);

  if (!usuario.racha) usuario.racha = 0;

  return enviar(
    `🔥 *TU RACHA*\n\n` +
    `🔥 Días consecutivos: *${usuario.racha}*`
  );
}

if (comando === ".misstats" || comando === ".estadisticas") {
  const usuario = iniciarUsuario(numero);

  return enviar(
    `📊 *MIS ESTADÍSTICAS*\n\n` +
    `👤 Usuario: ${nombreUsuario(contexto)}\n` +
    `⭐ Nivel: ${usuario.nivel}\n` +
    `✨ XP: ${usuario.xp}\n` +
    `💰 Monedas: ${dinero(usuario.monedas)}\n` +
    `🔥 Racha: ${usuario.racha || 0}\n` +
    `🎒 Objetos: ${usuario.inventario?.length || 0}`
  );
}


// ==================== FUNCIONES ESPECIALES ====================

if (
  texto.toLowerCase().includes("titanbot") &&
  !comando
) {
  const respuestas = [
    "⚡ ¿Qué pasó? Aquí estoy.",
    "🤖 TitanBot activo.",
    "🔥 ¿Necesitas algo?",
    "🛡️ Listo para ayudarte.",
    "⚡ Siempre activo."
  ];

  return enviar(elegir(respuestas));
}

if (
  texto.toLowerCase().includes("hola") &&
  !comando
) {
  const respuestas = [
    "👋 ¡Hola! Soy TitanBot.",
    "⚡ ¡Hey! ¿Qué tal?",
    "🤖 ¡Hola! ¿En qué te ayudo?",
    "🔥 ¡Buenas! TitanBot está activo."
  ];

  return enviar(elegir(respuestas));
}

return;
}


// ==================== PROCESAR MENSAJE ====================

async function procesarMensaje(m) {
  try {
    const mensaje =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      "";

    if (!mensaje) return;

    const texto = mensaje.trim();
    const numero = m.key.participant || m.key.remoteJid;

    const contexto = {
      chat: m.key.remoteJid,
      sender: numero,
      isGroup: m.key.remoteJid.endsWith("@g.us"),
      message: m
    };

    iniciarUsuario(numero);

    // ==================== PERFIL ====================

    if (perfilesEnProceso[numero]) {
      const paso = perfilesEnProceso[numero].paso;
      const datos = perfilesEnProceso[numero].datos;

      if (paso === 1) {
        datos.nombre = texto;
        perfilesEnProceso[numero].paso = 2;

        return enviar(
          "🎂 Perfecto. Ahora dime tu *edad*."
        );
      }

      if (paso === 2) {
        const edad = parseInt(texto);

        if (isNaN(edad) || edad < 1 || edad > 100) {
          return enviar(
            "❌ Escribe una edad válida."
          );
        }

        datos.edad = edad;
        perfilesEnProceso[numero].paso = 3;

        return enviar(
          "📅 Ahora dime tu *fecha de cumpleaños*.\n\n" +
          "Ejemplo: 15/08/2010"
        );
      }

      if (paso === 3) {
        datos.cumple = texto;
        perfilesEnProceso[numero].paso = 4;

        return enviar(
          "💬 Ahora dime tu *frase favorita*."
        );
      }

      if (paso === 4) {
        datos.frase = texto;

        perfiles[numero] = {
          ...datos,
          creado: Date.now()
        };

        delete perfilesEnProceso[numero];

        agregarXP(numero, 50);

        return enviar(
          `✅ *PERFIL COMPLETADO*\n\n` +
          `👤 Nombre: ${datos.nombre}\n` +
          `🎂 Edad: ${datos.edad}\n` +
          `📅 Cumpleaños: ${datos.cumple}\n` +
          `💬 Frase: ${datos.frase}\n\n` +
          `✨ Has ganado +50 XP.`
        );
      }
    }

    // ==================== COMANDOS ====================

    if (texto.startsWith(PREFIX)) {
      await ejecutarComando(texto, contexto);
      return;
    }

    // ==================== RESPUESTAS AL BOT ====================

    const contextoMensaje =
      m.message?.extendedTextMessage?.contextInfo;

    const mencionadoBot =
      contextoMensaje?.mentionedJid?.some(
        id => id === sock.user?.id
      );

    const respondeAlBot =
      contextoMensaje?.participant === sock.user?.id;

    if (
      !perfilesEnProceso[numero] &&
      (mencionadoBot || respondeAlBot)
    ) {
      const respuestas = [
        "🤖 ¿Sí?",
        "⚡ Aquí estoy.",
        "🔥 Dime.",
        "🛡️ Te escucho.",
        "👀 ¿Qué necesitas?"
      ];

      await enviar(elegir(respuestas));
      return;
    }

    // ==================== ANTILINK ====================

if (comando === ".antilink") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;

  const idGrupo = contexto.chat;

  if (!grupos[idGrupo]) grupos[idGrupo] = {};

  grupos[idGrupo].antilink = !grupos[idGrupo].antilink;

  return enviar(
    grupos[idGrupo].antilink
      ? "🔒 *ANTILINK ACTIVADO*"
      : "🔓 *ANTILINK DESACTIVADO*"
  );
}

if (comando === ".antispam") {
  if (!contexto.isGroup) return enviar("❌ Este comando solo funciona en grupos.");
  if (!(await comprobarAdmin(contexto))) return;

  const idGrupo = contexto.chat;

  if (!grupos[idGrupo]) grupos[idGrupo] = {};

  grupos[idGrupo].antispam = !grupos[idGrupo].antispam;

  return enviar(
    grupos[idGrupo].antispam
      ? "🛡️ *ANTISPAM ACTIVADO*"
      : "🔓 *ANTISPAM DESACTIVADO*"
  );
}


// ==================== ECONOMÍA ====================

if (comando === ".saldo") {
  const usuario = iniciarUsuario(numero);

  return enviar(
    `💰 *TU SALDO*\n\n` +
    `👤 ${nombreUsuario(contexto)}\n` +
    `💵 Monedas: ${dinero(usuario.monedas)}\n` +
    `⭐ Nivel: ${usuario.nivel}\n` +
    `✨ XP: ${usuario.xp}`
  );
}

if (comando === ".diario") {
  const usuario = iniciarUsuario(numero);
  const ahora = Date.now();
  const espera = 24 * 60 * 60 * 1000;

  if (usuario.ultimoDiario && ahora - usuario.ultimoDiario < espera) {
    const restante = espera - (ahora - usuario.ultimoDiario);
    const horas = Math.floor(restante / 3600000);
    const minutos = Math.floor((restante % 3600000) / 60000);

    return enviar(
      `⏳ Ya reclamaste tu recompensa diaria.\n\n` +
      `Vuelve en *${horas}h ${minutos}m*.`
    );
  }

  const recompensa = 500 + Math.floor(Math.random() * 501);

  usuario.monedas += recompensa;
  usuario.ultimoDiario = ahora;

  agregarXP(numero, 25);

  return enviar(
    `🎁 *RECOMPENSA DIARIA*\n\n` +
    `💰 Ganaste: *${dinero(recompensa)} monedas*\n` +
    `💵 Saldo actual: *${dinero(usuario.monedas)} monedas*\n\n` +
    `✨ +25 XP`
  );
}

if (comando === ".trabajar") {
  const usuario = iniciarUsuario(numero);

  const trabajos = [
    "👨‍💻 Programador",
    "🎮 Desarrollador de videojuegos",
    "🔧 Técnico electrónico",
    "🎨 Diseñador",
    "🧑‍🍳 Cocinero",
    "🚗 Mecánico",
    "📱 Técnico de celulares",
    "🛠️ Ingeniero"
  ];

  const trabajo = elegir(trabajos);
  const recompensa = 200 + Math.floor(Math.random() * 801);

  usuario.monedas += recompensa;

  agregarXP(numero, 15);

  return enviar(
    `💼 *TRABAJO COMPLETADO*\n\n` +
    `${trabajo}\n\n` +
    `💰 Ganaste: *${dinero(recompensa)} monedas*\n` +
    `💵 Saldo: *${dinero(usuario.monedas)} monedas*\n` +
    `✨ +15 XP`
  );
}

if (comando === ".robar") {
  const usuario = iniciarUsuario(numero);

  if (usuario.monedas < 100) {
    return enviar(
      `🚨 Necesitas al menos *100 monedas* para intentar robar.`
    );
  }

  const exito = Math.random() < 0.45;

  if (exito) {
    const ganancia = 100 + Math.floor(Math.random() * 501);

    usuario.monedas += ganancia;

    return enviar(
      `🕵️ *¡LO LOGRASTE!*\n\n` +
      `💰 Ganaste: *${dinero(ganancia)} monedas*\n` +
      `💵 Saldo: *${dinero(usuario.monedas)} monedas*`
    );
  }

  const perdida = Math.min(
    usuario.monedas,
    100 + Math.floor(Math.random() * 301)
  );

  usuario.monedas -= perdida;

  return enviar(
    `🚨 *¡TE ATRAPARON!*\n\n` +
    `💸 Perdiste: *${dinero(perdida)} monedas*\n` +
    `💵 Saldo: *${dinero(usuario.monedas)} monedas*`
  );
}

if (comando === ".pagar") {
  const usuario = iniciarUsuario(numero);

  const objetivo = obtenerMencion(argumentos, contexto);
  const cantidad = parseInt(argumentos.replace(/\D/g, ""), 10);

  if (!objetivo) {
    return enviar("❌ Menciona a la persona a la que quieres pagar.");
  }

  if (!cantidad || cantidad <= 0) {
    return enviar("❌ Escribe una cantidad válida.");
  }

  if (usuario.monedas < cantidad) {
    return enviar("❌ No tienes suficientes monedas.");
  }

  const receptor = iniciarUsuario(objetivo.split("@")[0]);

  usuario.monedas -= cantidad;
  receptor.monedas += cantidad;

  return enviar(
    `💸 *PAGO REALIZADO*\n\n` +
    `👤 Destinatario: @${objetivo.split("@")[0]}\n` +
    `💰 Cantidad: *${dinero(cantidad)} monedas*\n` +
    `💵 Tu saldo: *${dinero(usuario.monedas)} monedas*`,
    { mentions: [objetivo] }
  );
}

if (comando === ".tienda") {
  return enviar(
    `🛒 *TIENDA TITANBOT*\n\n` +
    `1️⃣ 🍀 Amuleto — 1.000 monedas\n` +
    `2️⃣ ⚔️ Espada — 2.500 monedas\n` +
    `3️⃣ 🛡️ Escudo — 3.500 monedas\n` +
    `4️⃣ 👑 Corona — 5.000 monedas\n\n` +
    `Usa *.comprar <objeto>*`
  );
}

if (comando === ".comprar") {
  const usuario = iniciarUsuario(numero);
  const objeto = argumentos.toLowerCase();

  const tienda = {
    amuleto: 1000,
    "1": 1000,
    espada: 2500,
    "2": 2500,
    escudo: 3500,
    "3": 3500,
    corona: 5000,
    "4": 5000
  };

  if (!tienda[objeto]) {
    return enviar(
      `❌ Producto no encontrado.\n\nUsa *.tienda* para ver los productos.`
    );
  }

  const precio = tienda[objeto];

  if (usuario.monedas < precio) {
    return enviar(
      `❌ No tienes suficientes monedas.\n\n` +
      `💰 Precio: ${dinero(precio)}\n` +
      `💵 Tienes: ${dinero(usuario.monedas)}`
    );
  }

  usuario.monedas -= precio;

  if (!usuario.inventario) usuario.inventario = [];

  usuario.inventario.push(objeto);

  return enviar(
    `✅ *COMPRA REALIZADA*\n\n` +
    `🛒 Producto: ${objeto}\n` +
    `💰 Precio: ${dinero(precio)}\n` +
    `💵 Saldo restante: ${dinero(usuario.monedas)}`
  );
}

if (comando === ".inventario") {
  const usuario = iniciarUsuario(numero);

  if (!usuario.inventario || !usuario.inventario.length) {
    return enviar(
      `🎒 *INVENTARIO*\n\n` +
      `Tu inventario está vacío.`
    );
  }

  return enviar(
    `🎒 *TU INVENTARIO*\n\n` +
    usuario.inventario
      .map((item, i) => `${i + 1}. ${item}`)
      .join("\n")
  );
}

if (comando === ".regalar") {
  const usuario = iniciarUsuario(numero);
  const objetivo = obtenerMencion(argumentos, contexto);

  if (!objetivo) {
    return enviar("❌ Menciona a la persona a la que quieres regalar algo.");
  }

  if (!usuario.inventario || !usuario.inventario.length) {
    return enviar("🎒 No tienes objetos para regalar.");
  }

  const objeto = usuario.inventario.shift();
  const receptor = iniciarUsuario(objetivo.split("@")[0]);

  if (!receptor.inventario) receptor.inventario = [];

  receptor.inventario.push(objeto);

  return enviar(
    `🎁 *REGALO ENVIADO*\n\n` +
    `🎁 Objeto: ${objeto}\n` +
    `👤 Para: @${objetivo.split("@")[0]}`,
    { mentions: [objetivo] }
  );
}

if (comando === ".topmonedas") {
  const lista = Object.entries(usuarios)
    .sort((a, b) => (b[1].monedas || 0) - (a[1].monedas || 0))
    .slice(0, 10);

  if (!lista.length) {
    return enviar("💰 Todavía no hay usuarios registrados.");
  }

  const texto = lista
    .map(
      ([id, u], i) =>
        `${i + 1}. @${id} — ${dinero(u.monedas || 0)} 💰`
    )
    .join("\n");

  return enviar(`🏆 *TOP MONEDAS*\n\n${texto}`);
}


// ==================== XP Y LOGROS ====================

if (
  comando === ".rank" ||
  comando === ".nivel" ||
  comando === ".xp"
) {
  const usuario = iniciarUsuario(numero);
  const progreso = usuario.xp % 100;

  return enviar(
    `📊 *TU RANGO*\n\n` +
    `👤 ${nombreUsuario(contexto)}\n` +
    `⭐ Nivel: *${usuario.nivel}*\n` +
    `✨ XP: *${usuario.xp}*\n` +
    `📈 Progreso: *${progreso}/100 XP*`
  );
}

if (comando === ".topxp") {
  const lista = Object.entries(usuarios)
    .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0))
    .slice(0, 10);

  if (!lista.length) {
    return enviar("🏆 Todavía no hay usuarios con XP.");
  }

  const texto = lista
    .map(
      ([id, u], i) =>
        `${i + 1}. @${id} — Nivel ${u.nivel || 1} — ${u.xp || 0} XP`
    )
    .join("\n");

  return enviar(`🏆 *TOP XP*\n\n${texto}`);
}

if (comando === ".logros" || comando === ".mislogros") {
  const usuario = iniciarUsuario(numero);
  const logros = [];

  if (usuario.xp >= 100) logros.push("🥉 Primer nivel");
  if (usuario.xp >= 500) logros.push("🥈 Experto");
  if (usuario.xp >= 1000) logros.push("🥇 Maestro");
  if (usuario.monedas >= 5000) logros.push("💰 Rico");
  if (usuario.monedas >= 10000) logros.push("👑 Millonario");

  return enviar(
    `🏅 *TUS LOGROS*\n\n` +
    (logros.length
      ? logros.map((l, i) => `${i + 1}. ${l}`).join("\n")
      : "🔒 Todavía no tienes logros desbloqueados.")
  );
}

if (comando === ".premios") {
  return enviar(
    `🏆 *PREMIOS TITANBOT*\n\n` +
    `🥉 100 XP — Primer nivel\n` +
    `🥈 500 XP — Experto\n` +
    `🥇 1.000 XP — Maestro\n` +
    `💰 5.000 monedas — Rico\n` +
    `👑 10.000 monedas — Millonario`
  );
}

if (comando === ".racha") {
  const usuario = iniciarUsuario(numero);

  if (!usuario.racha) usuario.racha = 0;

  return enviar(
    `🔥 *TU RACHA*\n\n` +
    `🔥 Días consecutivos: *${usuario.racha}*`
  );
}

if (comando === ".misstats" || comando === ".estadisticas") {
  const usuario = iniciarUsuario(numero);

  return enviar(
    `📊 *MIS ESTADÍSTICAS*\n\n` +
    `👤 Usuario: ${nombreUsuario(contexto)}\n` +
    `⭐ Nivel: ${usuario.nivel}\n` +
    `✨ XP: ${usuario.xp}\n` +
    `💰 Monedas: ${dinero(usuario.monedas)}\n` +
    `🔥 Racha: ${usuario.racha || 0}\n` +
    `🎒 Objetos: ${usuario.inventario?.length || 0}`
  );
}


// ==================== FUNCIONES ESPECIALES ====================

if (texto.toLowerCase().includes("titanbot") && !comando) {
  return enviar(
    elegir([
      "🤖 ¿Sí?",
      "⚡ Aquí estoy.",
      "🔥 Dime.",
      "🛡️ Te escucho.",
      "👀 ¿Qué necesitas?"
    ])
  );
}

if (
  (texto.toLowerCase() === "hola" ||
   texto.toLowerCase() === "holaa" ||
   texto.toLowerCase() === "holaaa") &&
  !comando
) {
  return enviar(
    elegir([
      "👋 ¡Hola! Soy TitanBot.",
      "⚡ ¡Hey! ¿Qué tal?",
      "🤖 ¡Hola! ¿En qué te ayudo?",
      "🔥 ¡Buenas! TitanBot está activo."
    ])
  );
}

return;
}


// ==================== PROCESAR MENSAJE ====================

async function procesarMensaje(m) {
  try {
    const mensaje =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      "";

    if (!mensaje) return;

    const texto = mensaje.trim();
    const numero = m.key.participant || m.key.remoteJid;

    const contexto = {
      chat: m.key.remoteJid,
      sender: numero,
      isGroup: m.key.remoteJid.endsWith("@g.us"),
      message: m
    };

    iniciarUsuario(numero);

    if (perfilesEnProceso[numero]) {
      const paso = perfilesEnProceso[numero].paso;
      const datos = perfilesEnProceso[numero].datos;

      if (paso === 1) {
        datos.nombre = texto;
        perfilesEnProceso[numero].paso = 2;

        return enviar("🎂 Perfecto. Ahora dime tu *edad*.");
      }

      if (paso === 2) {
        const edad = parseInt(texto);

        if (isNaN(edad) || edad < 1 || edad > 100) {
          return enviar("❌ Escribe una edad válida.");
        }

        datos.edad = edad;
        perfilesEnProceso[numero].paso = 3;

        return enviar(
          "📅 Ahora dime tu *fecha de cumpleaños*.\n\n" +
          "Ejemplo: 15/08/2010"
        );
      }

      if (paso === 3) {
        datos.cumple = texto;
        perfilesEnProceso[numero].paso = 4;

        return enviar("💬 Ahora dime tu *frase favorita*.");
      }

      if (paso === 4) {
        datos.frase = texto;

        perfiles[numero] = {
          ...datos,
          creado: Date.now()
        };

        delete perfilesEnProceso[numero];

        agregarXP(numero, 50);

        return enviar(
          `✅ *PERFIL COMPLETADO*\n\n` +
          `👤 Nombre: ${datos.nombre}\n` +
          `🎂 Edad: ${datos.edad}\n` +
          `📅 Cumpleaños: ${datos.cumple}\n` +
          `💬 Frase: ${datos.frase}\n\n` +
          `✨ Has ganado +50 XP.`
        );
      }
    }

    if (texto.startsWith(PREFIX)) {
      await ejecutarComando(texto, contexto);
      return;
    }

    const contextoMensaje =
      m.message?.extendedTextMessage?.contextInfo;

    const mencionadoBot =
      contextoMensaje?.mentionedJid?.some(
        id => id === sock.user?.id
      );

    const respondeAlBot =
      contextoMensaje?.participant === sock.user?.id;

    if (
      !perfilesEnProceso[numero] &&
      (mencionadoBot || respondeAlBot)
    ) {
      return enviar(
        elegir([
          "🤖 ¿Sí?",
          "⚡ Aquí estoy.",
          "🔥 Dime.",
          "🛡️ Te escucho.",
          "👀 ¿Qué necesitas?"
        ])
      );
    }

    if (contexto.isGroup) {
      const grupo = obtenerGrupo(contexto);

      if (
        grupo?.antilink &&
        /https?:\/\/|chat\.whatsapp\.com/i.test(texto)
      ) {
        const esAdmin = await comprobarAdmin(contexto);

        if (!esAdmin) {
          await enviar(
            "🚫 *ENLACE DETECTADO*\n\n" +
            "Este grupo tiene el antilink activado."
          );
        }
      }
    }

    const textoMinus = texto.toLowerCase();

    if (
      textoMinus === "hola" ||
      textoMinus === "holaa" ||
      textoMinus === "holaaa"
    ) {
      return enviar(
        elegir([
          "👋 ¡Hola! Soy TitanBot.",
          "⚡ ¡Hola! ¿Cómo estás?",
          "🤖 ¡Buenas! TitanBot activo.",
          "🔥 ¡Hey! ¿Qué necesitas?"
        ])
      );
    }

  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
  }
}


// ==================== INICIAR BOT ====================

async function iniciarBot() {
  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("./auth_info");

    const { version } =
      await fetchLatestBaileysVersion();

    console.log(
      `📦 Baileys versión: ${version.join(".")}`
    );

    const sockNuevo = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({
        level: "silent"
      }),
      browser: [
        "TitanBot",
        "Chrome",
        "1.0.0"
      ],
      generateHighQualityLinkPreview: true
    });

    sock = sockNuevo;

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    sock.ev.on(
      "connection.update",
      async update => {
        const {
          connection,
          lastDisconnect
        } = update;

        if (connection === "connecting") {
          console.log("🔄 Conectando TitanBot...");
        }

        if (connection === "open") {
          console.log("✅ TITANBOT CONECTADO CORRECTAMENTE");
          console.log(`🤖 ${BOT_NAME}`);
          console.log(`⚡ ${FRASE}`);
        }

        if (connection === "close") {
          const codigo =
            lastDisconnect?.error?.output?.statusCode;

          console.log(
            "❌ Conexión cerrada. Código:",
            codigo
          );

          if (codigo !== DisconnectReason.loggedOut) {
            console.log("🔄 Reiniciando conexión...");

            setTimeout(
              iniciarBot,
              5000
            );
          } else {
            console.log(
              "🚪 Sesión cerrada. Debes volver a vincular el bot."
            );
          }
        }
      }
    );

    if (!state.creds.registered) {
      if (!PAIRING_NUMBER) {
        console.log(
          "❌ Falta la variable PAIRING_NUMBER en Render."
        );
      } else {
        const numeroVinculacion =
          PAIRING_NUMBER.replace(/\D/g, "");

        console.log(
          "⏳ Esperando antes de solicitar el código..."
        );

        await sleep(5000);

        try {
          console.log(
            "🔢 Generando código de vinculación..."
          );

          const code =
            await sock.requestPairingCode(
              numeroVinculacion
            );

          console.log(
            "\n================================"
          );

          console.log(
            `📱 CÓDIGO DE VINCULACIÓN: ${code}`
          );

          console.log(
            "================================\n"
          );

          console.log(
            "📲 En WhatsApp entra a:"
          );

          console.log(
            "Ajustes > Dispositivos vinculados > Vincular dispositivo > Vincular con número de teléfono"
          );

          console.log(
            "✏️ Introduce el código mostrado arriba."
          );

        } catch (error) {
          console.error(
            "❌ Error generando código:",
            error
          );
        }
      }
    }

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {
        for (const m of messages) {
          if (!m.message) continue;
          if (m.key.fromMe) continue;

          await procesarMensaje(m);
        }
      }
    );

  } catch (error) {
    console.error(
      "❌ Error iniciando TitanBot:",
      error
    );

    setTimeout(
      iniciarBot,
      10000
    );
  }
}


// ==================== INICIO ====================

console.log(
  "================================"
);

console.log(
  `🤖 ${BOT_NAME}`
);

console.log(
  "⚡ Iniciando..."
);

console.log(
  `🌐 Puerto: ${PORT}`
);

console.log(
  "📱 Vinculación: NÚMERO DE TELÉFONO"
);

console.log(
  "🚫 QR: DESACTIVADO"
);

console.log(
  "================================"
);

iniciarBot();
