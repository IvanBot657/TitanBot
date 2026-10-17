// ============================================
// 🎴 TITANBOT - SISTEMA DE CARTAS MEJORADO
// Sin IA | Personajes desde la web con Jikan API
// Compatible con .s, .w, .coleccion, .carta y .cartas
// ============================================

const fs = require("fs");
const path = require("path");

// ============================================
// 📁 RUTAS
// Este archivo debe estar dentro de /commands
// ============================================

const databaseDir = path.join(__dirname, "..", "database");
const cartasFile = path.join(databaseDir, "cartas.json");
const usuariosFile = path.join(databaseDir, "cartas_usuarios.json");
const JIKAN_API = "https://api.jikan.moe/v4";

fs.mkdirSync(databaseDir, { recursive: true });

if (!fs.existsSync(usuariosFile)) {
    fs.writeFileSync(usuariosFile, JSON.stringify({}, null, 2), "utf8");
}

if (!fs.existsSync(cartasFile)) {
    fs.writeFileSync(cartasFile, JSON.stringify([], null, 2), "utf8");
}

// ============================================
// 📖 BASE DE DATOS
// Mantiene el formato de array usado por tu archivo
// ============================================

function cargarCartas() {
    try {
        const contenido = JSON.parse(fs.readFileSync(cartasFile, "utf8"));
        if (Array.isArray(contenido)) return contenido;
        // Compatibilidad defensiva si el catálogo fuera un objeto.
        if (contenido && typeof contenido === "object") return Object.values(contenido);
        return [];
    } catch (error) {
        console.error("❌ Error leyendo cartas.json:", error.message);
        return [];
    }
}

function guardarCartas(cartas) {
    fs.writeFileSync(cartasFile, JSON.stringify(cartas, null, 2), "utf8");
}

function cargarUsuarios() {
    try {
        const data = JSON.parse(fs.readFileSync(usuariosFile, "utf8"));
        return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch (error) {
        console.error("❌ Error leyendo cartas_usuarios.json:", error.message);
        return {};
    }
}

function guardarUsuarios(data) {
    fs.writeFileSync(usuariosFile, JSON.stringify(data, null, 2), "utf8");
}

function obtenerUsuario(id) {
    const usuarios = cargarUsuarios();
    if (!usuarios[id]) {
        usuarios[id] = { cartas: [], pendiente: null };
        guardarUsuarios(usuarios);
    }

    // Compatibilidad con colecciones antiguas.
    if (!Array.isArray(usuarios[id].cartas)) usuarios[id].cartas = [];
    if (!Object.prototype.hasOwnProperty.call(usuarios[id], "pendiente")) {
        usuarios[id].pendiente = null;
    }
    return usuarios[id];
}

function textoSeguro(valor, max = 180) {
    return String(valor || "").replace(/[\r\n]+/g, " ").slice(0, max);
}

// ============================================
// 🌐 JIKAN API - LIMITACIÓN DE CONSULTAS
// Evita consultar repetidamente la API demasiado rápido.
// Node.js 18+ incluye fetch; el hosting recomendado es Node 24.
// ============================================

let ultimaConsultaAPI = 0;

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function consultarJikan(endpoint) {
    const ahora = Date.now();
    const espera = Math.max(0, 1100 - (ahora - ultimaConsultaAPI));
    if (espera) await esperar(espera);
    ultimaConsultaAPI = Date.now();

    const respuesta = await fetch(`${JIKAN_API}${endpoint}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000)
    });

    if (respuesta.status === 429) {
        throw new Error("Jikan está recibiendo muchas consultas. Espera unos segundos e inténtalo otra vez.");
    }
    if (!respuesta.ok) {
        throw new Error(`Jikan respondió con el estado ${respuesta.status}.`);
    }
    return respuesta.json();
}

const rarezas = [
    { nombre: "Común", peso: 60 },
    { nombre: "Rara", peso: 25 },
    { nombre: "Épica", peso: 10 },
    { nombre: "Legendaria", peso: 4 },
    { nombre: "Mítica", peso: 1 }
];

function elegirRareza() {
    let numero = Math.random() * 100;
    for (const rareza of rarezas) {
        numero -= rareza.peso;
        if (numero < 0) return rareza.nombre;
    }
    return "Común";
}

function valorPorRareza(rareza) {
    const valores = {
        "Común": 100,
        "Rara": 250,
        "Épica": 600,
        "Legendaria": 1500,
        "Mítica": 3000
    };
    return valores[rareza] || 100;
}

function emojiRareza(rareza) {
    const emojis = {
        "Común": "⚪",
        "Rara": "🔵",
        "Épica": "🟣",
        "Legendaria": "🟡",
        "Mítica": "🔴"
    };
    return emojis[rareza] || "🎴";
}

function imagenEsURL(imagen) {
    return typeof imagen === "string" && /^https:\/\//i.test(imagen);
}

function crearCartaWeb(personaje, detalles) {
    const imagen = personaje?.images?.webp?.image_url || personaje?.images?.jpg?.image_url || "";
    if (!personaje?.mal_id || !personaje?.name || !imagenEsURL(imagen)) return null;

    const rareza = elegirRareza();
    const anime = Array.isArray(detalles?.data?.animeography) && detalles.data.animeography.length
        ? textoSeguro(detalles.data.animeography[0]?.anime?.title || detalles.data.animeography[0]?.name || "Anime no especificado", 150)
        : "Anime no especificado";

    return {
        id: `JIKAN_${personaje.mal_id}`,
        nombre: textoSeguro(personaje.name, 120),
        anime,
        rareza,
        valor: valorPorRareza(rareza),
        imagen,
        fuente: `https://myanimelist.net/character/${personaje.mal_id}`,
        api: "Jikan API",
        licenciaImagen: "No verificada: revisar permisos antes de reutilizar la imagen"
    };
}

async function buscarCartaWeb(cartasActuales) {
    // Jikan entrega personajes reales y sus URL de imagen; no genera imágenes.
    // Se intenta con varias páginas para ampliar el catálogo.
    const paginas = [
        Math.floor(Math.random() * 30) + 1,
        Math.floor(Math.random() * 30) + 1,
        1
    ];

    for (const pagina of paginas) {
        const resultado = await consultarJikan(
            `/characters?order_by=favorites&sort=desc&limit=25&page=${pagina}`
        );
        const lista = Array.isArray(resultado?.data) ? resultado.data : [];
        if (!lista.length) continue;

        // Priorizar un personaje que aún no esté en el catálogo local.
        const nuevos = lista.filter(p =>
            p?.mal_id && !cartasActuales.some(c => String(c.id) === `JIKAN_${p.mal_id}`) &&
            (p?.images?.webp?.image_url || p?.images?.jpg?.image_url)
        );
        const candidatos = nuevos.length ? nuevos : lista.filter(p =>
            p?.mal_id && (p?.images?.webp?.image_url || p?.images?.jpg?.image_url)
        );
        if (!candidatos.length) continue;

        const personaje = candidatos[Math.floor(Math.random() * candidatos.length)];
        let detalles = null;
        try {
            detalles = await consultarJikan(`/characters/${personaje.mal_id}/full`);
        } catch (error) {
            // La carta puede funcionar aunque no se consiga el anime asociado.
            console.warn("No se pudo consultar la ficha completa del personaje:", error.message);
        }

        const carta = crearCartaWeb(personaje, detalles);
        if (!carta) continue;

        const existente = cartasActuales.find(c => String(c.id) === carta.id);
        if (existente) return existente;

        cartasActuales.push(carta);
        guardarCartas(cartasActuales);
        return carta;
    }

    throw new Error("La web no devolvió personajes con imágenes disponibles.");
}

// ============================================
// 🖼️ ENVIAR CARTA: URL WEB O IMAGEN LOCAL
// ============================================

async function enviarCarta(sock, chat, carta, caption, msg) {
    const opciones = msg ? { quoted: msg } : {};

    if (carta.imagen && imagenEsURL(carta.imagen)) {
        try {
            return await sock.sendMessage(chat, {
                image: { url: carta.imagen },
                caption
            }, opciones);
        } catch (error) {
            console.error("No se pudo enviar imagen web:", error.message);
        }
    } else if (carta.imagen) {
        const imagenPath = path.join(__dirname, "..", "media", "cartas", carta.imagen);
        if (fs.existsSync(imagenPath)) {
            try {
                return await sock.sendMessage(chat, {
                    image: fs.readFileSync(imagenPath),
                    caption
                }, opciones);
            } catch (error) {
                console.error("No se pudo enviar imagen local:", error.message);
            }
        }
    }

    const aviso = carta.imagen ? "\n\n⚠️ No pude cargar la imagen; aquí están los datos." : "\n\n⚠️ Esta carta no tiene imagen configurada.";
    return sock.sendMessage(chat, { text: caption + aviso }, opciones);
}

// ============================================
// 🎴 COMANDO PRINCIPAL
// Firma original conservada: ejecutarCartas(sock, chat, sender, texto, msg)
// ============================================

async function ejecutarCartas(sock, chat, sender, texto, msg) {
    const partes = String(texto || "").trim().split(/\s+/).filter(Boolean);
    const comando = (partes[0] || "").toLowerCase();
    const usuarios = cargarUsuarios();
    const usuario = obtenerUsuario(sender);
    const cartas = cargarCartas();

    // ========================================
    // 🎲 .s - carta de web, con respaldo local
    // ========================================
    if (comando === ".s") {
        let carta = null;
        let avisoWeb = "";

        try {
            carta = await buscarCartaWeb(cartas);
        } catch (error) {
            console.error("❌ Error buscando personaje web:", error.message);
            avisoWeb = "\n\n⚠️ No pude conectar con la web; usé el catálogo guardado.";
            if (cartas.length) {
                carta = cartas[Math.floor(Math.random() * cartas.length)];
            }
        }

        if (!carta) {
            return sock.sendMessage(chat, {
                text: "❌ No pude obtener una carta de la web y tu catálogo local está vacío. Comprueba que el hosting tenga conexión a internet e inténtalo de nuevo.",
                ...(msg ? { quoted: msg } : {})
            });
        }

        usuario.pendiente = carta.id;
        usuarios[sender] = usuario;
        guardarUsuarios(usuarios);

        const mensaje =
            `🎴 *TITAN CARD*\n\n` +
            `${emojiRareza(carta.rareza)} *${String(carta.rareza || "Común").toUpperCase()}*\n\n` +
            `👤 *${carta.nombre}*\n` +
            `📺 Anime: ${carta.anime || "No especificado"}\n` +
            `🆔 ID: ${carta.id}\n` +
            `💰 Valor: ${carta.valor || 100}\n\n` +
            `━━━━━━━━━━━━━━━━\n` +
            `🃏 Usa *.w* para reclamarla.\n` +
            `🎲 Usa *.s* para sacar otra carta.` +
            (carta.fuente ? `\n🌐 Fuente: ${carta.fuente}` : "") +
            avisoWeb;

        return enviarCarta(sock, chat, carta, mensaje, msg);
    }

    // ========================================
    // 🃏 .w - reclamar carta pendiente
    // ========================================
    if (comando === ".w") {
        if (!usuario.pendiente) {
            return sock.sendMessage(chat, {
                text: "❌ No tienes ninguna carta pendiente.\n\nUsa *.s* para sacar una carta.",
                ...(msg ? { quoted: msg } : {})
            });
        }

        const carta = cartas.find(c => String(c.id) === String(usuario.pendiente));
        if (!carta) {
            usuario.pendiente = null;
            usuarios[sender] = usuario;
            guardarUsuarios(usuarios);
            return sock.sendMessage(chat, {
                text: "❌ Esa carta ya no existe en el catálogo. Usa *.s* para sacar otra.",
                ...(msg ? { quoted: msg } : {})
            });
        }

        // Evitar duplicados en la colección, como en el sistema original.
        const yaTiene = usuario.cartas.find(c => String(c.id) === String(carta.id));
        if (yaTiene) {
            yaTiene.cantidad = Number(yaTiene.cantidad || 0) + 1;
        } else {
            usuario.cartas.push({ id: carta.id, cantidad: 1 });
        }

        usuario.pendiente = null;
        usuarios[sender] = usuario;
        guardarUsuarios(usuarios);

        const mensaje =
            `✅ *¡CARTA RECLAMADA!*\n\n` +
            `${emojiRareza(carta.rareza)} *${carta.nombre}*\n\n` +
            `📺 ${carta.anime || "Anime no especificado"}\n` +
            `⭐ ${carta.rareza || "Común"}\n` +
            `💰 ${carta.valor || 100}\n\n` +
            `🎴 Ahora forma parte de tu colección.`;

        return enviarCarta(sock, chat, carta, mensaje, msg);
    }

    // ========================================
    // 📚 .coleccion
    // ========================================
    if (comando === ".coleccion") {
        if (!usuario.cartas.length) {
            return sock.sendMessage(chat, {
                text: "📚 *TU COLECCIÓN ESTÁ VACÍA*\n\nUsa *.s* para sacar tu primera carta.",
                ...(msg ? { quoted: msg } : {})
            });
        }

        let mensaje = `🎴 *COLECCIÓN DE CARTAS*\n\n📦 Cartas diferentes: ${usuario.cartas.length}\n\n━━━━━━━━━━━━━━━━`;
        let valorTotal = 0;

        for (const poseida of usuario.cartas) {
            const carta = cartas.find(c => String(c.id) === String(poseida.id));
            if (!carta) continue;
            const cantidad = Number(poseida.cantidad || 0);
            const valor = Number(carta.valor || 0) * cantidad;
            valorTotal += valor;
            mensaje += `\n\n${emojiRareza(carta.rareza)} *${carta.nombre}*\n📺 ${carta.anime || "Anime no especificado"}\n⭐ ${carta.rareza || "Común"}\n🔢 x${cantidad}\n💰 ${valor}`;
        }

        mensaje += `\n\n━━━━━━━━━━━━━━━━\n💰 *VALOR TOTAL:* ${valorTotal}`;
        return sock.sendMessage(chat, { text: mensaje, ...(msg ? { quoted: msg } : {}) });
    }

    // ========================================
    // 🔎 .carta ID o nombre
    // ========================================
    if (comando === ".carta") {
        const busqueda = partes.slice(1).join(" ").toLowerCase();
        if (!busqueda) {
            return sock.sendMessage(chat, {
                text: "🔎 *CONSULTAR CARTA*\n\nEjemplos:\n.carta Naruto\n.carta C001\n.carta JIKAN_1",
                ...(msg ? { quoted: msg } : {})
            });
        }

        const carta = cartas.find(c =>
            String(c.id).toLowerCase() === busqueda ||
            String(c.nombre || "").toLowerCase().includes(busqueda)
        );

        if (!carta) {
            return sock.sendMessage(chat, {
                text: "❌ No encontré esa carta en el catálogo guardado. Usa *.s* para descubrir personajes nuevos.",
                ...(msg ? { quoted: msg } : {})
            });
        }

        const mensaje =
            `🎴 *CARTA*\n\n` +
            `${emojiRareza(carta.rareza)} *${carta.nombre}*\n\n` +
            `🆔 ID: ${carta.id}\n` +
            `📺 Anime: ${carta.anime || "No especificado"}\n` +
            `⭐ Rareza: ${carta.rareza || "Común"}\n` +
            `💰 Valor: ${carta.valor || 100}` +
            (carta.fuente ? `\n🌐 Fuente: ${carta.fuente}` : "");

        return enviarCarta(sock, chat, carta, mensaje, msg);
    }

    // ========================================
    // 📖 .cartas - menú
    // ========================================
    if (comando === ".cartas") {
        return sock.sendMessage(chat, {
            text:
                `🎴 *TITAN CARD SYSTEM*\n\n` +
                `Colecciona personajes de anime obtenidos desde la web.\n\n` +
                `🎲 *.s*\nSacar una carta nueva.\n\n` +
                `🃏 *.w*\nReclamar la carta pendiente.\n\n` +
                `📚 *.coleccion*\nVer tus cartas y su valor.\n\n` +
                `🔎 *.carta <nombre o ID>*\nConsultar una carta.\n\n` +
                `📖 *.cartas*\nMostrar este menú.\n\n` +
                `━━━━━━━━━━━━━━━━\n⭐ Rarezas:\n⚪ Común\n🔵 Rara\n🟣 Épica\n🟡 Legendaria\n🔴 Mítica\n\n🌐 Personajes e imágenes consultados mediante Jikan API. Las licencias de las imágenes deben verificarse por separado.`,
            ...(msg ? { quoted: msg } : {})
        });
    }

    return false;
}

module.exports = ejecutarCartas;
