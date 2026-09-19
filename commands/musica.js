const axios = require("axios");

const TUNELIO_KEY = process.env.TUNELIO_KEY;
const TUNELIO_API ="https://tunelio.dev/api";

async function musica(sock, chat, comando, args, id) {
    const query = args.join(" ").trim();

    if (!query) {
        return sock.sendMessage(chat, {
            text: "🎵 Escribe el nombre de una canción.\n\nEjemplo:\n.play Faded"
        });
    }

    if (!TUNELIO_KEY) {
        return sock.sendMessage(chat, {
            text: "❌ Falta configurar TUNELIO_KEY en Render."
        });
    }

    try {
        const respuesta = await axios.get(`${TUNELIO_API}/info`, {
            params: {
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
            },
            headers: {
                Authorization: `Bearer ${TUNELIO_KEY}`
            },
            timeout: 20000
        });

        const datos = respuesta.data;

        const titulo = datos.title || query;
        const miniatura =
            datos.thumbnail ||
            datos.thumbnails?.[0]?.url ||
            null;

        const link =
            datos.url ||
            datos.webpage_url ||
            datos.permalink ||
            "";

        let mensaje = `🎵 *${titulo}*\n\n`;

        if (link) {
            mensaje += `🔗 ${link}`;
        }

        if (miniatura) {
            await sock.sendMessage(chat, {
                image: { url: miniatura },
                caption: mensaje
            });
        } else {
            await sock.sendMessage(chat, {
                text: mensaje
            });
        }

    } catch (error) {
        console.error(
            "❌ ERROR TUNELIO:",
            error.response?.data || error.message
        );

        await sock.sendMessage(chat, {
            text: "❌ No se pudo obtener la información de la canción."
        });
    }
}

module.exports = musica;
module.exports.musica = musica;
