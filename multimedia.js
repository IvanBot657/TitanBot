// TITANBOT - 11 comandos multimedia
// Requiere Node.js 18+ (usa fetch nativo). No necesita paquetes adicionales.
// Descarga únicamente archivos directos y públicos; no extrae contenido de
// YouTube, Pixiv o páginas que no ofrecen un archivo descargable directamente.

const dns = require('dns').promises;
const net = require('net');
const config = (() => {
  try { return require('./config'); } catch { return {}; }
})();

const MAX_BYTES = 18 * 1024 * 1024;
const TIMEOUT_MS = 20000;
const IMAGE_COMMANDS = new Set(['pinterest', 'pin']);
const COMMANDS = new Set([
  'mediafire', 'mf', 'mp4', 'ytmp4', 'mp4doc',
  'pinterest', 'pin', 'pixiv', 'px', 'pixivpdf', 'ytaudio'
]);

function normalizarHost(host) {
  return String(host || '').toLowerCase().replace(/^\[|\]$/g, '');
}

function esIpPrivada(ip) {
  const tipo = net.isIP(ip);
  if (tipo === 4) {
    const p = ip.split('.').map(Number);
    return p[0] === 0 || p[0] === 10 || p[0] === 127 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) || p[0] >= 224;
  }
  if (tipo === 6) {
    const v = ip.toLowerCase();
    return v === '::' || v === '::1' || v.startsWith('fc') ||
      v.startsWith('fd') || v.startsWith('fe80:') || v.startsWith('ff');
  }
  return true;
}

async function validarUrlPublica(valor) {
  let url;
  try { url = new URL(valor); } catch { throw new Error('El enlace no es válido.'); }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Por seguridad, solo se aceptan enlaces HTTPS públicos.');
  }
  const host = normalizarHost(url.hostname);
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('Ese servidor no es válido.');
  }
  if (net.isIP(host)) {
    if (esIpPrivada(host)) throw new Error('No se permiten direcciones privadas.');
  } else {
    const ips = await dns.lookup(host, { all: true, verbatim: true });
    if (!ips.length || ips.some(x => esIpPrivada(x.address))) {
      throw new Error('El servidor no parece ser una dirección pública segura.');
    }
  }
  return url;
}

async function descargar(urlInicial) {
  let url = urlInicial;
  for (let salto = 0; salto <= 4; salto++) {
    await validarUrlPublica(url);
    const respuesta = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'TITANBOT/1.0 (media sender)' }
    });
    if ([301, 302, 303, 307, 308].includes(respuesta.status)) {
      const destino = respuesta.headers.get('location');
      if (!destino || salto === 4) throw new Error('El enlace tiene demasiadas redirecciones.');
      url = new URL(destino, url).toString();
      continue;
    }
    if (!respuesta.ok) throw new Error(`La fuente respondió HTTP ${respuesta.status}.`);
    const largo = Number(respuesta.headers.get('content-length') || 0);
    if (largo > MAX_BYTES) throw new Error('El archivo supera el límite de 18 MB.');
    const mime = (respuesta.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!mime || mime === 'text/html' || mime.includes('javascript') || mime.includes('json')) {
      throw new Error('El enlace abre una página web, no un archivo directo.');
    }
    const buffer = Buffer.from(await respuesta.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_BYTES) throw new Error('El archivo está vacío o supera 18 MB.');
    return { buffer, mime, url };
  }
  throw new Error('No se pudo abrir el enlace.');
}

function detectarUrl(texto) {
  const coincidencia = String(texto || '').match(/https:\/\/[^\s<>]+/i);
  return coincidencia ? coincidencia[0].replace(/[),.!?]+$/, '') : null;
}

function nombreArchivo(url, mime) {
  try {
    const nombre = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'archivo');
    if (nombre.includes('.') && nombre.length < 100) return nombre;
  } catch {}
  const ext = mime.includes('image/jpeg') ? 'jpg' : mime.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'bin';
  return `titanbot.${ext}`;
}

function enlaceBusquedaPixiv(consulta) {
  return `https://www.pixiv.net/tags/${encodeURIComponent(consulta)}/artworks`;
}

async function buscarImagenesLibres(consulta, sock, jid, quoted) {
  const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('generator', 'search');
  endpoint.searchParams.set('gsrsearch', `filetype:bitmap ${consulta}`);
  endpoint.searchParams.set('gsrnamespace', '6');
  endpoint.searchParams.set('gsrlimit', '5');
  endpoint.searchParams.set('prop', 'imageinfo');
  endpoint.searchParams.set('iiprop', 'url|mime');
  endpoint.searchParams.set('iiurlwidth', '1000');
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('origin', '*');

  const r = await fetch(endpoint, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': 'TITANBOT/1.0 (Wikimedia Commons image search)' }
  });
  if (!r.ok) throw new Error(`Wikimedia Commons respondió HTTP ${r.status}.`);
  const data = await r.json();
  const paginas = Object.values(data?.query?.pages || {});
  const imagenes = paginas
    .map(p => p.imageinfo?.[0])
    .filter(i => i && i.thumburl && /^image\/(jpeg|png|webp|gif)$/i.test(i.mime || ''))
    .slice(0, 4);

  if (!imagenes.length) {
    await sock.sendMessage(jid, {
      text: `📥 *TITANBOT — ${'PIN'}*\n\nNo encontré imágenes libres para: *${consulta}*.\n\n🔎 Búsqueda: https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${encodeURIComponent(consulta)}`
    }, { quoted });
    return;
  }

  await sock.sendMessage(jid, {
    text: `📥 *TITANBOT — IMÁGENES*\n\n🔎 Búsqueda: *${consulta}*\n📸 Enviando ${imagenes.length} imágenes de Wikimedia Commons (consulta la licencia en la fuente).`
  }, { quoted });

  let enviadas = 0;
  for (const item of imagenes) {
    try {
      const archivo = await descargar(item.thumburl);
      if (!archivo.mime.startsWith('image/')) continue;
      await sock.sendMessage(jid, {
        image: archivo.buffer,
        caption: `🖼️ ${item.descriptionurl || item.url || 'Wikimedia Commons'}\nℹ️ Revisa la licencia y atribución en la ficha original.`
      }, { quoted });
      enviadas++;
    } catch (e) {
      console.error('[TITANBOT IMAGEN]', e.message);
    }
  }
  if (!enviadas) {
    await sock.sendMessage(jid, { text: '⚠️ No pude obtener las imágenes esta vez. Prueba otra búsqueda.' }, { quoted });
  }
}

async function enviarArchivoPorTipo({ sock, jid, quoted, url, comando }) {
  const archivo = await descargar(url);
  const mime = archivo.mime;
  const nombre = nombreArchivo(archivo.url, mime);
  const prefijo = config.prefijo || '.';

  if (comando === 'mp4' || comando === 'ytmp4') {
    if (!mime.startsWith('video/')) throw new Error('Ese enlace no parece ser un video directo.');
    await sock.sendMessage(jid, { video: archivo.buffer, mimetype: mime, caption: `📥 *TITANBOT — ${comando.toUpperCase()}*\n\n✅ Video enviado: *${nombre}*` }, { quoted });
    return;
  }
  if (comando === 'mp4doc') {
    if (!mime.startsWith('video/')) throw new Error('Ese enlace no parece ser un video directo.');
    await sock.sendMessage(jid, { document: archivo.buffer, mimetype: mime, fileName: nombre, caption: '📥 *TITANBOT — MP4DOC*\n\n✅ Video enviado como documento.' }, { quoted });
    return;
  }
  if (comando === 'ytaudio') {
    if (!/^(audio\/|application\/ogg)/.test(mime)) throw new Error('Ese enlace no parece ser un archivo de audio directo.');
    await sock.sendMessage(jid, { audio: archivo.buffer, mimetype: mime, fileName: nombre, ptt: false }, { quoted });
    return;
  }
  if (comando === 'pixivpdf') {
    if (mime !== 'application/pdf') throw new Error('Ese enlace no parece ser un PDF directo.');
    await sock.sendMessage(jid, { document: archivo.buffer, mimetype: 'application/pdf', fileName: nombre.endsWith('.pdf') ? nombre : 'archivo.pdf', caption: '📥 *TITANBOT — PIXIVPDF*\n\n✅ PDF enviado.' }, { quoted });
    return;
  }
  if (IMAGE_COMMANDS.has(comando) || comando === 'pixiv' || comando === 'px') {
    if (!mime.startsWith('image/')) throw new Error('Ese enlace no parece ser una imagen directa.');
    await sock.sendMessage(jid, { image: archivo.buffer, caption: `📥 *TITANBOT — ${comando.toUpperCase()}*\n\n✅ Imagen enviada: *${nombre}*` }, { quoted });
    return;
  }
  // MediaFire: solo se envía si el enlace es un archivo directo.
  await sock.sendMessage(jid, {
    document: archivo.buffer,
    mimetype: mime,
    fileName: nombre,
    caption: '📥 *TITANBOT — MEDIAFIRE*\n\n✅ Archivo directo enviado.'
  }, { quoted });
}

function ayuda(comando, ejemplo) {
  const p = config.prefijo || '.';
  return `📥 *TITANBOT — ${comando.toUpperCase()}*\n\nUso:\n${p}${comando} ${ejemplo}\n\nℹ️ Envía archivos desde enlaces directos HTTPS. Las páginas de YouTube, Pixiv y MediaFire que no ofrezcan un archivo directo se abren en su fuente oficial; no se extraen ni se convierten contenidos protegidos.`;
}

async function manejarMultimedia({ sock, jid, texto, quoted }) {
  const p = config.prefijo || '.';
  const limpio = String(texto || '').trim();
  if (!limpio.startsWith(p)) return false;
  const partes = limpio.slice(p.length).trim().split(/\s+/);
  const comando = (partes.shift() || '').toLowerCase();
  if (!COMMANDS.has(comando)) return false;

  const consulta = partes.join(' ').trim();
  const url = detectarUrl(consulta);
  const ejemplos = {
    mediafire: 'enlace_directo', mf: 'enlace_directo',
    mp4: 'enlace_directo.mp4', ytmp4: 'enlace_directo.mp4',
    mp4doc: 'enlace_directo.mp4', pinterest: 'fondos de pantalla',
    pin: 'fondos de pantalla', pixiv: 'nombre o enlace de imagen',
    px: 'nombre o enlace de imagen', pixivpdf: 'enlace_directo.pdf',
    ytaudio: 'enlace_directo.mp3'
  };

  if (!consulta || ['ayuda', 'help', 'menu', 'menú'].includes(consulta.toLowerCase())) {
    await sock.sendMessage(jid, { text: ayuda(comando, ejemplos[comando]) }, { quoted });
    return true;
  }

  try {
    if (url) {
      const host = normalizarHost(new URL(url).hostname);
      const esYoutube = /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)music\.youtube\.com$/.test(host);
      const esPixiv = /(^|\.)pixiv\.net$/.test(host);
      const esPinterestPage = /(^|\.)(pinterest\.com|pinterest\.es)$/.test(host);
      const esMediafire = /(^|\.)mediafire\.com$/.test(host);

      if (esYoutube || esPixiv || esPinterestPage || (esMediafire && !/\.(mp4|mp3|m4a|pdf|jpe?g|png|webp|zip|rar)(\?|$)/i.test(url))) {
        await sock.sendMessage(jid, {
          text: `📥 *TITANBOT — ${comando.toUpperCase()}*\n\nℹ️ Ese enlace es una página de la plataforma, no un archivo directo.\n🔗 Fuente oficial:\n${url}`
        }, { quoted });
        return true;
      }
      await enviarArchivoPorTipo({ sock, jid, quoted, url, comando });
      return true;
    }

    if (IMAGE_COMMANDS.has(comando)) {
      await buscarImagenesLibres(consulta, sock, jid, quoted);
      return true;
    }

    if (comando === 'pixiv' || comando === 'px') {
      await sock.sendMessage(jid, {
        text: `📥 *TITANBOT — ${comando.toUpperCase()}*\n\n🔎 Búsqueda oficial de Pixiv:\n${enlaceBusquedaPixiv(consulta)}\n\nℹ️ Pixiv puede requerir inicio de sesión y permisos del autor. Si tienes un enlace directo a una imagen que puedes compartir, envíalo después de ${p}${comando}.`
      }, { quoted });
      return true;
    }

    if (comando === 'pixivpdf') {
      await sock.sendMessage(jid, {
        text: `📥 *TITANBOT — PIXIVPDF*\n\nPara enviar el PDF, usa un enlace HTTPS directo a un archivo PDF autorizado.\n\nEjemplo:\n${p}pixivpdf https://sitio.com/archivo.pdf\n\n🔎 Búsqueda oficial de Pixiv:\n${enlaceBusquedaPixiv(consulta)}`
      }, { quoted });
      return true;
    }

    const buscadores = {
      mediafire: `https://www.google.com/search?q=${encodeURIComponent(`site:mediafire.com ${consulta}`)}`,
      mf: `https://www.google.com/search?q=${encodeURIComponent(`site:mediafire.com ${consulta}`)}`,
      mp4: `https://www.youtube.com/results?search_query=${encodeURIComponent(consulta)}`,
      ytmp4: `https://www.youtube.com/results?search_query=${encodeURIComponent(consulta)}`,
      mp4doc: `https://www.youtube.com/results?search_query=${encodeURIComponent(consulta)}`,
      ytaudio: `https://music.youtube.com/search?q=${encodeURIComponent(consulta)}`
    };
    await sock.sendMessage(jid, {
      text: `📥 *TITANBOT — ${comando.toUpperCase()}*\n\n🔎 No se proporcionó un enlace directo al archivo.\n\n🌐 Abrir búsqueda/fuente:\n${buscadores[comando]}\n\nℹ️ Para enviar el archivo, utiliza un enlace HTTPS directo y autorizado.`
    }, { quoted });
    return true;
  } catch (error) {
    console.error(`[MULTIMEDIA ${comando}]`, error);
    await sock.sendMessage(jid, {
      text: `📥 *TITANBOT — ${comando.toUpperCase()}*\n\n⚠️ No pude enviar ese contenido.\nMotivo: ${String(error.message || 'error desconocido').slice(0, 220)}\n\nℹ️ Prueba con un enlace HTTPS directo al archivo, público y menor de 18 MB.`
    }, { quoted });
    return true;
  }
}

module.exports = { manejarMultimedia, comandos: [...COMMANDS] };
