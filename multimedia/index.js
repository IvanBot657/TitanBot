
const fs = require("fs");
const path = require("path");

const BASE = __dirname;
const CARPETA_VIDEOS = path.join(BASE, "videos");
const ARCHIVO_CATALOGO = path.join(BASE, "catalogo.json");

function normalizar(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function leerCatalogo() {
  try {
    const contenido = JSON.parse(
      fs.readFileSync(ARCHIVO_CATALOGO, "utf8")
    );

    return {
      peliculas: contenido.peliculas || [],
      series: contenido.series || []
    };
  } catch (error) {
    console.error("[MULTIMEDIA]", error);
    return { peliculas: [], series: [] };
  }
}

async function manejarMultimedia({ sock, jid, texto }) {
  const entrada = String(texto || "").trim();

  const coincidencia = entrada.match(
    /^\.(pelicula|película|serie)\s+(.+)$/i
  );

  if (!coincidencia) return false;

  const tipo = normalizar(coincidencia[1]) === "serie"
    ? "series"
    : "peliculas";

  const busqueda = normalizar(coincidencia[2]);
  const catalogo = leerCatalogo();

  const elemento = catalogo[tipo].find(item =>
    normalizar(item.titulo).includes(busqueda)
  );

  if (!elemento) {
    await sock.sendMessage(jid, {
      text: "❌ No encontré ese título en el catálogo."
    });
    return true;
  }

  const archivo = path.basename(elemento.archivo || "");
  const ruta = path.join(CARPETA_VIDEOS, archivo);

  if (!archivo || !fs.existsSync(ruta)) {
    await sock.sendMessage(jid, {
      text: `❌ No encontré el vídeo: ${archivo}`
    });
    return true;
  }

  try {
    await sock.sendMessage(jid, {
      video: fs.readFileSync(ruta),
      mimetype: "video/mp4",
      fileName: archivo,
      caption: `🎬 ${elemento.titulo}`
    });
  } catch (error) {
    console.error("[MULTIMEDIA] Error:", error);

    await sock.sendMessage(jid, {
      text: "❌ No pude enviar el vídeo."
    });
  }

  return true;
}

module.exports = { manejarMultimedia };
