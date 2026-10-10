// =====================================================
// 🎃 TITANBOT — LIBRO PROHIBIDO | EDICIÓN OCTUBRE
// Sin IA, sin API y sin dependencias adicionales.
// =====================================================
const fs = require("fs");
const path = require("path");
const config = require("../config");

const ROOT = path.join(__dirname, "..");
const DB_DIR = path.join(ROOT, "database");
const USERS_FILE = path.join(DB_DIR, "libro_usuarios.json");
const SPELLS_FILE = path.join(DB_DIR, "libro_hechizos.json");
const ECONOMY_FILE = path.join(DB_DIR, "users.json");

const MAX_ENERGIA = 100;
const REGEN_MS = 2 * 60 * 1000; // 1 punto cada 2 minutos
const DURACION_MALDICION_MS = 10 * 60 * 1000;
const DURACION_ESCUDO_MS = 15 * 60 * 1000;

function asegurarArchivos() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}");
  if (!fs.existsSync(SPELLS_FILE)) {
    fs.writeFileSync(SPELLS_FILE, JSON.stringify(HECHIZOS_BASE, null, 2));
  }
}

const HECHIZOS_BASE = {
  "sombra": { nombre: "Sombra Errante", emoji: "🌑", coste: 10, rango: 1, descripcion: "Una sombra rodea al objetivo y lo confunde por unos instantes." },
  "escudo": { nombre: "Escudo Umbrío", emoji: "🛡️", coste: 15, rango: 1, descripcion: "Levanta una protección mágica temporal." },
  "chispa": { nombre: "Chispa Arcana", emoji: "✨", coste: 10, rango: 1, descripcion: "Libera una descarga de energía arcana." },
  "vinculo": { nombre: "Vínculo de Humo", emoji: "🕸️", coste: 20, rango: 2, descripcion: "Un vínculo de humo marca al objetivo." },
  "niebla": { nombre: "Niebla Negra", emoji: "🌫️", coste: 20, rango: 2, descripcion: "Una niebla cubre el lugar durante el conjuro." },
  "cuervo": { nombre: "Llamado del Cuervo", emoji: "🐦‍⬛", coste: 25, rango: 2, descripcion: "Un cuervo espectral lleva un presagio." },
  "dominacion": { nombre: "Dominación Oscura", emoji: "👁️", coste: 35, rango: 3, descripcion: "Una marca de autoridad mágica aparece sobre el objetivo." },
  "portal": { nombre: "Portal de Sombras", emoji: "🌀", coste: 40, rango: 3, descripcion: "Abre un portal ficticio a un reino sombrío." },
  "supremo": { nombre: "Edicto del Grimorio", emoji: "👑", coste: 0, rango: 4, descripcion: "Poder reservado al propietario del bot." }
};

function leerJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return data && typeof data === "object" ? data : fallback;
  } catch (e) {
    console.error("📕 Error leyendo", path.basename(file), e.message);
    return fallback;
  }
}

function guardarJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function obtenerHechizos() {
  asegurarArchivos();
  const datos = leerJSON(SPELLS_FILE, HECHIZOS_BASE);
  return { ...HECHIZOS_BASE, ...datos };
}

function normalizarId(id) {
  return String(id || "").replace(/:\d+@/, "@").trim();
}

function obtenerPerfil(db, id) {
  const key = normalizarId(id) || "desconocido";
  if (!db[key]) {
    db[key] = {
      energia: MAX_ENERGIA,
      ultimaRegeneracion: Date.now(),
      rango: 1,
      experienciaMagica: 0,
      hechizos: ["sombra", "escudo", "chispa"],
      proteccionHasta: 0,
      maldiciones: {},
      rituales: 0
    };
  }
  const p = db[key];
  if (typeof p.energia !== "number") p.energia = MAX_ENERGIA;
  if (typeof p.ultimaRegeneracion !== "number") p.ultimaRegeneracion = Date.now();
  if (!Array.isArray(p.hechizos)) p.hechizos = ["sombra", "escudo", "chispa"];
  if (!p.maldiciones || typeof p.maldiciones !== "object") p.maldiciones = {};
  if (typeof p.experienciaMagica !== "number") p.experienciaMagica = 0;
  if (typeof p.rituales !== "number") p.rituales = 0;
  if (typeof p.proteccionHasta !== "number") p.proteccionHasta = 0;

  const elapsed = Math.max(0, Date.now() - p.ultimaRegeneracion);
  const gained = Math.floor(elapsed / REGEN_MS);
  if (gained > 0) {
    p.energia = Math.min(MAX_ENERGIA, p.energia + gained);
    p.ultimaRegeneracion += gained * REGEN_MS;
    if (p.energia >= MAX_ENERGIA) p.ultimaRegeneracion = Date.now();
  }
  p.energia = Math.max(0, Math.min(MAX_ENERGIA, p.energia));
  p.rango = p.experienciaMagica >= 500 ? 4 : p.experienciaMagica >= 220 ? 3 : p.experienciaMagica >= 80 ? 2 : 1;
  return p;
}

function nombreRango(rango) {
  return ({
    1: "Aprendiz de las Sombras",
    2: "Hechicero Oscuro",
    3: "Maestro del Grimorio",
    4: "Señor de las Sombras"
  })[rango] || "Aprendiz de las Sombras";
}

function extraerMenciones(msg) {
  const ctx = msg?.message?.extendedTextMessage?.contextInfo ||
    msg?.message?.imageMessage?.contextInfo ||
    msg?.message?.videoMessage?.contextInfo || {};
  return Array.isArray(ctx.mentionedJid) ? ctx.mentionedJid : [];
}

function idAutor(msg, id) {
  return normalizarId(msg?.key?.participant || id || msg?.key?.remoteJid);
}

function esOwner(id) {
  const candidatos = [
    process.env.OWNER_NUMBER,
    config.owner,
    config.ownerNumber,
    config.numeroOwner,
    config.numeroCreador,
    config.creador,
    ...(Array.isArray(config.owners) ? config.owners : [])
  ].filter(Boolean).map(v => String(v).replace(/\D/g, ""));
  const actual = String(id || "").replace(/\D/g, "");
  if (!actual) return false;
  return candidatos.some(n => n && (actual.endsWith(n) || n.endsWith(actual)));
}

async function esAdminGrupo(sock, chat, id) {
  if (!chat.endsWith("@g.us")) return false;
  try {
    const metadata = await sock.groupMetadata(chat);
    const actual = normalizarId(id);
    const participante = (metadata.participants || []).find(p =>
      normalizarId(p.id) === actual ||
      normalizarId(p.phoneNumber) === actual ||
      (actual.endsWith("@lid") && normalizarId(p.lid) === actual)
    );
    return participante?.admin === "admin" || participante?.admin === "superadmin";
  } catch {
    return false;
  }
}

function cobrar(perfil, coste) {
  if (perfil.energia < coste) return false;
  perfil.energia -= coste;
  return true;
}

function darMonedas(id, cantidad) {
  try {
    const db = leerJSON(ECONOMY_FILE, {});
    const key = normalizarId(id);
    if (!key || !db || typeof db !== "object") return false;
    if (!db[key]) db[key] = { nombre: "Usuario", dinero: 500, banco: 0, inventario: {} };
    if (typeof db[key].dinero !== "number") db[key].dinero = 500;
    if (typeof db[key].banco !== "number") db[key].banco = 0;
    if (!db[key].inventario || typeof db[key].inventario !== "object") db[key].inventario = {};
    db[key].dinero += cantidad;
    guardarJSON(ECONOMY_FILE, db);
    return true;
  } catch (e) {
    console.error("📕 No se pudo aplicar la recompensa económica:", e.message);
    return false;
  }
}

async function libro(sock, chat, comando, args, id, msg) {
  const permitidos = new Set(["libro", "hechizo", "ojo", "invocar", "maldicion", "maldición", "proteccion", "protección", "ritual"]);
  if (!permitidos.has(String(comando || "").toLowerCase())) return false;

  asegurarArchivos();
  const db = leerJSON(USERS_FILE, {});
  const actor = idAutor(msg, id);
  const perfil = obtenerPerfil(db, actor);
  const hechizos = obtenerHechizos();
  const menciones = extraerMenciones(msg);
  const objetivo = menciones[0] || actor;
  const esPropietario = esOwner(id) || esOwner(actor);
  const esAdmin = await esAdminGrupo(sock, chat, actor);
  const alias = String(comando).toLowerCase();

  try {
    if (alias === "libro") {
      if (String(args[0] || "").toLowerCase() === "supremo" && !esPropietario) {
        await sock.sendMessage(chat, { text: `🎃🔒 *SELLO SUPREMO* 🔒🎃\n🕯️ Solo el propietario de TITANBOT puede abrir esta página prohibida.` });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      const lista = perfil.hechizos.map(k => {
        const h = hechizos[k];
        return h ? `${h.emoji} ${h.nombre} (${h.coste} energía)` : `✨ ${k}`;
      }).join("\n") || "Ninguno";
      const regen = Math.max(0, Math.ceil((REGEN_MS - (Date.now() - perfil.ultimaRegeneracion)) / 60000));
      await sock.sendMessage(chat, { text:
`🎃🕸️ ═══ LIBRO PROHIBIDO ═══ 🕸️🎃
🕯️ *EDICIÓN ESPECIAL DE OCTUBRE* 🦇
🌘 Portador: @${actor.split("@")[0]}
🜏 Rango: ${nombreRango(perfil.rango)}
⚡ Energía: ${perfil.energia}/${MAX_ENERGIA}
⏳ Próximo punto de energía: ${perfil.energia >= MAX_ENERGIA ? "completa" : `aprox. ${regen} min`}
✨ Experiencia mágica: ${perfil.experienciaMagica}
📜 Rituales completados: ${perfil.rituales}

🦇 ══ HECHIZOS DESBLOQUEADOS ══ 🦇
${lista}

🎃 ══ COMANDOS DEL GRIMORIO ══ 🎃
📖 .libro — Abre el grimorio
🪄 .hechizo [hechizo] [@usuario] — Conjura magia
👁️ .ojo — Revela un secreto
🌑 .invocar — Llama a una criatura
💀 .maldicion @usuario — Marca con sombras
🛡️ .proteccion — Activa el escudo umbrío
🔥 .ritual — Realiza un ritual

🕸️ *En octubre, las sombras despiertan…*`,
        mentions: [actor] });
      guardarJSON(USERS_FILE, db);
      return true;
    }

    if (alias === "ojo") {
      const secretos = [
        "🎃👁️ El ojo del grimorio revela una puerta que solo aparece bajo la luna de octubre.",
        "🕯️📜 Una página en blanco acaba de escribir tu nombre… con tinta negra.",
        "🐦‍⬛🕸️ El cuervo conoce un secreto de Halloween, pero exige una chispa de energía.",
        "🌑🎃 La sombra más larga apunta hacia un hechizo sellado desde la noche de octubre.",
        "🔮🦇 El libro susurra: quien domina su energía, domina su destino… incluso en Halloween."
      ];
      if (!cobrar(perfil, 5)) {
        await sock.sendMessage(chat, { text: `🎃⚡ ¡La energía oscura no alcanza! Tienes ${perfil.energia}/${MAX_ENERGIA}.
🕯️ Espera a que el grimorio recupere su poder.` });
      } else {
        await sock.sendMessage(chat, { text: secretos[Math.floor(Math.random() * secretos.length)] });
      }
      guardarJSON(USERS_FILE, db);
      return true;
    }

    if (alias === "invocar") {
      const criaturas = [
        ["🐦‍⬛", "Cuervo espectral", "vigila el chat durante un instante"],
        ["🐺", "Lobo de humo", "custodia el grimorio"],
        ["🦇", "Murciélago nocturno", "trae una señal del reino oscuro"],
        ["🐈‍⬛", "Gato de sombra", "se acomoda junto a las páginas"],
        ["👻", "Espíritu guardián", "acepta proteger al portador"]
      ];
      const coste = esPropietario ? 0 : esAdmin && chat.endsWith("@g.us") ? 10 : 15;
      if (!cobrar(perfil, coste)) {
        await sock.sendMessage(chat, { text: `🎃⚡ La magia se está agotando.
🕯️ Coste: ${coste} de energía
🔋 Disponible: ${perfil.energia}` });
      } else {
        const c = criaturas[Math.floor(Math.random() * criaturas.length)];
        perfil.experienciaMagica += 8;
        await sock.sendMessage(chat, { text: `🎃🕯️ ══ INVOCACIÓN DE OCTUBRE ══ 🕯️🎃\n\n${c[0]} *${c[1]}* ${c[2]}.\n🜏 Portador: @${actor.split("@")[0]}\n⚡ Energía: ${perfil.energia}/${MAX_ENERGIA}${esAdmin && chat.endsWith("@g.us") ? "\n👑 Poder de administrador reconocido." : ""}`, mentions: [actor] });
      }
      guardarJSON(USERS_FILE, db);
      return true;
    }

    if (alias === "proteccion" || alias === "protección") {
      const coste = esPropietario ? 0 : 15;
      if (!cobrar(perfil, coste)) {
        await sock.sendMessage(chat, { text: `🎃🛡️ El escudo sigue sellado: no tienes energía suficiente.
🕯️ Coste: ${coste} | Disponible: ${perfil.energia}` });
      } else {
        perfil.proteccionHasta = Date.now() + DURACION_ESCUDO_MS;
        perfil.experienciaMagica += 5;
        await sock.sendMessage(chat, { text: `🎃🛡️ ══ ESCUDO UMBRÍO ACTIVADO ══ 🛡️🎃\n\n🕯️ @${actor.split("@")[0]}, las sombras te rodean y te protegen contra maldiciones del Libro durante 15 minutos.\n⚡ Energía: ${perfil.energia}/${MAX_ENERGIA}`, mentions: [actor] });
      }
      guardarJSON(USERS_FILE, db);
      return true;
    }

    if (alias === "maldicion" || alias === "maldición") {
      if (!menciones.length) {
        await sock.sendMessage(chat, { text: `🎃💀 *FALTA EL OBJETIVO* 💀🎃\n🕸️ Menciona a alguien para lanzar la maldición.\n📜 Ejemplo: .maldicion @usuario` });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      if (normalizarId(objetivo) === actor) {
        await sock.sendMessage(chat, { text: "🎃📕 El grimorio prohíbe lanzar esta maldición sobre tu propia sombra." });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      const coste = esPropietario ? 0 : esAdmin && chat.endsWith("@g.us") ? 20 : 30;
      if (!cobrar(perfil, coste)) {
        await sock.sendMessage(chat, { text: `⚡ Energía insuficiente. Coste: ${coste}; tienes ${perfil.energia}.` });
      } else {
        const objetivoKey = normalizarId(objetivo);
        const dbObjetivo = obtenerPerfil(db, objetivoKey);
        if (dbObjetivo.proteccionHasta > Date.now() && !esPropietario) {
          await sock.sendMessage(chat, { text: `🎃🛡️ ¡La protección mágica de @${objetivoKey.split("@")[0]} ha rechazado la maldición! 🕯️`, mentions: [objetivo] });
        } else {
          dbObjetivo.maldiciones[chat] = Date.now() + DURACION_MALDICION_MS;
          perfil.experienciaMagica += 12;
          await sock.sendMessage(chat, { text: `🎃💀 ══ MALDICIÓN DE OCTUBRE ══ 💀🎃\n\n@${actor.split("@")[0]} lanza una marca de sombras sobre @${objetivoKey.split("@")[0]}.\n⏳ Efecto de rol: 10 minutos.\n📕 La marca queda registrada en el grimorio.${esAdmin && chat.endsWith("@g.us") ? "\n👑 Maldición reforzada por autoridad de administrador." : ""}`, mentions: [actor, objetivo] });
        }
      }
      guardarJSON(USERS_FILE, db);
      return true;
    }

    if (alias === "ritual") {
      if (perfil.rituales > 0 && Date.now() - (perfil.ultimoRitual || 0) < 60 * 60 * 1000) {
        const restante = Math.ceil((60 * 60 * 1000 - (Date.now() - perfil.ultimoRitual)) / 60000);
        await sock.sendMessage(chat, { text: `🎃🕯️ El círculo de Halloween aún está enfriándose.
⏳ Vuelve en ${restante} min.` });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      const coste = esPropietario ? 0 : 10;
      if (!cobrar(perfil, coste)) {
        await sock.sendMessage(chat, { text: `⚡ Necesitas ${coste} de energía para iniciar el ritual.` });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      perfil.rituales++;
      perfil.ultimoRitual = Date.now();
      perfil.experienciaMagica += 25;
      let extra = "";
      const tipoRecompensa = Math.floor(Math.random() * 4);
      if (tipoRecompensa === 0) {
        perfil.energia = Math.min(MAX_ENERGIA, perfil.energia + 25);
        extra = "⚡ Recuperas 25 puntos de energía.";
      } else if (tipoRecompensa === 1) {
        const aplicada = darMonedas(actor, 100);
        extra = aplicada
          ? "💰 El grimorio te concede 100 TitanCoins."
          : "🔮 El grimorio guarda una recompensa para otro ritual.";
      } else if (tipoRecompensa === 2) {
        perfil.experienciaMagica += 20;
        extra = "✨ Ganas 20 puntos extra de experiencia mágica.";
      } else {
        const bloqueados = Object.keys(hechizos).filter(k => !perfil.hechizos.includes(k) && k !== "supremo" && hechizos[k].rango <= Math.min(3, perfil.rango + 1));
        if (bloqueados.length) {
          const k = bloqueados[Math.floor(Math.random() * bloqueados.length)];
          perfil.hechizos.push(k);
          extra = `🔓 Desbloqueaste: ${hechizos[k].emoji} ${hechizos[k].nombre}.`;
        } else {
          perfil.energia = Math.min(MAX_ENERGIA, perfil.energia + 15);
          extra = "⚡ Ya conoces los hechizos disponibles de tu rango; recuperas 15 de energía.";
        }
      }
      await sock.sendMessage(chat, { text: `🎃🕯️ ═══ RITUAL DE OCTUBRE COMPLETADO ═══ 🕯️🎃\n\n${extra}\n✨ Experiencia mágica: ${perfil.experienciaMagica}\n📕 Rango: ${nombreRango(perfil.rango)}\n⚡ Energía: ${perfil.energia}/${MAX_ENERGIA}` });
      guardarJSON(USERS_FILE, db);
      return true;
    }

    if (alias === "hechizo") {
      let nombreHechizo = String(args.find(a => !a.startsWith("@")) || "sombra").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (nombreHechizo === "dominacionoscura") nombreHechizo = "dominacion";
      if (nombreHechizo === "vinculodehumo") nombreHechizo = "vinculo";
      if (nombreHechizo === "niegranegra") nombreHechizo = "niebla";
      const h = hechizos[nombreHechizo];
      if (!h) {
        await sock.sendMessage(chat, { text: `🎃📖 Hechizo desconocido: ${nombreHechizo}.\n🕸️ Usa .libro para consultar las páginas desbloqueadas del grimorio.` });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      if (nombreHechizo === "supremo" && !esPropietario) {
        await sock.sendMessage(chat, { text: "🎃👑 El Edicto del Grimorio permanece sellado; solo el propietario de TITANBOT puede pronunciarlo." });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      if (!perfil.hechizos.includes(nombreHechizo) && nombreHechizo !== "supremo" && !esPropietario) {
        await sock.sendMessage(chat, { text: `🎃🔒 ${h.nombre} aún está sellado entre las páginas prohibidas.
🔥 Intenta desbloquearlo mediante .ritual.` });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      if (nombreHechizo !== "supremo" && perfil.rango < h.rango && !esPropietario) {
        await sock.sendMessage(chat, { text: `🎃🔒 Las sombras aún no te reconocen. Necesitas rango ${h.rango} para usar ${h.nombre}.` });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      const coste = esPropietario ? 0 : h.coste;
      if (!cobrar(perfil, coste)) {
        await sock.sendMessage(chat, { text: `🎃⚡ La energía oscura es insuficiente para ${h.nombre}.
🕯️ Coste: ${coste} | Disponible: ${perfil.energia}` });
        guardarJSON(USERS_FILE, db);
        return true;
      }
      const objetivoKey = normalizarId(objetivo);
      if (menciones.length && nombreHechizo !== "supremo") {
        const dbObjetivo = obtenerPerfil(db, objetivoKey);
        if (dbObjetivo.proteccionHasta > Date.now() && !esPropietario) {
          await sock.sendMessage(chat, { text: `🎃🛡️ ¡El escudo de @${objetivoKey.split("@")[0]} desvía el conjuro entre chispas mágicas!`, mentions: [objetivo] });
          guardarJSON(USERS_FILE, db);
          return true;
        }
        dbObjetivo.maldiciones[chat] = Date.now() + 2 * 60 * 1000;
      }
      perfil.experienciaMagica += 5;
      const targetText = menciones.length ? `\n🎯 Objetivo: @${objetivoKey.split("@")[0]}` : "";
      const poder = nombreHechizo === "supremo"
        ? "👑 La voluntad del propietario se impone: todos reconocen la autoridad del Grimorio."
        : `${h.emoji} ${h.descripcion}`;
      await sock.sendMessage(chat, { text: `🎃📕 ══ ${h.nombre.toUpperCase()} ══ 📕🎃\n\n${poder}${targetText}\n\n🜏 Portador: @${actor.split("@")[0]}\n⚡ Energía: ${perfil.energia}/${MAX_ENERGIA}`, mentions: menciones.length ? [actor, objetivo] : [actor] });
      guardarJSON(USERS_FILE, db);
      return true;
    }

    return false;
  } catch (error) {
    console.error("📕 Error en Libro Prohibido:", error);
    await sock.sendMessage(chat, { text: "🎃📕 Las páginas del grimorio se agitaron y el conjuro falló. Inténtalo de nuevo. 🕯️" }).catch(() => {});
    guardarJSON(USERS_FILE, db);
    return true;
  }
}

module.exports = libro;
