// ============================================
// TITANBOT - MAGICKA MAXIMA
// GIFs reales enlazados desde GIPHY (no generados)
// Archivo independiente: commands/magicka.js
// Node.js 18+; sin paquetes nuevos
// ============================================

const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "database");
const DB_FILE = path.join(DB_DIR, "magicka_maxima.json");
const GIF_DIR = path.join(__dirname, "..", "media", "magicka");

const ENERGIA_MAXIMA = 100;
const REGENERACION_MS = 10 * 60 * 1000;
const DURACION_TRANSFORMACION_MS = 60 * 60 * 1000;
const NIVEL_MAXIMO = 10;

// Enlaces a GIFs publicados en GIPHY. No son dibujos ni GIFs generados aquí.
// El bot los descarga la primera vez que necesita cada animación y guarda
// una copia local para que los siguientes envíos sean más rápidos.
const GIFS_WEB = {
    bruja: {
        archivo: "bruja.gif",
        url: "https://media.giphy.com/media/h65kQIFwqiUgVUhNZU/giphy.gif",
        fuente: "https://giphy.com/gifs/magic-broom-bruja-h65kQIFwqiUgVUhNZU"
    },
    hechizos: {
        archivo: "hechizos.gif",
        url: "https://media.giphy.com/media/sRFEaE29kg99CehAH5/giphy.gif",
        fuente: "https://giphy.com/gifs/witch-witchcraft-caldron-sRFEaE29kg99CehAH5"
    },
    transformacion: {
        archivo: "transformacion.gif",
        url: "https://media.giphy.com/media/gvTITk4aovjVP6gUt6/giphy.gif",
        fuente: "https://giphy.com/gifs/Winx-Club-stella-winx-club-gvTITk4aovjVP6gUt6"
    },
    circulo: {
        archivo: "circulo.gif",
        url: "https://media.giphy.com/media/kfsNqQVJnhWuovEPQ5/giphy.gif",
        fuente: "https://giphy.com/gifs/witch-loony-luvgoods-kfsNqQVJnhWuovEPQ5"
    }
};

function prepararDB() {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.mkdirSync(GIF_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), "utf8");
    }
}

function cargarDB() {
    prepararDB();
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
        return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch (error) {
        console.error("[MAGICKA MÁXIMA] Error leyendo base de datos:", error.message);
        return {};
    }
}

function guardarDB(data) {
    prepararDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

function crearBruja() {
    return {
        nivel: 1,
        xp: 0,
        energia: 30,
        ultimaRegeneracion: Date.now(),
        transformacionHasta: 0,
        hechizosLanzados: 0
    };
}

function regenerar(bruja) {
    const ahora = Date.now();
    const ultima = Number(bruja.ultimaRegeneracion) || ahora;
    const energiaActual = Math.max(0, Number(bruja.energia) || 0);
    const puntos = Math.floor(Math.max(0, ahora - ultima) / REGENERACION_MS);
    if (puntos > 0) {
        bruja.energia = Math.min(ENERGIA_MAXIMA, energiaActual + puntos);
        bruja.ultimaRegeneracion = ultima + puntos * REGENERACION_MS;
    } else {
        bruja.energia = energiaActual;
    }
    if (bruja.energia >= ENERGIA_MAXIMA) {
        bruja.energia = ENERGIA_MAXIMA;
        bruja.ultimaRegeneracion = ahora;
    }
}

function agregarXP(bruja, cantidad) {
    bruja.xp = Math.max(0, Number(bruja.xp) || 0) + cantidad;
    bruja.nivel = Math.max(1, Number(bruja.nivel) || 1);
    let subio = false;
    while (bruja.nivel < NIVEL_MAXIMO && bruja.xp >= bruja.nivel * 100) {
        bruja.xp -= bruja.nivel * 100;
        bruja.nivel += 1;
        subio = true;
    }
    if (bruja.nivel >= NIVEL_MAXIMO) {
        bruja.nivel = NIVEL_MAXIMO;
        bruja.xp = Math.min(bruja.xp, 999);
    }
    return subio;
}

function barraEnergia(energia) {
    const llenos = Math.max(0, Math.min(10, Math.floor(energia / 10)));
    return "🟣".repeat(llenos) + "⬛".repeat(10 - llenos);
}

function formaActual(bruja) {
    return Number(bruja.transformacionHasta) > Date.now()
        ? "👑 BRUJA TODOPODEROSA"
        : "🧙‍♀️ Bruja en entrenamiento";
}

async function obtenerGif(tipo) {
    const item = GIFS_WEB[tipo];
    if (!item) return null;

    const destino = path.join(GIF_DIR, item.archivo);
    try {
        if (fs.existsSync(destino) && fs.statSync(destino).size > 1000) {
            return fs.readFileSync(destino);
        }

        const respuesta = await fetch(item.url, {
            headers: { "User-Agent": "TITANBOT/1.0 (WhatsApp bot GIF fetch)" },
            signal: AbortSignal.timeout(12000)
        });
        if (!respuesta.ok) {
            throw new Error(`GIPHY respondió HTTP ${respuesta.status}`);
        }

        const tipoContenido = String(respuesta.headers.get("content-type") || "").toLowerCase();
        if (!tipoContenido.includes("image/gif")) {
            throw new Error(`El enlace no devolvió un GIF (content-type: ${tipoContenido || "desconocido"})`);
        }

        const buffer = Buffer.from(await respuesta.arrayBuffer());
        if (buffer.length < 1000) throw new Error("El GIF descargado está vacío o incompleto");
        fs.mkdirSync(GIF_DIR, { recursive: true });
        fs.writeFileSync(destino, buffer);
        return buffer;
    } catch (error) {
        console.error(`[MAGICKA MÁXIMA] No se pudo obtener el GIF web "${tipo}":`, error.message);
        return null;
    }
}

async function responder(sock, chat, texto, msg, tipoGif) {
    const opciones = msg ? { quoted: msg } : {};
    if (tipoGif) {
        const buffer = await obtenerGif(tipoGif);
        if (buffer) {
            try {
                return await sock.sendMessage(chat, {
                    video: buffer,
                    gifPlayback: true,
                    caption: texto
                }, opciones);
            } catch (error) {
                console.error("[MAGICKA MÁXIMA] Error enviando GIF:", error.message);
            }
        }
    }
    // Si GIPHY no responde, el comando sigue funcionando con texto.
    return sock.sendMessage(chat, { text: texto }, opciones);
}

async function ejecutarMagicka(sock, chat, comando, args = [], id, msg) {
    const nombre = String(comando || "").toLowerCase().replace(/^\./, "");
    if (!["magicka", "magi"].includes(nombre)) return false;

    const usuarioId = id || msg?.key?.participant || msg?.key?.remoteJid || chat;
    const db = cargarDB();
    if (!db[usuarioId] || typeof db[usuarioId] !== "object") db[usuarioId] = crearBruja();

    const bruja = { ...crearBruja(), ...db[usuarioId] };
    regenerar(bruja);
    const sub = String(args[0] || "menu").toLowerCase();

    function guardar() {
        db[usuarioId] = bruja;
        guardarDB(db);
    }

    if (["menu", "ayuda"].includes(sub)) {
        guardar();
        return responder(sock, chat,
`🌑🟣 ═══ MAGICKA MÁXIMA ═══ 🟣🌑

「 EL GRIMORIO DE LA BRUJA SUPREMA 」

Despierta la magia prohibida y domina las sombras violetas.

🔮 .magicka estado
🌙 .magicka despertar
📚 .magicka entrenar
🪄 .magicka hechizo
👑 .magicka maxima

La Magicka Máxima requiere nivel 3 y 30 de energía.
La transformación dura 60 minutos.

🕯️ La energía se regenera con el tiempo.
✨ Alias: .magi`, msg, "bruja");
    }

    if (sub === "estado") {
        guardar();
        const activa = Number(bruja.transformacionHasta) > Date.now();
        const minutos = activa ? Math.ceil((Number(bruja.transformacionHasta) - Date.now()) / 60000) : 0;
        return responder(sock, chat,
`🔮 ═══ ESTADO DEL GRIMORIO ═══ 🔮

🧙‍♀️ Forma: ${formaActual(bruja)}
⭐ Nivel: ${bruja.nivel}/${NIVEL_MAXIMO}
✨ Experiencia: ${bruja.xp}/${bruja.nivel * 100} XP
⚡ Energía: ${bruja.energia}/${ENERGIA_MAXIMA}
${barraEnergia(bruja.energia)}
🪄 Hechizos lanzados: ${bruja.hechizosLanzados}
${activa ? `⏳ Magicka Máxima activa: ${minutos} minuto(s).` : "🌑 Sigue entrenando para romper el sello supremo."}`, msg, "circulo");
    }

    if (sub === "despertar") {
        if (bruja.energia < 15) {
            guardar();
            return responder(sock, chat, "⚡ Necesitas 15 puntos de energía para despertar tu magia.", msg, "circulo");
        }
        bruja.energia -= 15;
        bruja.hechizosLanzados += 1;
        const subio = agregarXP(bruja, 25);
        guardar();
        return responder(sock, chat,
`🌙 ═══ DESPERTAR DE LAS SOMBRAS ═══ 🌙

Un círculo arcano despierta y una presencia ancestral responde desde la oscuridad.

✨ ¡Tu magia ha despertado!
📚 Experiencia: +25 XP
⭐ Nivel: ${bruja.nivel}${subio ? " ⬆️ ¡SUBISTE DE NIVEL!" : ""}
⚡ Energía restante: ${bruja.energia}/${ENERGIA_MAXIMA}

Usa .magicka entrenar para dominar tu poder.`, msg, "circulo");
    }

    if (sub === "entrenar") {
        if (bruja.energia < 10) {
            guardar();
            return responder(sock, chat, "⚡ Necesitas 10 puntos de energía para entrenar. Espera a que se recupere.", msg, "hechizos");
        }
        if (bruja.nivel >= NIVEL_MAXIMO) {
            guardar();
            return responder(sock, chat, "👑 ¡Ya alcanzaste el nivel máximo de magia!", msg, "bruja");
        }
        bruja.energia -= 10;
        const subio = agregarXP(bruja, 50);
        guardar();
        return responder(sock, chat,
`📚 ═══ ENTRENAMIENTO ARCANO ═══ 📚

Las runas absorben tu energía y las sombras violetas giran a tu alrededor.

✨ Experiencia: +50 XP
⭐ Nivel actual: ${bruja.nivel}${subio ? " ⬆️ ¡SUBISTE DE NIVEL!" : ""}
⚡ Energía: ${bruja.energia}/${ENERGIA_MAXIMA}
${bruja.nivel >= 3 ? "👑 El sello supremo puede ser desafiado con .magicka maxima." : "🌙 Llega al nivel 3 para desbloquear Magicka Máxima."}`, msg, "hechizos");
    }

    if (["maxima", "máxima", "poder"].includes(sub)) {
        if (bruja.nivel < 3) {
            guardar();
            return responder(sock, chat,
`🔒 EL HECHIZO SUPREMO SIGUE SELLADO

Necesitas nivel 3; tu nivel actual es ${bruja.nivel}.
Usa .magicka entrenar para ganar experiencia.`, msg, "circulo");
        }
        if (bruja.energia < 30) {
            guardar();
            return responder(sock, chat, "⚡ Necesitas 30 puntos de energía para lanzar Magicka Máxima.", msg, "circulo");
        }
        bruja.energia -= 30;
        bruja.transformacionHasta = Date.now() + DURACION_TRANSFORMACION_MS;
        bruja.hechizosLanzados += 1;
        const subio = agregarXP(bruja, 25);
        guardar();
        return responder(sock, chat,
`👑🌑 ═══ MAGICKA MÁXIMA ═══ 🌑👑

「 CORONA DE LAS MIL ESTRELLAS VIOLETAS 」

El círculo arcano se abre. Las runas despiertan y una corona de luz violeta te envuelve.

🟣 ¡TE HAS CONVERTIDO EN LA BRUJA TODOPODEROSA!
👑 Forma: BRUJA TODOPODEROSA
⭐ Nivel: ${bruja.nivel}${subio ? " ⬆️ ¡SUBISTE DE NIVEL!" : ""}
✨ Experiencia: +25 XP
⚡ Energía restante: ${bruja.energia}/${ENERGIA_MAXIMA}

⏳ La transformación dura 60 minutos.
Usa .magicka estado para consultar tu poder.`, msg, "transformacion");
    }

    if (sub === "hechizo") {
        if (bruja.energia < 5) {
            guardar();
            return responder(sock, chat, "⚡ Necesitas 5 puntos de energía para lanzar un hechizo.", msg, "hechizos");
        }
        bruja.energia -= 5;
        bruja.hechizosLanzados += 1;
        const subio = agregarXP(bruja, 10);
        guardar();
        return responder(sock, chat,
`🪄 ═══ HECHIZO ARCANO ═══ 🪄

「 UMBRA LUX: LLAMADO VIOLETA 」

La magia oscura ilumina el grimorio y las runas orbitan a tu alrededor.

📚 Experiencia: +10 XP
⭐ Nivel: ${bruja.nivel}${subio ? " ⬆️ ¡SUBISTE DE NIVEL!" : ""}
⚡ Energía restante: ${bruja.energia}/${ENERGIA_MAXIMA}`, msg, "hechizos");
    }

    guardar();
    return responder(sock, chat, 
`❓ Opción desconocida: ${sub}
Usa .magicka para abrir el grimorio.`, msg, "bruja");
}

module.exports = ejecutarMagicka;
