// ============================================
// 🐉 TITANBOT - CRIATURAS MITOLÓGICAS
// API: Wikipedia en español (MediaWiki API)
// Sin API key y sin dependencias adicionales.
// ============================================

const API = "https://es.wikipedia.org/w/api.php";

const criaturasAleatorias = [
  "Dragón", "Fénix", "Grifo", "Unicornio", "Kraken",
  "Basilisco", "Quimera", "Hidra de Lerna", "Cerbero",
  "Pegaso", "Minotauro", "Esfinge", "Medusa",
  "Sirena", "Cíclope", "Harpía", "Yeti", "Kitsune",
  "Jörmundgander", "Anubis", "Quetzalcóatl", "Leviatán",
  "Manticora", "Salamandra (mitología)"
];

const comandos = new Set(["criatura", "criaturas", "bestiario"]);

function limpiarTexto(valor = "") {
  return String(valor)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function consultarWikipedia(parametros) {
  const url = new URL(API);
  for (const [clave, valor] of Object.entries(parametros)) {
    url.searchParams.set(clave, valor);
  }
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const respuesta = await fetch(url.toString(), {
    headers: {
      "User-Agent": "TITANBOT/3.0 (comando de consulta de criaturas mitologicas)"
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!respuesta.ok) {
    throw new Error(`Wikipedia respondió con estado ${respuesta.status}`);
  }

  return respuesta.json();
}

async function obtenerPagina(consulta) {
  // Primero se busca el título más cercano para aceptar nombres escritos
  // por el usuario y nombres que no coincidan exactamente con el título.
  const busqueda = await consultarWikipedia({
    action: "query",
    list: "search",
    srsearch: consulta,
    srlimit: "1",
    srnamespace: "0"
  });

  const titulo = busqueda?.query?.search?.[0]?.title || consulta;

  const datos = await consultarWikipedia({
    action: "query",
    prop: "extracts|pageimages",
    exintro: "1",
    explaintext: "1",
    exsentences: "5",
    piprop: "thumbnail",
    pithumbsize: "900",
    redirects: "1",
    titles: titulo
  });

  const pagina = Object.values(datos?.query?.pages || {})[0];
  if (!pagina || pagina.missing !== undefined) return null;

  return {
    titulo: pagina.title || titulo,
    descripcion: limpiarTexto(pagina.extract || ""),
    imagen: pagina.thumbnail?.source || null,
    enlace: `https://es.wikipedia.org/wiki/${encodeURIComponent(
      String(pagina.title || titulo).replace(/ /g, "_")
    )}`
  };
}

function crearDatosLegendarios(nombre) {
  // Clasificación lúdica propia de TITANBOT; no es una escala histórica.
  const nombreNormal = nombre.toLowerCase();

  let rareza = "🔹 Extraordinaria";
  let atributo = "✨ Misterio ancestral";

  if (["dragón", "fenix", "fénix", "kraken", "leviatán", "quetzalcóatl"].some(x => nombreNormal.includes(x))) {
    rareza = "🌟 Legendaria";
    atributo = "🔥 Poder ancestral";
  } else if (["unicornio", "pegaso", "grifo", "hidra", "cerbero", "medusa"].some(x => nombreNormal.includes(x))) {
    rareza = "💎 Épica";
    atributo = "⚡ Fuerza sobrenatural";
  } else if (["sirena", "kitsune", "esfinge", "minotauro", "basilisco"].some(x => nombreNormal.includes(x))) {
    rareza = "🟣 Mítica";
    atributo = "🌙 Don sobrenatural";
  }

  return { rareza, atributo };
}

async function enviarCriatura(sock, chat, consulta, msg) {
  const datos = await obtenerPagina(consulta);

  if (!datos || (!datos.descripcion && !datos.imagen)) {
    await sock.sendMessage(chat, {
      text: `🔎 No encontré información de *${consulta}* en Wikipedia en español.\n\nPrueba con otro nombre o usa *.criatura random*.`
    }, { quoted: msg });
    return;
  }

  const { rareza, atributo } = crearDatosLegendarios(datos.titulo);
  const descripcion = datos.descripcion
    ? datos.descripcion.slice(0, 850)
    : "No hay una descripción introductoria disponible para esta criatura.";

  const caption =
    `╭━━━〔 🐉 *BESTIARIO TITAN* 〕━━━╮\n` +
    `\n` +
    `  🐲 *${datos.titulo.toUpperCase()}*\n` +
    `\n` +
    `  💠 Rareza TITAN: ${rareza}\n` +
    `  ✨ Atributo: ${atributo}\n` +
    `\n` +
    `  📖 *DESCRIPCIÓN*\n` +
    `  ${descripcion}\n` +
    `\n` +
    `  🌐 Fuente: Wikipedia\n` +
    `  ${datos.enlace}\n` +
    `\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯\n` +
    `       ⚡ *TITANBOT*`;

  if (datos.imagen) {
    try {
      const respuestaImagen = await fetch(datos.imagen, {
        headers: { "User-Agent": "TITANBOT/3.0" },
        signal: AbortSignal.timeout(15000)
      });

      if (!respuestaImagen.ok) {
        throw new Error(`No se pudo descargar la imagen (${respuestaImagen.status})`);
      }

      const buffer = Buffer.from(await respuestaImagen.arrayBuffer());
      await sock.sendMessage(chat, {
        image: buffer,
        caption
      }, { quoted: msg });
      return;
    } catch (errorImagen) {
      console.log("⚠️ TITANBOT criatura: imagen no disponible:", errorImagen.message);
    }
  }

  await sock.sendMessage(chat, { text: caption }, { quoted: msg });
}

async function criatura(sock, chat, comando, args, id, msg) {
  if (!comandos.has(comando)) return false;

  const consulta = args.join(" ").trim();
  const ayuda = !consulta || ["ayuda", "menu", "menú"].includes(consulta.toLowerCase());

  if (ayuda) {
    await sock.sendMessage(chat, {
      text:
        `╭━━━〔 🐉 *BESTIARIO TITAN* 〕━━━╮\n\n` +
        `Descubre criaturas de las leyendas con información e imágenes consultadas desde Wikipedia.\n\n` +
        `🔹 *.criatura random* — criatura aleatoria\n` +
        `🔹 *.criatura dragón* — buscar por nombre\n` +
        `🔹 *.criatura fénix* — ejemplo de búsqueda\n\n` +
        `📚 También puedes usar *.criaturas* o *.bestiario*.\n\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯\n⚡ *TITANBOT*`
    }, { quoted: msg });
    return true;
  }

  try {
    let nombre = consulta;

    if (["random", "aleatoria", "aleatorio"].includes(consulta.toLowerCase())) {
      // Se prueban varias opciones por si una página no tiene ficha en español.
      let encontrado = null;
      for (let intento = 0; intento < 5 && !encontrado; intento++) {
        const candidato = criaturasAleatorias[
          Math.floor(Math.random() * criaturasAleatorias.length)
        ];
        try {
          encontrado = await obtenerPagina(candidato);
          if (encontrado && (encontrado.descripcion || encontrado.imagen)) {
            nombre = candidato;
            break;
          }
          encontrado = null;
        } catch {
          encontrado = null;
        }
      }

      if (!encontrado) {
        throw new Error("No se pudo encontrar una criatura aleatoria en Wikipedia.");
      }

      const { rareza, atributo } = crearDatosLegendarios(encontrado.titulo);
      const descripcion = encontrado.descripcion
        ? encontrado.descripcion.slice(0, 850)
        : "No hay una descripción introductoria disponible para esta criatura.";
      const caption =
        `╭━━━〔 🐉 *BESTIARIO TITAN* 〕━━━╮\n\n` +
        `  🐲 *${encontrado.titulo.toUpperCase()}*\n\n` +
        `  💠 Rareza TITAN: ${rareza}\n` +
        `  ✨ Atributo: ${atributo}\n\n` +
        `  📖 *DESCRIPCIÓN*\n  ${descripcion}\n\n` +
        `  🌐 Fuente: Wikipedia\n  ${encontrado.enlace}\n\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯\n       ⚡ *TITANBOT*`;

      if (encontrado.imagen) {
        try {
          const respuestaImagen = await fetch(encontrado.imagen, {
            headers: { "User-Agent": "TITANBOT/3.0" },
            signal: AbortSignal.timeout(15000)
          });
          if (!respuestaImagen.ok) throw new Error("Imagen no disponible");
          const buffer = Buffer.from(await respuestaImagen.arrayBuffer());
          await sock.sendMessage(chat, { image: buffer, caption }, { quoted: msg });
          return true;
        } catch (errorImagen) {
          console.log("⚠️ TITANBOT criatura aleatoria: imagen:", errorImagen.message);
        }
      }

      await sock.sendMessage(chat, { text: caption }, { quoted: msg });
      return true;
    }

    await enviarCriatura(sock, chat, nombre, msg);
    return true;
  } catch (error) {
    console.error("❌ Error en comando criatura:", error);
    await sock.sendMessage(chat, {
      text: "⚠️ No pude consultar el bestiario en este momento. Inténtalo de nuevo más tarde."
    }, { quoted: msg });
    return true;
  }
}

criatura.comandos = comandos;
module.exports = criatura;
