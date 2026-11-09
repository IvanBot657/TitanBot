// ============================================
// ⚡ TITAN POKÉMON - COLECCIÓN OFICIAL
// API: PokéAPI (sin IA)
// Comandos: .pokemon, .mispokemon, .pokemoninfo,
//           .toppokemon, .pokebuscar
// ============================================

const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "database");
const DATA_FILE = path.join(DB_DIR, "pokemon.json");
const CACHE_FILE = path.join(DB_DIR, "pokemon_cache.json");

const MAX_POKEMON = 1025;
const API = "https://pokeapi.co/api/v2";
const ARTWORK = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const comandos = new Set([
  "pokemon",
  "mispokemon",
  "pokemoninfo",
  "toppokemon",
  "pokebuscar"
]);

const TIPOS = {
  normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico",
  grass: "Planta", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
  ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
  rock: "Roca", ghost: "Fantasma", dragon: "Dragón", dark: "Siniestro",
  steel: "Acero", fairy: "Hada"
};

function asegurarArchivos() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ usuarios: {} }, null, 2));
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify({}, null, 2));
}

function leerJSON(file, fallback) {
  asegurarArchivos();
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function guardarJSON(file, data) {
  asegurarArchivos();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function nombreBonito(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

async function apiJSON(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) {
    if (response.status === 404) throw new Error("No encontré ese Pokémon en la PokéAPI.");
    throw new Error(`PokéAPI respondió con estado ${response.status}.`);
  }
  return response.json();
}

async function obtenerPokemon(identificador) {
  const cache = leerJSON(CACHE_FILE, {});
  const key = String(identificador).toLowerCase().trim();

  if (cache[key]) return cache[key];

  const pokemon = await apiJSON(`${API}/pokemon/${encodeURIComponent(key)}`);
  let especie = {};
  try {
    especie = await apiJSON(`${API}/pokemon-species/${pokemon.id}`);
  } catch {}

  const nombreES = especie.names?.find(item => item.language.name === "es")?.name;
  const descripcionES = especie.flavor_text_entries?.find(item => item.language.name === "es")?.flavor_text;
  const nombre = nombreES || nombreBonito(pokemon.name);
  const imagen = pokemon.sprites?.other?.["official-artwork"]?.front_default
    || `${ARTWORK}/${pokemon.id}.png`;

  const datos = {
    id: pokemon.id,
    nombre,
    nombreApi: pokemon.name,
    imagen,
    tipos: pokemon.types.map(item => TIPOS[item.type.name] || nombreBonito(item.type.name)),
    altura: pokemon.height / 10,
    peso: pokemon.weight / 10,
    habilidades: pokemon.abilities.map(item => nombreBonito(item.ability.name)),
    estadisticas: pokemon.stats.map(item => ({
      nombre: nombreBonito(item.stat.name),
      valor: item.base_stat
    })),
    descripcion: descripcionES ? descripcionES.replace(/\s+/g, " ") : "Información oficial de la PokéAPI."
  };

  cache[key] = datos;
  cache[String(pokemon.id)] = datos;
  cache[pokemon.name] = datos;
  guardarJSON(CACHE_FILE, cache);
  return datos;
}

function idUsuario(id) {
  return String(id || "").split(":")[0];
}

function etiquetaNumero(n) {
  return String(n).padStart(4, "0");
}

async function enviarPokemon(sock, chat, pokemon, caption, msg) {
  const contenido = {
    image: { url: pokemon.imagen },
    caption
  };
  await sock.sendMessage(chat, contenido, msg ? { quoted: msg } : {});
}

async function manejar(sock, chat, comando, args = [], id, msg) {
  if (!comandos.has(comando)) return false;

  try {
    if (comando === "pokemon") {
      const numero = Math.floor(Math.random() * MAX_POKEMON) + 1;
      const pokemon = await obtenerPokemon(numero);
      const db = leerJSON(DATA_FILE, { usuarios: {} });
      const usuarioId = idUsuario(id);

      if (!db.usuarios[usuarioId]) db.usuarios[usuarioId] = { pokemon: {} };
      const coleccion = db.usuarios[usuarioId].pokemon;
      const clave = String(pokemon.id);
      const existente = coleccion[clave];

      if (existente) {
        existente.cantidad = (existente.cantidad || 1) + 1;
        existente.ultimaCaptura = new Date().toISOString();
      } else {
        coleccion[clave] = {
          id: pokemon.id,
          nombre: pokemon.nombre,
          imagen: pokemon.imagen,
          tipos: pokemon.tipos,
          cantidad: 1,
          capturadoEn: new Date().toISOString(),
          ultimaCaptura: new Date().toISOString()
        };
      }

      guardarJSON(DATA_FILE, db);
      const total = Object.keys(coleccion).length;
      const repetido = existente ? `\n🔁 Repetido: ahora tienes ${existente.cantidad}.` : "\n✨ ¡Nuevo Pokémon en tu colección!";
      await enviarPokemon(
        sock, chat, pokemon,
        `╭━━━ ⚡ TITAN POKÉMON ━━━╮\n` +
        `┃ #${etiquetaNumero(pokemon.id)} · ${pokemon.nombre}\n` +
        `┃ ${pokemon.tipos.join(" / ")}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯\n` +
        `🎒 Pokémon diferentes: ${total}${repetido}`,
        msg
      );
      return true;
    }

    if (comando === "mispokemon") {
      const db = leerJSON(DATA_FILE, { usuarios: {} });
      const coleccion = db.usuarios[idUsuario(id)]?.pokemon || {};
      const lista = Object.values(coleccion).sort((a, b) => a.id - b.id);

      if (!lista.length) {
        await sock.sendMessage(chat, { text: "🎒 Tu colección está vacía.\nUsa .pokemon para conseguir tu primer Pokémon." }, { quoted: msg });
        return true;
      }

      const pagina = Math.max(1, parseInt(args[0], 10) || 1);
      const porPagina = 12;
      const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
      const actual = Math.min(pagina, paginas);
      const elementos = lista.slice((actual - 1) * porPagina, actual * porPagina);
      const lineas = elementos.map(p => `• #${etiquetaNumero(p.id)} ${p.nombre} ×${p.cantidad || 1}`);
      await sock.sendMessage(chat, {
        text: `╭━━ 🎒 MI COLECCIÓN ━━╮\n${lineas.join("\n")}\n╰━━━━━━━━━━━━━━━━╯\n📦 Diferentes: ${lista.length}\n📄 Página ${actual}/${paginas}\n\nSiguiente página: .mispokemon ${Math.min(actual + 1, paginas)}`
      }, { quoted: msg });
      return true;
    }

    if (comando === "pokemoninfo" || comando === "pokebuscar") {
      const busqueda = args.join(" ").trim();
      if (!busqueda) {
        await sock.sendMessage(chat, { text: `🔎 Escribe un nombre o número.\nEjemplo: .${comando} Pikachu` }, { quoted: msg });
        return true;
      }

      const pokemon = await obtenerPokemon(busqueda.toLowerCase());
      const stats = pokemon.estadisticas.map(s => `• ${s.nombre}: ${s.valor}`).join("\n");
      await enviarPokemon(
        sock, chat, pokemon,
        `╭━━━ 📘 POKÉDEX TITAN ━━━╮\n` +
        `┃ #${etiquetaNumero(pokemon.id)} · ${pokemon.nombre}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n` +
        `🏷️ Tipo: ${pokemon.tipos.join(" / ")}\n` +
        `📏 Altura: ${pokemon.altura} m\n` +
        `⚖️ Peso: ${pokemon.peso} kg\n` +
        `✨ Habilidades: ${pokemon.habilidades.join(", ")}\n\n` +
        `📊 ESTADÍSTICAS\n${stats}\n\n` +
        `📖 ${pokemon.descripcion}`,
        msg
      );
      return true;
    }

    if (comando === "toppokemon") {
      const db = leerJSON(DATA_FILE, { usuarios: {} });
      const ranking = Object.entries(db.usuarios || {}).map(([jid, data]) => {
        const pokemon = Object.values(data.pokemon || {});
        return {
          jid,
          cantidad: pokemon.length,
          capturados: pokemon.reduce((suma, p) => suma + (p.cantidad || 1), 0)
        };
      }).filter(item => item.cantidad > 0)
        .sort((a, b) => b.cantidad - a.cantidad || b.capturados - a.capturados)
        .slice(0, 10);

      if (!ranking.length) {
        await sock.sendMessage(chat, { text: "🏆 Todavía no hay entrenadores en el ranking. ¡Usa .pokemon!" }, { quoted: msg });
        return true;
      }

      const menciones = ranking.map((r, i) => `${i + 1}. @${r.jid.split("@")[0]}\n   🎒 ${r.cantidad} diferentes · ${r.capturados} capturas`);
      await sock.sendMessage(chat, {
        text: `╭━━ 🏆 TOP TITAN POKÉMON ━━╮\n${menciones.join("\n")}\n╰━━━━━━━━━━━━━━━━━━━━━━╯`,
        mentions: ranking.map(r => r.jid)
      }, { quoted: msg });
      return true;
    }
  } catch (error) {
    console.error("[TITAN POKÉMON]", error);
    await sock.sendMessage(chat, {
      text: `❌ No pude completar el comando Pokémon.\n${error.message || "Error inesperado"}\n\nInténtalo nuevamente en unos segundos.`
    }, { quoted: msg });
    return true;
  }

  return false;
}

manejar.comandos = comandos;
module.exports = manejar;
