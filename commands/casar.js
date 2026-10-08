// ==========================================
// 💍 TITANBOT - SISTEMA DE MATRIMONIOS
// ==========================================

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");

// ==========================================
// 📁 RUTAS
// ==========================================

const DATABASE_DIR = path.join(__dirname, "..", "database");
const DATABASE_FILE = path.join(
    DATABASE_DIR,
    "matrimonios.json"
);

const TEMP_DIR = path.join(
    DATABASE_DIR,
    "temp_bodas"
);

// ==========================================
// 📁 CREAR CARPETAS / ARCHIVO
// ==========================================

function prepararBase() {

    if (!fs.existsSync(DATABASE_DIR)) {
        fs.mkdirSync(DATABASE_DIR, {
            recursive: true
        });
    }

    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, {
            recursive: true
        });
    }

    if (!fs.existsSync(DATABASE_FILE)) {

        fs.writeFileSync(
            DATABASE_FILE,
            JSON.stringify(
                {
                    matrimonios: {},
                    propuestas: {}
                },
                null,
                2
            )
        );
    }
}

// ==========================================
// 📖 LEER BASE DE DATOS
// ==========================================

function leerDB() {

    prepararBase();

    try {

        const db = JSON.parse(
            fs.readFileSync(
                DATABASE_FILE,
                "utf8"
            )
        );

        if (!db.matrimonios) {
            db.matrimonios = {};
        }

        if (!db.propuestas) {
            db.propuestas = {};
        }

        return db;

    } catch (error) {

        console.error(
            "❌ Error leyendo matrimonios.json:",
            error
        );

        return {
            matrimonios: {},
            propuestas: {}
        };
    }
}

// ==========================================
// 💾 GUARDAR
// ==========================================

function guardarDB(db) {

    prepararBase();

    fs.writeFileSync(
        DATABASE_FILE,
        JSON.stringify(
            db,
            null,
            2
        )
    );
}

// ==========================================
// 🔧 NORMALIZAR JID
// ==========================================

function normalizarJid(jid) {

    if (!jid) return null;

    return jid
        .toString()
        .split(":")[0];
}

// ==========================================
// 📱 OBTENER NÚMERO
// ==========================================

function numero(jid) {

    if (!jid) return "";

    return normalizarJid(jid)
        .split("@")[0];
}

// ==========================================
// 👤 OBTENER JID DESDE @USUARIO
// ==========================================

function obtenerUsuario(args) {

    if (!args || !args.length) {
        return null;
    }

    const texto = args[0]
        .toString()
        .trim();

    // Ejemplo:
    // @573001234567

    const numeros = texto.replace(
        /[^0-9]/g,
        ""
    );

    if (!numeros) {
        return null;
    }

    return `${numeros}@s.whatsapp.net`;
}

// ==========================================
// 💍 BUSCAR MATRIMONIO
// ==========================================

function buscarMatrimonio(db, usuario) {

    return Object.entries(
        db.matrimonios
    ).find(([clave, matrimonio]) => {

        return (
            matrimonio.persona1 === usuario ||
            matrimonio.persona2 === usuario
        );

    });
}

// ==========================================
// ❤️ OBTENER PAREJA
// ==========================================

function obtenerPareja(db, usuario) {

    const encontrado =
        buscarMatrimonio(
            db,
            usuario
        );

    if (!encontrado) {
        return null;
    }

    const matrimonio =
        encontrado[1];

    return matrimonio.persona1 === usuario
        ? matrimonio.persona2
        : matrimonio.persona1;
}

// ==========================================
// 🔐 CLAVE DEL MATRIMONIO
// ==========================================

function crearClave(a, b) {

    return [
        normalizarJid(a),
        normalizarJid(b)
    ]
        .sort()
        .join("_");
}

// ==========================================
// ⏳ LIMPIAR PROPUESTAS
// ==========================================

function limpiarPropuestas(db) {

    const ahora = Date.now();

    for (
        const id of Object.keys(
            db.propuestas
        )
    ) {

        const propuesta =
            db.propuestas[id];

        if (
            !propuesta ||
            propuesta.expira < ahora
        ) {

            delete db.propuestas[id];
        }
    }

    guardarDB(db);
}

// ==========================================
// 📸 FOTO DE PERFIL
// ==========================================

async function descargarFoto(
    sock,
    jid
) {

    try {

        const url =
            await sock.profilePictureUrl(
                jid,
                "image"
            );

        if (!url) {
            return null;
        }

        const respuesta =
            await axios.get(
                url,
                {
                    responseType:
                        "arraybuffer",
                    timeout: 15000
                }
            );

        return Buffer.from(
            respuesta.data
        );

    } catch (error) {

        console.log(
            "⚠️ No se pudo obtener foto:",
            jid
        );

        return null;
    }
}

// ==========================================
// 🖼️ FOTO DE RESPALDO
// ==========================================

function fotoPredeterminada() {

    const svg = `
    <svg width="600" height="600"
    xmlns="http://www.w3.org/2000/svg">

        <rect
            width="600"
            height="600"
            fill="#252525"
        />

        <circle
            cx="300"
            cy="220"
            r="120"
            fill="#555555"
        />

        <path
            d="M100 600
               C110 400 490 400 500 600"
            fill="#444444"
        />

        <text
            x="300"
            y="330"
            text-anchor="middle"
            font-size="55"
            fill="white">
            ❤️
        </text>

    </svg>
    `;

    return Buffer.from(svg);
}

// ==========================================
// 🖼️ CREAR IMAGEN DE BODA
// ==========================================

async function crearImagenBoda(
    foto1,
    foto2
) {

    const id =
        Date.now();

    const izquierda =
        path.join(
            TEMP_DIR,
            `izquierda_${id}.png`
        );

    const derecha =
        path.join(
            TEMP_DIR,
            `derecha_${id}.png`
        );

    const salida =
        path.join(
            TEMP_DIR,
            `boda_${id}.jpg`
        );

    await sharp(foto1)
        .resize(
            600,
            600,
            {
                fit: "cover"
            }
        )
        .png()
        .toFile(izquierda);

    await sharp(foto2)
        .resize(
            600,
            600,
            {
                fit: "cover"
            }
        )
        .png()
        .toFile(derecha);

    const decoracion = Buffer.from(`
    <svg
        width="1200"
        height="800"
        xmlns="http://www.w3.org/2000/svg">

        <rect
            width="1200"
            height="800"
            fill="#ffe6ef"/>

        <text
            x="600"
            y="70"
            text-anchor="middle"
            font-family="Arial"
            font-size="55"
            font-weight="bold"
            fill="#c2185b">

            💍 BODA TITANBOT

        </text>

        <text
            x="600"
            y="125"
            text-anchor="middle"
            font-family="Arial"
            font-size="32"
            fill="#7b1fa2">

            ❤️ Unidos oficialmente ❤️

        </text>

        <text
            x="600"
            y="770"
            text-anchor="middle"
            font-family="Arial"
            font-size="28"
            fill="#880e4f">

            TITANBOT ⚡

        </text>

    </svg>
    `);

    await sharp({
        create: {
            width: 1200,
            height: 800,
            channels: 4,
            background: {
                r: 255,
                g: 230,
                b: 239,
                alpha: 1
            }
        }
    })
        .composite([
            {
                input: izquierda,
                left: 0,
                top: 170
            },
            {
                input: derecha,
                left: 600,
                top: 170
            },
            {
                input: decoracion,
                left: 0,
                top: 0
            }
        ])
        .jpeg({
            quality: 90
        })
        .toFile(salida);

    // Limpiar temporales

    try {
        fs.unlinkSync(
            izquierda
        );

        fs.unlinkSync(
            derecha
        );
    } catch {}

    return salida;
}

// ==========================================
// 📸 ENVIAR FOTO DE BODA
// ==========================================

async function enviarFotoBoda(
    sock,
    chat,
    persona1,
    persona2
) {

    try {

        let foto1 =
            await descargarFoto(
                sock,
                persona1
            );

        let foto2 =
            await descargarFoto(
                sock,
                persona2
            );

        if (!foto1) {
            foto1 =
                fotoPredeterminada();
        }

        if (!foto2) {
            foto2 =
                fotoPredeterminada();
        }

        const imagen =
            await crearImagenBoda(
                foto1,
                foto2
            );

        await sock.sendMessage(
            chat,
            {
                image: {
                    url: imagen
                },

                caption:
                    "💍❤️ *¡MATRIMONIO OFICIAL!* ❤️💍\n\n" +
                    `👤 @${numero(persona1)}\n` +
                    `❤️ @${numero(persona2)}\n\n` +
                    "🎉 ¡Felicidades a la nueva pareja!\n" +
                    "📜 Su matrimonio ha sido registrado en TITANBOT ⚡",

                mentions: [
                    persona1,
                    persona2
                ]
            }
        );

        setTimeout(() => {

            try {

                if (
                    fs.existsSync(
                        imagen
                    )
                ) {

                    fs.unlinkSync(
                        imagen
                    );
                }

            } catch {}

        }, 30000);

    } catch (error) {

        console.error(
            "❌ Error creando boda:",
            error
        );
    }
}

// ==========================================
// 💍 COMANDO PRINCIPAL
// ==========================================

async function casar(
    sock,
    chat,
    comando,
    args,
    id,
    esGrupo,
    esAdmin
) {

    prepararBase();

    const cmd =
        String(comando || "")
            .toLowerCase()
            .trim();

    const usuario =
        normalizarJid(id);

    const db =
        leerDB();

    limpiarPropuestas(db);

    // ======================================
    // 💍 .casar @usuario
    // ======================================

    if (cmd === "casar") {

        if (!esGrupo) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💍 Este comando solo funciona en grupos."
                }
            );

            return true;
        }

        const objetivo =
            obtenerUsuario(args);

        if (!objetivo) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💍 *PROPUESTA DE MATRIMONIO*\n\n" +
                        "Debes mencionar a la persona.\n\n" +
                        "📌 Ejemplo:\n" +
                        "`.casar @usuario`"
                }
            );

            return true;
        }

        if (
            objetivo === usuario
        ) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "😂 No puedes casarte contigo mismo."
                }
            );

            return true;
        }

        if (
            buscarMatrimonio(
                db,
                usuario
            )
        ) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💍 Ya estás casado/a.\n\n" +
                        "💔 Usa `.divorcio` si quieres terminar el matrimonio."
                }
            );

            return true;
        }

        if (
            buscarMatrimonio(
                db,
                objetivo
            )
        ) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💔 Esa persona ya está casada."
                }
            );

            return true;
        }

        const propuestaPendiente =
            Object.values(
                db.propuestas
            ).find(
                p =>
                    p.de === usuario &&
                    p.para === objetivo
            );

        if (
            propuestaPendiente
        ) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💍 Ya tienes una propuesta pendiente para esa persona."
                }
            );

            return true;
        }

        const propuestaId =
            `${usuario}_${objetivo}_${Date.now()}`;

        db.propuestas[
            propuestaId
        ] = {

            de: usuario,

            para: objetivo,

            chat: chat,

            fecha:
                new Date()
                    .toISOString(),

            expira:
                Date.now() +
                10 * 60 * 1000
        };

        guardarDB(db);

        await sock.sendMessage(
            chat,
            {
                text:
                    "💍 *PROPUESTA DE MATRIMONIO* 💍\n\n" +

                    `💘 @${numero(usuario)} ` +
                    `le ha propuesto matrimonio a ` +
                    `@${numero(objetivo)}.\n\n` +

                    "❤️ ¿Aceptas casarte?\n\n" +

                    "✅ Escribe: *.aceptar*\n" +
                    "❌ Escribe: *.rechazar*\n\n" +

                    "⏳ La propuesta expira en 10 minutos.",

                mentions: [
                    usuario,
                    objetivo
                ]
            }
        );

        return true;
    }

    // ======================================
    // ✅ aceptar
    // ======================================

    if (
        cmd === "aceptar"
    ) {

        const encontrada =
            Object.entries(
                db.propuestas
            ).find(
                ([, p]) =>
                    p.para === usuario
            );

        if (!encontrada) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💌 No tienes ninguna propuesta pendiente."
                }
            );

            return true;
        }

        const [
            propuestaId,
            propuesta
        ] = encontrada;

        if (
            buscarMatrimonio(
                db,
                usuario
            )
        ) {

            delete db.propuestas[
                propuestaId
            ];

            guardarDB(db);

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💍 Ya estás casado/a."
                }
            );

            return true;
        }

        if (
            buscarMatrimonio(
                db,
                propuesta.de
            )
        ) {

            delete db.propuestas[
                propuestaId
            ];

            guardarDB(db);

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💔 La persona que te hizo la propuesta ya está casada."
                }
            );

            return true;
        }

        const clave =
            crearClave(
                propuesta.de,
                usuario
            );

        db.matrimonios[
            clave
        ] = {

            persona1:
                propuesta.de,

            persona2:
                usuario,

            fecha:
                new Date()
                    .toISOString(),

            chat:
                propuesta.chat
        };

        delete db.propuestas[
            propuestaId
        ];

        guardarDB(db);

        await sock.sendMessage(
            chat,
            {
                text:
                    "💍❤️ *¡MATRIMONIO ACEPTADO!* ❤️💍\n\n" +

                    `👤 @${numero(propuesta.de)}\n` +
                    `❤️ @${numero(usuario)}\n\n` +

                    "🎉 ¡Ahora están oficialmente casados!\n\n" +

                    "📜 Matrimonio guardado correctamente.",

                mentions: [
                    propuesta.de,
                    usuario
                ]
            }
        );

        // Crear imagen con ambas fotos

        await enviarFotoBoda(
            sock,
            chat,
            propuesta.de,
            usuario
        );

        return true;
    }

    // ======================================
    // ❌ rechazar
    // ======================================

    if (
        cmd === "rechazar"
    ) {

        const encontrada =
            Object.entries(
                db.propuestas
            ).find(
                ([, p]) =>
                    p.para === usuario
            );

        if (!encontrada) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💌 No tienes ninguna propuesta pendiente."
                }
            );

            return true;
        }

        const [
            propuestaId,
            propuesta
        ] = encontrada;

        delete db.propuestas[
            propuestaId
        ];

        guardarDB(db);

        await sock.sendMessage(
            chat,
            {
                text:
                    "❌💔 *PROPUESTA RECHAZADA*\n\n" +

                    `@${numero(usuario)} ` +
                    "ha rechazado la propuesta de " +

                    `@${numero(propuesta.de)}.`,

                mentions: [
                    usuario,
                    propuesta.de
                ]
            }
        );

        return true;
    }

    // ======================================
    // 📜 .matrimonio
    // ======================================

    if (
        cmd === "matrimonio"
    ) {

        const encontrado =
            buscarMatrimonio(
                db,
                usuario
            );

        if (!encontrado) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💔 *ESTADO CIVIL*\n\n" +
                        "Actualmente estás soltero/a.\n\n" +
                        "💍 Puedes usar:\n" +
                        "`.casar @usuario`"
                }
            );

            return true;
        }

        const matrimonio =
            encontrado[1];

        const pareja =
            matrimonio.persona1 === usuario
                ? matrimonio.persona2
                : matrimonio.persona1;

        const fecha =
            new Date(
                matrimonio.fecha
            );

        await sock.sendMessage(
            chat,
            {
                text:
                    "📜💍 *CERTIFICADO DE MATRIMONIO* 💍📜\n\n" +

                    `👤 Usuario: @${numero(usuario)}\n` +

                    `❤️ Pareja: @${numero(pareja)}\n\n` +

                    `📅 Fecha: ${fecha.toLocaleDateString("es-CO")}\n` +

                    `🕐 Hora: ${fecha.toLocaleTimeString("es-CO")}\n\n` +

                    "💍 Estado: *CASADO/A* ❤️",

                mentions: [
                    usuario,
                    pareja
                ]
            }
        );

        return true;
    }

    // ======================================
    // 💔 .divorcio
    // ======================================

    if (
        cmd === "divorcio"
    ) {

        const encontrado =
            buscarMatrimonio(
                db,
                usuario
            );

        if (!encontrado) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        "💔 Actualmente no estás casado/a."
                }
            );

            return true;
        }

        const matrimonio =
            encontrado[1];

        const pareja =
            matrimonio.persona1 === usuario
                ? matrimonio.persona2
                : matrimonio.persona1;

        const clave =
            crearClave(
                matrimonio.persona1,
                matrimonio.persona2
            );

        delete db.matrimonios[
            clave
        ];

        guardarDB(db);

        await sock.sendMessage(
            chat,
            {
                text:
                    "💔 *DIVORCIO REALIZADO*\n\n" +

                    `@${numero(usuario)} ` +
                    `y @${numero(pareja)} ` +
                    "ya no están casados.\n\n" +

                    "📜 El matrimonio fue eliminado de TITANBOT.",

                mentions: [
                    usuario,
                    pareja
                ]
            }
        );

        return true;
    }

    return false;
}

module.exports = casar;
