const axios = require("axios");
const yts = require("yt-search");

const TUNELIO_KEY = process.env.TUNELIO_KEY;

async function musica(sock, chat, comando, args, id) {
    const query = args.join(" ").trim();

    if (!query) {
        await sock.sendMessage(chat, {
            text: "🎵 Escribe el nombre de una canción.\n\nEjemplo:\n.play Believer"
        });
        return;
    }

    if (!TUNELIO_KEY) {
        await sock.sendMessage(chat, {
            text: "❌ Falta configurar TUNELIO_KEY en Render."
        });
        return;
    }

    try {
        // 🔎 Buscar canción en YouTube
        const resultado = await yts(query);

        if (!resultado.videos || resultado.videos.length === 0) {
            await sock.sendMessage(chat, {
                text: `❌ No encontré "${query}" en YouTube.`
            });
            return;
        }

        const video = resultado.videos[0];

        // 🔗 URL del resultado encontrado
        const youtubeUrl = video.url;

        // 🖼️ Obtener datos desde Tunelio
        const respuesta = await axios.get(
            "https://tunelio.dev/info",
            {
                params: {
                    url: youtubeUrl
                },
                headers: {
                    Authorization: `Bearer ${TUNELIO_KEY}`
                },
                timeout: 20000
            }
        );

        const datos = respuesta.data;

        const titulo = datos.title || video.title;
        const miniatura = datos.thumbnail || video.thumbnail;
        const duracion =
            datos.duration_str ||
            video.timestamp ||
            "Desconocida";

        const mensaje =
`🎵 *${titulo}*

👤 Canal: ${video.author?.name || "Desconocido"}

⏱️ Duración: ${duracion}

🔗 ${youtubeUrl}`;

        // 🖼️ Enviar miniatura
        if (miniatura) {
            await sock.sendMessage(chat, {
                image: {
                    url: miniatura
                },
                caption: mensaje
            });
        } else {
            await sock.sendMessage(chat, {
                text: mensaje
            });
        }

    } catch (error) {
        console.error(
            "❌ ERROR MUSICA:",
            error.response?.data || error.message
        );

        await sock.sendMessage(chat, {
            text: "❌ No se pudo obtener la información de la canción."
        });
    }
}

module.exports = musica;
module.exports.musica = musica;
