const yts = require("yt-search");

async function musica(sock, chat, comando, args, id) {
    const query = args.join(" ").trim();

    if (!query) {
        await sock.sendMessage(chat, {
            text: "🎵 Escribe el nombre de una canción.\n\nEjemplo:\n.play Believer"
        });

        return true;
    }

    // 🔎 Mensaje mientras busca
    await sock.sendMessage(chat, {
        text: "🔎 Buscando canción..."
    });

    try {
        console.log("🔎 Buscando en YouTube:", query);

        const resultado = await yts(query);

        if (!resultado || !resultado.videos || resultado.videos.length === 0) {
            await sock.sendMessage(chat, {
                text: `❌ No encontré la canción.`
            });

            return true;
        }

        // 🎵 Primer resultado
        const video = resultado.videos[0];

        const titulo = video.title || "Sin título";
        const miniatura = video.thumbnail || null;
        const link = video.url || "";
        const duracion = video.timestamp || "Desconocida";
        const canal = video.author?.name || "Desconocido";

        const mensaje =
`🎵 *${titulo}*

👤 ${canal}
⏱️ ${duracion}

🔗 ${link}`;

        // 🖼️ Enviar miniatura + información
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

        return true;

    } catch (error) {
        console.error("❌ ERROR MUSICA:", error);

        await sock.sendMessage(chat, {
            text: "❌ Ocurrió un error buscando la canción."
        });

        return true;
    }
}

module.exports = musica;
module.exports.musica = musica;
