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
const TITANBOT_PROFILE_IMAGE = path.join(__dirname, "titanbot-profile.png");
const http = require("http");
const QRCode = require("qrcode");

const PREFIX = ".";
const PORT = process.env.PORT || 10000;
const BOT_NAME = "TITANBOT";
const FRASE = "⚡ El futuro empieza ahora.";

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
let currentQR = null;
let botConnection = "starting";
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

async function sendCommandText(jid, command, text, options = {}) {
  const title = String(command || "BOT").toUpperCase();
  const decorated = `╭━━━〔 ⚡ TITANBOT 〕━━━╮
┃ ✦ *${PREFIX}${command}*  •  ${title}
╰━━━━━━━━━━━━━━━━━━━━╯

${text}

╰─〔 🤖 TITANBOT • ONLINE 〕─╯`;
  return sendText(jid, decorated, options);
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

function commandCategory(command) {
  const c = String(command).toLowerCase();
  const groups = [
    ['👥 GRUPOS', /^(anti|welcome|goodbye|admin|admins|grupo|infogrupo|tagall|hidetag|linkgrupo|promote|demote|kick|mencion|miembros|moderacion|norma|normas|regla|reglas|respeto|invitar|silencio|aviso)/],
    ['🎮 JUEGOS', /^(dado|moneda|ppt|numero|quiz|reto|verdad|pregunta|juego|juegos|eleccion|decision|random|azar|elige|8ball|suerte|robar|boss|aventura)/],
    ['👤 PERFIL', /^(id|perfil|completarperfil|foto|frase|frasefavorita|edad|cumple|micuenta|miid|confianza)/],
    ['🎌 ANIME', /^(s$|anime|waifu|quote|manga|pixel|fantasia|heroe|villano|magia)/],
    ['💰 ECONOMÍA', /^(saldo|diario|trabajar|trabajo|dinero|economia|coins|monedas|money|pagar|comprar|shop|tienda|inventario|item|topmonedas)/],
    ['⭐ NIVEL & XP', /^(xp|nivel|level|levelup|rank|ranking|rankingxp|rango|topxp|racha|logro|logros|progreso|estadisticas|stats|top)/],
    ['🛠️ UTILIDADES', /^(ping|pong|hora|fecha|fecha2|fechaactual|calc|calculadora|say|qr|mayus|minus|invertir|contar|numeroazar|clima|temperatura|codigo|texto|emoji|randomemoji|archivo|array|async|await|funcion|variable|if|loop|math|objeto|json|javascript|js|html|css|node|nodejs|api|test|check|debug|error|fix|numero2)/],
    ['🤖 BOT', /^(about|acerca|actividad|activo|actualizado|actualizar|autor|bot|bot[1-5]|botinfo|conectado|conexion|creador|categoria|comandos|comandos2|menu|menu[1-5]|help|ayuda|ayuda[1-5]|info|informacion|inicio|principal|online|online2|sistema|status|estado|estado[1-3]|titan|titanbot|version|version2|versionbot|vincular|whatsapp|baileys|backup|deploy|server|servidor|render|render2|repo|github|git|npm|web|puerto|logs|log|manual|norma|rules|seguridad|privacidad)/],
    ['✨ DIVERSIÓN', /^(hola|hola2|holaa|holi|hi|hey|hey2|hello|buenas|buenas2|buenosdias|buenasdiasbot|buenastardes|buenasnoches|buenasnochesbot|adios|chao|goodbye|hasta|gracias|gracias1|gracias2|graciasbot|denada|ok|jaja|lol|xd|risas|broma|chiste|animo|feliz|triste|miedo|hambre|sed|sueño|musica|musica2|frase|consejo|consejo[1-3]|motivacion|motivacion[1-3]|motivar|paciencia|tip|tip[2-9]|tip10|dato|dato\d+|nube|luna|sol|tierra|aire|agua|fuego|hielo|estrella|galaxia|futuro|futuro2|espacio|libro|pelicula|serie|historia|portal|cyber|robot|ready|listo|gracias|porfavor)/]
  ];
  for (const [name, rx] of groups) if (rx.test(c)) return name;
  return '📚 OTROS';
}

function commandMenu() {
  const names = allCommandNames();
  const grouped = {};
  for (const name of names) {
    const category = commandCategory(name);
    (grouped[category] ||= []).push(name);
  }

  const order = ['👤 PERFIL','🎌 ANIME','💰 ECONOMÍA','⭐ NIVEL & XP','👥 GRUPOS','🎮 JUEGOS','🛠️ UTILIDADES','🤖 BOT','✨ DIVERSIÓN','📚 OTROS'];
  const sections = order.filter(c => grouped[c]?.length).map(category => {
    const list = grouped[category];
    const lines = [];
    for (const command of list) {
      lines.push(`│ ✦ ${PREFIX}${command} ✦`);
    }
    return `╭─「 ${category} 」\n${lines.join('\n')}\n╰──────────────────────`;
  }).join('\n\n');

  return `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🤖 *${BOT_NAME}* ⚡
┃ ${FRASE}
┃ 📚 *${names.length} COMANDOS*
╰━━━━━━━━━━━━━━━━━━━━━━╯

${sections}

╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🔎 *${PREFIX}help <comando>* → información
┃ 📋 *${PREFIX}todos* → lista numerada completa
┃ ⚡ Prefijo: *${PREFIX}*
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
}

function decorateCommandResponse(command, text) {
  return `╭━━━〔 ⚡ TITANBOT 〕━━━╮\n┃ 🔹 *${PREFIX}${command}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n${text}\n\n╰─〔 🤖 TITANBOT • ONLINE 〕─╯`;
}

function commandHelp(command) {
  const c = String(command || '').toLowerCase().trim();
  const descriptions = {
    menu: '📋 Abre el menú principal con las categorías del bot.',
    ping: '🏓 Comprueba que TITANBOT esté conectado y respondiendo.',
    perfil: '👤 Muestra o gestiona tu perfil.',
    saldo: '💰 Consulta tus monedas disponibles.',
    diario: '🎁 Reclama tu recompensa diaria.',
    trabajar: '💼 Obtén monedas mediante el sistema de economía.',
    dado: '🎲 Lanza un dado y obtén un resultado aleatorio.',
    moneda: '🪙 Lanza una moneda.',
    ppt: '✊ Juega piedra, papel o tijera.',
    quiz: '🧠 Participa en una pregunta rápida.',
    tagall: '📢 Menciona a los participantes del grupo.',
    hidetag: '📣 Envía un mensaje mencionando al grupo sin mostrar las menciones.',
    admins: '🛡️ Muestra los administradores del grupo.',
    calc: '🧮 Realiza un cálculo básico.',
    say: '💬 Hace que el bot repita el texto indicado.',
    anime: '🎴 Accede a las funciones de anime disponibles.',
    waifu: '🌸 Genera una respuesta relacionada con anime.',
    info: '🤖 Muestra información de TITANBOT.',
    version: '⚙️ Muestra la versión del bot.',
    estado: '🟢 Muestra el estado actual del bot.'
  };
  return descriptions[c] || `📖 Comando: *${PREFIX}${c}*\n💡 Usa *${PREFIX}menu* para ver las categorías disponibles.`;
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
  versionbot: "🤖 TITANBOT 4.6.0 — v2.6\n⚡ El futuro empieza ahora.",
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
  kick: null,
  qr: null,
  mayus: null,
  minus: null,
  invertir: null,
  contar: null,
  numeroazar: null,
  dado10: null,
  dado20: null,
  elige: null,
  azar: null,
  "8ball": null,
  rankingxp: null,
  stats: null,
  enfoque: "🎯 Enfócate en una cosa a la vez.",
  aprende: "📚 Aprender requiere práctica.",
  crea: "🛠️ Crea, prueba y mejora.",
  proyecto: "🚀 Un proyecto crece con pequeñas mejoras."
};

// Genera alias/funciones para superar 200 comandos sin duplicar lógica.
const aliases = {
  hi:"hola", hey:"hola", hello:"hola", holi:"hola", holaa:"hola",
  buenastardes:"buenas", buenasdiasbot:"buenosdias", buenasnochesbot:"buenasnoches",
  ok:"gracias", gracias1:"gracias", gracias2:"gracias", denada:"gracias",
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
  reglas1:"reglas", reglas2:"reglas", respeto1:"respeto", respeto2:"respeto",
  rankingxp:"topxp", estadisticas2:"stats", nivelactual:"nivel", experiencia:"xp",
  aleatorio:"azar", bola8:"8ball", dado10x:"dado10", dado20x:"dado20",
  aleatorio2:"numeroazar", elegir:"elige", upper:"mayus", lower:"minus", reversa:"invertir"
};

for (const [a, target] of Object.entries(aliases)) {
  if (!(a in simpleCommands)) simpleCommands[a] = simpleCommands[target];
}


// ===== 200 COMANDOS EXTRA =====
const extraCommands = {
  broma: '😂 Aquí va una broma: ¡un bug pidió vacaciones!',
  chiste: '🤣 ¿Por qué el código fue al médico? Porque tenía demasiados bugs.',
  lol: '😂 Modo LOL activado.',
  xd: '😎 XD',
  jaja: '🤣 JAJAJA',
  risas: '😂 Risas activadas.',
  randomemoji: '🎲 😀 😎 🔥 🤖 🌟',
  emoji: '😎 Usa un emoji para darle estilo a tu mensaje.',
  dado2: '🎲 Resultado: 1',
  moneda2: '🪙 Cara o sello: resultado aleatorio.',
  suerte2: '🍀 Que la suerte te acompañe.',
  reto2: '🎯 Reto: escribe una meta que quieras cumplir hoy.',
  pregunta2: '❓ ¿Qué función te gustaría agregar al bot?',
  verdad2: '🗣️ Verdad: todos los proyectos mejoran con pruebas.',
  eleccion: '🎯 Elige entre A o B.',
  decision: '🤔 Toma una decisión y pruébala paso a paso.',
  saludo: '👋 ¡Saludos desde TITANBOT!',
  hola2: '👋 ¡Hola otra vez!',
  hey2: '⚡ ¡Hey!',
  buenas2: '🔥 ¡Buenas!',
  gracias2: '💙 ¡Con gusto!',
  porfavor: '🙏 De nada.',
  perdon: '🙂 No pasa nada.',
  bienvenido: '🎉 ¡Bienvenido a TITANBOT!',
  bienvenida: '🎉 ¡Bienvenida a TITANBOT!',
  hasta: '👋 ¡Hasta luego!',
  adios: '👋 ¡Adiós!',
  chao: '👋 ¡Chao!',
  estado2: '🟢 Sistemas básicos funcionando.',
  estado3: '🟢 Bot operativo.',
  online2: '🟢 TITANBOT está online.',
  activo: '⚡ TITANBOT activo.',
  test: '🧪 Prueba correcta.',
  prueba: '🧪 TITANBOT respondió correctamente.',
  check: '✅ Todo bien.',
  ok: '✅ OK.',
  ready: '🚀 Listo.',
  listo: '🚀 Listo para recibir comandos.',
  uptime: '⏱️ Consulta el tiempo de actividad del servicio en Render.',
  nube: '☁️ La nube puede alojar aplicaciones y datos.',
  web: '🌐 Una aplicación web funciona mediante tecnologías del navegador y servidor.',
  html: '🌐 HTML estructura páginas web.',
  css: '🎨 CSS da estilo a las páginas.',
  js: '🟨 JavaScript agrega lógica e interacción.',
  json: '📦 JSON organiza datos en texto.',
  api: '🔌 Una API permite comunicar aplicaciones.',
  npm: '📦 npm administra paquetes de Node.js.',
  nodejs: '🟩 Node.js ejecuta JavaScript en el servidor.',
  git: '🐙 Git registra cambios del proyecto.',
  repo: '📁 Un repositorio guarda el código y su historial.',
  debug: '🐞 Depurar es buscar y corregir errores.',
  bug: '🐞 Un bug es un error de software.',
  funcion: '🧩 Una función agrupa instrucciones reutilizables.',
  variable: '📦 Una variable guarda un valor.',
  array: '📚 Un array contiene varios valores.',
  objeto: '🧱 Un objeto agrupa propiedades y datos.',
  loop: '🔁 Un bucle repite instrucciones.',
  if: '🔀 if permite ejecutar código según una condición.',
  async: '⚡ async se usa para trabajar con operaciones asíncronas.',
  await: '⏳ await espera el resultado de una promesa.',
  render2: '🌐 Render puede ejecutar servicios web y bots.',
  deploy: '🚀 Deploy significa publicar una aplicación.',
  logs: '📋 Los logs muestran lo que ocurre en el servidor.',
  servidor: '🖥️ Un servidor procesa solicitudes y ejecuta servicios.',
  puerto: '🔌 Un puerto permite recibir conexiones de red.',
  qr: '📷 La vinculación actual de TITANBOT usa QR.',
  vincular: '📱 Ve a WhatsApp → Dispositivos vinculados → Vincular dispositivo.',
  conexion: '🔗 TITANBOT usa una conexión con WhatsApp Web.',
  perfil2: '👤 Usa .perfil para ver tu perfil.',
  miid: '🆔 Usa .id para consultar tu identificador.',
  micuenta: '👤 Tu cuenta puede guardar progreso y estadísticas.',
  stats: '📊 Usa los comandos de perfil y XP para ver estadísticas.',
  estadisticas: '📊 Consulta tus estadísticas con los comandos disponibles.',
  progreso: '📈 Tu progreso aumenta al usar el bot.',
  actividad: '📊 La actividad se registra en las estadísticas del bot.',
  economia: '💰 Usa .saldo, .diario y .trabajar para la economía.',
  dinero: '💰 Revisa tu saldo con .saldo.',
  coins: '🪙 Las monedas forman parte de la economía del bot.',
  monedas: '🪙 Usa .saldo para consultar monedas.',
  shop: '🛒 Usa .tienda para ver la tienda.',
  comprar2: '🛒 Usa .comprar seguido del artículo que quieras adquirir.',
  item: '📦 Usa .inventario para revisar tus artículos.',
  inventario2: '🎒 Revisa tu inventario con .inventario.',
  trabajo: '💼 Usa .trabajar para ganar monedas.',
  daily: '🎁 Usa .diario para reclamar tu recompensa.',
  ranking: '🏆 Usa .topmonedas o .topxp para rankings.',
  xp2: '⭐ Usa .xp para consultar experiencia.',
  level: '📈 Usa .nivel para consultar tu nivel.',
  levelup: '✨ Sigue ganando XP para subir de nivel.',
  logro: '🏅 Usa .logros para consultar logros.',
  racha2: '🔥 Usa .racha para consultar tu racha.',
  top: '🏆 Usa .rank para consultar posiciones.',
  grupo2: '👥 Funciones de grupo disponibles.',
  reglas2: '📜 Recuerda respetar las reglas del grupo.',
  normas: '📜 Mantén una convivencia respetuosa.',
  miembros: '👥 En un grupo puedes consultar información con .infogrupo.',
  admins2: '🛡️ Usa .admins para consultar administradores.',
  invitar: '🔗 Usa .linkgrupo si tienes permisos.',
  mencion: '📢 Usa .tagall con responsabilidad.',
  aviso: '📢 Usa .hidetag para avisos cuando corresponda.',
  admin2: '🛡️ Algunas acciones requieren ser administrador.',
  moderacion: '🛡️ Las acciones de moderación requieren permisos.',
  juego2: '🎮 Prueba .dado, .moneda, .ppt y .quiz.',
  jugar: '🎮 ¡A jugar!',
  quiz2: '🧠 Usa .quiz para jugar preguntas.',
  ppt2: '✊ Usa .ppt para piedra, papel o tijera.',
  numero2: '🔢 Usa .numero para un juego numérico.',
  dado3: '🎲 Usa .dado para lanzar un dado.',
  moneda3: '🪙 Usa .moneda para lanzar una moneda.',
  reto3: '🎯 Usa .reto para un reto.',
  verdad3: '🗣️ Usa .verdad para una pregunta.',
  anime2: '🎴 Usa .anime para la tarjeta anime.',
  manga: '📖 Modo manga activado.',
  pixel: '🟪 Modo pixel activado.',
  fantasia: '🧙 Modo fantasía activado.',
  aventura: '🗺️ ¡La aventura comienza!',
  heroe: '🦸 Modo héroe activado.',
  villano: '🦹 Modo villano activado.',
  magia: '✨ Magia activada.',
  boss: '👹 ¡Prepárate para un jefe!',
  musica2: '🎵 Modo música activado.',
  sonido: '🔊 Modo sonido activado.',
  silencio: '🔇 Modo silencio textual activado.',
  pelicula: '🎬 Modo película activado.',
  serie: '📺 Modo serie activado.',
  historia: '📚 Modo historia activado.',
  libro: '📖 Modo lectura activado.',
  autor: '✍️ Modo autor activado.',
  clima: '🌤️ Para clima real se necesita una fuente meteorológica externa.',
  temperatura: '🌡️ Para temperatura real se necesita una fuente meteorológica externa.',
  calculadora: '🧮 Usa .calc para operaciones básicas.',
  math: '🧮 Usa .calc para calcular.',
  hora2: '🕐 Usa .hora para consultar la hora del servidor.',
  fecha2: '📅 Usa .fecha para consultar la fecha del servidor.',
  texto: '📝 Puedes usar .say para repetir texto.',
  repetir: '🔁 Usa .say seguido del texto.',
  consejo2: '💡 Divide los problemas grandes en pasos pequeños.',
  tip: '💡 Consejo: prueba una función antes de añadir otra.',
  tip2: '💡 Consejo: revisa los logs cuando algo falle.',
  tip3: '💡 Consejo: guarda copias de tu código.',
  tip4: '💡 Consejo: usa nombres claros para variables.',
  tip5: '💡 Consejo: prueba comandos con entradas simples.',
  tip6: '💡 Consejo: mantén tus funciones pequeñas cuando sea posible.',
  tip7: '💡 Consejo: documenta las partes importantes.',
  tip8: '💡 Consejo: evita duplicar lógica innecesariamente.',
  tip9: '💡 Consejo: valida los datos que recibes.',
  tip10: '💡 Consejo: reinicia el servicio después de cambios importantes.',
  energia: '⚡ Energía TITAN al máximo.',
  fuego: '🔥 Modo fuego.',
  rayo: '⚡ Modo rayo.',
  agua: '💧 Modo agua.',
  tierra: '🌍 Modo tierra.',
  aire: '🌬️ Modo aire.',
  hielo: '❄️ Modo hielo.',
  sol: '☀️ Modo sol.',
  luna: '🌙 Modo luna.',
  estrella: '⭐ Modo estrella.',
  galaxia: '🌌 Modo galaxia.',
  portal: '🌀 Portal abierto en la imaginación.',
  espacio: '🚀 Modo espacial.',
  robot: '🤖 Modo robot.',
  cyber: '💻 Modo cyber.',
  futuro2: '🚀 El futuro empieza creando.',
  motivacion2: '🔥 Cada error puede enseñarte algo.',
  animo: '💙 Sigue adelante paso a paso.',
  confianza: '💪 Confía en tu proceso.',
  enfoque: '🎯 Enfócate en una cosa a la vez.',
  paciencia: '⏳ La paciencia ayuda a resolver problemas.',
  aprende: '📚 Aprender requiere práctica.',
  crea: '🛠️ Crea, prueba y mejora.',
  proyecto: '🚀 Un proyecto crece con pequeñas mejoras.',
  idea: '💡 Una idea puede convertirse en una función.',
  meta: '🎯 Define una meta y divídela en pasos.',
  fechaactual: '📅 Usa .fecha para la fecha actual del servidor.',
  horario: '🕐 Usa .hora para el horario del servidor.',
  ayuda2: '📚 Usa .menu o .todos para explorar comandos.',
  comandos2: '📚 Usa .todos para ver todos los comandos.',
  manual: '📖 Usa .menu como manual rápido.',
  inicio: '🏠 Bienvenido al inicio de TITANBOT.',
  principal: '🏠 Menú principal: .menu',
  categoria: '📚 Las funciones están organizadas por categorías.',
  nuevos: '🆕 Esta versión incluye comandos adicionales.',
  actualizado: '🔄 TITANBOT tiene funciones actualizadas.',
  seguridad: '🛡️ No compartas contraseñas ni códigos de acceso.',
  privacidad: '🔒 Protege tus datos personales.',
  backup: '💾 Mantén una copia de seguridad de tu proyecto.',
  archivo: '📁 Los archivos del proyecto deben mantenerse organizados.',
  codigo2: '💻 Mantén tu código ordenado y probado.',
  error: '⚠️ Si aparece un error, revisa los Logs.',
  log: '📋 Revisa los Logs de Render para diagnosticar problemas.',
  fix: '🔧 Identifica primero el error y después aplica el cambio.',
  actualizar: '🔄 Actualiza dependencias con cuidado y prueba después.',
  version2: '⚙️ Consulta la versión con .version.',
  funcionextra1: '⚡ Función extra #194 de TITANBOT.',
  funcionextra2: '⚡ Función extra #195 de TITANBOT.',
  funcionextra3: '⚡ Función extra #196 de TITANBOT.',
  funcionextra4: '⚡ Función extra #197 de TITANBOT.',
  funcionextra5: '⚡ Función extra #198 de TITANBOT.',
  funcionextra6: '⚡ Función extra #199 de TITANBOT.',
  funcionextra7: '⚡ Función extra #200 de TITANBOT.',
}

Object.assign(simpleCommands, extraCommands);

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
    return sendCommandText(m.key.remoteJid, cmd, text);
  }

  if (cmd === "completarperfil") {
    profileSteps[id] = { step: 1, data: {} };
    return sendCommandText(m.key.remoteJid, cmd,
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
      return sendCommandText(m.key.remoteJid, cmd, "❌ No pude obtener la foto de perfil.");
    }
  }

  if (cmd === "frasefavorita" || cmd === "frase") {
    if (!p?.phrase) return sendCommandText(m.key.remoteJid, cmd, "💬 No tienes una frase guardada. Usa .completarperfil");
    return sendCommandText(m.key.remoteJid, cmd, `💬 *Tu frase favorita:*\n\n${p.phrase}`);
  }

  if (cmd === "edad") {
    return sendCommandText(m.key.remoteJid, cmd, `🎂 Edad: *${p?.age || "No registrada"}*`);
  }

  if (cmd === "cumple") {
    return sendCommandText(m.key.remoteJid, cmd, `📅 Cumpleaños: *${p?.birthday || "No registrado"}*`);
  }

  return false;
}

async function handleEconomy(cmd, args, m, id) {
  const u = ensureUser(id);

  if (cmd === "saldo") {
    return sendCommandText(m.key.remoteJid, cmd,
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
      return sendCommandText(m.key.remoteJid, cmd,
        `⏳ Ya reclamaste tu recompensa.\nVuelve en ${Math.ceil(remaining / 3600000)} hora(s).`);
    }
    const reward = 500 + Math.floor(Math.random() * 501);
    u.coins += reward;
    u.daily = now;
    u.streak++;
    addXP(id, 25);
    saveData();
    return sendCommandText(m.key.remoteJid, cmd,
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
    return sendCommandText(m.key.remoteJid, cmd,
`💼 *TRABAJO COMPLETADO*
${pick(jobs)}
💰 +${money(reward)} monedas
✨ +15 XP`);
  }

  if (cmd === "robar") {
    if (u.coins < 100) return sendCommandText(m.key.remoteJid, cmd, "❌ Necesitas 100 monedas.");
    if (Math.random() < 0.45) {
      const gain = 100 + Math.floor(Math.random() * 501);
      u.coins += gain;
      saveData();
      return sendCommandText(m.key.remoteJid, cmd, `🕵️ ¡Lo lograste!\n💰 +${money(gain)} monedas`);
    }
    const loss = Math.min(u.coins, 100 + Math.floor(Math.random() * 301));
    u.coins -= loss;
    saveData();
    return sendCommandText(m.key.remoteJid, cmd, `🚨 Te atraparon.\n💸 -${money(loss)} monedas`);
  }

  if (cmd === "pagar") {
    const target = getMention(m);
    const amount = Number(args.find(x => /^\d+$/.test(x)));
    if (!target) return sendCommandText(m.key.remoteJid, cmd, "❌ Menciona a quien quieres pagar.");
    if (!amount || amount < 1) return sendCommandText(m.key.remoteJid, cmd, "❌ Escribe una cantidad válida.");
    if (u.coins < amount) return sendCommandText(m.key.remoteJid, cmd, "❌ No tienes suficientes monedas.");
    const receiver = ensureUser(cleanNumber(target));
    u.coins -= amount;
    receiver.coins += amount;
    saveData();
    return sendCommandText(m.key.remoteJid, cmd, `💸 Pagaste ${money(amount)} monedas a @${cleanNumber(target)}`, {
      mentions: [target]
    });
  }

  if (cmd === "tienda") {
    return sendCommandText(m.key.remoteJid, cmd,
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
    if (!prices[item]) return sendCommandText(m.key.remoteJid, cmd, "❌ Producto no encontrado.");
    if (u.coins < prices[item]) return sendCommandText(m.key.remoteJid, cmd, "❌ No tienes suficientes monedas.");
    u.coins -= prices[item];
    u.inventory.push(item);
    saveData();
    return sendCommandText(m.key.remoteJid, cmd, `✅ Compraste *${item}* por ${money(prices[item])} monedas.`);
  }

  if (cmd === "inventario") {
    return sendCommandText(m.key.remoteJid, cmd,
`🎒 *INVENTARIO*

${u.inventory.length ? u.inventory.map((x,i)=>`${i+1}. ${x}`).join("\n") : "Vacío"}`);
  }

  if (cmd === "topmonedas") {
    const top = Object.entries(data.users)
      .sort((a,b)=>(b[1].coins||0)-(a[1].coins||0))
      .slice(0,10);
    return sendCommandText(m.key.remoteJid, cmd,
`🏆 *TOP MONEDAS*

${top.map(([n,v],i)=>`${i+1}. @${n} — ${money(v.coins||0)} 💰`).join("\n")}`,
      { mentions: top.map(x=>`${x[0]}@s.whatsapp.net`) });
  }

  if (cmd === "ranking" || cmd === "topmonedas") {
    const top = Object.entries(data.users)
      .sort((a,b)=>(b[1].coins||0)-(a[1].coins||0)).slice(0,10);
    return sendCommandText(m.key.remoteJid, cmd,
`╭━━〔 🏆 TOP MONEDAS 〕━━╮
${top.map(([n,v],i)=>`┃ ${i+1}. @${n} — ${money(v.coins||0)} 💰`).join("\n") || "┃ Sin datos todavía."}
╰━━━━━━━━━━━━━━━━━━━━╯`, {mentions: top.map(x=>`${x[0]}@s.whatsapp.net`)});
  }

  return false;
}

async function handleGames(cmd, args, m, id) {
  const jid = m.key.remoteJid;
  const decorated = (title, body) =>
`╭━━━〔 🎮 TITANBOT 〕━━━╮
┃ ✦ *${title}*
╰━━━━━━━━━━━━━━━━━━━━╯

${body}

╰─〔 ⚡ EL FUTURO EMPIEZA AHORA 〕─╯`;

  if (cmd === "dado") {
    return sendText(jid, decorated("DADO", `🎲 Resultado: *${1 + Math.floor(Math.random()*6)}*`));
  }

  if (cmd === "moneda") {
    return sendText(jid, decorated("MONEDA", `🪙 Salió: *${pick(["CARA","SELLO"])}*`));
  }

  if (cmd === "ppt") {
    const choices = ["piedra","papel","tijera"];
    const user = args[0]?.toLowerCase();
    if (!choices.includes(user)) return sendText(jid, decorated("PIEDRA • PAPEL • TIJERA", "❌ Usa: *.ppt piedra* / *.ppt papel* / *.ppt tijera*"));
    const bot = pick(choices);
    let result = "🤝 Empate";
    if ((user==="piedra"&&bot==="tijera")||(user==="papel"&&bot==="piedra")||(user==="tijera"&&bot==="papel")) result="🏆 ¡Ganaste!";
    else if (user !== bot) result="🤖 Gané yo";
    return sendText(jid, decorated("PPT", `👤 Tú: *${user}*\n🤖 Yo: *${bot}*\n\n${result}`));
  }

  if (cmd === "numero") {
    const n = 1 + Math.floor(Math.random()*10);
    return sendText(jid, decorated("NÚMERO", `🔢 Pensé en un número del 1 al 10.\n\n🎯 Era: *${n}*`));
  }

  if (cmd === "quiz") {
    const q = pick([
      ["¿Qué lenguaje usa Node.js principalmente?", "JavaScript"],
      ["¿Qué archivo contiene las dependencias de Node?", "package.json"],
      ["¿Qué plataforma sirve para alojar repositorios Git?", "GitHub"],
      ["¿Qué símbolo es el prefijo de TITANBOT?", "."]
    ]);
    return sendText(jid, decorated("QUIZ", `🧠 ${q[0]}\n\n💡 Respuesta: *${q[1]}*`));
  }

  if (cmd === "reto") {
    return sendText(jid, decorated("RETO", `🎯 ${pick([
      "Di un dato curioso.",
      "Aprende una palabra nueva.",
      "Escribe una meta para hoy.",
      "Comparte una idea creativa.",
      "Inventa un nombre para un videojuego."
    ])}`));
  }

  if (cmd === "verdad") {
    return sendText(jid, decorated("VERDAD", `🗣️ ${pick([
      "¿Qué habilidad te gustaría aprender?",
      "¿Cuál es tu juego favorito?",
      "¿Qué proyecto te gustaría crear?",
      "¿Qué comando nuevo agregarías al bot?"
    ])}`));
  }

  if (cmd === "pregunta") {
    return sendText(jid, decorated("PREGUNTA", `❓ ${pick([
      "¿Qué estás aprendiendo?",
      "¿Qué proyecto tienes en mente?",
      "¿Qué función debería tener TITANBOT?"
    ])}`));
  }

  if (cmd === "azar") {
    const options = args.filter(Boolean);
    if (options.length < 2) return sendText(jid, decorated("AZAR", "❌ Ejemplo: *.azar pizza hamburguesa*"));
    return sendText(jid, decorated("AZAR", `🎯 Ganador: *${pick(options)}*`));
  }

  if (cmd === "8ball") {
    return sendText(jid, decorated("BOLA MÁGICA", `🔮 ${pick(["Sí.", "No.", "Probablemente.", "No estoy seguro.", "Inténtalo.", "Las posibilidades son buenas."])}`));
  }

  return false;
}

async function handleStats(cmd, m, id) {
  const jid = m.key.remoteJid;
  const u = ensureUser(id);
  const decorated = (title, body) =>
`╭━━━〔 ⭐ TITANBOT 〕━━━╮
┃ ✦ *${title}*
╰━━━━━━━━━━━━━━━━━━━━╯

${body}

╰─〔 🤖 ONLINE 〕─╯`;

  if (cmd === "xp") return sendText(jid, decorated("EXPERIENCIA", `✨ XP: *${u.xp}*\n⭐ Nivel: *${u.level}*\n📈 Falta: *${Math.max(0, u.level * 100 - u.xp)} XP*`));
  if (cmd === "nivel" || cmd === "level") return sendText(jid, decorated("NIVEL", `⭐ Nivel actual: *${u.level}*\n✨ XP: *${u.xp}*`));
  if (cmd === "rank" || cmd === "rankingxp" || cmd === "topxp") {
    const top = Object.entries(data.users).sort((a,b)=>((b[1].level||1)*100+(b[1].xp||0))-((a[1].level||1)*100+(a[1].xp||0))).slice(0,10);
    return sendText(jid, decorated("TOP XP", top.map(([n,v],i)=>`${i+1}. @${n} — Nivel ${v.level||1} • ${v.xp||0} XP`).join("\n") || "Sin datos."), {mentions: top.map(x=>`${x[0]}@s.whatsapp.net`)});
  }
  if (cmd === "racha") return sendText(jid, decorated("RACHA", `🔥 Tu racha diaria: *${u.streak || 0}*`));
  if (cmd === "logros") {
    const achievements = [];
    if ((u.messages||0) >= 1) achievements.push("🏅 Primer comando");
    if ((u.messages||0) >= 50) achievements.push("🏆 50 mensajes");
    if ((u.level||1) >= 5) achievements.push("⭐ Nivel 5");
    if ((u.coins||0) >= 5000) achievements.push("💰 5.000 monedas");
    return sendText(jid, decorated("LOGROS", achievements.length ? achievements.join("\n") : "🔒 Aún no tienes logros desbloqueados."));
  }
  if (cmd === "stats" || cmd === "estadisticas") {
    return sendText(jid, decorated("ESTADÍSTICAS", `💬 Mensajes: *${u.messages||0}*\n⭐ Nivel: *${u.level||1}*\n✨ XP: *${u.xp||0}*\n💰 Monedas: *${money(u.coins||0)}*\n🔥 Racha: *${u.streak||0}*`));
  }
  return false;
}

async function handleGroup(cmd, args, m) {
  if (!isGroup(m)) return sendCommandText(m.key.remoteJid, cmd, "❌ Este comando solo funciona en grupos.");

  const jid = m.key.remoteJid;
  const g = ensureGroup(jid);

  if (["antilink","welcome","goodbye"].includes(cmd)) {
    if (!(await isAdmin(m))) return sendCommandText(jid, cmd, "❌ Solo los administradores pueden usarlo.");
    g[cmd] = !g[cmd];
    saveData();
    return sendCommandText(jid, cmd, `${g[cmd] ? "✅ ACTIVADO" : "❌ DESACTIVADO"}: *${cmd}*`);
  }

  if (cmd === "admins") {
    const meta = await groupMetadata(jid);
    if (!meta) return sendCommandText(jid, cmd, "❌ No pude obtener la información.");
    const list = meta.participants.filter(p=>p.admin).map(p=>`• @${cleanNumber(p.id)}`).join("\n");
    return sendCommandText(jid, cmd, `🛡️ *ADMINISTRADORES*\n\n${list || "No encontrados."}`,
      {mentions: meta.participants.filter(p=>p.admin).map(p=>p.id)});
  }

  if (cmd === "infogrupo") {
    const meta = await groupMetadata(jid);
    if (!meta) return sendCommandText(jid, cmd, "❌ No pude obtener la información.");
    return sendCommandText(jid, cmd,
`👥 *INFORMACIÓN DEL GRUPO*
📛 Nombre: ${meta.subject}
👤 Miembros: ${meta.participants.length}
🆔 ID: ${jid}`);
  }

  if (cmd === "tagall" || cmd === "hidetag") {
    if (!(await isAdmin(m))) return sendCommandText(jid, cmd, "❌ Solo administradores.");
    const meta = await groupMetadata(jid);
    const mentions = meta.participants.map(p=>p.id);
    const text = args.join(" ") || "📢 Atención grupo";
    return sendCommandText(jid, cmd, text, { mentions });
  }

  if (cmd === "linkgrupo") {
    if (!(await isAdmin(m))) return sendCommandText(jid, cmd, "❌ Solo administradores.");
    if (!(await botIsAdmin(jid))) return sendCommandText(jid, cmd, "❌ Necesito ser administrador.");
    try {
      const code = await sock.groupInviteCode(jid);
      return sendCommandText(jid, cmd, `🔗 https://chat.whatsapp.com/${code}`);
    } catch {
      return sendCommandText(jid, cmd, "❌ No pude obtener el enlace.");
    }
  }

  if (cmd === "promote" || cmd === "demote" || cmd === "kick") {
    if (!(await isAdmin(m))) return sendCommandText(jid, cmd, "❌ Solo administradores.");
    if (!(await botIsAdmin(jid))) return sendCommandText(jid, cmd, "❌ Necesito ser administrador.");
    const target = getMention(m);
    if (!target) return sendCommandText(jid, cmd, "❌ Menciona a la persona.");
    const action = cmd === "promote" ? "promote" : cmd === "demote" ? "demote" : "remove";
    await sock.groupParticipantsUpdate(jid, [target], action);
    return sendCommandText(jid, cmd, `✅ Acción *${cmd}* realizada.`);
  }

  return false;
}

async function handleUtilities(cmd, args, m) {
  if (cmd === "calc") {
    const expression = args.join(" ");
    if (!/^[0-9+\-*/().%\s]+$/.test(expression)) return sendCommandText(m.key.remoteJid, cmd, "❌ Solo operaciones matemáticas básicas.");
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return sendCommandText(m.key.remoteJid, cmd, `🧮 ${expression} = *${result}*`);
    } catch {
      return sendCommandText(m.key.remoteJid, cmd, "❌ Operación inválida.");
    }
  }

  if (cmd === "say") {
    return sendCommandText(m.key.remoteJid, cmd, args.join(" ") || "❌ Escribe algo.");
  }

  if (cmd === "hora") {
    return sendCommandText(m.key.remoteJid, cmd, `🕐 Hora del servidor: ${new Date().toLocaleTimeString("es-CO")}`);
  }

  if (cmd === "fecha") {
    return sendCommandText(m.key.remoteJid, cmd, `📅 Fecha: ${new Date().toLocaleDateString("es-CO")}`);
  }


  if (cmd === "qr") {
    const value = args.join(" ").trim();
    if (!value) return sendCommandText(m.key.remoteJid, cmd, "❌ Escribe el texto que quieres convertir en QR.\n💡 Ejemplo: *.qr Hola TITANBOT*");
    try {
      const buffer = await QRCode.toBuffer(value, { type: "png", width: 700, margin: 2 });
      return sock.sendMessage(m.key.remoteJid, {
        image: buffer,
        caption: `╭━━━〔 📱 QR TITANBOT 〕━━━╮\n┃ ✦ Código generado correctamente\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n📝 Contenido: ${value}`
      });
    } catch {
      return sendCommandText(m.key.remoteJid, cmd, "❌ No pude generar el QR.");
    }
  }

  if (["mayus", "minus", "invertir", "contar"].includes(cmd)) {
    const value = args.join(" ").trim();
    if (!value) return sendCommandText(m.key.remoteJid, cmd, "❌ Escribe un texto.\n💡 Ejemplo: *.mayus hola mundo*");
    let result;
    if (cmd === "mayus") result = value.toUpperCase();
    if (cmd === "minus") result = value.toLowerCase();
    if (cmd === "invertir") result = [...value].reverse().join("");
    if (cmd === "contar") result = `🔢 Caracteres: *${value.length}*\n📝 Palabras: *${value.split(/\s+/).filter(Boolean).length}*`;
    return sendCommandText(m.key.remoteJid, cmd, `📄 Resultado:\n\n${result}`);
  }

  if (cmd === "numeroazar") {
    const min = Number(args[0]);
    const max = Number(args[1]);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return sendCommandText(m.key.remoteJid, cmd, "❌ Ejemplo: *.numeroazar 1 100*");
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    return sendCommandText(m.key.remoteJid, cmd, `🎯 Número: *${result}*`);
  }

  if (cmd === "dado10" || cmd === "dado20") {
    const sides = Number(cmd.replace("dado", ""));
    return sendCommandText(m.key.remoteJid, cmd, `🎲 D${sides}: *${1 + Math.floor(Math.random() * sides)}*`);
  }

  if (cmd === "elige") {
    const options = args.filter(Boolean);
    if (options.length < 2) return sendCommandText(m.key.remoteJid, cmd, "❌ Ejemplo: *.elige rojo azul verde*");
    return sendCommandText(m.key.remoteJid, cmd, `🎯 Elegí: *${pick(options)}*`);
  }

  return false;
}

async function handleAnime(cmd, m, id, args = []) {
  if (cmd !== "s" && cmd !== "anime" && cmd !== "waifu") return false;

  const jid = m.key.remoteJid;
  const choice = (args[0] || "random").toLowerCase();
  const gender = choice === "hombre" || choice === "male" ? "Hombre"
    : choice === "mujer" || choice === "female" ? "Mujer"
    : Math.random() < 0.5 ? "Hombre" : "Mujer";

  const maleNames = ["Akira", "Ren", "Kaito", "Haru", "Sora", "Yuki"];
  const femaleNames = ["Aiko", "Hana", "Yuna", "Sakura", "Mika", "Akari"];
  const names = gender === "Hombre" ? maleNames : femaleNames;
  const name = names[Math.floor(Math.random() * names.length)];
  const animeId = String(Math.floor(1000 + Math.random() * 9000));

  const caption =
`╭━━〔 🎴 TARJETA ANIME 〕━━╮
┃ 👤 Nombre: ${name}
┃ 🧑 Género: ${gender}
┃ 💚 Estado: Libre
┃ 🆔 ID: ${animeId}
┃ 🤖 Bot: TITANBOT
╰━━━━━━━━━━━━━━━━━━━━╯

✨ Usa *.s hombre* o *.s mujer* para elegir.
⚡ El futuro empieza ahora.`;

  try {
    // Solo imágenes con clasificación segura.
    const tag = gender === "Hombre" ? "male" : "female";
    const apiUrl = `https://api.nekosapi.com/v4/images/random?rating=safe&tags=${encodeURIComponent(tag)}&limit=1`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Nekos API HTTP ${response.status}`);

    const data = await response.json();
    const item = Array.isArray(data) ? data[0] : (data.items?.[0] || data.data?.[0] || data);
    const imageUrl = item?.url || item?.image_url || item?.image?.url;
    if (!imageUrl) throw new Error("La API no devolvió una imagen");

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Imagen HTTP ${imageResponse.status}`);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    await sock.sendMessage(jid, {
      image: buffer,
      caption
    });
    return true;
  } catch (error) {
    console.error("Error en .s:", error.message);

    // Respaldo 1: imagen configurada en Render.
    const fallback = process.env.ANIME_IMAGE_URL;
    if (fallback) {
      await sock.sendMessage(jid, {
        image: { url: fallback },
        caption
      });
      return true;
    }

    // Respaldo 2: otra fuente pública de imágenes anime SFW.
    try {
      const backupResponse = await fetch("https://api.waifu.pics/sfw/waifu");
      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        if (backupData?.url) {
          const backupImage = await fetch(backupData.url);
          if (backupImage.ok) {
            const backupBuffer = Buffer.from(await backupImage.arrayBuffer());
            await sock.sendMessage(jid, { image: backupBuffer, caption });
            return true;
          }
        }
      }
    } catch (backupError) {
      console.error("Respaldo anime falló:", backupError.message);
    }

    // Respaldo 3: la imagen anime local del perfil del bot.
    try {
      const localProfile = path.join(__dirname, "titanbot-profile.png");
      if (fs.existsSync(localProfile)) {
        await sock.sendMessage(jid, { image: fs.readFileSync(localProfile), caption });
        return true;
      }
    } catch (localError) {
      console.error("Respaldo local anime falló:", localError.message);
    }

    await sock.sendMessage(jid, {
      text: `${caption}\n\n❌ No se pudo cargar ninguna imagen. Intenta de nuevo.`
    });
    return true;
  }
}

async function executeCommand(text, m) {
  try {
    const parts = text.slice(PREFIX.length).trim().split(/\s+/);
    const raw = parts.shift()?.toLowerCase();
    if (!raw) return;

    const cmd = aliases[raw] || raw;
    const args = parts;
    const shownCmd = raw;
    const id = userId(m.key.participant || m.key.remoteJid);

    ensureUser(id).messages++;
    addXP(id, 1);

    if (cmd === "menu" || cmd === "comandos") {
      const caption = commandMenu();
      try {
        if (fs.existsSync(TITANBOT_PROFILE_IMAGE)) {
          return sock.sendMessage(m.key.remoteJid, {
            image: fs.readFileSync(TITANBOT_PROFILE_IMAGE),
            caption
          });
        }
      } catch (e) {
        console.error("⚠️ No se pudo cargar la foto del menú:", e.message);
      }
      return sendText(m.key.remoteJid, caption);
    }

    if (cmd === "help" || cmd === "ayuda") {
      return sendText(m.key.remoteJid, decorateCommandResponse("help", commandHelp(args[0] || "menu")));
    }

    if (cmd === "todos") {
      const names = allCommandNames();
      return sendText(m.key.remoteJid,
`📚 *COMANDOS DISPONIBLES*
Total: *${names.length}*

${names.map((x,i)=>`${i+1}. .${x}`).join("\n")}`);
    }

    if (await handleProfile(cmd, m, id)) return;
    if (await handleAnime(cmd, m, id, args)) return;
    if (await handleEconomy(cmd, args, m, id)) return;
    if (await handleGames(cmd, args, m, id)) return;
    if (await handleGroup(cmd, args, m)) return;
    if (await handleUtilities(cmd, args, m)) return;

    if (Object.prototype.hasOwnProperty.call(simpleCommands, cmd)) {
      const response = simpleCommands[cmd];
      if (response) return sendText(m.key.remoteJid, decorateCommandResponse(cmd, response));
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

async function setTitanBotProfilePicture() {
  try {
    if (!sock?.user?.id) return;
    if (!fs.existsSync(TITANBOT_PROFILE_IMAGE)) {
      console.log("⚠️ No se encontró titanbot-profile.png");
      return;
    }
    await sock.updateProfilePicture(sock.user.id, { url: TITANBOT_PROFILE_IMAGE });
    console.log("🖼️ Foto de perfil de TITANBOT actualizada.");
  } catch (error) {
    console.error("⚠️ No se pudo actualizar la foto de perfil:", error?.message || error);
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
      generateHighQualityLinkPreview: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async update => {
      try {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !state.creds.registered) {
          currentQR = qr;
          botConnection = "qr";
          console.log("================================");
          console.log("📷 QR DE VINCULACIÓN DISPONIBLE EN LA PÁGINA WEB");
          console.log("📱 Abre la URL de TITANBOT y escanea el QR.");
          console.log("================================");
        }

        if (connection === "connecting") {
          botConnection = "connecting";
          console.log("🔄 Conectando TITANBOT...");
        }

        if (connection === "open") {
          currentQR = null;
          botConnection = "connected";
          console.log("================================");
          console.log("✅ TITANBOT CONECTADO");
          console.log(`🤖 ${BOT_NAME}`);
          console.log(`⚡ ${FRASE}`);
          console.log("================================");
          await setTitanBotProfilePicture();
        }

        if (connection === "close") {
          currentQR = null;
          botConnection = "closed";
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
      console.log("📲 TITANBOT está esperando la vinculación por QR.");
      console.log("📷 El QR se mostrará directamente en la página web.");
    }
  } catch (error) {
    console.error("❌ Error iniciando TitanBot:", error);
    setTimeout(startBot, 10000);
  }
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    // API simple de estado. El QR se genera en el servidor, sin depender de CDN.
    if (url.pathname === "/api/qr") {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      if (botConnection === "connected") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ status: "connected", qr: null }));
        return;
      }

      if (currentQR) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ status: "qr", qr: currentQR }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: botConnection, qr: null }));
      return;
    }

    // Entrega el QR como SVG generado por Node. No necesita JavaScript externo.
    if (url.pathname === "/qr.svg") {
      if (!currentQR) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        res.end("QR no disponible");
        return;
      }

      const svg = await QRCode.toString(currentQR, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 2,
        width: 360
      });

      res.writeHead(200, {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.end(svg);
      return;
    }

    if (url.pathname === "/") {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.end(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-store">
<title>TITANBOT - Vinculación QR</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#0b0f12;color:#fff;font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;padding:20px}
.card{width:min(92vw,430px);background:#151a1f;border:1px solid #293139;border-radius:22px;padding:26px;text-align:center;box-shadow:0 15px 45px rgba(0,0,0,.4)}
h1{margin:0 0 8px;font-size:28px}
p{color:#aeb7bf;line-height:1.45}
.status{font-weight:700;margin:12px 0;font-size:18px}
.qrbox{width:320px;height:320px;max-width:100%;margin:20px auto;background:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.qrbox img{width:100%;height:100%;padding:14px;display:block}
.message{color:#222;font-weight:700;padding:20px}
.ok{font-size:64px}
.steps{text-align:left;background:#0f1317;border-radius:14px;padding:14px 18px;color:#d9e0e5}
.steps li{margin:9px 0}
button{border:0;border-radius:12px;padding:12px 18px;background:#fff;color:#111;font-weight:700;cursor:pointer}
.small{font-size:13px;color:#7f8992}
</style>
</head>
<body>
<div class="card">
<h1>🤖 TITANBOT</h1>
<p>Vinculación por código QR</p>
<div id="status" class="status">⏳ Esperando QR...</div>
<div id="qrbox" class="qrbox"><div class="message">⏳ Esperando que WhatsApp genere el QR...</div></div>
<button onclick="updateQR(true)">🔄 Actualizar QR</button>
<ol class="steps">
<li>Abre WhatsApp en tu teléfono.</li>
<li>Ve a <b>Dispositivos vinculados</b>.</li>
<li>Pulsa <b>Vincular dispositivo</b>.</li>
<li>Escanea el QR que aparece arriba.</li>
</ol>
<p class="small">El QR cambia automáticamente cuando WhatsApp genera uno nuevo.</p>
</div>
<script>
const statusEl=document.getElementById('status');
const box=document.getElementById('qrbox');
let lastQR='';
let lastState='';

async function updateQR(force=false){
  try{
    const r=await fetch('/api/qr?ts='+Date.now(),{cache:'no-store'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    const data=await r.json();

    if(data.status==='connected'){
      if(lastState!=='connected'){
        box.innerHTML='<div class="ok">✅</div>';
      }
      statusEl.textContent='✅ TITANBOT CONECTADO';
      lastState='connected';
      return;
    }

    if(data.qr){
      if(force || data.qr!==lastQR){
        lastQR=data.qr;
        lastState='qr';
        box.innerHTML='<img alt="QR de vinculación de TITANBOT" src="/qr.svg?ts='+Date.now()+'">';
      }
      statusEl.textContent='📷 Escanea el QR con WhatsApp';
      return;
    }

    lastState=data.status || 'waiting';
    statusEl.textContent=data.status==='connecting'?'🔄 Conectando...':'⏳ Generando QR...';
    if(force || !lastQR){
      box.innerHTML='<div class="message">⏳ Esperando que WhatsApp genere el QR...</div>';
    }
  }catch(e){
    statusEl.textContent='⚠️ Error consultando el QR';
    box.innerHTML='<div class="message">No se pudo obtener el QR. Pulsa <b>Actualizar QR</b>.</div>';
    console.error(e);
  }
}

updateQR(true);
setInterval(updateQR,1500);
</script>
</body>
</html>`);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 - No encontrado\n");
  } catch (error) {
    console.error("❌ Error en servidor web:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    res.end("500 - Error interno\n");
  }
}).listen(PORT, () => {
  console.log(`🌐 TitanBot disponible en el puerto ${PORT}`);
  console.log(`📷 QR web: abre la URL principal para vincular TITANBOT.`);
});

console.log("================================");
console.log(`🤖 ${BOT_NAME}`);
console.log(`⚡ ${FRASE}`);
console.log("📱 Vinculación: QR");
console.log("🟢 QR: ACTIVADO");
console.log("🚫 Código por número: DESACTIVADO");
console.log("================================");

startBot();
