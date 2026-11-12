// =====================================================
// 🏴‍☠️ TITANBOT — COLECCIÓN ONE PIECE
// API: https://onepieceapi.com/
// Sistema independiente de Pokémon, Varitas y Cartas Anime.
// =====================================================

const fs = require('fs');
const path = require('path');

const API = 'https://onepieceapi.com/api';
const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'onepiece.json');
const PAGE_SIZE = 20;
const RANDOM_PAGE_COUNT = 72; // Aproximadamente 1.431 personajes / 20 por página.

const comandos = new Set([
  'onepiece', 'onepie',
  'onepiedex',
  'onepieinfo',
  'onepiebuscar',
  'onepietop'
]);

function cargarDB() {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}', 'utf8');
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch (error) {
    console.error('⚠️ No se pudo leer database/onepiece.json:', error.message);
    return {};
  }
}

function guardarDB(db) {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const temporal = `${DB_FILE}.tmp`;
  fs.writeFileSync(temporal, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(temporal, DB_FILE);
}

async function consultar(endpoint) {
  const response = await fetch(`${API}${endpoint}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`La API respondió ${response.status}`);
  return response.json();
}

function nombreDe(valor) {
  if (!valor) return 'Nombre desconocido';
  if (typeof valor === 'string') return valor;
  return valor.en || valor.romaji || valor.jp || 'Nombre desconocido';
}

function recompensa(personaje) {
  const lista = Array.isArray(personaje?.bounties) ? personaje.bounties : [];
  const activas = lista.filter(x => x && x.is_active && Number.isFinite(Number(x.amount)));
  const candidatas = activas.length ? activas : lista.filter(x => x && Number.isFinite(Number(x.amount)));
  if (!candidatas.length) return 0;
  return Math.max(...candidatas.map(x => Number(x.amount)));
}

function rareza(cantidad) {
  if (cantidad >= 1000000000) return '🌟 LEGENDARIO';
  if (cantidad >= 100000000) return '💎 ÉPICO';
  if (cantidad >= 10000000) return '🔷 RARO';
  return '⚓ COMÚN';
}

function berries(cantidad) {
  return cantidad > 0 ? `${cantidad.toLocaleString('en-US')} ฿` : 'Sin recompensa conocida';
}

function limpiar(texto) {
  return String(texto || '').replace(/[\r\n]+/g, ' ').trim();
}

function claveUsuario(id) {
  return String(id || 'desconocido').split('@')[0];
}

async function enviarPersonaje(sock, chat, personaje, caption, msg) {
  const imagen = personaje?.image_url;
  if (imagen && /^https:\/\//i.test(imagen)) {
    try {
      await sock.sendMessage(chat, { image: { url: imagen }, caption }, { quoted: msg });
      return;
    } catch (error) {
      console.log('⚠️ No se pudo enviar la imagen del personaje:', error.message);
    }
  }
  await sock.sendMessage(chat, { text: `${caption}\n\n🖼️ Esta ficha no tiene una imagen disponible.` }, { quoted: msg });
}

async function buscarPersonajes(consulta) {
  const q = encodeURIComponent(consulta);
  const datos = await consultar(`/characters?q=${q}&page=1&limit=10`);
  return Array.isArray(datos) ? datos : (Array.isArray(datos?.data) ? datos.data : []);
}

async function obtenerAleatorio() {
  // Se elige una página aleatoria y se comprueba que el personaje tenga imagen.
  for (let intento = 0; intento < 6; intento++) {
    const pagina = Math.floor(Math.random() * RANDOM_PAGE_COUNT) + 1;
    const datos = await consultar(`/characters?page=${pagina}&limit=${PAGE_SIZE}`);
    const lista = Array.isArray(datos) ? datos : (Array.isArray(datos?.data) ? datos.data : []);
    const candidatos = lista.filter(p => p && p.id && p.image_url);
    if (candidatos.length) return candidatos[Math.floor(Math.random() * candidatos.length)];
  }
  throw new Error('No encontré un personaje con imagen en los intentos realizados.');
}

function fichaTexto(personaje, titulo = '🏴‍☠️ PERSONAJE DE ONE PIECE') {
  const nombre = nombreDe(personaje.name);
  const extra = personaje.extra_data || {};
  const monto = recompensa(personaje);
  const edad = personaje.age != null ? `${personaje.age} años` : 'No disponible';
  const altura = personaje.height != null ? `${personaje.height} cm` : 'No disponible';
  const estado = personaje.status || 'No disponible';
  const afiliacion = extra.affiliation || extra.occupation || 'No disponible';
  return [
    `╭━━〔 ${titulo} 〕━━╮`,
    `🏴‍☠️ *${nombre}*`,
    '',
    `${rareza(monto)}`,
    `💰 Recompensa: *${berries(monto)}*`,
    `🎂 Edad: ${edad}`,
    `📏 Altura: ${altura}`,
    `⚓ Afiliación: ${afiliacion}`,
    `📌 Estado: ${estado}`,
    '',
    '╰━━━━━━〔 ⚡ TITANBOT 〕━━━━━━╯'
  ].join('\n');
}

async function onepiece(sock, chat, comando, args, id, msg) {
  try {
    if (comando === 'onepiece' || comando === 'onepie') {
      const personaje = await obtenerAleatorio();
      const db = cargarDB();
      const usuario = claveUsuario(id);
      if (!db[usuario]) db[usuario] = { personajes: {} };
      if (!db[usuario].personajes) db[usuario].personajes = {};

      const personajeId = String(personaje.id);
      const nombre = nombreDe(personaje.name);
      const repetido = Boolean(db[usuario].personajes[personajeId]);

      if (!repetido) {
        db[usuario].personajes[personajeId] = {
          id: personajeId,
          name: nombre,
          image_url: personaje.image_url || null,
          bounty: recompensa(personaje),
          rarity: rareza(recompensa(personaje)),
          obtainedAt: new Date().toISOString()
        };
        guardarDB(db);
      }

      const caption = fichaTexto(
        personaje,
        repetido ? 'PERSONAJE REPETIDO' : '¡NUEVO PERSONAJE!'
      ) + (repetido
        ? '\n\n🔁 Ya tenías este personaje en tu colección.'
        : `\n\n🎉 ¡${nombre} se une a tu tripulación!`);

      await enviarPersonaje(sock, chat, personaje, caption, msg);
      return true;
    }

    if (comando === 'onepiedex') {
      const db = cargarDB();
      const usuario = claveUsuario(id);
      const personajes = Object.values(db[usuario]?.personajes || {});
      if (!personajes.length) {
        await sock.sendMessage(chat, {
          text: '🏴‍☠️ *TU ONEPIEDEX ESTÁ VACÍO*\n\nUsa *.onepiece* para conseguir tu primer personaje.'
        }, { quoted: msg });
        return true;
      }
      const lista = personajes
        .sort((a, b) => (b.bounty || 0) - (a.bounty || 0))
        .slice(0, 30)
        .map((p, i) => `${i + 1}. ${p.name} — ${p.rarity || '⚓ COMÚN'}`)
        .join('\n');
      await sock.sendMessage(chat, {
        text: `╭━━〔 🏴‍☠️ MI ONEPIEDEX 〕━━╮\n\n👤 Coleccionista: ${usuario}\n📚 Personajes: *${personajes.length}*\n\n${lista}${personajes.length > 30 ? '\n\n…y más personajes.' : ''}\n\n╰━━━━━━〔 ⚡ TITANBOT 〕━━━━━━╯`
      }, { quoted: msg });
      return true;
    }

    if (comando === 'onepieinfo' || comando === 'onepiebuscar') {
      const consulta = limpiar(args.join(' '));
      if (!consulta) {
        await sock.sendMessage(chat, {
          text: `🔎 *BUSCADOR ONE PIECE*\n\nUso: .${comando} nombre\nEjemplo: .${comando} Monkey D. Luffy`
        }, { quoted: msg });
        return true;
      }
      const resultados = await buscarPersonajes(consulta);
      if (!resultados.length) {
        await sock.sendMessage(chat, { text: `❌ No encontré personajes para: *${consulta}*.` }, { quoted: msg });
        return true;
      }
      const personaje = resultados[0];
      const caption = fichaTexto(personaje, '🔎 FICHA DE PERSONAJE');
      await enviarPersonaje(sock, chat, personaje, caption, msg);
      if (resultados.length > 1 && comando === 'onepiebuscar') {
        const otros = resultados.slice(1, 6).map(p => `• ${nombreDe(p.name)}`).join('\n');
        await sock.sendMessage(chat, { text: `Otros resultados:\n${otros}` }, { quoted: msg });
      }
      return true;
    }

    if (comando === 'onepietop') {
      const db = cargarDB();
      const ranking = Object.entries(db)
        .map(([usuario, datos]) => ({ usuario, total: Object.keys(datos?.personajes || {}).length }))
        .filter(x => x.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      if (!ranking.length) {
        await sock.sendMessage(chat, { text: '🏴‍☠️ Todavía no hay coleccionistas en el ranking. ¡Usa .onepiece!' }, { quoted: msg });
        return true;
      }
      const lista = ranking.map((p, i) => `${i + 1}. ${p.usuario} — *${p.total}* personaje(s)`).join('\n');
      await sock.sendMessage(chat, {
        text: `╭━━〔 🏆 TOP COLECCIONISTAS 〕━━╮\n\n${lista}\n\n╰━━━━━━〔 ⚡ TITANBOT 〕━━━━━━╯`
      }, { quoted: msg });
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error en sistema One Piece:', error);
    await sock.sendMessage(chat, {
      text: '⚠️ No pude consultar One Piece en este momento. La API puede estar temporalmente ocupada; inténtalo más tarde.'
    }, { quoted: msg });
    return true;
  }
}

onepiece.comandos = comandos;
module.exports = onepiece;
