const axios = require("axios");

const AUDIUS_API = "https://api.audius.co/v1";

async function buscarCancion(query) {
    const apiKey = process.env.AUDIUS_API_KEY;
    const bearerToken = process.env.AUDIUS_BEARER_TOKEN;

    if (!apiKey || !bearerToken) {
        throw new Error("Faltan AUDIUS_API_KEY o AUDIUS_BEARER_TOKEN en Render.");
    }

    const respuesta = await axios.get(`${AUDIUS_API}/tracks/search`, {
        params: {
            query: query,
            limit: 1,
            sort: "relevant"
        },
        headers: {
            "Authorization": `Bearer ${bearerToken}`,
            "x-api-key": apiKey
        },
        timeout: 15000
    });

    return respuesta.data?.data || [];
}

async function musica(sock, chat, comando, args, id) {

    const query = args.join(" ").trim();

    if (!query) {
        await sock.sendMessage(chat, {
            text: "🎵 Escribe el nombre de la canción.\n\nEjemplo:\n.play Faded"
        });
        return;
    }

    try {

        const resultados = await buscarCancion(query);

        if (!resultados.length) {
            await sock.sendMessage(chat, {
                text: `❌ No encontré "${query}" en Audius.`
            });
            return;
        }

        const track = resultados[0];

        const titulo = track.title || "Sin título";
        const artista = track.user?.name || "Artista desconocido";

        const miniatura =
            track.artwork?._480x480 ||
            track.artwork?._1000x1000 ||
            track.artwork?._150x150 ||
            null;

        const link = track.permalink || `https://audius.co/tracks/${track.id}`;

        const mensaje =
`🎵 *${titulo}*

👤 Artista: ${artista}

🔗 ${link}`;

        // Si Audius tiene miniatura, la enviamos
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
            "❌ ERROR CON AUDIUS:",
            error.response?.data || error.message
        );

        await sock.sendMessage(chat, {
            text: "❌ No se pudo buscar la canción en Audius."
        });
    }
}

module.exports = musica;
module.exports.musica = musica;
