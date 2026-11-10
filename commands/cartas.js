// ============================================
// 🎴 TITANBOT - SISTEMA DE CARTAS MEJORADO
// Sin IA | Personajes e imágenes desde AniList API
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
const ANILIST_API = "https://graphql.anilist.co";

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
// 🌐 ANILIST GRAPHQL API
// Busca personajes reales y obtiene su imagen de personaje.
// Límite conservador: una consulta cada 2.5 segundos.
// ============================================

let ultimaConsultaAPI = 0;

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function consultarAniList(query, variables = {}) {
    const ahora = Date.now();
    const espera = Math.max(0, 2500 - (ahora - ultimaConsultaAPI));
    if (espera) await esperar(espera);
    ultimaConsultaAPI = Date.now();

    const respuesta = await fetch(ANILIST_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(20000)
    });

    if (respuesta.status === 429) {
        const reintento = Number(respuesta.headers.get("Retry-After") || 60);
        throw new Error(`AniList está limitando las consultas. Espera ${reintento} segundos e inténtalo de nuevo.`);
    }

    let resultado;
    try {
        resultado = await respuesta.json();
    } catch {
        throw new Error("AniList devolvió una respuesta que no se pudo leer.");
    }

    if (!respuesta.ok || (Array.isArray(resultado?.errors) && resultado.errors.length)) {
        const detalle = resultado?.errors?.[0]?.message;
        throw new Error(detalle || `AniList respondió con el estado ${respuesta.status}.`);
    }

    return resultado?.data;
}

const CONSULTA_PERSONAJES = `
    query ($pagina: Int) {
        Page(page: $pagina, perPage: 25) {
            characters(sort: [FAVOURITES_DESC]) {
                id
                name {
                    full
                    native
                }
                image {
                    large
                    medium
                }
                media(perPage: 1, sort: [POPULARITY_DESC]) {
                    nodes {
                        title {
                            romaji
                            english
                        }
                    }
                }
            }
        }
    }
`;

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

function crearCartaAniList(personaje) {
    const imagen = personaje?.image?.large || personaje?.image?.medium || "";
    const nombre = personaje?.name?.full || personaje?.name?.native || "";
    if (!personaje?.id || !nombre || !imagenEsURL(imagen)) return null;

    const medios = personaje?.media?.nodes || [];
    const primerAnime = medios[0]?.title;
    const anime = primerAnime?.english || primerAnime?.romaji || "Anime no especificado";
    const rareza = elegirRareza();

    return {
        id: `ANILIST_${personaje.id}`,
        nombre: textoSeguro(nombre, 120),
        anime: textoSeguro(anime, 150),
        rareza,
        valor: valorPorRareza(rareza),
        imagen,
        fuente: `https://anilist.co/character/${personaje.id}`,
        api: "AniList API",
        licenciaImagen: "No verificada: revisar permisos antes de reutilizar la imagen"
    };
}

async function buscarCartaWeb(cartasActuales) {
    // Se prueban páginas diferentes para ampliar la variedad de personajes.
    const paginas = [
        Math.floor(Math.random() * 40) + 1,
        Math.floor(Math.random() * 40) + 1,
        1
    ];

    for (const pagina of paginas) {
        const resultado = await consultarAniList(CONSULTA_PERSONAJES, { pagina });
        const lista = resultado?.Page?.characters || [];
        if (!lista.length) continue;

        const candidatos = lista.filter(personaje =>
            personaje?.id &&
            (personaje?.image?.large || personaje?.image?.medium)
        );
        if (!candidatos.length) continue;

        // Elegir primero un personaje que aún no exista en el catálogo.
        const nuevos = candidatos.filter(personaje =>
            !cartasActuales.some(carta => String(carta.id) === `ANILIST_${personaje.id}`)
        );
        const disponibles = nuevos.length ? nuevos : candidatos;
        const personaje = disponibles[Math.floor(Math.random() * disponibles.length)];
        const carta = crearCartaAniList(personaje);
        if (!carta) continue;

        const existente = cartasActuales.find(c => String(c.id) === carta.id);
        if (existente) return existente;

        cartasActuales.push(carta);
        guardarCartas(cartasActuales);
        return carta;
    }

    throw new Error("AniList no devolvió personajes con imágenes disponibles.");
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
            `📺 Fuente: ${carta.anime || "Anime no especificado"}\n` +
            `🆔 ID: ${carta.id}\n` +
            `💰 Valor: ${carta.valor || 100}\n` +
            `📌 Estado: Pendiente de reclamar\n\n` +
            `━━━━━━━━━━━━━━━━\n` +
            `🃏 Usa *.w* para reclamarla.\n` +
            `🎲 Usa *.s* para sacar otra carta.` +
            (carta.fuente ? `\n🌐 Ficha: ${carta.fuente}` : "") +
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
            `📌 Estado: En tu colección\n` +
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
            `📺 Fuente: ${carta.anime || "Anime no especificado"}\n` +
            `⭐ Rareza: ${carta.rareza || "Común"}\n` +
            `💰 Valor: ${carta.valor || 100}\n` +
            `📌 Estado: ${usuario.cartas.some(c => String(c.id) === String(carta.id)) ? "En tu colección" : "En catálogo"}` +
            (carta.fuente ? `\n🌐 Ficha: ${carta.fuente}` : "");

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
                `━━━━━━━━━━━━━━━━\n⭐ Rarezas:\n⚪ Común\n🔵 Rara\n🟣 Épica\n🟡 Legendaria\n🔴 Mítica\n\n🌐 Personajes e imágenes consultados mediante AniList API. Las licencias de las imágenes deben verificarse por separado.`,
            ...(msg ? { quoted: msg } : {})
        });
    }

    return false;
}

module.exports = ejecutarCartas;
