// ============================================
// 🎴 TITANBOT - SISTEMA DE CARTAS
// Sin IA - Sin API de IA
// ============================================

const fs = require("fs");
const path = require("path");

// ============================================
// 📁 RUTAS
// ============================================

const databaseDir = path.join(__dirname, "../../database");

const cartasFile = path.join(databaseDir, "cartas.json");
const usuariosFile = path.join(databaseDir, "cartas_usuarios.json");

// Crear carpeta database si no existe
if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
}

// Crear base de usuarios si no existe
if (!fs.existsSync(usuariosFile)) {
    fs.writeFileSync(
        usuariosFile,
        JSON.stringify({}, null, 2)
    );
}

// ============================================
// 📖 FUNCIONES
// ============================================

function cargarCartas() {
    try {
        return JSON.parse(
            fs.readFileSync(cartasFile, "utf8")
        );
    } catch (error) {
        console.error("❌ Error leyendo cartas.json:", error);
        return [];
    }
}

function cargarUsuarios() {
    try {
        return JSON.parse(
            fs.readFileSync(usuariosFile, "utf8")
        );
    } catch (error) {
        return {};
    }
}

function guardarUsuarios(data) {
    fs.writeFileSync(
        usuariosFile,
        JSON.stringify(data, null, 2)
    );
}

function obtenerUsuario(id) {
    const usuarios = cargarUsuarios();

    if (!usuarios[id]) {
        usuarios[id] = {
            cartas: [],
            pendiente: null
        };

        guardarUsuarios(usuarios);
    }

    return usuarios[id];
}

// ============================================
// 🎲 CARTA ALEATORIA
// ============================================

function cartaAleatoria(cartas) {

    if (!cartas.length) return null;

    // Sistema de probabilidades por rareza
    const probabilidades = {
        "Común": 60,
        "Rara": 25,
        "Épica": 10,
        "Legendaria": 4,
        "Mítica": 1
    };

    const bolsa = [];

    for (const carta of cartas) {

        const cantidad =
            probabilidades[carta.rareza] || 1;

        for (let i = 0; i < cantidad; i++) {
            bolsa.push(carta);
        }
    }

    return bolsa[
        Math.floor(Math.random() * bolsa.length)
    ];
}

// ============================================
// ⭐ EMOJIS DE RAREZA
// ============================================

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

// ============================================
// 🎴 COMANDO PRINCIPAL
// ============================================

async function ejecutarCartas(sock, chat, sender, texto) {

    const cartas = cargarCartas();

    if (!cartas.length) {
        return sock.sendMessage(chat, {
            text: "❌ No hay cartas configuradas."
        });
    }

    const usuario = obtenerUsuario(sender);

    const partes = texto.trim().split(/\s+/);

    const comando = partes[0].toLowerCase();

    // ========================================
    // 🎲 .s
    // ========================================

    if (comando === ".s") {

        const carta = cartaAleatoria(cartas);

        if (!carta) {
            return sock.sendMessage(chat, {
                text: "❌ No hay cartas disponibles."
            });
        }

        usuario.pendiente = carta.id;

        const mensaje =
`🎴 *TITAN CARD*

${emojiRareza(carta.rareza)} *${carta.rareza.toUpperCase()}*

👤 *${carta.nombre}*
📺 Anime: ${carta.anime}
🆔 ID: ${carta.id}
💰 Valor: ${carta.valor}

━━━━━━━━━━━━━━━━
🃏 Usa *.w* para reclamarla.
🎴 Usa *.s* para sacar otra carta.`;

        // Guardar pendiente
        const usuarios = cargarUsuarios();
        usuarios[sender] = usuario;
        guardarUsuarios(usuarios);

        // ====================================
        // 🖼️ IMAGEN LOCAL
        // ====================================

        if (carta.imagen) {

            const imagenPath = path.join(
                __dirname,
                "../../media/cartas",
                carta.imagen
            );

            if (fs.existsSync(imagenPath)) {

                return sock.sendMessage(chat, {
                    image: fs.readFileSync(imagenPath),
                    caption: mensaje
                });

            }
        }

        // Si no existe imagen
        return sock.sendMessage(chat, {
            text: mensaje +
                "\n\n⚠️ Imagen no encontrada."
        });
    }

    // ========================================
    // 🃏 .w
    // ========================================

    if (comando === ".w") {

        if (!usuario.pendiente) {

            return sock.sendMessage(chat, {
                text:
`❌ No tienes ninguna carta pendiente.

Usa *.s* para sacar una carta.`
            });
        }

        const carta = cartas.find(
            c => c.id === usuario.pendiente
        );

        if (!carta) {

            usuario.pendiente = null;

            const usuarios = cargarUsuarios();
            usuarios[sender] = usuario;
            guardarUsuarios(usuarios);

            return sock.sendMessage(chat, {
                text: "❌ Esa carta ya no existe."
            });
        }

        // Evitar duplicados
        const yaTiene = usuario.cartas.find(
            c => c.id === carta.id
        );

        if (yaTiene) {

            yaTiene.cantidad++;

        } else {

            usuario.cartas.push({
                id: carta.id,
                cantidad: 1
            });
        }

        usuario.pendiente = null;

        const usuarios = cargarUsuarios();
        usuarios[sender] = usuario;

        guardarUsuarios(usuarios);

        return sock.sendMessage(chat, {
            text:
`✅ *¡CARTA RECLAMADA!*

${emojiRareza(carta.rareza)} ${carta.nombre}

📺 ${carta.anime}
⭐ ${carta.rareza}
💰 ${carta.valor}

🎴 Ahora forma parte de tu colección.`
        });
    }

    // ========================================
    // 📚 .coleccion
    // ========================================

    if (comando === ".coleccion") {

        if (!usuario.cartas.length) {

            return sock.sendMessage(chat, {
                text:
`📚 *TU COLECCIÓN ESTÁ VACÍA*

Usa *.s* para sacar tu primera carta.`
            });
        }

        let mensaje =
`🎴 *COLECCIÓN DE CARTAS*

📦 Cartas diferentes: ${usuario.cartas.length}

━━━━━━━━━━━━━━━━`;

        let valorTotal = 0;

        for (const poseida of usuario.cartas) {

            const carta = cartas.find(
                c => c.id === poseida.id
            );

            if (!carta) continue;

            valorTotal +=
                carta.valor * poseida.cantidad;

            mensaje +=
`\n\n${emojiRareza(carta.rareza)} *${carta.nombre}*
📺 ${carta.anime}
⭐ ${carta.rareza}
🔢 x${poseida.cantidad}
💰 ${carta.valor * poseida.cantidad}`;
        }

        mensaje +=
`\n\n━━━━━━━━━━━━━━━━
💰 *VALOR TOTAL:* ${valorTotal}`;

        return sock.sendMessage(chat, {
            text: mensaje
        });
    }

    // ========================================
    // 🔎 .carta ID
    // ========================================

    if (comando === ".carta") {

        const busqueda =
            partes.slice(1).join(" ").toLowerCase();

        if (!busqueda) {

            return sock.sendMessage(chat, {
                text:
`🔎 *CONSULTAR CARTA*

Ejemplo:

.carta naruto
.carta C001`
            });
        }

        const carta = cartas.find(c =>
            c.id.toLowerCase() === busqueda ||
            c.nombre.toLowerCase().includes(busqueda)
        );

        if (!carta) {

            return sock.sendMessage(chat, {
                text: "❌ No encontré esa carta."
            });
        }

        return sock.sendMessage(chat, {
            text:
`🎴 *CARTA*

${emojiRareza(carta.rareza)} *${carta.nombre}*

🆔 ID: ${carta.id}
📺 Anime: ${carta.anime}
⭐ Rareza: ${carta.rareza}
💰 Valor: ${carta.valor}`
        });
    }

    // ========================================
    // 📖 .cartas
    // ========================================

    if (comando === ".cartas") {

        return sock.sendMessage(chat, {
            text:
`🎴 *TITAN CARD SYSTEM*

Colecciona personajes y completa tu colección.

🎲 *.s*
Sacar una carta.

🃏 *.w*
Reclamar carta.

📚 *.coleccion*
Ver tus cartas.

🔎 *.carta <nombre>*
Buscar una carta.

━━━━━━━━━━━━━━━━

⭐ Rarezas:

⚪ Común
🔵 Rara
🟣 Épica
🟡 Legendaria
🔴 Mítica`
        });
    }

    return false;
}

// ============================================
// 📤 EXPORTACIÓN
// ============================================

module.exports = ejecutarCartas;
