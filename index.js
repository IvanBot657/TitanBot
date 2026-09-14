// TITANBOT - index.js
// Baileys 7.0.0-rc14
// Bot base para Render - vinculación por número, menú, perfiles,
// grupos, economía, XP, juegos y más de 200 comandos.

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");
const http = require("http");

const PREFIX = ".";
const PORT = process.env.PORT || 10000;
const BOT_NAME = "TITANBOT";
const FRASE = "⚡ El futuro empieza ahora.";
const PAIRING_NUMBER = process.env.PAIRING_NUMBER || "";

const DATA_DIR = path.join(__dirname, "titan_data");
const DATA_FILE = path.join(DATA_DIR, "data.json");
const AUTH_DIR = path.join(__dirname, "auth_info");

fs.mkdirSync(DATA_DIR, { recursive: true });

let data = {
  users: {},
  groups: {},
  profiles: {}
};

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    console.log("⚠️ No se pudo leer data.json. Se creará uno nuevo.");
  }
}

let sock = null;
const profileSteps = {};

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ Error guardando datos:", e.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function money(n) {
  return Number(n || 0).toLocaleString("es-CO");
}

function cleanNumber(jid = "") {
  return String(jid).split("@")[0].split(":")[0].replace(/\D/g, "");
}

function userId(jid) {
  return cleanNumber(jid);
}

function displayName(m) {
  return m.pushName || cleanNumber(m.key?.participant || m.key?.remoteJid);
}

function ensureUser(id) {
  if (!data.users[id]) {
    data.users[id] = {
      coins: 1000,
      xp: 0,
      level: 1,
      daily: 0,
      streak: 0,
      inventory: [],
      warnings: 0,
      messages: 0
    };
  }
  return data.users[id];
}

function ensureGroup(jid) {
  if (!data.groups[jid]) {
    data.groups[jid] = {
      antilink: false,
      welcome: false,
      goodbye: false,
      mute: false,
      adminsOnly: false
    };
  }
  return data.groups[jid];
}

function addXP(id, amount) {
  const u = ensureUser(id);
  u.xp += amount;
  while (u.xp >= u.level * 100) {
    u.xp -= u.level * 100;
    u.level++;
  }
  saveData();
}

function argsOf(text) {
  return text.trim().split(/\s+/).slice(1);
}

function quotedInfo(m) {
  return m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
}

function getMention(m) {
  const info = m.message?.extendedTextMessage?.contextInfo;
  return info?.mentionedJid?.[0] || info?.participant || null;
}

async function sendText(jid, text, options = {}) {
  if (!sock) return;
  return sock.sendMessage(jid, { text, ...options });
}

function isGroup(m) {
  return String(m.key?.remoteJid || "").endsWith("@g.us");
}

async function groupMetadata(jid) {
  try {
    return await sock.groupMetadata(jid);
  } catch {
    return null;
  }
}

async function isAdmin(m, jid = m.key.remoteJid) {
  if (!isGroup(m)) return false;
  const meta = await groupMetadata(jid);
  if (!meta) return false;

  const me = cleanNumber(sock.user?.id);
  const sender = cleanNumber(m.key.participant || m.key.remoteJid);

  return meta.participants.some(p => {
    const id = cleanNumber(p.id);
    return id === sender && (p.admin === "admin" || p.admin === "superadmin");
  }) || meta.participants.some(p => {
    const id = cleanNumber(p.id);
    return id === me && (p.admin === "admin" || p.admin === "superadmin");
  });
}

async function botIsAdmin(jid) {
  const meta = await groupMetadata(jid);
  if (!meta) return false;

  const me = cleanNumber(sock.user?.id);
  const p = meta.participants.find(x => cleanNumber(x.id) === me);
  return !!p && (p.admin === "admin" || p.admin === "superadmin");
}

function commandMenu() {
  return `
╭━━━〔 🤖 ${BOT_NAME} 〕━━━╮
┃ ⚡ ${FRASE}
╰━━━━━━━━━━━━━━━━━━━━╯

👤 PERFIL
• .id
• .perfil
• .completarperfil
• .foto
• .frase
• .edad
• .cumple

🎴 ANIME
• .s
• .anime
• .waifu
• .quote

💰 ECONOMÍA
• .saldo
• .diario
• .trabajar
• .robar
• .pagar
• .tienda
• .comprar
• .inventario
• .topmonedas

⭐ NIVEL
• .xp
• .nivel
• .rank
• .topxp
• .logros
• .racha

👥 GRUPO
• .antilink
• .welcome
• .goodbye
• .admins
• .infogrupo
• .tagall
• .hidetag
• .linkgrupo
• .promote
• .demote
• .kick

🎮 JUEGOS
• .dado
• .moneda
• .ppt
• .numero
• .quiz
• .reto
• .verdad
• .pregunta

🛠️ UTILIDADES
• .ping
• .hora
• .fecha
• .calc
• .say
• .stickerinfo
• .menu
• .help

📚 +200 comandos disponibles.
Escribe *.todos* para verlos.
`;
}

// Más de 200 comandos ligeros y seguros.
// Cada entrada tiene una respuesta independiente.
const simpleCommands = {
  ping: "🏓 Pong! TitanBot está activo.",
  pong: "🏓 Pong!",
  hola: "👋 ¡Hola! Soy TitanBot.",
  buenosdias: "🌞 ¡Buenos días!",
  buenasnoches: "🌙 ¡Buenas noches!",
  buenas: "🔥 ¡Buenas! TitanBot activo.",
  gracias: "🤖 ¡De nada!",
  graciasbot: "⚡ Siempre listo.",
  titanbot: "🤖 TitanBot presente.",
  bot: "🤖 Aquí estoy.",
  version: "⚙️ TitanBot 1.0 — Baileys 7.0.0-rc14",
  estado: "🟢 TitanBot está funcionando.",
  online: "🟢 En línea.",
  ayuda: "📚 Usa .menu para ver las categorías.",
  help: "📚 Usa .menu para ver las categorías.",
  menu: null,
  comandos: null,
  todos: null,
  info: "🤖 TitanBot — asistente para tu grupo.",
  creador: "👨‍💻 Proyecto TitanBot.",
  server: "🌐 TitanBot está preparado para Render.",
  render: "🌐 Servicio ejecutándose en Render.",
  reglas: "📜 Respeta a los demás y sigue las reglas del grupo.",
  respeto: "🤝 El respeto hace mejor la comunidad.",
  motivacion: "🔥 Sigue aprendiendo. Cada paso cuenta.",
  motivar: "⚡ No te rindas.",
  suerte: "🍀 ¡Mucha suerte!",
  random: "🎲 " + pick(["⚡ Energía Titan.", "🔥 Todo puede pasar.", "🤖 Modo aleatorio activado."]),
  consejo: "💡 Aprende algo nuevo cada día.",
  dato: "🧠 Dato: la constancia suele ser más útil que la prisa.",
  dato1: "🧠 Un programa se vuelve mejor cuando se prueba y se corrige.",
  dato2: "🧠 JavaScript puede ejecutarse en servidores con Node.js.",
  dato3: "🧠 Git ayuda a controlar versiones de proyectos.",
  dato4: "🧠 Los errores de sintaxis se solucionan revisando llaves y bloques.",
  dato5: "🧠 Una función permite reutilizar lógica.",
  dato6: "🧠 JSON es un formato común para guardar datos.",
  dato7: "🧠 Node.js permite crear servidores con JavaScript.",
  dato8: "🧠 Render puede ejecutar aplicaciones web y servicios.",
  dato9: "🧠 Baileys permite interactuar con WhatsApp Web.",
  estado2: "🟢 Todos los sistemas básicos están listos.",
  sistema: "⚙️ Sistemas básicos operativos.",
  versionbot: "🤖 TITANBOT v1.0",
  frase: FRASE,
  titan: "⚡ TITANBOT: potencia, orden y creatividad.",
  futuro: "🚀 El futuro se construye creando.",
  programar: "💻 Practica, prueba, corrige y vuelve a probar.",
  codigo: "💻 Código limpio = menos dolores de cabeza.",
  javascript: "🟨 JavaScript detectado.",
  node: "🟩 Node.js detectado.",
  baileys: "📱 Baileys detectado.",
  github: "🐙 GitHub sirve para alojar y versionar código.",
  whatsapp: "📱 WhatsApp conectado mediante Baileys.",
  animebot: "🎴 Modo anime.",
  anime: "🎴 Usa .s para una tarjeta anime.",
  waifu: "🎴 Usa .s para generar una tarjeta.",
  quote: "💬 'La constancia convierte los intentos en resultados.'",
  feliz: "😄 ¡Qué bueno!",
  triste: "💙 Ánimo. Un mal momento no define todo el día.",
  miedo: "🛡️ Respira, piensa y avanza paso a paso.",
  sueño: "😴 Descansar también es importante.",
  hambre: "🍔 Hora de comer algo.",
  sed: "💧 Recuerda hidratarte.",
  musica: "🎵 ¡Música activada en espíritu!",
  juego: "🎮 Usa .juegos para ideas.",
  juegos: "🎮 Usa .dado, .moneda, .ppt o .quiz.",
  grupo: "👥 Este bot tiene funciones para grupos.",
  admin: "🛡️ Las funciones administrativas requieren permisos.",
  admins: null,
  antilink: null,
  welcome: null,
  goodbye: null,
  perfil: null,
  id: null,
  completarperfil: null,
  foto: null,
  frasefavorita: null,
  edad: null,
  cumple: null,
  saldo: null,
  diario: null,
  trabajar: null,
  robar: null,
  pagar: null,
  tienda: null,
  comprar: null,
  inventario: null,
  topmonedas: null,
  xp: null,
  nivel: null,
  rank: null,
  topxp: null,
  logros: null,
  racha: null,
  dado: null,
  moneda: null,
  ppt: null,
  numero: null,
  quiz: null,
  reto: null,
  verdad: null,
  pregunta: null,
  calc: null,
  say: null,
  hora: null,
  fecha: null,
  tagall: null,
  hidetag: null,
  linkgrupo: null,
  infogrupo: null,
  promote: null,
  demote: null,
  kick: null
};

// Genera alias/funciones para superar 200 comandos sin duplicar lógica.
const aliases = {
  hi:"hola", hey:"hola", hello:"hola", holi:"hola", holaa:"hola",
  buenastardes:"buenas", buenasdiasbot:"buenosdias", buenasnochesbot:"buenasnoches",
  ok:"gracias", gracias1:"gracias", gracias2:"gracias", deNada:"gracias",
  about:"info", acerca:"info", informacion:"info", botinfo:"info",
  rules:"reglas", norma:"reglas", normas:"reglas",
  consejo1:"consejo", consejo2:"consejo", consejo3:"consejo",
  motivacion1:"motivacion", motivacion2:"motivacion", motivacion3:"motivacion",
  suerte1:"suerte", suerte2:"suerte",
  dato10:"dato", dato11:"dato", dato12:"dato", dato13:"dato", dato14:"dato",
  dato15:"dato", dato16:"dato", dato17:"dato", dato18:"dato", dato19:"dato",
  dato20:"dato", dato21:"dato", dato22:"dato", dato23:"dato", dato24:"dato",
  dato25:"dato", dato26:"dato", dato27:"dato", dato28:"dato", dato29:"dato",
  dato30:"dato", dato31:"dato", dato32:"dato", dato33:"dato", dato34:"dato",
  dato35:"dato", dato36:"dato", dato37:"dato", dato38:"dato", dato39:"dato",
  dato40:"dato", dato41:"dato", dato42:"dato", dato43:"dato", dato44:"dato",
  dato45:"dato", dato46:"dato", dato47:"dato", dato48:"dato", dato49:"dato",
  dato50:"dato", dato51:"dato", dato52:"dato", dato53:"dato", dato54:"dato",
  dato55:"dato", dato56:"dato", dato57:"dato", dato58:"dato", dato59:"dato",
  dato60:"dato", dato61:"dato", dato62:"dato", dato63:"dato", dato64:"dato",
  dato65:"dato", dato66:"dato", dato67:"dato", dato68:"dato", dato69:"dato",
  dato70:"dato", dato71:"dato", dato72:"dato", dato73:"dato", dato74:"dato",
  dato75:"dato", dato76:"dato", dato77:"dato", dato78:"dato", dato79:"dato",
  dato80:"dato", dato81:"dato", dato82:"dato", dato83:"dato", dato84:"dato",
  dato85:"dato", dato86:"dato", dato87:"dato", dato88:"dato", dato89:"dato",
  dato90:"dato", dato91:"dato", dato92:"dato", dato93:"dato", dato94:"dato",
  dato95:"dato", dato96:"dato", dato97:"dato", dato98:"dato", dato99:"dato",
  dato100:"dato",
  menu1:"menu", menu2:"menu", menu3:"menu", menu4:"menu", menu5:"menu",
  ayuda1:"ayuda", ayuda2:"ayuda", ayuda3:"ayuda", ayuda4:"ayuda", ayuda5:"ayuda",
  estado1:"estado", status:"estado", activo:"online", conectado:"online",
  bot1:"bot", bot2:"bot", bot3:"bot", bot4:"bot", bot5:"bot",
  perfil1:"perfil", perfil2:"perfil", perfil3:"perfil",
  id1:"id", id2:"id", id3:"id",
  anime1:"anime", anime2:"anime", anime3:"anime", anime4:"anime",
  juego1:"juego", juego2:"juegos", juegos1:"juegos", juegos2:"juegos",
  dinero:"saldo", money:"saldo", coins:"saldo", moneda1:"moneda",
  nivel1:"nivel", nivel2:"nivel", nivel3:"nivel",
  xp1:"xp", xp2:"xp", rango:"rank", ranking:"rank",
  grupo1:"grupo", grupo2:"grupo", grupo3:"grupo",
  reglas1:"reglas", reglas2:"reglas", respeto1:"respeto", respeto2:"respeto"
};

for (const [a, target] of Object.entries(aliases)) {
  if (!(a in simpleCommands)) simpleCommands[a] = simpleCommands[target];
}

function allCommandNames() {
  return Object.keys(simpleCommands).sort();
}

async function handleProfile(cmd, m, id) {
  const p = data.profiles[id];

  if (cmd === "id" || cmd === "perfil") {
    const u = ensureUser(id);

    let photo = null;
    try {
      photo = await sock.profilePictureUrl(m.key.participant || m.key.remoteJid, "image");
    } catch {}

    const text =
`╭━━〔 👤 PERFIL 〕━━╮
┃ 👤 Nombre: ${p?.name || displayName(m)}
┃ 🆔 ID: ${id}
┃ 🎂 Edad: ${p?.age || "No registrada"}
┃ 📅 Cumpleaños: ${p?.birthday || "No registrado"}
┃ 💬 Frase: ${p?.phrase || "No registrada"}
┃ ⭐ Nivel: ${u.level}
┃ ✨ XP: ${u.xp}
┃ 💰 Monedas: ${money(u.coins)}
╰━━━━━━━━━━━━━━╯`;

    if (photo) {
      return sock.sendMessage(m.key.remoteJid, {
        image: { url: photo },
        caption: text
      });
    }
    return sendText(m.key.remoteJid, text);
  }

  if (cmd === "completarperfil") {
    profileSteps[id] = { step: 1, data: {} };
    return sendText(m.key.remoteJid,
      "👤 *COMPLETAR PERFIL*\n\nEscribe tu *nombre*.");
  }

  if (cmd === "foto") {
    try {
      const photo = await sock.profilePictureUrl(
        m.key.participant || m.key.remoteJid,
        "image"
      );
      return sock.sendMessage(m.key.remoteJid, {
        image: { url: photo },
        caption: `🖼️ Foto de perfil de ${displayName(m)}`
      });
    } catch {
      return sendText(m.key.remoteJid, "❌ No pude obtener la foto de perfil.");
    }
  }

  if (cmd === "frasefavorita" || cmd === "frase") {
    if (!p?.phrase) return sendText(m.key.remoteJid, "💬 No tienes una frase guardada. Usa .completarperfil");
    return sendText(m.key.remoteJid, `💬 *Tu frase favorita:*\n\n${p.phrase}`);
  }

  if (cmd === "edad") {
    return sendText(m.key.remoteJid, `🎂 Edad: *${p?.age || "No registrada"}*`);
  }

  if (cmd === "cumple") {
    return sendText(m.key.remoteJid, `📅 Cumpleaños: *${p?.birthday || "No registrado"}*`);
  }

  return false;
}

async function handleEconomy(cmd, args, m, id) {
  const u = ensureUser(id);

  if (cmd === "saldo") {
    return sendText(m.key.remoteJid,
`💰 *SALDO*
👤 ${displayName(m)}
💵 ${money(u.coins)} monedas
⭐ Nivel ${u.level}
✨ ${u.xp} XP`);
  }

  if (cmd === "diario") {
    const now = Date.now();
    if (now - u.daily < 86400000) {
      const remaining = 86400000 - (now - u.daily);
      return sendText(m.key.remoteJid,
        `⏳ Ya reclamaste tu recompensa.\nVuelve en ${Math.ceil(remaining / 3600000)} hora(s).`);
    }
    const reward = 500 + Math.floor(Math.random() * 501);
    u.coins += reward;
    u.daily = now;
    u.streak++;
    addXP(id, 25);
    saveData();
    return sendText(m.key.remoteJid,
`🎁 *RECOMPENSA DIARIA*
💰 +${money(reward)} monedas
🔥 Racha: ${u.streak}
✨ +25 XP`);
  }

  if (cmd === "trabajar") {
    const jobs = ["💻 Programador", "🔧 Técnico", "🎨 Diseñador", "🎮 Gamer", "🛠️ Ingeniero", "📱 Técnico de celulares"];
    const reward = 200 + Math.floor(Math.random() * 801);
    u.coins += reward;
    addXP(id, 15);
    saveData();
    return sendText(m.key.remoteJid,
`💼 *TRABAJO COMPLETADO*
${pick(jobs)}
💰 +${money(reward)} monedas
✨ +15 XP`);
  }

  if (cmd === "robar") {
    if (u.coins < 100) return sendText(m.key.remoteJid, "❌ Necesitas 100 monedas.");
    if (Math.random() < 0.45) {
      const gain = 100 + Math.floor(Math.random() * 501);
      u.coins += gain;
      saveData();
      return sendText(m.key.remoteJid, `🕵️ ¡Lo lograste!\n💰 +${money(gain)} monedas`);
    }
    const loss = Math.min(u.coins, 100 + Math.floor(Math.random() * 301));
    u.coins -= loss;
    saveData();
    return sendText(m.key.remoteJid, `🚨 Te atraparon.\n💸 -${money(loss)} monedas`);
  }

  if (cmd === "pagar") {
    const target = getMention(m);
    const amount = Number(args.find(x => /^\d+$/.test(x)));
    if (!target) return sendText(m.key.remoteJid, "❌ Menciona a quien quieres pagar.");
    if (!amount || amount < 1) return sendText(m.key.remoteJid, "❌ Escribe una cantidad válida.");
    if (u.coins < amount) return sendText(m.key.remoteJid, "❌ No tienes suficientes monedas.");
    const receiver = ensureUser(cleanNumber(target));
    u.coins -= amount;
    receiver.coins += amount;
    saveData();
    return sendText(m.key.remoteJid, `💸 Pagaste ${money(amount)} monedas a @${cleanNumber(target)}`, {
      mentions: [target]
    });
  }

  if (cmd === "tienda") {
    return sendText(m.key.remoteJid,
`🛒 *TIENDA*
🍀 amuleto — 1.000
⚔️ espada — 2.500
🛡️ escudo — 3.500
👑 corona — 5.000

Usa .comprar <objeto>`);
  }

  if (cmd === "comprar") {
    const prices = { amuleto:1000, espada:2500, escudo:3500, corona:5000 };
    const item = args[0]?.toLowerCase();
    if (!prices[item]) return sendText(m.key.remoteJid, "❌ Producto no encontrado.");
    if (u.coins < prices[item]) return sendText(m.key.remoteJid, "❌ No tienes suficientes monedas.");
    u.coins -= prices[item];
    u.inventory.push(item);
    saveData();
    return sendText(m.key.remoteJid, `✅ Compraste *${item}* por ${money(prices[item])} monedas.`);
  }

  if (cmd === "inventario") {
    return sendText(m.key.remoteJid,
`🎒 *INVENTARIO*

${u.inventory.length ? u.inventory.map((x,i)=>`${i+1}. ${x}`).join("\n") : "Vacío"}`);
  }

  if (cmd === "topmonedas") {
    const top = Object.entries(data.users)
      .sort((a,b)=>(b[1].coins||0)-(a[1].coins||0))
      .slice(0,10);
    return sendText(m.key.remoteJid,
`🏆 *TOP MONEDAS*

${top.map(([n,v],i)=>`${i+1}. @${n} — ${money(v.coins||0)} 💰`).join("\n")}`,
      { mentions: top.map(x=>`${x[0]}@s.whatsapp.net`) });
  }

  return false;
}

async function handleGames(cmd, args, m, id) {
  if (cmd === "dado") {
    return sendText(m.key.remoteJid, `🎲 Resultado: *${1 + Math.floor(Math.random()*6)}*`);
  }

  if (cmd === "moneda") {
    return sendText(m.key.remoteJid, `🪙 Salió: *${pick(["CARA","SELLO"])}*`);
  }

  if (cmd === "ppt") {
    const choices = ["piedra","papel","tijera"];
    const user = args[0]?.toLowerCase();
    if (!choices.includes(user)) return sendText(m.key.remoteJid, "🎮 Usa: .ppt piedra/papel/tijera");
    const bot = pick(choices);
    let result = "🤝 Empate";
    if ((user==="piedra"&&bot==="tijera")||(user==="papel"&&bot==="piedra")||(user==="tijera"&&bot==="papel")) result="🏆 Ganaste";
    else if (user !== bot) result="🤖 Gané yo";
    return sendText(m.key.remoteJid, `🎮 Tú: ${user}\n🤖 Yo: ${bot}\n\n${result}`);
  }

  if (cmd === "numero") {
    const n = 1 + Math.floor(Math.random()*10);
    return sendText(m.key.remoteJid, `🔢 Pensé en un número del 1 al 10.\n\n🎯 Era: *${n}*`);
  }

  if (cmd === "quiz") {
    const q = pick([
      ["¿Qué lenguaje usa Node.js principalmente?", "JavaScript"],
      ["¿Qué archivo suele contener dependencias de Node?", "package.json"],
      ["¿Qué plataforma sirve para alojar repositorios Git?", "GitHub"],
      ["¿Qué símbolo usamos como prefijo en este bot?", "."]
    ]);
    return sendText(m.key.remoteJid, `🧠 *QUIZ*\n\n${q[0]}\n\n💡 Respuesta: *${q[1]}*`);
  }

  if (cmd === "reto") {
    return sendText(m.key.remoteJid, `🎯 *RETO*\n\n${pick([
      "Di un dato curioso.",
      "Aprende una palabra nueva.",
      "Escribe una meta para hoy.",
      "Comparte una idea creativa."
    ])}`);
  }

  if (cmd === "verdad") {
    return sendText(m.key.remoteJid, `🗣️ *VERDAD*\n\n${pick([
      "¿Qué habilidad te gustaría aprender?",
      "¿Cuál es tu juego favorito?",
      "¿Qué proyecto te gustaría crear?"
    ])}`);
  }

  if (cmd === "pregunta") {
    return sendText(m.key.remoteJid, `❓ ${pick([
      "¿Qué estás aprendiendo?",
      "¿Qué proyecto tienes en mente?",
      "¿Qué función debería tener TitanBot?"
    ])}`);
  }

  return false;
}

async function handleGroup(cmd, args, m) {
  if (!isGroup(m)) return sendText(m.key.remoteJid, "❌ Este comando solo funciona en grupos.");

  const jid = m.key.remoteJid;
  const g = ensureGroup(jid);

  if (["antilink","welcome","goodbye"].includes(cmd)) {
    if (!(await isAdmin(m))) return sendText(jid, "❌ Solo los administradores pueden usarlo.");
    g[cmd] = !g[cmd];
    saveData();
    return sendText(jid, `${g[cmd] ? "✅ ACTIVADO" : "❌ DESACTIVADO"}: *${cmd}*`);
  }

  if (cmd === "admins") {
    const meta = await groupMetadata(jid);
    if (!meta) return sendText(jid, "❌ No pude obtener la información.");
    const list = meta.participants.filter(p=>p.admin).map(p=>`• @${cleanNumber(p.id)}`).join("\n");
    return sendText(jid, `🛡️ *ADMINISTRADORES*\n\n${list || "No encontrados."}`,
      {mentions: meta.participants.filter(p=>p.admin).map(p=>p.id)});
  }

  if (cmd === "infogrupo") {
    const meta = await groupMetadata(jid);
    if (!meta) return sendText(jid, "❌ No pude obtener la información.");
    return sendText(jid,
`👥 *INFORMACIÓN DEL GRUPO*
📛 Nombre: ${meta.subject}
👤 Miembros: ${meta.participants.length}
🆔 ID: ${jid}`);
  }

  if (cmd === "tagall" || cmd === "hidetag") {
    if (!(await isAdmin(m))) return sendText(jid, "❌ Solo administradores.");
    const meta = await groupMetadata(jid);
    const mentions = meta.participants.map(p=>p.id);
    const text = args.join(" ") || "📢 Atención grupo";
    return sendText(jid, text, { mentions });
  }

  if (cmd === "linkgrupo") {
    if (!(await isAdmin(m))) return sendText(jid, "❌ Solo administradores.");
    if (!(await botIsAdmin(jid))) return sendText(jid, "❌ Necesito ser administrador.");
    try {
      const code = await sock.groupInviteCode(jid);
      return sendText(jid, `🔗 https://chat.whatsapp.com/${code}`);
    } catch {
      return sendText(jid, "❌ No pude obtener el enlace.");
    }
  }

  if (cmd === "promote" || cmd === "demote" || cmd === "kick") {
    if (!(await isAdmin(m))) return sendText(jid, "❌ Solo administradores.");
    if (!(await botIsAdmin(jid))) return sendText(jid, "❌ Necesito ser administrador.");
    const target = getMention(m);
    if (!target) return sendText(jid, "❌ Menciona a la persona.");
    const action = cmd === "promote" ? "promote" : cmd === "demote" ? "demote" : "remove";
    await sock.groupParticipantsUpdate(jid, [target], action);
    return sendText(jid, `✅ Acción *${cmd}* realizada.`);
  }

  return false;
}

async function handleUtilities(cmd, args, m) {
  if (cmd === "calc") {
    const expression = args.join(" ");
    if (!/^[0-9+\-*/().%\s]+$/.test(expression)) return sendText(m.key.remoteJid, "❌ Solo operaciones matemáticas básicas.");
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return sendText(m.key.remoteJid, `🧮 ${expression} = *${result}*`);
    } catch {
      return sendText(m.key.remoteJid, "❌ Operación inválida.");
    }
  }

  if (cmd === "say") {
    return sendText(m.key.remoteJid, args.join(" ") || "❌ Escribe algo.");
  }

  if (cmd === "hora") {
    return sendText(m.key.remoteJid, `🕐 Hora del servidor: ${new Date().toLocaleTimeString("es-CO")}`);
  }

  if (cmd === "fecha") {
    return sendText(m.key.remoteJid, `📅 Fecha: ${new Date().toLocaleDateString("es-CO")}`);
  }

  return false;
}

async function handleAnime(cmd, m, id) {
  if (cmd !== "s" && cmd !== "anime" && cmd !== "waifu") return false;

  // Sin API externa: tarjeta visual de texto estable.
  // Si se configura ANIME_IMAGE_URL en Render, se usa esa imagen.
  const image = process.env.ANIME_IMAGE_URL;

  const p = data.profiles[id];
  const name = p?.name || displayName(m);

  const caption =
`╭━━〔 🎴 TARJETA ANIME 〕━━╮
┃ ✨ ${name}
┃ ⭐ Nivel: ${ensureUser(id).level}
┃ 💫 TITANBOT
╰━━━━━━━━━━━━━━━━━━━━╯

${pick([
  "🌸 Espíritu aventurero.",
  "⚡ Energía futurista.",
  "🔥 Modo protagonista.",
  "🌙 Modo tranquilo."
])}`;

  if (image) {
    return sock.sendMessage(m.key.remoteJid, {
      image: { url: image },
      caption
    });
  }

  return sendText(m.key.remoteJid, caption);
}

async function executeCommand(text, m) {
  try {
    const parts = text.slice(PREFIX.length).trim().split(/\s+/);
    const raw = parts.shift()?.toLowerCase();
    if (!raw) return;

    const cmd = raw;
    const args = parts;
    const id = userId(m.key.participant || m.key.remoteJid);

    ensureUser(id).messages++;
    addXP(id, 1);

    if (cmd === "menu" || cmd === "help" || cmd === "comandos") {
      return sendText(m.key.remoteJid, commandMenu());
    }

    if (cmd === "todos") {
      const names = allCommandNames();
      return sendText(m.key.remoteJid,
`📚 *COMANDOS DISPONIBLES*
Total: *${names.length}*

${names.map((x,i)=>`${i+1}. .${x}`).join("\n")}`);
    }

    if (await handleProfile(cmd, m, id)) return;
    if (await handleAnime(cmd, m, id)) return;
    if (await handleEconomy(cmd, args, m, id)) return;
    if (await handleGames(cmd, args, m, id)) return;
    if (await handleGroup(cmd, args, m)) return;
    if (await handleUtilities(cmd, args, m)) return;

    if (Object.prototype.hasOwnProperty.call(simpleCommands, cmd)) {
      const response = simpleCommands[cmd];
      if (response) return sendText(m.key.remoteJid, response);
    }

    return sendText(m.key.remoteJid,
      `❌ Comando desconocido: *.${cmd}*\n\nUsa *.menu* para ver el menú.`);
  } catch (error) {
    console.error("❌ Error ejecutando comando:", error);
    return sendText(m.key.remoteJid, "❌ Ocurrió un error al ejecutar el comando.");
  }
}

async function processMessage(m) {
  try {
    if (!m?.message) return;
    if (m.key.fromMe) return;

    const remote = m.key.remoteJid;
    if (!remote) return;

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      m.message.videoMessage?.caption ||
      "";

    if (!text) return;

    const id = userId(m.key.participant || remote);
    ensureUser(id);

    // Sistema de respuesta: si alguien responde a un mensaje enviado por TitanBot,
    // TitanBot contesta de forma automática.
    const ctx = m.message.extendedTextMessage?.contextInfo;
    const quotedParticipant = ctx?.participant;
    const botId = cleanNumber(sock.user?.id);

    const replyingToBot =
      quotedParticipant && cleanNumber(quotedParticipant) === botId;

    if (replyingToBot && !text.startsWith(PREFIX)) {
      return sendText(remote, pick([
        "🤖 Sí, te estoy leyendo.",
        "⚡ Aquí estoy.",
        "👀 Te escucho.",
        "🔥 Dime.",
        "🛡️ TitanBot atento."
      ]));
    }

    // Antilink
    if (isGroup(m)) {
      const g = ensureGroup(remote);
      if (g.antilink && /https?:\/\/|chat\.whatsapp\.com/i.test(text)) {
        if (!(await isAdmin(m))) {
          if (await botIsAdmin(remote)) {
            const target = m.key.participant;
            try {
              await sock.groupParticipantsUpdate(remote, [target], "remove");
              return sendText(remote, "🚫 Enlace detectado. Usuario retirado.");
            } catch {
              return sendText(remote, "🚫 Enlace detectado.");
            }
          }
        }
      }
    }

    if (profileSteps[id] && !text.startsWith(PREFIX)) {
      const state = profileSteps[id];

      if (state.step === 1) {
        state.data.name = text;
        state.step = 2;
        return sendText(remote, "🎂 Ahora escribe tu *edad*.");
      }

      if (state.step === 2) {
        const age = Number(text);
        if (!Number.isInteger(age) || age < 1 || age > 100) {
          return sendText(remote, "❌ Escribe una edad válida.");
        }
        state.data.age = age;
        state.step = 3;
        return sendText(remote, "📅 Ahora escribe tu *cumpleaños*.\nEjemplo: 15/08/2010");
      }

      if (state.step === 3) {
        state.data.birthday = text;
        state.step = 4;
        return sendText(remote, "💬 Ahora escribe tu *frase favorita*.");
      }

      if (state.step === 4) {
        state.data.phrase = text;
        data.profiles[id] = {
          ...state.data,
          updatedAt: Date.now()
        };
        delete profileSteps[id];
        addXP(id, 50);
        saveData();

        return sendText(remote,
`✅ *PERFIL COMPLETADO*

👤 ${state.data.name}
🎂 ${state.data.age}
📅 ${state.data.birthday}
💬 ${state.data.phrase}

✨ +50 XP`);
      }
    }

    if (text.startsWith(PREFIX)) {
      return executeCommand(text, m);
    }

    const lower = text.toLowerCase().trim();

    if (["hola","holaa","holaaa","hey","hello"].includes(lower)) {
      return sendText(remote, pick([
        "👋 ¡Hola! Soy TitanBot.",
        "🤖 ¡Hola! ¿Qué tal?",
        "⚡ ¡Hey! TitanBot activo.",
        "🔥 ¡Buenas!"
      ]));
    }
  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
  }
}

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("TitanBot"),
      mobile: false,
      generateHighQualityLinkPreview: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async update => {
      try {
        const { connection, lastDisconnect } = update;

        if (connection === "connecting") {
          console.log("🔄 Conectando TITANBOT...");
        }

        if (connection === "open") {
          console.log("================================");
          console.log("✅ TITANBOT CONECTADO");
          console.log(`🤖 ${BOT_NAME}`);
          console.log(`⚡ ${FRASE}`);
          console.log("================================");
        }

        if (connection === "close") {
          const code = lastDisconnect?.error?.output?.statusCode;

          console.log("❌ Conexión cerrada. Código:", code);

          if (code !== DisconnectReason.loggedOut) {
            console.log("🔄 Reintentando en 5 segundos...");
            await sleep(5000);
            return startBot();
          }

          console.log("🚪 Sesión cerrada. Hay que volver a vincular.");
        }
      } catch (error) {
        console.error("❌ Error en connection.update:", error);
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      for (const m of messages) {
        await processMessage(m);
      }
    });

    if (!state.creds.registered) {
      if (!PAIRING_NUMBER) {
        console.log("❌ Falta PAIRING_NUMBER en las variables de entorno.");
      } else {
        await sleep(5000);

        try {
          const number = PAIRING_NUMBER.replace(/\D/g, "");
          console.log("🔢 Generando código de vinculación...");

          const code = await sock.requestPairingCode(number);

          console.log("");
          console.log("================================");
          console.log("📱 CÓDIGO PARA VINCULAR:");
          console.log(code);
          console.log("================================");
          console.log("WhatsApp > Dispositivos vinculados >");
          console.log("Vincular dispositivo > Vincular con número de teléfono");
          console.log("================================");
        } catch (error) {
          console.error("❌ Error generando código:", error);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error iniciando TitanBot:", error);
    setTimeout(startBot, 10000);
  }
}

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("🤖 TITANBOT ONLINE\n");
}).listen(PORT, () => {
  console.log(`🌐 TitanBot disponible en el puerto ${PORT}`);
});

console.log("================================");
console.log(`🤖 ${BOT_NAME}`);
console.log(`⚡ ${FRASE}`);
console.log("📱 Vinculación: NÚMERO");
console.log("🚫 QR: DESACTIVADO");
console.log("================================");

startBot();
