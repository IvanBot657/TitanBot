const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "database");
const DB_FILE = path.join(DB_DIR, "groups.json");

const comandos = new Set([
  "bienvenida",
  "despedida",
  "textobienvenida",
  "textodespedida"
]);

const TEXTO_BIENVENIDA =
  "🎉 *¡BIENVENIDO/A A {grupo}!*\n\n" +
  "👤 Nos alegra mucho recibirte, {nombre}. Desde ahora formas parte de esta comunidad.\n\n" +
  "✨ Esperamos que disfrutes tu estadía, participes, conozcas a los demás integrantes y compartas buenos momentos.\n\n" +
  "📜 Recuerda respetar a todos, evitar el spam y cumplir las reglas del grupo.\n\n" +
  "🤝 Si tienes alguna duda, puedes consultar con los administradores.\n\n" +
  "⚡ ¡Que comience la diversión!\n\n" +
  "🤖 *TITANBOT*";

const TEXTO_DESPEDIDA =
  "👋 *Hasta pronto, {nombre}.*\n\n" +
  "Esperamos verte nuevamente. ⚡";

function asegurarDB() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}", "utf8");
}

function cargarDB() {
  asegurarDB();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function guardarDB(db) {
  asegurarDB();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function obtenerGrupo(db, chat) {
  if (!db[chat] || typeof db[chat] !== "object") {
    db[chat] = {
      bienvenida: false,
      despedida: false,
      reglas: "No hay reglas configuradas."
    };
  }
  if (typeof db[chat].bienvenida !== "boolean") db[chat].bienvenida = false;
  if (typeof db[chat].despedida !== "boolean") db[chat].despedida = false;
  return db[chat];
}

function reemplazarPlantillas(texto, nombre, grupo) {
  return String(texto || "")
    .replace(/\{nombre\}/gi, nombre)
    .replace(/\{grupo\}/gi, grupo);
}

async function enviarConFoto(sock, chat, participante, nombre, texto, despedida = false) {
  const mensaje = reemplazarPlantillas(texto, nombre, "este grupo");
  const menciones = participante ? [participante] : [];
  let foto = null;

  try {
    const url = await sock.profilePictureUrl(participante, "image");
    if (url) {
      const respuesta = await fetch(url);
      if (respuesta.ok) foto = Buffer.from(await respuesta.arrayBuffer());
    }
  } catch (error) {
    console.log("⚠️ No se pudo obtener la foto de perfil:", error?.message || error);
  }

  if (foto) {
    await sock.sendMessage(chat, {
      image: foto,
      caption: mensaje,
      mentions: menciones
    });
  } else {
    await sock.sendMessage(chat, {
      text: mensaje,
      mentions: menciones
    });
  }
}

async function ejecutar(sock, chat, comando, args, id, esGrupo, esAdmin, msg) {
  if (!esGrupo) {
    await sock.sendMessage(chat, { text: "❌ Este comando solo funciona en grupos." }, { quoted: msg });
    return true;
  }
  if (!esAdmin) {
    await sock.sendMessage(chat, { text: "⛔ Solo los administradores del grupo pueden configurar bienvenida y despedida." }, { quoted: msg });
    return true;
  }

  const db = cargarDB();
  const grupo = obtenerGrupo(db, chat);
  const accion = (args[0] || "ayuda").toLowerCase();

  if (comando === "bienvenida" || comando === "despedida") {
    if (!["on", "off", "estado", "ayuda"].includes(accion)) {
      await sock.sendMessage(chat, {
        text: `Uso:\n.${comando} on\n.${comando} off\n.${comando} estado`
      }, { quoted: msg });
      return true;
    }
    if (accion === "on" || accion === "off") {
      grupo[comando] = accion === "on";
      guardarDB(db);
      await sock.sendMessage(chat, {
        text: `${accion === "on" ? "✅ Activado" : "🔕 Desactivado"}: *${comando}* para este grupo.`
      }, { quoted: msg });
      return true;
    }
    await sock.sendMessage(chat, {
      text: `⚙️ *CONFIGURACIÓN ${comando.toUpperCase()}*\n\nEstado: ${grupo[comando] ? "🟢 Activada" : "🔴 Desactivada"}`
    }, { quoted: msg });
    return true;
  }

  const campo = comando === "textobienvenida" ? "textoBienvenida" : "textoDespedida";
  const predeterminado = comando === "textobienvenida" ? TEXTO_BIENVENIDA : TEXTO_DESPEDIDA;
  const nuevoTexto = args.join(" ").trim();
  if (nuevoTexto) {
    grupo[campo] = nuevoTexto;
    guardarDB(db);
    await sock.sendMessage(chat, {
      text: `✅ Texto de ${comando === "textobienvenida" ? "bienvenida" : "despedida"} actualizado.\n\nVariables disponibles: {nombre} y {grupo}.`
    }, { quoted: msg });
  } else {
    const actual = grupo[campo] || predeterminado;
    await sock.sendMessage(chat, {
      text: `📝 *TEXTO ACTUAL*\n\n${actual}\n\nPara cambiarlo, escribe:\n.${comando} tu nuevo mensaje\n\nVariables: {nombre} y {grupo}.`
    }, { quoted: msg });
  }
  return true;
}

async function procesarEvento(sock, update) {
  const chat = update?.id;
  const accion = update?.action;
  if (!chat || !chat.endsWith("@g.us")) return;
  if (accion !== "add" && accion !== "remove") return;

  const db = cargarDB();
  const grupo = obtenerGrupo(db, chat);
  guardarDB(db);

  const activar = accion === "add" ? grupo.bienvenida : grupo.despedida;
  if (!activar) return;

  let nombreGrupo = "el grupo";
  try {
    const metadata = await sock.groupMetadata(chat);
    nombreGrupo = metadata?.subject || nombreGrupo;
  } catch {}

  for (const datoParticipante of update.participants || []) {
    // Baileys puede entregar el participante como JID (string) o como objeto.
    let participante = typeof datoParticipante === "string"
      ? datoParticipante
      : datoParticipante?.id || datoParticipante?.jid || datoParticipante?.participant || datoParticipante?.phoneNumber;

    if (typeof participante !== "string" || !participante.trim()) continue;
    participante = participante.trim();
    if (/^\d+$/.test(participante)) participante += "@s.whatsapp.net";

    let nombre = participante.split("@")[0];
    try {
      if (typeof sock.getName === "function") {
        nombre = (await sock.getName(participante)) || nombre;
      }
    } catch {}

    const texto = accion === "add"
      ? (grupo.textoBienvenida || TEXTO_BIENVENIDA).replace(/\{grupo\}/gi, nombreGrupo)
      : (grupo.textoDespedida || TEXTO_DESPEDIDA).replace(/\{grupo\}/gi, nombreGrupo);

    await enviarConFoto(sock, chat, participante, nombre, texto, accion === "remove");
  }
}

module.exports = { comandos, ejecutar, procesarEvento };
