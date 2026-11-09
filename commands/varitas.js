// ============================================
// TITANBOT - COLECCION DE VARITAS HARRY POTTER
// Personajes: HP-API o respaldo local. 1.000.000 de modelos combinatorios TITANBOT.
// Sin IA. Sistema independiente de Cartas/Duelos/Casar.
// ============================================

const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "database");
const DB_FILE = path.join(DB_DIR, "varitas.json");
const CACHE_FILE = path.join(DB_DIR, "varitas_cache.json");
const API_URL = "https://hp-api.onrender.com/api/characters";
const CACHE_MS = 10 * 60 * 1000;

// Catálogo local mínimo: permite usar .varita incluso si HP-API nunca responde.
// Los datos se limitan a varitas conocidas; no se inventan medidas desconocidas.
const PERSONAJES_RESPALDO = [
  { id: "harry-potter", nombre: "Harry Potter", madera: "Acebo", nucleo: "Pluma de fénix", longitud: 11, imagen: null },
  { id: "hermione-granger", nombre: "Hermione Granger", madera: "Vid", nucleo: "Fibra de corazón de dragón", longitud: 10.75, imagen: null },
  { id: "ron-weasley", nombre: "Ron Weasley", madera: "Sauce", nucleo: "Pelo de unicornio", longitud: 14, imagen: null },
  { id: "draco-malfoy", nombre: "Draco Malfoy", madera: "Espino", nucleo: "Pelo de unicornio", longitud: 10, imagen: null },
  { id: "lord-voldemort", nombre: "Lord Voldemort", madera: "Tejo", nucleo: "Pluma de fénix", longitud: 13.5, imagen: null },
  { id: "bellatrix-lestrange", nombre: "Bellatrix Lestrange", madera: "Nogal", nucleo: "Fibra de corazón de dragón", longitud: 12.75, imagen: null },
  { id: "cedric-diggory", nombre: "Cedric Diggory", madera: "Fresno", nucleo: "Pelo de cola de unicornio", longitud: 12.25, imagen: null },
  { id: "fleur-delacour", nombre: "Fleur Delacour", madera: "Palo de rosa", nucleo: "Cabello de veela", longitud: 9.5, imagen: null },
  { id: "viktor-krum", nombre: "Viktor Krum", madera: "Carpe", nucleo: "Fibra de corazón de dragón", longitud: 10.25, imagen: null },
  { id: "elder-wand", nombre: "Varita de Saúco", madera: "Saúco", nucleo: "Pelo de cola de thestral", longitud: 15, imagen: null }
];

let cachePersonajes = null;
let cacheFecha = 0;

function asegurarDB() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ usuarios: {} }, null, 2));
  }
}

function cargarDB() {
  asegurarDB();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    if (!data.usuarios || typeof data.usuarios !== "object") data.usuarios = {};
    return data;
  } catch (error) {
    console.error("[VARITAS] Error leyendo varitas.json:", error);
    return { usuarios: {} };
  }
}

function guardarDB(data) {
  asegurarDB();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cargarCachePersonajes() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const guardado = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    if (!Array.isArray(guardado.personajes) || !guardado.personajes.length) return null;
    return guardado.personajes;
  } catch (error) {
    console.error("[VARITAS] No se pudo leer la caché:", error.message);
    return null;
  }
}

function guardarCachePersonajes(personajes) {
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    const temporal = `${CACHE_FILE}.tmp`;
    fs.writeFileSync(temporal, JSON.stringify({
      actualizado: new Date().toISOString(),
      personajes
    }, null, 2));
    fs.renameSync(temporal, CACHE_FILE);
  } catch (error) {
    // La caché es una mejora de respaldo; no debe impedir entregar una varita.
    console.error("[VARITAS] No se pudo guardar la caché:", error.message);
  }
}

async function obtenerPersonajes() {
  if (cachePersonajes && Date.now() - cacheFecha < CACHE_MS) {
    return cachePersonajes;
  }

  try {
    const respuesta = await fetch(API_URL, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "TITANBOT/1.1" }
    });

    if (!respuesta.ok) {
      throw new Error(`HP-API respondió con estado ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    if (!Array.isArray(datos)) {
      throw new Error("La API devolvió un formato inesperado.");
    }

    const personajes = datos
      .map((p) => {
        const wand = p.wand || {};
        return {
          id: String(p.id || `${p.name || "personaje"}-${p.house || ""}`),
          nombre: p.name || "Personaje desconocido",
          madera: wand.wood || p.wandWood || "Desconocida",
          nucleo: wand.core || p.wandCore || "Desconocido",
          longitud: wand.length || p.wandLength || null,
          imagen: p.image || null
        };
      })
      .filter((p) =>
        p.nombre !== "Personaje desconocido" &&
        p.madera !== "Desconocida" &&
        p.nucleo !== "Desconocido"
      );

    if (!personajes.length) {
      throw new Error("La API no devolvió personajes con datos de varita.");
    }

    cachePersonajes = personajes;
    cacheFecha = Date.now();
    guardarCachePersonajes(personajes);
    return personajes;
  } catch (error) {
    // Si HP-API está caída (por ejemplo, HTTP 503), usamos la última copia válida.
    const respaldo = cachePersonajes || cargarCachePersonajes() || PERSONAJES_RESPALDO;

    if (respaldo && respaldo.length) {
      cachePersonajes = respaldo;
      cacheFecha = Date.now();
      // Si aún no había caché, guardar también el catálogo local para próximos reinicios.
      guardarCachePersonajes(respaldo);
      console.warn(
        `[VARITAS] HP-API no disponible (${error.message}). Usando ${respaldo.length} personajes de respaldo.`
      );
      return respaldo;
    }

    throw new Error(
      `HP-API no está disponible (${error.message}) y no hay personajes de respaldo.`
    );
  }
}

// Catálogo combinatorio propio de TITANBOT: 100 maderas x 100 núcleos x 100 longitudes
// = 1.000.000 de modelos distintos. Son variantes originales del juego, no datos oficiales.
const MAX_VARITAS = 1_000_000;
const MADERAS_BASE = [
  "Roble", "Sauce", "Nogal", "Abedul", "Cerezo",
  "Fresno", "Arce", "Cedro", "Olmo", "Castaño"
];
const MADERAS_ESTILO = [
  "ancestral", "lunar", "estelar", "sombría", "dorada",
  "cristalina", "rúnica", " ígnea", "glacial", "encantada"
];
const NUCLEOS_BASE = [
  "Fibra de corazón de dragón", "Pluma de fénix", "Pelo de unicornio",
  "Cabello de veela", "Pelo de cola de thestral", "Bigote de troll",
  "Escama de sirena", "Polvo de estrella", "Esencia de salamandra", "Cristal mágico"
];
const NUCLEOS_ESTILO = [
  "antiguo", "lunar", "estelar", "de fuego", "de hielo",
  "de sombra", "de luz", "rúnico", "celestial", "del bosque"
];

function crearVaritaModelo(numero, personajes) {
  const maderaIndice = numero % 100;
  const nucleoIndice = Math.floor(numero / 100) % 100;
  const longitudIndice = Math.floor(numero / 10000) % 100;
  const personajeIndice = numero % personajes.length;
  const base = personajes[personajeIndice];
  const madera = `${MADERAS_BASE[Math.floor(maderaIndice / 10)]} ${MADERAS_ESTILO[maderaIndice % 10]}`.trim();
  const nucleo = `${NUCLEOS_BASE[Math.floor(nucleoIndice / 10)]} (${NUCLEOS_ESTILO[nucleoIndice % 10]})`;
  const longitud = Number((8 + longitudIndice / 10).toFixed(1));
  const modelo = numero + 1;
  return {
    id: `titan-varita-${numero}`,
    // Nombre propio y único para distinguir cada modelo de la colección.
    nombre: `Varita #${String(modelo).padStart(6, "0")} — ${madera}`,
    personaje: base.nombre,
    madera,
    nucleo,
    longitud,
    imagen: null,
    modelo
  };
}

function elegirModeloDisponible(usuario, personajes) {
  const obtenidas = new Set(usuario.varitas.map((v) => String(v.id)));
  if (obtenidas.size >= MAX_VARITAS) return null;

  // Intentos aleatorios para repartir las variantes; luego búsqueda secuencial garantizada.
  for (let intento = 0; intento < 150; intento++) {
    const numero = Math.floor(Math.random() * MAX_VARITAS);
    if (!obtenidas.has(`titan-varita-${numero}`)) {
      return crearVaritaModelo(numero, personajes);
    }
  }

  const inicio = Math.floor(Math.random() * MAX_VARITAS);
  for (let paso = 0; paso < MAX_VARITAS; paso++) {
    const numero = (inicio + paso) % MAX_VARITAS;
    if (!obtenidas.has(`titan-varita-${numero}`)) {
      return crearVaritaModelo(numero, personajes);
    }
  }
  return null;
}

// Estas probabilidades son propias de TITANBOT; no son rarezas oficiales.
function obtenerRareza() {
  const n = Math.random() * 100;
  if (n < 1) return "Mítica";
  if (n < 7) return "Legendaria";
  if (n < 20) return "Épica";
  if (n < 45) return "Rara";
  return "Común";
}

const ICONOS = {
  "Mítica": "🌌",
  "Legendaria": "👑",
  "Épica": "💜",
  "Rara": "💎",
  "Común": "🪄"
};

function obtenerUsuario(db, id) {
  if (!db.usuarios[id]) db.usuarios[id] = { varitas: [] };
  if (!Array.isArray(db.usuarios[id].varitas)) db.usuarios[id].varitas = [];
  return db.usuarios[id];
}

const VALORES_RAREZA = {
  "Común": 500,
  "Rara": 1500,
  "Épica": 3500,
  "Legendaria": 7500,
  "Mítica": 15000
};

function textoVarita(v, numero) {
  const icono = ICONOS[v.rareza] || "🪄";
  const valor = VALORES_RAREZA[v.rareza] || VALORES_RAREZA["Común"];
  const nombre = v.nombre || "Varita desconocida";
  return (
    `🎄╔══════════════════════╗🎄\n` +
    `❄️       *TITANBOT MÁGICO*       ❄️\n` +
    `╠══════════════════════╣\n` +
    `║ ${icono} *${nombre}*\n` +
    `║ ├ Madera: ${v.madera}\n` +
    `║ ├ Núcleo: ${v.nucleo}\n` +
    `║ ├ Longitud: ${v.longitud ? `${v.longitud} pulgadas` : "No registrada"}\n` +
    `║ ├ Rareza: *${v.rareza}*\n` +
    `║ └ Valor: *${valor.toLocaleString("es-CO")} TitanCoins*\n` +
    `╚══════════════════════╝🎄`
  );
}

async function varitas(sock, chat, comando, args, id, msg) {
  const permitidos = varitas.comandos;
  if (!permitidos.has(comando)) return false;

  try {
    if (comando === "varita") {
      const db = cargarDB();
      const usuario = obtenerUsuario(db, id);
      const personajes = await obtenerPersonajes();
      const personaje = elegirModeloDisponible(usuario, personajes);

      if (!personaje) {
        await sock.sendMessage(chat, {
          text: "🪄 *COLECCIÓN COMPLETA*\n\nYa conseguiste los 1.000.000 de modelos de varitas de TITANBOT."
        }, { quoted: msg });
        return true;
      }

      const nueva = {
        ...personaje,
        rareza: obtenerRareza(),
        fecha: new Date().toISOString()
      };

      usuario.varitas.push(nueva);
      guardarDB(db);

      const caption =
        `🎅❄️ *¡NUEVA VARITA OBTENIDA!* ❄️🎁\n\n` +
        `${textoVarita(nueva)}\n\n` +
        `📚 Colección: *${usuario.varitas.length} varita(s)*\n` +
        `🌟 Modelo: *${nueva.modelo.toLocaleString("es-CO")} / 1.000.000*\n` +
        `🎄⚡ *TITANBOT* ⚡🎄`;

      if (nueva.imagen && /^https?:\/\//i.test(nueva.imagen)) {
        try {
          await sock.sendMessage(chat, {
            image: { url: nueva.imagen },
            caption
          }, { quoted: msg });
        } catch (imageError) {
          await sock.sendMessage(chat, { text: caption }, { quoted: msg });
        }
      } else {
        await sock.sendMessage(chat, { text: caption }, { quoted: msg });
      }
      return true;
    }

    if (comando === "misvaritas") {
      const db = cargarDB();
      const usuario = obtenerUsuario(db, id);
      const lista = usuario.varitas;
      if (!lista.length) {
        await sock.sendMessage(chat, {
          text: "🪄 Todavía no tienes varitas.\n\nUsa *.varita* para conseguir tu primera varita."
        }, { quoted: msg });
        return true;
      }

      const porPagina = 10;
      const totalPaginas = Math.ceil(lista.length / porPagina);
      const paginaSolicitada = Number.parseInt(args[0], 10);
      const pagina = Number.isFinite(paginaSolicitada)
        ? Math.min(Math.max(paginaSolicitada, 1), totalPaginas)
        : 1;
      const inicio = (pagina - 1) * porPagina;
      const visibles = lista.slice(inicio, inicio + porPagina);

      const cuerpo = visibles
        .map((v, i) => textoVarita(v, inicio + i + 1))
        .join("\n\n");

      await sock.sendMessage(chat, {
        text:
          `🪄 *COLECCIÓN DE VARITAS*\n` +
          `👤 Coleccionista: ${id.split("@")[0]}\n` +
          `📦 Total: ${lista.length}\n\n` +
          `${cuerpo}\n\n` +
          `📄 Página ${pagina}/${totalPaginas}\n` +
          `Usa *.misvaritas 2* para cambiar de página.`
      }, { quoted: msg });
      return true;
    }

    if (comando === "varitainfo") {
      const busqueda = normalizar(args.join(" "));
      if (!busqueda) {
        await sock.sendMessage(chat, {
          text: "Indica el nombre de tu varita. Ejemplo: *.varitainfo Varita #000001*"
        }, { quoted: msg });
        return true;
      }

      const db = cargarDB();
      const usuario = obtenerUsuario(db, id);
      const encontrada = usuario.varitas.find((v) =>
        normalizar(v.nombre).includes(busqueda)
      );

      if (!encontrada) {
        await sock.sendMessage(chat, {
          text: "❌ No tienes una varita con ese nombre en tu colección."
        }, { quoted: msg });
        return true;
      }

      const caption = `🔎 *DETALLES DE TU VARITA*\n\n${textoVarita(encontrada)}\n\n⚡ TITANBOT`;
      if (encontrada.imagen && /^https?:\/\//i.test(encontrada.imagen)) {
        try {
          await sock.sendMessage(chat, {
            image: { url: encontrada.imagen },
            caption
          }, { quoted: msg });
        } catch (e) {
          await sock.sendMessage(chat, { text: caption }, { quoted: msg });
        }
      } else {
        await sock.sendMessage(chat, { text: caption }, { quoted: msg });
      }
      return true;
    }

    if (comando === "topvaritas") {
      const db = cargarDB();
      const ranking = Object.entries(db.usuarios)
        .map(([usuarioId, datos]) => ({
          id: usuarioId,
          total: Array.isArray(datos.varitas) ? datos.varitas.length : 0
        }))
        .filter((u) => u.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      if (!ranking.length) {
        await sock.sendMessage(chat, {
          text: "🏆 Todavía no hay coleccionistas en el ranking."
        }, { quoted: msg });
        return true;
      }

      const medallas = ["🥇", "🥈", "🥉"];
      const lineas = ranking.map((u, i) =>
        `${medallas[i] || `${i + 1}.`} @${u.id.split("@")[0]} — *${u.total}* varita(s)`
      );

      await sock.sendMessage(chat, {
        text: `🏆 *RANKING DE COLECCIONISTAS*\n\n${lineas.join("\n")}\n\n⚡ TITANBOT`,
        mentions: ranking.map((u) => u.id)
      }, { quoted: msg });
      return true;
    }

    return false;
  } catch (error) {
    console.error("[VARITAS] Error:", error);
    await sock.sendMessage(chat, {
      text:
        "❌ No pude completar el comando de varitas.\n" +
        "La API está temporalmente fuera de servicio y no hay datos guardados suficientes para continuar. Inténtalo más tarde."
    }, { quoted: msg });
    return true;
  }
}

varitas.comandos = new Set([
  "varita",
  "misvaritas",
  "varitainfo",
  "topvaritas"
]);

module.exports = varitas;
