// commands/mascota.js
// 🐾 TITANBOT - Sistema de Mascotas Virtuales
// Persistencia: database/mascotas.json

const fs = require("fs");
const path = require("path");

// ======================================================
// CONFIGURACIÓN
// ======================================================

const DB_DIR = path.join(__dirname, "..", "database");
const DB_FILE = path.join(DB_DIR, "mascotas.json");

// Crear carpeta database si no existe
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Crear archivo JSON si no existe
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), "utf8");
}

// ======================================================
// BASE DE DATOS
// ======================================================

function cargarMascotas() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, "{}", "utf8");
        }

        const contenido = fs.readFileSync(DB_FILE, "utf8").trim();

        if (!contenido) return {};

        return JSON.parse(contenido);
    } catch (error) {
        console.error("❌ Error leyendo mascotas.json:", error);

        // Intentar recuperar el archivo
        try {
            fs.writeFileSync(DB_FILE, "{}", "utf8");
        } catch (_) {}

        return {};
    }
}

function guardarMascotas(data) {
    try {
        fs.writeFileSync(
            DB_FILE,
            JSON.stringify(data, null, 2),
            "utf8"
        );
        return true;
    } catch (error) {
        console.error("❌ Error guardando mascotas:", error);
        return false;
    }
}

// ======================================================
// UTILIDADES
// ======================================================

function limitar(numero, minimo = 0, maximo = 100) {
    return Math.max(minimo, Math.min(maximo, numero));
}

function obtenerUsuario(m) {
    return (
        m.sender ||
        m.key?.participant ||
        m.participant ||
        m.key?.remoteJid ||
        "usuario"
    );
}

function obtenerNombre(m) {
    return (
        m.pushName ||
        m.name ||
        "Usuario"
    );
}

function crearID() {
    return Date.now().toString();
}

function barra(valor) {
    const total = 10;
    const llenos = Math.round((valor / 100) * total);
    const vacios = total - llenos;

    return "🟩".repeat(llenos) + "⬜".repeat(vacios);
}

function tipoEmoji(tipo) {
    const emojis = {
        perro: "🐶",
        gato: "🐱",
        zorro: "🦊",
        conejo: "🐰",
        panda: "🐼",
        dragon: "🐉",
        lobo: "🐺",
        unicornio: "🦄"
    };

    return emojis[tipo] || "🐾";
}

function crearMascota(nombre, tipo) {
    return {
        id: crearID(),
        nombre,
        tipo,
        nivel: 1,
        experiencia: 0,

        hambre: 80,
        energia: 80,
        felicidad: 80,
        higiene: 80,

        monedas: 100,

        evolucion: 0,

        inventario: {
            comida: 3,
            juguete: 1,
            jabon: 1
        },

        creada: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString()
    };
}

function experienciaNecesaria(nivel) {
    return nivel * 100;
}

function revisarNivel(mascota) {
    let subio = false;

    while (
        mascota.experiencia >= experienciaNecesaria(mascota.nivel)
    ) {
        mascota.experiencia -= experienciaNecesaria(mascota.nivel);
        mascota.nivel++;
        mascota.evolucion++;

        mascota.hambre = limitar(mascota.hambre + 15);
        mascota.energia = limitar(mascota.energia + 15);
        mascota.felicidad = limitar(mascota.felicidad + 15);
        mascota.higiene = limitar(mascota.higiene + 10);

        subio = true;
    }

    return subio;
}

function obtenerMascota(data, userId) {
    return data[userId] || null;
}

function actualizarFecha(mascota) {
    mascota.ultimaActualizacion = new Date().toISOString();
}

// ======================================================
// MENSAJES
// ======================================================

function mensajeSinMascota() {
    return `
🐾 *TITANBOT - MASCOTA*

❌ No tienes una mascota todavía.

Usa:

🐣 *.crearmascota Nombre Tipo*

Ejemplo:

*.crearmascota Max perro*

Tipos disponibles:

🐶 perro
🐱 gato
🦊 zorro
🐰 conejo
🐼 panda
🐺 lobo
🐉 dragon
🦄 unicornio
`.trim();
}

// ======================================================
// COMANDO PRINCIPAL
// ======================================================

async function mascota(m, sock) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = obtenerMascota(data, userId);

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: mensajeSinMascota() },
            { quoted: m }
        );
    }

    actualizarFecha(pet);
    guardarMascotas(data);

    const nivelXP = experienciaNecesaria(pet.nivel);

    const texto = `
╔══════════════════════╗
        🐾 *MI MASCOTA*
╚══════════════════════╝

${tipoEmoji(pet.tipo)} *${pet.nombre}*

👤 Dueño: ${obtenerNombre(m)}
🐾 Tipo: ${pet.tipo}
⭐ Nivel: ${pet.nivel}
✨ XP: ${pet.experiencia}/${nivelXP}
💰 Monedas: ${pet.monedas}

🍖 Hambre
${barra(pet.hambre)} ${pet.hambre}/100

⚡ Energía
${barra(pet.energia)} ${pet.energia}/100

❤️ Felicidad
${barra(pet.felicidad)} ${pet.felicidad}/100

🧼 Higiene
${barra(pet.higiene)} ${pet.higiene}/100

🔄 Evolución: ${pet.evolucion}

━━━━━━━━━━━━━━━━━━━━
🐾 *COMANDOS*

🍖 .alimentar
🎮 .jugar
🛁 .bañar
😴 .dormir
📊 .estado
✨ .evolucionar
🛒 .tienda
🎒 .inventario
`.trim();

    return sock.sendMessage(
        m.chat,
        { text: texto },
        { quoted: m }
    );
}

// ======================================================
// CREAR MASCOTA
// ======================================================

async function crearMascota(m, sock, args) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);

    if (data[userId]) {
        return sock.sendMessage(
            m.chat,
            {
                text: `
🐾 *YA TIENES UNA MASCOTA*

Tu mascota es:

${tipoEmoji(data[userId].tipo)} *${data[userId].nombre}*

Usa *.mascota* para verla.
`.trim()
            },
            { quoted: m }
        );
    }

    if (!args || args.length < 2) {
        return sock.sendMessage(
            m.chat,
            {
                text: `
🐣 *CREAR MASCOTA*

Uso:

*.crearmascota Nombre Tipo*

Ejemplos:

*.crearmascota Max perro*
*.crearmascota Luna gato*
*.crearmascota Rex dragon*

Tipos disponibles:

🐶 perro
🐱 gato
🦊 zorro
🐰 conejo
🐼 panda
🐺 lobo
🐉 dragon
🦄 unicornio
`.trim()
            },
            { quoted: m }
        );
    }

    const nombre = args[0].trim();
    const tipo = args[1].toLowerCase().trim();

    const tiposPermitidos = [
        "perro",
        "gato",
        "zorro",
        "conejo",
        "panda",
        "dragon",
        "lobo",
        "unicornio"
    ];

    if (!tiposPermitidos.includes(tipo)) {
        return sock.sendMessage(
            m.chat,
            {
                text: `❌ Tipo de mascota inválido.\n\nTipos disponibles:\n${tiposPermitidos.join(", ")}`
            },
            { quoted: m }
        );
    }

    if (nombre.length < 2 || nombre.length > 20) {
        return sock.sendMessage(
            m.chat,
            {
                text: "❌ El nombre debe tener entre 2 y 20 caracteres."
            },
            { quoted: m }
        );
    }

    const nuevaMascota = crearMascota(nombre, tipo);

    data[userId] = nuevaMascota;

    if (!guardarMascotas(data)) {
        return sock.sendMessage(
            m.chat,
            {
                text: "❌ No se pudo guardar tu mascota."
            },
            { quoted: m }
        );
    }

    return sock.sendMessage(
        m.chat,
        {
            text: `
╔══════════════════════╗
      🐣 *MASCOTA CREADA*
╚══════════════════════╝

${tipoEmoji(tipo)} *${nombre}*

🎉 ¡Felicidades!

Tu nueva mascota ha sido creada.

⭐ Nivel: 1
❤️ Felicidad: 80
🍖 Hambre: 80
⚡ Energía: 80
🧼 Higiene: 80
💰 Monedas: 100

Usa *.mascota* para verla.
`.trim()
        },
        { quoted: m }
    );
}

// ======================================================
// ALIMENTAR
// ======================================================

async function alimentar(m, sock) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = obtenerMascota(data, userId);

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: mensajeSinMascota() },
            { quoted: m }
        );
    }

    if (!pet.inventario) {
        pet.inventario = {
            comida: 0,
            juguete: 0,
            jabon: 0
        };
    }

    if ((pet.inventario.comida || 0) <= 0) {
        return sock.sendMessage(
            m.chat,
            {
                text: `
🍖 *SIN COMIDA*

No tienes comida para alimentar a ${pet.nombre}.

Puedes comprar comida en:

🛒 *.tienda*
`.trim()
            },
            { quoted: m }
        );
    }

    pet.inventario.comida--;
    pet.hambre = limitar(pet.hambre + 30);
    pet.felicidad = limitar(pet.felicidad + 5);
    pet.experiencia += 10;

    const subio = revisarNivel(pet);

    actualizarFecha(pet);
    guardarMascotas(data);

    return sock.sendMessage(
        m.chat,
        {
            text: `
🍖 *${pet.nombre} HA COMIDO*

❤️ Hambre: ${pet.hambre}/100
😊 Felicidad: ${pet.felicidad}/100
🍖 Comida restante: ${pet.inventario.comida}
✨ XP: +10
${subio ? `\n🎉 *¡SUBIÓ AL NIVEL ${pet.nivel}!*` : ""}
`.trim()
        },
        { quoted: m }
    );
}

// ======================================================
// JUGAR
// ======================================================

async function jugar(m, sock) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = obtenerMascota(data, userId);

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: mensajeSinMascota() },
            { quoted: m }
        );
    }

    if (pet.energia < 15) {
        return sock.sendMessage(
            m.chat,
            {
                text: `😴 *${pet.nombre} está cansado.*\n\nNecesita dormir antes de jugar.`
            },
            { quoted: m }
        );
    }

    if (!pet.inventario) {
        pet.inventario = {
            comida: 0,
            juguete: 0,
            jabon: 0
        };
    }

    if ((pet.inventario.juguete || 0) <= 0) {
        return sock.sendMessage(
            m.chat,
            {
                text: `
🎮 *NO TIENES JUGUETES*

Compra uno usando:

🛒 *.tienda*
`.trim()
            },
            { quoted: m }
        );
    }

    pet.inventario.juguete--;
    pet.energia = limitar(pet.energia - 15);
    pet.felicidad = limitar(pet.felicidad + 30);
    pet.hambre = limitar(pet.hambre - 5);
    pet.experiencia += 20;

    const subio = revisarNivel(pet);

    actualizarFecha(pet);
    guardarMascotas(data);

    return sock.sendMessage(
        m.chat,
        {
            text: `
🎮 *¡HORA DE JUGAR!*

${tipoEmoji(pet.tipo)} ${pet.nombre} se divirtió muchísimo.

❤️ Felicidad: ${pet.felicidad}/100
⚡ Energía: ${pet.energia}/100
✨ XP: +20
🎮 Juguetes restantes: ${pet.inventario.juguete}
${subio ? `\n🎉 *¡SUBIÓ AL NIVEL ${pet.nivel}!*` : ""}
`.trim()
        },
        { quoted: m }
    );
}

// ======================================================
// BAÑAR
// ======================================================

async function banar(m, sock) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = obtenerMascota(data, userId);

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: mensajeSinMascota() },
            { quoted: m }
        );
    }

    if (!pet.inventario) {
        pet.inventario = {
            comida: 0,
            juguete: 0,
            jabon: 0
        };
    }

    if ((pet.inventario.jabon || 0) <= 0) {
        return sock.sendMessage(
            m.chat,
            {
                text: `
🧼 *NO TIENES JABÓN*

Compra jabón usando:

🛒 *.tienda*
`.trim()
            },
            { quoted: m }
        );
    }

    pet.inventario.jabon--;
    pet.higiene = limitar(pet.higiene + 40);
    pet.felicidad = limitar(pet.felicidad + 5);
    pet.experiencia += 10;

    const subio = revisarNivel(pet);

    actualizarFecha(pet);
    guardarMascotas(data);

    return sock.sendMessage(
        m.chat,
        {
            text: `
🛁 *${pet.nombre} ESTÁ LIMPIO*

🧼 Higiene: ${pet.higiene}/100
❤️ Felicidad: ${pet.felicidad}/100
✨ XP: +10
🧼 Jabón restante: ${pet.inventario.jabon}
${subio ? `\n🎉 *¡SUBIÓ AL NIVEL ${pet.nivel}!*` : ""}
`.trim()
        },
        { quoted: m }
    );
}

// ======================================================
// DORMIR
// ======================================================

async function dormir(m, sock) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = obtenerMascota(data, userId);

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: mensajeSinMascota() },
            { quoted: m }
        );
    }

    pet.energia = 100;
    pet.hambre = limitar(pet.hambre - 10);
    pet.experiencia += 5;

    revisarNivel(pet);

    actualizarFecha(pet);
    guardarMascotas(data);

    return sock.sendMessage(
        m.chat,
        {
            text: `
😴 *${pet.nombre} HA DORMIDO*

💤 Energía restaurada: 100/100
🍖 Hambre: ${pet.hambre}/100
✨ XP: +5

${tipoEmoji(pet.tipo)} ¡Ahora está listo para continuar!
`.trim()
        },
        { quoted: m }
    );
}

// ======================================================
// ESTADO
// ======================================================

async function estado(m, sock) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = obtenerMascota(data, userId);

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: mensajeSinMascota() },
            { quoted: m }
        );
    }

    return sock.sendMessage(
        m.chat,
        {
            text: `
╔══════════════════════╗
       📊 *ESTADO*
╚══════════════════════╝

${tipoEmoji(pet.tipo)} *${pet.nombre}*

🐾 Tipo: ${pet.tipo}
⭐ Nivel: ${pet.nivel}
✨ XP: ${pet.experiencia}/${experienciaNecesaria(pet.nivel)}

🍖 Hambre
${barra(pet.hambre)}
${pet.hambre}/100

⚡ Energía
${barra(pet.energia)}
${pet.energia}/100

❤️ Felicidad
${barra(pet.felicidad)}
${pet.felicidad}/100

🧼 Higiene
${barra(pet.higiene)}
${pet.higiene}/100

💰 Monedas: ${pet.monedas}
🔄 Evolución: ${pet.evolucion}
`.trim()
        },
        { quoted: m }
    );
}

// ======================================================
// EVOLUCIONAR
// ======================================================

async function evolucionar(m, sock) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = obtenerMascota(data, userId);

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: mensajeSinMascota() },
            { quoted: m }
        );
    }

    const nivelNecesario = 5;

    if (pet.nivel < nivelNecesario) {
        return sock.sendMessage(
            m.chat,
            {
                text: `
✨ *EVOLUCIÓN*

${pet.nombre} todavía no puede evolucionar.

⭐ Nivel actual: ${pet.nivel}
⭐ Nivel necesario: ${nivelNecesario}

Sigue cuidando a tu mascota para subir de nivel.
`.trim()
            },
            { quoted: m }
        );
    }

    if (pet.evolucion >= 3) {
        return sock.sendMessage(
            m.chat,
            {
                text: `✨ ${pet.nombre} ya alcanzó su máximo de evolución.`
            },
            { quoted: m }
        );
    }

    pet.evolucion++;
    pet.nivel += 1;

    pet.hambre = 100;
    pet.energia = 100;
    pet.felicidad = 100;
    pet.higiene = 100;

    actualizarFecha(pet);
    guardarMascotas(data);

    return sock.sendMessage(
        m.chat,
        {
            text: `
╔══════════════════════╗
       ✨ *EVOLUCIÓN*
╚══════════════════════╝

🎉 ¡${pet.nombre} ha evolucionado!

${tipoEmoji(pet.tipo)} *${pet.nombre}*

⭐ Nuevo nivel: ${pet.nivel}
🔄 Evolución: ${pet.evolucion}

❤️ Felicidad: 100
🍖 Hambre: 100
⚡ Energía: 100
🧼 Higiene: 100

🐾 ¡Tu mascota es más fuerte!
`.trim()
        },
        { quoted: m }
    );
}

// ======================================================
// TIENDA
// ======================================================

async function tienda(m, sock) {
    const texto = `
╔══════════════════════╗
       🛒 *TIENDA*
╚══════════════════════╝

💰 Compra objetos para tu mascota.

🍖 *Comida*
Precio: 20 monedas
Recupera hambre.

🎮 *Juguete*
Precio: 30 monedas
Permite jugar.

🧼 *Jabón*
Precio: 25 monedas
Permite bañar a tu mascota.

━━━━━━━━━━━━━━━━━━━━

📌 Comprar:

*.comprar comida*
*.comprar juguete*
*.comprar jabon*
`.trim();

    return sock.sendMessage(
        m.chat,
        { text: texto },
        { quoted: m }
    );
}

// ======================================================
// COMPRAR
// ======================================================

async function comprar(m, sock, args) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = obtenerMascota(data, userId);

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: mensajeSinMascota() },
            { quoted: m }
        );
    }

    if (!args || !args[0]) {
        return sock.sendMessage(
            m.chat,
            {
                text: `
🛒 *COMPRAR*

Usa:

*.comprar comida*
*.comprar juguete*
*.comprar jabon*
`.trim()
            },
            { quoted: m }
        );
    }

    const producto = args[0].toLowerCase();

    const productos = {
        comida: {
            precio: 20,
            campo: "comida",
            emoji: "🍖"
        },
        juguete: {
            precio: 30,
            campo: "juguete",
            emoji: "🎮"
        },
        jabon: {
            precio: 25,
            campo: "jabon",
            emoji: "🧼"
        }
    };

    const item = productos[producto];

    if (!item) {
        return sock.sendMessage(
            m.chat,
            {
                text: "❌ Producto no encontrado. Usa *.tienda* para ver los productos."
            },
            { quoted: m }
        );
    }

    if (pet.monedas < item.precio) {
        return sock.sendMessage(
            m.chat,
            {
                text: `
❌ *NO TIENES SUFICIENTES MONEDAS*

💰 Tienes: ${pet.monedas}
💵 Necesitas: ${item.precio}
`.trim()
            },
            { quoted: m }
        );
    }

    if (!pet.inventario) {
        pet.inventario = {
            comida: 0,
            juguete: 0,
            jabon: 0
        };
    }

    pet.monedas -= item.precio;
    pet.inventario[item.campo]++;

    actualizarFecha(pet);
    guardarMascotas(data);

    return sock.sendMessage(
        m.chat,
        {
            text: `
🛒 *COMPRA REALIZADA*

${item.emoji} Producto: ${producto}
💵 Precio: ${item.precio}
💰 Monedas restantes: ${pet.monedas}

🎒 Cantidad: ${pet.inventario[item.campo]}
`.trim()
        },
        { quoted: m }
    );
}

  // ======================================================
// INVENTARIO
// ======================================================

async function inventario(m, sock) {
    const data = cargarMascotas();
    const userId = obtenerUsuario(m);
    const pet = data[userId];

    if (!pet) {
        return sock.sendMessage(
            m.chat,
            { text: sinMascota() },
            { quoted: m }
        );
    }

    pet.inventario ||= {
        comida: 0,
        juguete: 0,
        jabon: 0
    };

    guardarMascotas(data);

    return sock.sendMessage(
        m.chat,
        {
            text: `
╔══════════════════════╗
       🎒 *INVENTARIO*
╚══════════════════════╝

${tipoEmoji(pet.tipo)} *${pet.nombre}*

🍖 Comida: ${pet.inventario.comida || 0}
🎮 Juguetes: ${pet.inventario.juguete || 0}
🧼 Jabón: ${pet.inventario.jabon || 0}

💰 Monedas: ${pet.monedas}

━━━━━━━━━━━━━━━━━━━━

🛒 Usa *.tienda* para comprar objetos.
`.trim()
        },
        { quoted: m }
    );
}


// ======================================================
// MANEJADOR PRINCIPAL DE MASCOTAS
// ======================================================

async function ejecutarMascota(m, sock, command, args = []) {

    const cmd = String(command || "")
        .toLowerCase()
        .replace(/^\./, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    switch (cmd) {

        case "mascota":
            return mascota(m, sock);

        case "crearmascota":
            return crearMascota(m, sock, args);

        case "alimentar":
        case "comer":
            return alimentar(m, sock);

        case "jugar":
            return jugar(m, sock);

        case "banar":
            return banar(m, sock);

        case "dormir":
            return dormir(m, sock);

        case "estado":
            return estado(m, sock);

        case "evolucionar":
            return evolucionar(m, sock);

        case "tienda":
            return tienda(m, sock);

        case "comprar":
            return comprar(m, sock, args);

        case "inventario":
            return inventario(m, sock);

        default:
            return false;
    }
}


// ======================================================
// EXPORTACIONES
// ======================================================

module.exports = {
    ejecutarMascota,

    mascota,
    crearMascota,
    alimentar,
    jugar,
    banar,
    dormir,
    estado,
    evolucionar,
    tienda,
    comprar,
    inventario
};
