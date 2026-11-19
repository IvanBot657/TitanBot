"use strict";

// TITANBOT - Adivina Musical
// Solo reproduce archivos cuya ficha de Internet Archive declara una licencia
// de dominio público o Creative Commons Attribution 4.0.
const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const { URL } = require("url");
const ffmpegPath = require("ffmpeg-static");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

const DB_DIR = path.join(__dirname, "..", "database");
const DB_PATH = path.join(DB_DIR, "users.json");
const DURACION_FRAGMENTO = 12;
const PREMIO = 250;
const MAX_BYTES = 35 * 1024 * 1024;
const sesiones = new Map();
const comandos = new Set(["adivina", "responder", "cancelaradivina"]);
const LICENCIAS_PERMITIDAS = new Set([
  "https://creativecommons.org/publicdomain/mark/1.0/",
  "https://creativecommons.org/licenses/by/4.0/",
  "http://creativecommons.org/publicdomain/mark/1.0/",
  "http://creativecommons.org/licenses/by/4.0/"
]);

function getJson(url, timeout = 18000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "TITANBOT-Adivina/1.0" } }, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error("Respuesta JSON inválida")); }
      });
    });
    req.setTimeout(timeout, () => req.destroy(new Error("Tiempo de espera agotado")));
    req.on("error", reject);
  });
}

function descargar(url, destino) {
  return new Promise((resolve, reject) => {
    const salida = fs.createWriteStream(destino);
    const req = https.get(url, { headers: { "User-Agent": "TITANBOT-Adivina/1.0" } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        salida.close(); fs.unlink(destino, () => {});
        return descargar(new URL(res.headers.location, url).toString(), destino).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        salida.close(); fs.unlink(destino, () => {});
        return reject(new Error(`Descarga HTTP ${res.statusCode}`));
      }
      const length = Number(res.headers["content-length"] || 0);
      if (length > MAX_BYTES) {
        req.destroy(new Error("Archivo demasiado grande"));
        salida.close(); fs.unlink(destino, () => {});
        return reject(new Error("Archivo demasiado grande"));
      }
      let total = 0;
      res.on("data", chunk => {
        total += chunk.length;
        if (total > MAX_BYTES) req.destroy(new Error("Archivo demasiado grande"));
      });
      res.pipe(salida);
      salida.on("finish", () => salida.close(resolve));
      salida.on("error", reject);
    });
    req.setTimeout(30000, () => req.destroy(new Error("Tiempo de descarga agotado")));
    req.on("error", err => { salida.destroy(); fs.unlink(destino, () => {}); reject(err); });
  });
}

function normalizar(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function cargarUsuarios() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "{}", "utf8");
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8") || "{}"); }
  catch (e) { console.error("[ADIVINA] Error leyendo users.json:", e); return null; }
}
function guardarUsuarios(db) {
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

async function buscarPista() {
  // Buscar grabaciones con licencias abiertas y verificar la licencia
  // nuevamente contra los metadatos oficiales de cada elemento.
  const q = 'mediatype:audio AND (licenseurl:"https://creativecommons.org/publicdomain/mark/1.0/" OR licenseurl:"https://creativecommons.org/licenses/by/4.0/" OR licenseurl:"http://creativecommons.org/publicdomain/mark/1.0/" OR licenseurl:"http://creativecommons.org/licenses/by/4.0/")';
  const searchUrl = new URL("https://archive.org/advancedsearch.php");
  searchUrl.searchParams.set("q", q);
  searchUrl.searchParams.set("fl[]", "identifier,title,creator,licenseurl");
  searchUrl.searchParams.append("fl[]", "year");
  searchUrl.searchParams.set("rows", "100");
  searchUrl.searchParams.set("page", "1");
  searchUrl.searchParams.set("output", "json");

  const data = await getJson(searchUrl.toString());
  const docs = data?.response?.docs || [];
  // No exigir licenseurl en el resultado de búsqueda: a veces el índice
  // omite ese campo aunque los metadatos del elemento sí lo incluyan.
  const candidatos = docs.filter(x => x.identifier);
  if (!candidatos.length) {
    throw new Error("Internet Archive no devolvió grabaciones para la búsqueda.");
  }

  const formatosAudio = /\.(mp3|ogg|oga|wav|flac|m4a|aac|opus|webm|mp4|aiff|wma)$/i;
  const ordenados = candidatos.sort(() => Math.random() - 0.5);
  let ultimoMotivo = "No se encontraron archivos de audio compatibles y con licencia permitida.";

  // Revisar más resultados y continuar si un elemento está incompleto.
  for (const elegido of ordenados.slice(0, 60)) {
    let meta;
    try {
      meta = await getJson(`https://archive.org/metadata/${encodeURIComponent(elegido.identifier)}`);
    } catch (error) {
      ultimoMotivo = `No pude leer los metadatos de ${elegido.identifier}: ${error.message}`;
      continue;
    }

    const metadata = meta?.metadata || {};
    const license = String(metadata.licenseurl || elegido.licenseurl || "").trim();
    if (!LICENCIAS_PERMITIDAS.has(license)) continue;

    const files = (meta?.files || []).filter(f => {
      const name = String(f.name || "");
      const size = Number(f.size || 0);
      return formatosAudio.test(name) && size > 0 && size <= MAX_BYTES &&
        !name.includes("__ia_thumb") && !name.includes("_spectrogram");
    });
    if (!files.length) {
      ultimoMotivo = `El elemento ${elegido.identifier} no contiene un archivo de audio compatible dentro del límite.`;
      continue;
    }

    // Preferir MP3/OGG/WAV; FFmpeg también puede convertir los otros formatos.
    files.sort((a, b) => {
      const rank = name => /\.(mp3|ogg|oga|wav)$/i.test(name) ? 0 : 1;
      return rank(a.name) - rank(b.name) || Number(a.size || 0) - Number(b.size || 0);
    });
    const audio = files[0];
    const title = Array.isArray(metadata.title) ? metadata.title[0] : (metadata.title || elegido.title || "Grabación sin título");
    const creator = Array.isArray(metadata.creator) ? metadata.creator.join(", ") : (metadata.creator || elegido.creator || "Autor no indicado");

    return {
      identifier: elegido.identifier,
      title: String(title),
      creator: String(creator),
      license,
      source: `https://archive.org/details/${encodeURIComponent(elegido.identifier)}`,
      fileUrl: `https://archive.org/download/${encodeURIComponent(elegido.identifier)}/${String(audio.name).split("/").map(encodeURIComponent).join("/")}`
    };
  }

  throw new Error(ultimoMotivo);
}

async function prepararFragmento(pista) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "titan-adivina-"));
  const ext = path.extname(new URL(pista.fileUrl).pathname) || ".audio";
  const original = path.join(dir, `original${ext}`);
  const salida = path.join(dir, "fragmento.mp3");
  try {
    await descargar(pista.fileUrl, original);
    const probe = await execFileAsync(ffmpegPath, ["-i", original, "-f", "null", "-"], { maxBuffer: 1024 * 1024 }).catch(e => e);
    const stderr = String(probe.stderr || "");
    const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (!durationMatch) throw new Error("No pude leer la duración del audio.");
    const duracion = Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3]);
    if (!Number.isFinite(duracion) || duracion < 3) throw new Error("El audio es demasiado corto.");
    const maxStart = Math.max(0, duracion - DURACION_FRAGMENTO - 1);
    const inicio = Math.floor(Math.random() * (maxStart + 1));
    await execFileAsync(ffmpegPath, ["-ss", String(inicio), "-i", original, "-t", String(DURACION_FRAGMENTO), "-vn", "-ac", "2", "-b:a", "96k", "-f", "mp3", salida], { timeout: 45000, maxBuffer: 2 * 1024 * 1024 });
    const buffer = fs.readFileSync(salida);
    if (!buffer.length) throw new Error("El fragmento quedó vacío.");
    return { dir, buffer };
  } catch (e) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw e;
  }
}

async function manejar({ sock, chat, comando, args = [], id, msg }) {
  if (!comandos.has(comando)) return false;
  if (!id) return sock.sendMessage(chat, { text: "❌ No pude identificar quién está jugando." }, { quoted: msg });

  if (comando === "adivina") {
    if (sesiones.has(chat)) return sock.sendMessage(chat, { text: "🎵 Ya hay una ronda activa en este chat. Usa .responder o .cancelaradivina." }, { quoted: msg });
    await sock.sendMessage(chat, { text: "🎧 Buscando una grabación con licencia abierta y preparando un fragmento..." }, { quoted: msg });
    let pista, preparado;
    try {
      pista = await buscarPista();
      preparado = await prepararFragmento(pista);
    } catch (error) {
      console.error("[ADIVINA]", error);
      return sock.sendMessage(chat, { text: "⚠️ No pude preparar el audio ahora. Inténtalo más tarde. No se descontaron ni entregaron TitanCoins." }, { quoted: msg });
    }
    sesiones.set(chat, { pista, respuesta: normalizar(pista.title), dir: preparado.dir, usuarioInicio: id, creada: Date.now() });
    try {
      await sock.sendMessage(chat, {
        audio: preparado.buffer,
        mimetype: "audio/mpeg",
        fileName: "titanbot-pista.mp3",
        ptt: false,
        caption: `🎵 *ADIVINA MUSICAL — TITANBOT*\n\n🔎 Escucha el fragmento y adivina el título.\n💰 Premio: ${PREMIO} TitanCoins\n\nResponde: *.responder título*\nCancela: *.cancelaradivina*\n\nFuente y licencia se revelan al terminar la ronda.`
      }, { quoted: msg });
      const sesion = sesiones.get(chat);
      sesion.timer = setTimeout(() => {
        if (sesiones.get(chat) === sesion) {
          sesiones.delete(chat);
          fs.rmSync(sesion.dir, { recursive: true, force: true });
          sock.sendMessage(chat, { text: `⏰ Se acabó el tiempo. La respuesta era *${pista.title}*.\n👤 Autor: ${pista.creator}\n📜 Licencia: ${pista.license}\n🔗 ${pista.source}` }).catch(() => {});
        }
      }, 90000);
    } catch (error) {
      sesiones.delete(chat); fs.rmSync(preparado.dir, { recursive: true, force: true });
      throw error;
    }
    return true;
  }

  if (comando === "responder") {
    const sesion = sesiones.get(chat);
    if (!sesion) return sock.sendMessage(chat, { text: "🎵 No hay una ronda activa. Escribe .adivina para comenzar." }, { quoted: msg });
    const respuesta = normalizar(args.join(" "));
    if (!respuesta) return sock.sendMessage(chat, { text: "✍️ Escribe tu respuesta. Ejemplo: .responder nombre de la canción" }, { quoted: msg });
    const titulo = normalizar(sesion.pista.title);
    const acierta = respuesta === titulo || (respuesta.length >= 5 && titulo.includes(respuesta)) || (titulo.length >= 5 && respuesta.includes(titulo));
    if (!acierta) return sock.sendMessage(chat, { text: "❌ Esa no es. ¡Puedes intentarlo otra vez!" }, { quoted: msg });

    clearTimeout(sesion.timer); sesiones.delete(chat);
    const db = cargarUsuarios();
    if (!db) { fs.rmSync(sesion.dir, { recursive: true, force: true }); return sock.sendMessage(chat, { text: "⚠️ No pude actualizar la economía. Avisa al administrador." }, { quoted: msg }); }
    if (!db[id] || typeof db[id] !== "object") db[id] = { nombre: "Usuario", dinero: 500, banco: 0, inventario: {} };
    if (typeof db[id].dinero !== "number") db[id].dinero = 500;
    db[id].dinero += PREMIO;
    guardarUsuarios(db);
    fs.rmSync(sesion.dir, { recursive: true, force: true });
    return sock.sendMessage(chat, {
      text: `🏆 *¡RESPUESTA CORRECTA!*\n\n🎵 Canción: *${sesion.pista.title}*\n👤 Autor: ${sesion.pista.creator}\n💰 Premio: +${PREMIO} TitanCoins\n💵 Saldo: ${db[id].dinero} TitanCoins\n\n📜 Licencia: ${sesion.pista.license}\n🔗 Fuente: ${sesion.pista.source}\n\n⚡ TITANBOT`,
      mentions: [id]
    }, { quoted: msg });
  }

  if (comando === "cancelaradivina") {
    const sesion = sesiones.get(chat);
    if (!sesion) return sock.sendMessage(chat, { text: "ℹ️ No hay ninguna ronda activa." }, { quoted: msg });
    clearTimeout(sesion.timer); sesiones.delete(chat);
    fs.rmSync(sesion.dir, { recursive: true, force: true });
    return sock.sendMessage(chat, { text: `🛑 Ronda cancelada.\n🎵 La respuesta era: *${sesion.pista.title}*\n📜 Licencia: ${sesion.pista.license}\n🔗 ${sesion.pista.source}` }, { quoted: msg });
  }
  return false;
}

module.exports = { comandos, manejar };
