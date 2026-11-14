// commands/anime.js
// TITANBOT - Sistema Anime con Tenrai API (sin Jikan)
// Mantiene la firma usada por index.js: anime(sock, chat, comando, args, id, msg)

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TENRAI_API = 'https://api.tenrai.org/v1';
const DATA_DIR = path.join(__dirname, '..', 'database');
const DATA_FILE = path.join(DATA_DIR, 'anime_reclamados.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

const personajesAnime = [
  { id: 1, nombre: 'Goku', anime: 'Dragon Ball', frase: '¡Superaré mis límites!' },
  { id: 2, nombre: 'Naruto Uzumaki', anime: 'Naruto', frase: '¡Nunca me rindo!' },
  { id: 3, nombre: 'Monkey D. Luffy', anime: 'One Piece', frase: '¡Seré el Rey de los Piratas!' },
  { id: 4, nombre: 'Ichigo Kurosaki', anime: 'Bleach', frase: '¡Protegeré a todos!' },
  { id: 5, nombre: 'Satoru Gojo', anime: 'Jujutsu Kaisen', frase: 'A lo largo del cielo y la tierra, solo yo soy el honrado.' },
  { id: 6, nombre: 'Levi Ackerman', anime: 'Shingeki no Kyojin', frase: 'Decide. Confía en ti mismo.' },
  { id: 7, nombre: 'Tanjiro Kamado', anime: 'Demon Slayer', frase: 'Nunca te rindas.' },
  { id: 8, nombre: 'Eren Yeager', anime: 'Shingeki no Kyojin', frase: '¡Lucharé hasta el final!' },
  { id: 9, nombre: 'Light Yagami', anime: 'Death Note', frase: 'Yo seré el dios de este nuevo mundo.' },
  { id: 10, nombre: 'Edward Elric', anime: 'Fullmetal Alchemist', frase: '¡Un intercambio equivalente!' },
  { id: 11, nombre: 'Killua Zoldyck', anime: 'Hunter x Hunter', frase: 'No quiero perder a mis amigos.' },
  { id: 12, nombre: 'Izuku Midoriya', anime: 'My Hero Academia', frase: '¡Yo también puedo ser un héroe!' }
];

let ultimaPeticion = 0;
let cola = Promise.resolve();

function cargarReclamados() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}', 'utf8');
    const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.error('Error leyendo anime_reclamados.json:', error.message);
    return {};
  }
}

function guardarReclamados(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error guardando personajes Anime:', error.message);
    return false;
  }
}

function limpiarId(value) {
  return String(value || 'desconocido').replace(/@s\.whatsapp\.net|@lid|@g\.us/g, '');
}

function obtenerUsuarioId(msg, id) {
  return limpiarId(id || msg?.key?.participant || msg?.participant || msg?.sender || msg?.key?.remoteJid);
}

function escapar(texto) {
  return String(texto ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function textoPlano(texto, max = 900) {
  return String(texto || 'N/A').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/[\r\t]+/g, ' ').trim().slice(0, max) || 'N/A';
}

async function tenraiGet(endpoint) {
  const ejecutar = async () => {
    const espera = Math.max(0, 310 - (Date.now() - ultimaPeticion));
    if (espera) await new Promise(resolve => setTimeout(resolve, espera));
    ultimaPeticion = Date.now();
    const url = `${TENRAI_API}${endpoint}${endpoint.includes('?') ? '&' : '?'}sfw-strict`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'TITANBOT/1.0' },
      signal: AbortSignal.timeout(20000)
    });
    if (response.status === 429) {
      const retry = response.headers.get('Retry-After') || '60';
      throw new Error(`Tenrai limitó las consultas. Espera ${retry} segundos.`);
    }
    let body;
    try { body = await response.json(); }
    catch { throw new Error(`Tenrai devolvió una respuesta inválida (HTTP ${response.status}).`); }
    if (!response.ok) throw new Error(body?.message || body?.error || `Tenrai respondió HTTP ${response.status}.`);
    return body;
  };
  const actual = cola.then(ejecutar, ejecutar);
  cola = actual.catch(() => {});
  return actual;
}

function getData(body) {
  if (Array.isArray(body?.data)) return body.data;
  if (body?.data && typeof body.data === 'object') return body.data;
  return body;
}

async function buscarAnime(nombre, limite = 1) {
  const body = await tenraiGet(`/anime?q=${encodeURIComponent(nombre)}&limit=${limite}`);
  const data = getData(body);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

async function buscarManga(nombre, limite = 1) {
  const body = await tenraiGet(`/manga?q=${encodeURIComponent(nombre)}&limit=${limite}`);
  const data = getData(body);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

async function buscarPersonaje(nombre) {
  const body = await tenraiGet(`/characters?q=${encodeURIComponent(nombre)}&limit=1`);
  const data = getData(body);
  return Array.isArray(data) ? data[0] || null : data || null;
}

function imagenPersonaje(personaje) {
  return personaje?.images?.webp?.image_url || personaje?.images?.jpg?.image_url || personaje?.image?.large || personaje?.image?.medium || null;
}

async function descargarImagen(url) {
  if (!url || !/^https:\/\//i.test(url)) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length ? buffer : null;
  } catch (error) {
    console.error('Error descargando imagen:', error.message);
    return null;
  }
}

async function crearTarjeta(personaje, usuarioId, estado = 'RECLAMADO') {
  const width = 1000, height = 1350;
  const imageBuffer = await descargarImagen(personaje.image);
  let imageMarkup = `<rect x="150" y="120" width="700" height="650" rx="35" fill="#252525"/><text x="500" y="455" text-anchor="middle" fill="white" font-size="42">IMAGEN NO DISPONIBLE</text>`;
  if (imageBuffer) {
    try {
      const processed = await sharp(imageBuffer).resize(700, 650, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
      imageMarkup = `<image href="data:image/jpeg;base64,${processed.toString('base64')}" x="150" y="120" width="700" height="650" preserveAspectRatio="xMidYMid slice"/>`;
    } catch (error) { console.error('Error procesando imagen:', error.message); }
  }
  const name = escapar(personaje.nombre), animeName = escapar(personaje.anime), phrase = escapar(personaje.frase);
  const uid = escapar(usuarioId);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#101827"/><stop offset="55%" stop-color="#172b3b"/><stop offset="100%" stop-color="#080d16"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#bg)"/><rect x="45" y="45" width="910" height="1260" rx="48" fill="none" stroke="#39d5ff" stroke-width="5" opacity=".8"/>
    <text x="500" y="95" text-anchor="middle" font-size="42" font-weight="bold" fill="white">TITANBOT</text><text x="500" y="145" text-anchor="middle" font-size="28" fill="#9deaff">PERSONAJE ANIME</text>
    ${imageMarkup}<text x="500" y="850" text-anchor="middle" font-size="48" font-weight="bold" fill="white">${name}</text>
    <text x="500" y="905" text-anchor="middle" font-size="30" fill="#b9d8e5">${animeName}</text><line x1="200" y1="950" x2="800" y2="950" stroke="#39d5ff" opacity=".7"/>
    <text x="500" y="1020" text-anchor="middle" font-size="26" fill="white">“${phrase}”</text><text x="500" y="1110" text-anchor="middle" font-size="32" font-weight="bold" fill="#39d5ff">${escapar(estado)}</text>
    <text x="500" y="1190" text-anchor="middle" font-size="25" fill="#c9d6df">Usuario: ${uid}</text><text x="500" y="1250" text-anchor="middle" font-size="20" fill="#91a7b5">Datos e imágenes consultados mediante Tenrai API</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

function estadoEspanol(status) {
  const map = { Finished: 'FINALIZADO', 'Currently Airing': 'EN EMISIÓN', 'Not yet aired': 'NO ESTRENADO', Finished: 'FINALIZADO', RELEASING: 'EN EMISIÓN', FINISHED: 'FINALIZADO', NOT_YET_RELEASED: 'NO ESTRENADO', CANCELLED: 'CANCELADO' };
  return map[status] || status || 'N/A';
}

async function enviarImagenOTexto(sock, chat, buffer, text, msg) {
  if (buffer) return sock.sendMessage(chat, { image: buffer, caption: text }, msg ? { quoted: msg } : {});
  return sock.sendMessage(chat, { text }, msg ? { quoted: msg } : {});
}

async function anime(sock, chat, comando, args = [], id, msg) {
  try {
    comando = String(comando || '').toLowerCase().replace(/^\./, '').trim();
    args = Array.isArray(args) ? args : String(args || '').split(/\s+/).filter(Boolean);
    const usuarioId = obtenerUsuarioId(msg, id);
    const quoted = msg ? { quoted: msg } : {};

    if (comando === 'anime' && args.length === 0 || comando === 'animemenu') {
      await sock.sendMessage(chat, { text:
        '🎴 *MENÚ ANIME - TITANBOT*\n\n' +
        '🎲 *.reclamar* → Reclamar personaje\n📋 *.mispersonajes* → Tus personajes\n👥 *.personajes* → Disponibles\n♻️ *.liberar* → Liberar personaje\n' +
        '🔎 *.animebuscar nombre* → Buscar anime\n🎬 *.anime nombre* → Información del anime\nℹ️ *.animeinfo nombre* → Información completa\n' +
        '👤 *.personaje nombre* → Buscar personaje\n📚 *.manga nombre* → Buscar manga\n🌸 *.waifu* → Personaje aleatorio\n🔥 *.husbando* → Personaje aleatorio\n\n━━━━━━━━━━━━━━━━━━\n🌐 API: Tenrai\n🤖 TITANBOT' }, quoted);
      return true;
    }

    if (comando === 'reclamar') {
      const reclamados = cargarReclamados();
      const disponibles = personajesAnime.filter(p => !reclamados[p.id]);
      if (!disponibles.length) {
        await sock.sendMessage(chat, { text: '❌ *NO HAY PERSONAJES DISPONIBLES*\nTodos los personajes de la lista ya fueron reclamados.' }, quoted);
        return true;
      }
      const personaje = disponibles[Math.floor(Math.random() * disponibles.length)];
      await sock.sendMessage(chat, { text: `🔎 Buscando la imagen de *${personaje.nombre}* en Tenrai API...` }, quoted);
      const encontrado = await buscarPersonaje(personaje.nombre);
      const image = imagenPersonaje(encontrado);
      if (!image) {
        await sock.sendMessage(chat, { text: `❌ No encontré una imagen para *${personaje.nombre}*. No se guardó la reclamación. Intenta de nuevo con *.reclamar*.` }, quoted);
        return true;
      }
      const final = { ...personaje, image };
      const card = await crearTarjeta(final, usuarioId);
      reclamados[personaje.id] = { ...final, usuarioId, fecha: new Date().toISOString() };
      if (!guardarReclamados(reclamados)) throw new Error('No pude guardar la reclamación en la base de datos.');
      await sock.sendMessage(chat, { image: card, caption: `🎉 *¡PERSONAJE RECLAMADO!*\n\n⭐ *${personaje.nombre}*\n🎬 ${personaje.anime}\n👤 Usuario: ${usuarioId}\n\n💬 “${personaje.frase}”\n🌐 Fuente: Tenrai API` }, quoted);
      return true;
    }

    if (comando === 'mispersonajes' || comando === 'mispersonaje') {
      const own = Object.entries(cargarReclamados()).filter(([, p]) => p.usuarioId === usuarioId);
      if (!own.length) {
        await sock.sendMessage(chat, { text: '📭 *NO TIENES PERSONAJES RECLAMADOS*\n\nUsa *.reclamar* para conseguir uno.' }, quoted);
        return true;
      }
      let text = '🎴 *TUS PERSONAJES*\n\n';
      own.forEach(([, p], i) => { text += `${i + 1}. ⭐ *${p.nombre}*\n   🎬 Anime: ${p.anime}\n   📅 Reclamado: ${p.fecha || 'Sin fecha'}\n\n`; });
      await sock.sendMessage(chat, { text }, quoted);
      return true;
    }

    if (comando === 'personajes') {
      const reclamados = cargarReclamados();
      const disponibles = personajesAnime.filter(p => !reclamados[p.id]);
      if (!disponibles.length) {
        await sock.sendMessage(chat, { text: '😢 Ya se reclamaron todos los personajes de la lista.' }, quoted);
        return true;
      }
      const text = '🎴 *PERSONAJES DISPONIBLES*\n\n' + disponibles.map((p, i) => `${i + 1}. ⭐ *${p.nombre}*\n   🎬 ${p.anime}`).join('\n\n') + '\n\n━━━━━━━━━━━━━━━━━━\nUsa *.reclamar* para conseguir uno.';
      await sock.sendMessage(chat, { text }, quoted);
      return true;
    }

    if (comando === 'liberar') {
      const reclamados = cargarReclamados();
      const own = Object.entries(reclamados).filter(([, p]) => p.usuarioId === usuarioId);
      const number = Number.parseInt(args[0], 10);
      if (!own.length) {
        await sock.sendMessage(chat, { text: '📭 No tienes personajes reclamados.' }, quoted);
        return true;
      }
      if (!Number.isInteger(number) || number < 1 || number > own.length) {
        const list = own.map(([, p], i) => `${i + 1}. *${p.nombre}*`).join('\n');
        await sock.sendMessage(chat, { text: `♻️ *LIBERAR PERSONAJE*\n\n${list}\n\nEscribe *.liberar número*\nEjemplo: *.liberar 1*` }, quoted);
        return true;
      }
      const [key, person] = own[number - 1];
      delete reclamados[key];
      guardarReclamados(reclamados);
      await sock.sendMessage(chat, { text: `♻️ *PERSONAJE LIBERADO*\n\n⭐ ${person.nombre}\n🎬 ${person.anime}\n\nAhora puede reclamarse nuevamente con *.reclamar*.` }, quoted);
      return true;
    }

    if (comando === 'animebuscar' || comando === 'anime' || comando === 'animeinfo') {
      const query = args.join(' ').trim();
      if (!query) {
        await sock.sendMessage(chat, { text: `🔎 Escribe un nombre.\nEjemplo: *.${comando} Naruto*` }, quoted);
        return true;
      }
      const results = await buscarAnime(query, comando === 'animebuscar' ? 5 : 1);
      if (!results.length) {
        await sock.sendMessage(chat, { text: `❌ No encontré información sobre *${query}* en Tenrai.` }, quoted);
        return true;
      }
      if (comando === 'animebuscar') {
        const text = '🔎 *RESULTADOS DE ANIME*\n\n' + results.map((item, i) => `${i + 1}. 🎬 *${textoPlano(item.title)}*\n   🆔 MAL ID: ${item.mal_id || 'N/A'}\n   ⭐ Score: ${item.score ?? 'N/A'}`).join('\n\n') + '\n\n🌐 Fuente: Tenrai API';
        await sock.sendMessage(chat, { text }, quoted);
        return true;
      }
      const item = results[0];
      const title = textoPlano(item.title), japanese = textoPlano(item.title_japanese);
      const aired = item.aired?.string || item.aired?.from || 'N/A';
      const genres = Array.isArray(item.genres) ? item.genres.map(g => g.name).filter(Boolean).join(', ') : 'N/A';
      const synopsis = textoPlano(item.synopsis, 1800);
      const text = `🎬 *${title}*\n\n🇯🇵 Título japonés: ${japanese}\n⭐ Score: ${item.score ?? 'N/A'}\n📺 Episodios: ${item.episodes ?? 'N/A'}\n📡 Estado: ${estadoEspanol(item.status)}\n📅 Emitido: ${aired}\n🎭 Tipo: ${item.type || 'N/A'}\n🎌 Géneros: ${genres}\n\n📝 *Sinopsis:*\n${synopsis}\n\n🌐 Fuente: Tenrai API`;
      await sock.sendMessage(chat, { text }, quoted);
      return true;
    }

    if (comando === 'personaje') {
      const query = args.join(' ').trim();
      if (!query) {
        await sock.sendMessage(chat, { text: '👤 Usa *.personaje nombre*\nEjemplo: *.personaje Gojo*' }, quoted);
        return true;
      }
      const person = await buscarPersonaje(query);
      if (!person) {
        await sock.sendMessage(chat, { text: `❌ No encontré al personaje *${query}* en Tenrai.` }, quoted);
        return true;
      }
      const image = imagenPersonaje(person);
      const buffer = await descargarImagen(image);
      const name = textoPlano(person.name || person.name_kanji || query, 160);
      const about = textoPlano(person.about || 'Sin biografía disponible.', 1200);
      await enviarImagenOTexto(sock, chat, buffer, `👤 *${name}*\n\n${about}\n\n🌐 Fuente: Tenrai API`, msg);
      return true;
    }

    if (comando === 'manga') {
      const query = args.join(' ').trim();
      if (!query) {
        await sock.sendMessage(chat, { text: '📚 Usa *.manga nombre del manga*' }, quoted);
        return true;
      }
      const results = await buscarManga(query, 1);
      if (!results.length) {
        await sock.sendMessage(chat, { text: `❌ No encontré el manga *${query}* en Tenrai.` }, quoted);
        return true;
      }
      const m = results[0];
      const text = `📚 *${textoPlano(m.title)}*\n\n⭐ Score: ${m.score ?? 'N/A'}\n📖 Capítulos: ${m.chapters ?? 'N/A'}\n📕 Volúmenes: ${m.volumes ?? 'N/A'}\n📡 Estado: ${m.status || 'N/A'}\n\n📝 *Sinopsis:*\n${textoPlano(m.synopsis, 1600)}\n\n🌐 Fuente: Tenrai API`;
      await sock.sendMessage(chat, { text }, quoted);
      return true;
    }

    if (comando === 'waifu' || comando === 'husbando') {
      const page = Math.floor(Math.random() * 40) + 1;
      const body = await tenraiGet(`/characters?has_image=true&limit=25&page=${page}`);
      const people = getData(body);
      const list = Array.isArray(people) ? people : (people ? [people] : []);
      const person = list.length ? list[Math.floor(Math.random() * list.length)] : null;
      if (!person) {
        await sock.sendMessage(chat, { text: '❌ Tenrai no devolvió personajes con imagen en este momento.' }, quoted);
        return true;
      }
      const image = imagenPersonaje(person);
      const buffer = await descargarImagen(image);
      const name = textoPlano(person.name || 'Personaje aleatorio', 160);
      await enviarImagenOTexto(sock, chat, buffer, `${comando === 'waifu' ? '🌸' : '🔥'} *PERSONAJE ALEATORIO*\n\n👤 ${name}\n🌐 Fuente: Tenrai API`, msg);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error en módulo Anime/Tenrai:', error);
    try {
      await sock.sendMessage(chat, { text: `❌ Ocurrió un error en el comando Anime.\n\n${error.message || 'Error desconocido'}` }, msg ? { quoted: msg } : {});
    } catch (sendError) {
      console.error('No se pudo enviar el error al chat:', sendError.message);
    }
    return true;
  }
}

module.exports = anime;
