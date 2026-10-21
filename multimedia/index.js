
const fs = require("fs");
const path = require("path");

const BASE = __dirname;
const CATALOGO = path.join(BASE, "catalogo.json");
const CARPETA_VIDEOS = path.join(BASE, "videos");

function normalizar(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function leerCatalogo() {
  try {
    const datos = JSON.parse(
      fs.readFileSync(CATALOGO, "utf8")
    );

    return {
      peliculas: Array.isArray(datos.peliculas)
        ? datos.peliculas : [],
      series: Array.isArray(datos.series)
        ? datos.series : []
    };
  } catch (error) {
    console.error("[MEDIA] Error leyendo catálogo:", error.message);
    return { peliculas: [], series: [] };
  }
}

async function manejarMultimedia({
  sock,
  jid,
  texto,
  quoted
}) {
  if (!texto) return false;

  const partes = texto.trim().split(/\s+/);
  const comando = partes[0].toLowerCase();
  const busqueda = partes.slice(1).join(" ");

  const comandos = [
    ".mediamenu",
    ".media",
    ".pelicula",
    ".serie"
  ];

  if (!comandos.includes(comando)) return false;

  const opciones = quoted ? { quoted } : {};

  if (comando === ".mediamenu") {
    await sock.sendMessage(jid, {
      text:
        "🎬 TITANBOT MEDIA\n\n" +
        "🎞️ .pelicula TITULO\n" +
        "📺 .serie TITULO\n" +
        "🔎 .media TITULO\n\n" +
        "Los archivos disponibles se envían automáticamente."
    }, opciones);

    return true;
  }

  if (!busqueda) {
    await sock.sendMessage(jid, {
      text: "Escribe un título. Ejemplo: .pelicula Mi película"
    }, opciones);

    return true;
  }

  const catalogo = leerCatalogo();

  const peliculas = catalogo.peliculas.map(item => ({
    ...item,
    tipo: "pelicula"
  }));

  const series = catalogo.series.map(item => ({
    ...item,
    tipo: "serie"
  }));

  const elementos = comando === ".pelicula"
    ? peliculas
    : comando === ".serie"
      ? series
      : [...peliculas, ...series];

  const resultados = elementos.filter(item =>
    item.titulo &&
    normalizar(item.titulo).includes(normalizar(busqueda))
  );

  if (!resultados.length) {
    await sock.sendMessage(jid, {
      text: "🔎 No encontré ese título en el catálogo de TITANBOT MEDIA."
    }, opciones);

    return true;
  }

  const item = resultados[0];

  if (!item.archivo) {
    await sock.sendMessage(jid, {
      text:
        `🎬 ${item.titulo}\n\n` +
        "⚠️ Este título está en el catálogo, " +
        "pero todavía no tiene un archivo asociado."
    }, opciones);

    return true;
  }

  // Solo se permiten nombres de archivo, no rutas externas.
  const nombreArchivo = path.basename(item.archivo);

  if (nombreArchivo !== item.archivo) {
    await sock.sendMessage(jid, {
      text: "⚠️ La ruta del archivo no es válida."
    }, opciones);

    return true;
  }

  const archivo = path.join(CARPETA_VIDEOS, nombreArchivo);

  try {
    const info = await fs.promises.stat(archivo);

    if (!info.isFile()) {
      throw new Error("La ruta no es un archivo.");
    }

    if (path.extname(archivo).toLowerCase() !== ".mp4") {
      await sock.sendMessage(jid, {
        text: "⚠️ Por ahora solo se admiten archivos MP4."
      }, opciones);

      return true;
    }

    await sock.sendMessage(jid, {
      video: { url: archivo },
      mimetype: "video/mp4",
      caption: `🎬 ${item.titulo}`
    }, opciones);

    console.log(`[MEDIA] Vídeo enviado: ${item.titulo}`);
  } catch (error) {
    console.error("[MEDIA] Error enviando vídeo:", error.message);

    await sock.sendMessage(jid, {
      text:
        "❌ No pude enviar el vídeo.\n\n" +
        "Comprueba que el archivo exista en multimedia/videos " +
        "y que el servidor tenga acceso a él."
    }, opciones);
  }

  return true;
}

module.exports = { manejarMultimedia };
