const yts = require("yt-search");

async function musica(sock, chat, comando, args, id) {
    const query = args.join(" ").trim();

    if (!query) {
        await sock.sendMessage(chat, {
            text: "🎵 Escribe el nombre de una canción.\n\nEjemplo:\n.play Believer"
        });
        return;
    }

    try {
        console.log("🔎 Buscando en YouTube:", query);

        const resultado = await yts(query);

        if (!resultado.videos || resultado.videos.length === 0) {
            await sock.sendMessage(chat, {
                text: `❌ No encontré "${query}" en YouTube.`
            });
            return;
        }

        const video = resultado.videos[0];

        const titulo = video.title || query;
        const miniatura = video.thumbnail;
        const link = video.url;
        const duracion = video.timestamp || "Desconocida";
        const canal = video.author?.name || "Desconocido";

        const mensaje =
`🎵 *${titulo}*

👤 Canal: ${canal}
⏱️ Duración: ${duracion}

🔗 ${link}`;

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

        console.log("✅ Canción encontrada:", titulo);

    } catch (error) {
        console.error("❌ ERROR MUSICA:", error);

        await sock.sendMessage(chat, {
            text: "❌ Ocurrió un error buscando la canción."
        });
    }
}

module.exports = musica;
module.exports.musica = musica;
