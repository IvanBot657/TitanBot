const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "database");
const DB_FILE = path.join(DB_DIR, "administracion-grupos.json");
const WARN_FILE = path.join(DB_DIR, "advertencias.json");

const REGLAS_PREDETERMINADAS = [
  "No enviar spam, flood ni mensajes repetidos.",
  "Respetar a todos los miembros; no insultar ni acosar.",
  "No enviar contenido inapropiado o que incumpla la ley.",
  "No hacer publicidad sin autorización de los administradores.",
  "No compartir enlaces sospechosos ni intentar estafas."
];

function asegurarArchivo(archivo) {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(archivo)) fs.writeFileSync(archivo, "{}");
}

function leer(archivo) {
  asegurarArchivo(archivo);
  try {
    const data = JSON.parse(fs.readFileSync(archivo, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    console.error(`[ADMIN] No se pudo leer ${path.basename(archivo)}:`, error.message);
    return {};
  }
}

function guardar(archivo, data) {
  asegurarArchivo(archivo);
  fs.writeFileSync(archivo, JSON.stringify(data, null, 2));
}

function configGrupo(grupo) {
  const db = leer(DB_FILE);
  if (!db[grupo]) {
    db[grupo] = {
      alertasAdministradores: false,
      botActivo: true,
      antispamActivo: true,
      reglas: [...REGLAS_PREDETERMINADAS]
    };
    guardar(DB_FILE, db);
  } else {
    let cambio = false;
    if (typeof db[grupo].alertasAdministradores !== "boolean") {
      db[grupo].alertasAdministradores = false;
      cambio = true;
    }
    if (typeof db[grupo].botActivo !== "boolean") {
      db[grupo].botActivo = true;
      cambio = true;
    }
    if (typeof db[grupo].antispamActivo !== "boolean") {
      db[grupo].antispamActivo = true;
      cambio = true;
    }
    if (!Array.isArray(db[grupo].reglas)) {
      db[grupo].reglas = [...REGLAS_PREDETERMINADAS];
      cambio = true;
    }
    if (cambio) guardar(DB_FILE, db);
  }
  return db[grupo];
}

function guardarConfig(grupo, config) {
  const db = leer(DB_FILE);
  db[grupo] = config;
  guardar(DB_FILE, db);
}

function botActivo(grupo) {
  if (!grupo || !grupo.endsWith("@g.us")) return true;
  return configGrupo(grupo).botActivo !== false;
}

function normalizarJid(jid) {
  return String(jid || "").trim().replace(/:\d+@/, "@");
}

function obtenerObjetivo(args, msg) {
  const contexto = msg?.message?.extendedTextMessage?.contextInfo ||
    msg?.message?.imageMessage?.contextInfo ||
    msg?.message?.videoMessage?.contextInfo || {};
  const mencionado = contexto.mentionedJid?.[0];
  if (mencionado) return normalizarJid(mencionado);

  const valor = String(args?.[0] || "").replace(/[<>,]/g, "").trim();
  if (!valor) return null;
  if (valor.includes("@")) return normalizarJid(valor);
  const numero = valor.replace(/\D/g, "");
  return numero.length >= 7 ? `${numero}@s.whatsapp.net` : null;
}

function esComandoAdmin(comando) {
  return [
    "alerts", "alertas", "bot",
    "advertir", "warn", "advertencias", "warnings",
    "delwarn", "quitarwarn", "reglas", "antispam"
  ].includes(comando);
}

// =====================================================
// 🛡️ ANTISPAM: detección preventiva, sin sanciones automáticas
// =====================================================
const historialMensajes = new Map();
const alertasAntispam = new Map();
const VENTANA_HISTORIAL_MS = 20000;

function textoComparable(texto) {
  return String(texto || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " [enlace] ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function detectarEnlaceSospechoso(texto) {
  const enlaces = String(texto || "").match(/https?:\/\/[^\s<>]+/gi) || [];
  const acortadores = new Set([
    "bit.ly", "tinyurl.com", "t.co", "cutt.ly", "rb.gy",
    "is.gd", "shorturl.at", "ow.ly", "buff.ly", "rebrand.ly"
  ]);
  const marcasFrecuentes = ["whatsapp", "instagram", "facebook", "google", "microsoft", "tiktok", "roblox"];

  for (const enlace of enlaces) {
    try {
      const url = new URL(enlace);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const hostSinPuerto = host.split(":")[0];
      const esIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostSinPuerto);
      const esAcortador = acortadores.has(host);
      const esPunycode = host.includes("xn--");
      const rutaEnganosa = /(?:login|verify|verificar|password|contrase|wallet|billetera|premio|regalo|free|gratis|suspend|confirmar|actualizar)/i.test(url.pathname + url.search);
      const marcaEnDominio = marcasFrecuentes.some(marca =>
        host.includes(marca) && !host.endsWith(`${marca}.com`) && !host.endsWith(`${marca}.net`) && !host.endsWith(`${marca}.org`)
      );
      if (esIp || esAcortador || esPunycode || rutaEnganosa || marcaEnDominio) {
        return { host, motivo: esAcortador ? "acortador de enlaces" : esIp ? "dirección IP directa" : esPunycode ? "dominio codificado/punycode" : marcaEnDominio ? "posible dominio que imita una marca" : "ruta que solicita datos o promete premios" };
      }
    } catch {}
  }
  return null;
}

async function analizarMensaje(sock, grupo, remitente, texto, msg) {
  if (!grupo || !grupo.endsWith("@g.us") || !remitente || !configGrupo(grupo).antispamActivo) return;
  const ahora = Date.now();
  const autor = normalizarJid(remitente);
  if (!autor || autor.endsWith("@g.us")) return;

  try {
    const metadata = await sock.groupMetadata(grupo);
    const participante = (metadata.participants || []).find(p => normalizarJid(p.id) === autor);
    if (participante?.admin === "admin" || participante?.admin === "superadmin") return;

    const clave = `${grupo}:${autor}`;
    const anteriores = (historialMensajes.get(clave) || []).filter(item => ahora - item.fecha <= VENTANA_HISTORIAL_MS);
    const comparable = textoComparable(texto);
    anteriores.push({ fecha: ahora, texto: comparable });
    historialMensajes.set(clave, anteriores);

    // Limitar memoria para que el mapa no crezca indefinidamente.
    if (historialMensajes.size > 3000) {
      const primeraClave = historialMensajes.keys().next().value;
      if (primeraClave) historialMensajes.delete(primeraClave);
    }

    const repetidos = comparable
      ? anteriores.filter(item => item.texto && item.texto === comparable && ahora - item.fecha <= 20000).length
      : 0;
    const mensajesDiezSegundos = anteriores.filter(item => ahora - item.fecha <= 10000).length;
    const razones = [];
    if (repetidos >= 3) razones.push(`envió el mismo mensaje ${repetidos} veces en 20 segundos`);
    if (mensajesDiezSegundos >= 6) razones.push(`envió ${mensajesDiezSegundos} mensajes en 10 segundos`);

    const enlace = detectarEnlaceSospechoso(texto);
    if (enlace) razones.push(`compartió un enlace que requiere revisión (${enlace.host}: ${enlace.motivo})`);
    if (!razones.length) return;

    const tipos = [
      repetidos >= 3 ? "repetidos" : null,
      mensajesDiezSegundos >= 6 ? "flood" : null,
      enlace ? "enlace" : null
    ].filter(Boolean);

    for (const tipo of tipos) {
      const llaveAlerta = `${clave}:${tipo}`;
      const ultima = alertasAntispam.get(llaveAlerta) || 0;
      if (ahora - ultima < 45000) continue;
      alertasAntispam.set(llaveAlerta, ahora);

      const admins = (metadata.participants || [])
        .filter(p => p.admin === "admin" || p.admin === "superadmin")
        .map(p => normalizarJid(p.id))
        .filter(Boolean);
      if (!admins.length) return;

      const resumen = razones.map(razon => `• ${razon}`).join("\\n");
      await sock.sendMessage(grupo, {
        text: `🛡️ *ALERTA ANTISPAM DE TITANBOT*\\n\\n👤 Usuario: @${autor.split("@")[0]}\\n${resumen}\\n\\n⚠️ Es una detección automática orientativa. Revisen el mensaje antes de tomar medidas.`,
        mentions: [...new Set([autor, ...admins])]
      });
      break;
    }
  } catch (error) {
    console.error("[ANTISPAM] Error analizando mensaje:", error?.message || error);
  }
}

async function administrar(sock, chat, comando, args, id, esGrupo, esAdmin, msg) {
  if (!esGrupo) return false;

  const enviar = (text, mentions = []) =>
    sock.sendMessage(chat, { text, mentions });

  const cfg = configGrupo(chat);

  if (comando === "antispam") {
    if (!esAdmin) {
      await enviar("⛔ Solo los administradores pueden configurar el antispam.");
      return true;
    }
    const estado = String(args[0] || "estado").toLowerCase();
    if (!["on", "off", "estado"].includes(estado)) {
      await enviar("🛡️ *ANTISPAM DE TITANBOT*\n\n.antispam on — Activar detección\n.antispam off — Desactivar detección\n.antispam estado — Consultar estado\n\nDetecta mensajes repetidos, flood y enlaces sospechosos. Solo alerta a los administradores; no elimina mensajes ni expulsa usuarios.");
      return true;
    }
    if (estado !== "estado") {
      cfg.antispamActivo = estado === "on";
      guardarConfig(chat, cfg);
    }
    await enviar(cfg.antispamActivo
      ? "🟢 Antispam ACTIVADO en este grupo."
      : "🔴 Antispam DESACTIVADO en este grupo.");
    return true;
  }

  if (comando === "bot") {
    if (!esAdmin) {
      await enviar("⛔ Solo los administradores pueden activar o desactivar TITANBOT.");
      return true;
    }
    const estado = String(args[0] || "").toLowerCase();
    if (!["on", "off"].includes(estado)) {
      await enviar("🤖 *TITANBOT EN EL GRUPO*\n\n.bot on — Activar el bot\n.bot off — Desactivar sus comandos\n\nSolo administradores.");
      return true;
    }
    cfg.botActivo = estado === "on";
    guardarConfig(chat, cfg);
    await enviar(estado === "on"
      ? "🟢 TITANBOT ha sido activado en este grupo."
      : "🔴 TITANBOT ha sido desactivado en este grupo.\nLos administradores todavía pueden usar .bot on para reactivarlo.");
    return true;
  }

  // Cuando el bot está apagado, bloquea el resto de comandos del grupo.
  // Este módulo sigue aceptando .bot on para reactivarlo.
  if (!botActivo(chat)) {
    return true;
  }

  if (!esComandoAdmin(comando)) return false;

  if (comando === "alerts" || comando === "alertas") {
    if (!esAdmin) {
      await enviar("⛔ Solo los administradores pueden configurar las alertas.");
      return true;
    }
    const estado = String(args[0] || "").toLowerCase();
    if (!["on", "off"].includes(estado)) {
      await enviar("🔔 *ALERTAS DE ADMINISTRADORES*\n\n.alerts on — Avisar cuando alguien sea promovido o degradado.\n.alerts off — Desactivar las alertas.");
      return true;
    }
    cfg.alertasAdministradores = estado === "on";
    guardarConfig(chat, cfg);
    await enviar(estado === "on"
      ? "🔔 Alertas de cambios de administrador ACTIVADAS."
      : "🔕 Alertas de cambios de administrador DESACTIVADAS.");
    return true;
  }

  if (comando === "reglas") {
    if (!args.length) {
      const lista = cfg.reglas.map((regla, i) => `${i + 1}. ${regla}`).join("\n");
      await enviar(`📜 *REGLAS DEL GRUPO*\n\n${lista}\n\nUn administrador puede agregar una regla con:\n.reglas agregar texto de la regla`);
      return true;
    }
    if (String(args[0]).toLowerCase() === "agregar") {
      if (!esAdmin) {
        await enviar("⛔ Solo los administradores pueden modificar las reglas.");
        return true;
      }
      const nueva = args.slice(1).join(" ").trim();
      if (!nueva) {
        await enviar("Uso: .reglas agregar texto de la regla");
        return true;
      }
      if (cfg.reglas.length >= 20) {
        await enviar("⚠️ El grupo ya tiene el máximo de 20 reglas.");
        return true;
      }
      cfg.reglas.push(nueva);
      guardarConfig(chat, cfg);
      await enviar(`✅ Regla ${cfg.reglas.length} agregada:\n${nueva}`);
      return true;
    }
    await enviar("Uso:\n.reglas — Ver reglas\n.reglas agregar texto — Agregar una regla (administradores)");
    return true;
  }

  if (comando === "advertir" || comando === "warn") {
    if (!esAdmin) {
      await enviar("⛔ Solo los administradores pueden emitir advertencias.");
      return true;
    }
    const objetivo = obtenerObjetivo(args, msg);
    const numeroRegla = Number(args.find((a, i) => i > 0 && /^\d+$/.test(a)));
    if (!objetivo || !Number.isInteger(numeroRegla) || numeroRegla < 1 || numeroRegla > cfg.reglas.length) {
      await enviar(`⚠️ Uso: .advertir @usuario número_de_regla\nEjemplo: .advertir @usuario 1\n\nConsulta las reglas con .reglas.`);
      return true;
    }
    if (normalizarJid(objetivo) === normalizarJid(id)) {
      await enviar("⚠️ No puedes advertirte a ti mismo.");
      return true;
    }
    const db = leer(WARN_FILE);
    if (!db[chat]) db[chat] = {};
    if (!Array.isArray(db[chat][objetivo])) db[chat][objetivo] = [];
    const registro = {
      regla: numeroRegla,
      motivo: cfg.reglas[numeroRegla - 1],
      admin: id,
      fecha: new Date().toISOString()
    };
    db[chat][objetivo].push(registro);
    guardar(WARN_FILE, db);
    const total = db[chat][objetivo].length;
    await enviar(
      `⚠️ *ADVERTENCIA REGISTRADA*\n\n👤 Usuario: @${objetivo.split("@")[0]}\n📜 Regla ${numeroRegla}: ${registro.motivo}\n🔢 Total de advertencias: ${total}\n\nRespeta las reglas del grupo para evitar nuevas advertencias.`,
      [objetivo]
    );
    return true;
  }

  if (comando === "advertencias" || comando === "warnings") {
    const objetivo = obtenerObjetivo(args, msg) || id;
    const db = leer(WARN_FILE);
    const registros = db[chat]?.[objetivo] || [];
    if (!registros.length) {
      await enviar(`✅ @${objetivo.split("@")[0]} no tiene advertencias registradas.`, [objetivo]);
      return true;
    }
    const detalle = registros.map((w, i) =>
      `${i + 1}. Regla ${w.regla}: ${w.motivo}\n   Fecha: ${new Date(w.fecha).toLocaleString("es-CO")}`
    ).join("\n\n");
    await enviar(`📋 *ADVERTENCIAS DE @${objetivo.split("@")[0]}*\n\n${detalle}\n\nTotal: ${registros.length}`, [objetivo]);
    return true;
  }

  if (comando === "delwarn" || comando === "quitarwarn") {
    if (!esAdmin) {
      await enviar("⛔ Solo los administradores pueden eliminar advertencias.");
      return true;
    }
    const objetivo = obtenerObjetivo(args, msg);
    if (!objetivo) {
      await enviar("Uso: .delwarn @usuario [número]\nSin número elimina todas sus advertencias.");
      return true;
    }
    const db = leer(WARN_FILE);
    const registros = db[chat]?.[objetivo] || [];
    if (!registros.length) {
      await enviar("ℹ️ Ese usuario no tiene advertencias registradas.");
      return true;
    }
    const indice = Number(args.find((a, i) => i > 0 && /^\d+$/.test(a)));
    if (Number.isInteger(indice) && indice > 0) {
      if (indice > registros.length) {
        await enviar(`⚠️ Solo tiene ${registros.length} advertencia(s).`);
        return true;
      }
      registros.splice(indice - 1, 1);
      if (registros.length) db[chat][objetivo] = registros;
      else delete db[chat][objetivo];
      guardar(WARN_FILE, db);
      await enviar(`🗑️ Se eliminó la advertencia ${indice} de @${objetivo.split("@")[0]}.`, [objetivo]);
    } else {
      delete db[chat][objetivo];
      guardar(WARN_FILE, db);
      await enviar(`🗑️ Se eliminaron todas las advertencias de @${objetivo.split("@")[0]}.`, [objetivo]);
    }
    return true;
  }

  return false;
}

async function alertarCambioAdmin(sock, grupo, participantes, accion) {
  if (!grupo || !grupo.endsWith("@g.us") || !["promote", "demote"].includes(accion)) return;
  const cfg = configGrupo(grupo);
  if (!cfg.alertasAdministradores) return;

  try {
    const metadata = await sock.groupMetadata(grupo);
    const admins = (metadata.participants || [])
      .filter(p => p.admin === "admin" || p.admin === "superadmin")
      .map(p => normalizarJid(p.id));
    const afectados = (participantes || []).map(normalizarJid).filter(Boolean);
    const menciones = [...new Set([...admins, ...afectados])];
    const lista = afectados.map(jid => `@${jid.split("@")[0]}`).join(", ");
    const texto = accion === "promote"
      ? `🔔 *ALERTA DE ADMINISTRADORES*\n\n👑 ${lista} ${afectados.length > 1 ? "han sido promovidos" : "ha sido promovido"} a administrador.\n\nTITANBOT informa este cambio al equipo de administración.`
      : `🔔 *ALERTA DE ADMINISTRADORES*\n\n⚠️ ${lista} ${afectados.length > 1 ? "han perdido" : "ha perdido"} los permisos de administrador.\n\nTITANBOT informa este cambio al equipo de administración.`;
    await sock.sendMessage(grupo, { text: texto, mentions: menciones });
  } catch (error) {
    console.error("[ADMIN] Error enviando alerta de administrador:", error.message || error);
  }
}

module.exports = {
  administrar,
  botActivo,
  alertarCambioAdmin,
  analizarMensaje
};
