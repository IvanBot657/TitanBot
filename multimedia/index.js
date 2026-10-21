
const fs = require("fs");
const path = require("path");

const BASE = __dirname;
const CATALOGO = path.join(BASE, "catalogo.json");

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

  if (![".mediamenu", ".media", ".pelicula", ".serie"].includes(comando)) {
    return false;
  }

  if (comando === ".mediamenu") {
    await sock.sendMessage(jid, {
      text:
        "🎬 TITANBOT MEDIA\n\n" +
        "🎞️ .pelicula TITULO\n" +
        "📺 .serie TITULO\n" +
        "🔎 .media TITULO"
    }, quoted ? { quoted } : {});

    return true;
  }

  if (!busqueda) {
    await sock.sendMessage(jid, {
      text: "Escribe un título. Ejemplo: .pelicula Mi película"
    }, quoted ? { quoted } : {});

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
    }, quoted ? { quoted } : {});

    return true;
  }

  const lista = resultados.slice(0, 10)
    .map((item, i) => `${i + 1}. ${item.titulo}`)
    .join("\n");

  await sock.sendMessage(jid, {
    text: `🎬 RESULTADOS\n\n${lista}\n\nPróximamente: envío de archivos.`
  }, quoted ? { quoted } : {});

  return true;
}

module.exports = { manejarMultimedia };
