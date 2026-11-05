// ==========================================
// TITANBOT - COMANDOS MULTIMEDIA / DESCARGAS
// ==========================================
// Los comandos abren búsquedas o enlaces de las plataformas de origen.
// No descargan ni republican automáticamente contenido protegido.

const COMANDOS = new Set([
  "mediafire", "mf", "mp4", "ytmp4", "mp4doc",
  "pinterest", "pin", "pixiv", "px", "pixivpdf", "ytaudio"
]);

const URL_RE = /^https?:\/\/\S+$/i;

function hostDe(valor) {
  try { return new URL(valor).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

function perteneceA(url, dominios) {
  const host = hostDe(url);
  return dominios.some(d => host === d || host.endsWith("." + d));
}

function busqueda(comando, consulta) {
  const q = encodeURIComponent(consulta);
  switch (comando) {
    case "mediafire":
    case "mf":
      return `https://www.google.com/search?q=${encodeURIComponent("site:mediafire.com " + consulta)}`;
    case "mp4":
    case "ytmp4":
      return `https://www.youtube.com/results?search_query=${q}`;
    case "mp4doc":
      return `https://www.google.com/search?q=${encodeURIComponent(consulta + " video fuente oficial")}`;
    case "pinterest":
    case "pin":
      return `https://www.pinterest.com/search/pins/?q=${q}`;
    case "pixiv":
    case "px":
    case "pixivpdf":
      return `https://www.pixiv.net/tags/${q}/artworks`;
    case "ytaudio":
      return `https://music.youtube.com/search?q=${q}`;
    default:
      return null;
  }
}

function ayuda(comando) {
  const ejemplos = {
    mediafire: ".mediafire https://www.mediafire.com/file/...",
    mf: ".mf https://www.mediafire.com/file/...",
    mp4: ".mp4 nombre del video",
    ytmp4: ".ytmp4 nombre del video",
    mp4doc: ".mp4doc https://...",
    pinterest: ".pinterest fondos de pantalla",
    pin: ".pin fondos de pantalla",
    pixiv: ".pixiv nombre del artista o tema",
    px: ".px nombre del artista o tema",
    pixivpdf: ".pixivpdf nombre del artista o tema",
    ytaudio: ".ytaudio nombre de la canción"
  };
  return `📥 *TITANBOT — ${comando.toUpperCase()}*\n\nUso:\n${ejemplos[comando]}\n\nℹ️ Abre la fuente o búsqueda oficial; no descarga archivos automáticamente.`;
}

async function manejarMultimedia({ sock, jid, texto, quoted }) {
  const entrada = String(texto || "").trim();
  if (!entrada) return false;

  const partes = entrada.split(/\s+/);
  let comando = partes.shift() || "";
  comando = comando.replace(/^[.!#]/, "").toLowerCase();
  if (!COMANDOS.has(comando)) return false;

  const consulta = partes.join(" ").trim();
  if (!consulta || ["ayuda", "help", "menu", "menú"].includes(consulta.toLowerCase())) {
    await sock.sendMessage(jid, { text: ayuda(comando) }, { quoted });
    return true;
  }

  let url;
  if (URL_RE.test(consulta)) {
    const dominios = {
      mediafire: ["mediafire.com"], mf: ["mediafire.com"],
      mp4: ["youtube.com", "youtu.be", "vimeo.com"],
      ytmp4: ["youtube.com", "youtu.be"],
      mp4doc: ["youtube.com", "youtu.be", "vimeo.com", "archive.org"],
      pinterest: ["pinterest.com", "pin.it"], pin: ["pinterest.com", "pin.it"],
      pixiv: ["pixiv.net"], px: ["pixiv.net"], pixivpdf: ["pixiv.net"],
      ytaudio: ["youtube.com", "youtu.be", "music.youtube.com"]
    };
    if (!perteneceA(consulta, dominios[comando] || [])) {
      await sock.sendMessage(jid, {
        text: `⚠️ El enlace no corresponde a la plataforma esperada para .${comando}.\n\nEnvía un enlace válido o escribe .${comando} ayuda.`
      }, { quoted });
      return true;
    }
    url = consulta;
  } else {
    url = busqueda(comando, consulta);
  }

  const nombres = {
    mediafire: "MEDIAFIRE", mf: "MEDIAFIRE", mp4: "VIDEOS",
    ytmp4: "YOUTUBE VIDEO", mp4doc: "VIDEO / DOCUMENTO",
    pinterest: "PINTEREST", pin: "PINTEREST",
    pixiv: "PIXIV", px: "PIXIV", pixivpdf: "PIXIV", ytaudio: "YOUTUBE MUSIC"
  };

  await sock.sendMessage(jid, {
    text: `📥 *TITANBOT — ${nombres[comando]}*\n\n🔎 *Consulta:* ${consulta}\n\n🔗 *Abrir fuente:*\n${url}\n\n⚠️ TITANBOT facilita el acceso a la fuente. Respeta los derechos del creador y las condiciones de cada plataforma.`
  }, { quoted });
  return true;
}

module.exports = { manejarMultimedia, comandos: COMANDOS };
