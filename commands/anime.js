/**
 * ============================================================
 * TITANBOT - ANIME / PERSONAJES
 * ============================================================
 *
 * .s
 * 🎲 Saca un personaje aleatorio
 *
 * .w
 * ❤️ Reclama el último personaje que salió con .s
 *
 * .coleccion
 * 📚 Muestra los personajes reclamados
 *
 * ============================================================
 */

const axios = require("axios");

// ============================================================
// DATOS TEMPORALES
// ============================================================

// Último personaje que le salió a cada usuario
const ultimoPersonaje = new Map();

// Colección de cada usuario
const colecciones = new Map();


// ============================================================
// OBTENER PERSONAJE ALEATORIO
// ============================================================

async function obtenerPersonaje() {
    try {
        const respuesta = await axios.get(
            "https://api.jikan.moe/v4/random/characters",
            {
                timeout: 15000
            }
        );

        const personaje = respuesta.data?.data;

        if (!personaje) {
            return null;
        }

        let anime = "Anime desconocido";

        // Intentar obtener el anime relacionado
        try {
            const datos = await axios.get(
                `https://api.jikan.moe/v4/characters/${personaje.mal_id}/full`,
                {
                    timeout: 15000
                }
            );

            const animes = datos.data?.data?.anime;

            if (Array.isArray(animes) && animes.length > 0) {
                anime =
                    animes[0]?.anime?.title ||
                    "Anime desconocido";
            }

        } catch (error) {
            console.log(
                "⚠️ No se pudo obtener el anime:",
                error.message
            );
        }

        return {
            id: personaje.mal_id,

            nombre:
                personaje.name ||
                "Personaje desconocido",

            anime,

            imagen:
                personaje.images?.jpg?.image_url ||
                personaje.images?.webp?.image_url ||
                null
        };

    } catch (error) {

        console.error(
            "❌ Error obteniendo personaje:",
            error.message
        );

        return null;
    }
}


// ============================================================
// OBTENER ID DEL USUARIO
// ============================================================

function obtenerUsuario(m) {

    return (
        m.sender ||
        m.key?.participant ||
        m.key?.remoteJid ||
        "usuario"
    );
}


// ============================================================
// OBTENER CHAT
// ============================================================

function obtenerChat(m) {

    return (
        m.chat ||
        m.key?.remoteJid
    );
}


// ============================================================
// VER SI YA TIENE EL PERSONAJE
// ============================================================

function tienePersonaje(usuario, personaje) {

    const coleccion =
        colecciones.get(usuario) || [];

    return coleccion.some(
        p =>
            p.id === personaje.id
    );
}


// ============================================================
// .S
// ============================================================

async function comandoS(conn, m) {

    const usuario =
        obtenerUsuario(m);

    const chat =
        obtenerChat(m);

    const personaje =
        await obtenerPersonaje();

    if (!personaje) {

        await conn.sendMessage(chat, {
            text:
                "❌ No pude sacar un personaje ahora mismo.\n\n" +
                "🔄 Intenta usar *.s* nuevamente."
        });

        return;
    }


    // Guardar último personaje
    ultimoPersonaje.set(
        usuario,
        personaje
    );


    const texto =
        `🎲 *¡PERSONAJE OBTENIDO!*\n\n` +

        `👤 *Nombre:* ${personaje.nombre}\n` +

        `🎌 *Anime:* ${personaje.anime}\n\n` +

        `❤️ Usa *.w* para reclamarlo.`;


    // Enviar imagen
    if (personaje.imagen) {

        try {

            await conn.sendMessage(chat, {

                image: {
                    url: personaje.imagen
                },

                caption: texto

            });

            return;

        } catch (error) {

            console.log(
                "⚠️ Error enviando imagen:",
                error.message
            );
        }
    }


    // Si la imagen falla
    await conn.sendMessage(chat, {
        text: texto
    });
}


// ============================================================
// .W
// ============================================================

async function comandoW(conn, m) {

    const usuario =
        obtenerUsuario(m);

    const chat =
        obtenerChat(m);


    const personaje =
        ultimoPersonaje.get(usuario);


    // No hay personaje pendiente
    if (!personaje) {

        await conn.sendMessage(chat, {

            text:
                `❌ *No tienes ningún personaje para reclamar.*\n\n` +

                `🎲 Primero usa *.s* para sacar uno.`
        });

        return;
    }


    // Ya lo tiene
    if (
        tienePersonaje(
            usuario,
            personaje
        )
    ) {

        await conn.sendMessage(chat, {

            text:
                `⚠️ *Ya tienes este personaje.*\n\n` +

                `👤 ${personaje.nombre}\n` +

                `🎌 ${personaje.anime}\n\n` +

                `🎲 Usa *.s* para sacar otro.`
        });

        ultimoPersonaje.delete(usuario);

        return;
    }


    // Crear colección
    if (!colecciones.has(usuario)) {

        colecciones.set(
            usuario,
            []
        );
    }


    // Guardar personaje
    colecciones
        .get(usuario)
        .push(personaje);


    // Limpiar personaje pendiente
    ultimoPersonaje.delete(usuario);


    await conn.sendMessage(chat, {

        text:
            `❤️ *¡PERSONAJE RECLAMADO!*\n\n` +

            `👤 *${personaje.nombre}*\n` +

            `🎌 *${personaje.anime}*\n\n` +

            `📚 Se agregó a tu colección.\n\n` +

            `✨ Usa *.coleccion* para verla.`
    });
}


// ============================================================
// .COLECCION
// ============================================================

async function comandoColeccion(conn, m) {

    const usuario =
        obtenerUsuario(m);

    const chat =
        obtenerChat(m);


    const coleccion =
        colecciones.get(usuario) || [];


    // Colección vacía
    if (coleccion.length === 0) {

        await conn.sendMessage(chat, {

            text:
                `📚 *TU COLECCIÓN ESTÁ VACÍA*\n\n` +

                `🎲 Usa *.s* para sacar un personaje.\n` +

                `❤️ Después usa *.w* para reclamarlo.`
        });

        return;
    }


    let texto =
        `📚 *TU COLECCIÓN*\n\n` +

        `👤 Personajes: *${coleccion.length}*\n\n`;


    coleccion.forEach(
        (personaje, index) => {

            texto +=
                `${index + 1}. 👤 *${personaje.nombre}*\n` +

                `   🎌 ${personaje.anime}\n\n`;
        }
    );


    await conn.sendMessage(chat, {
        text: texto
    });
}


// ============================================================
// EXPORTACIÓN
// ============================================================

module.exports = {

    name: "anime",

    aliases: [
        "s",
        "w",
        "coleccion"
    ],


    async execute({
        conn,
        m,
        command
    }) {

        const cmd =
            String(command || "")
                .toLowerCase();


        // .s
        if (cmd === "s") {

            await comandoS(
                conn,
                m
            );

            return;
        }


        // .w
        if (cmd === "w") {

            await comandoW(
                conn,
                m
            );

            return;
        }


        // .coleccion
        if (cmd === "coleccion") {

            await comandoColeccion(
                conn,
                m
            );

            return;
        }
    }
};
