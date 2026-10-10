// commands/play.js
// TITANBOT - Play con miniatura, sin enviar audio

const ytSearch = require("yt-search");

async function play(sock, chat, comando, args, id, msg) {
  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(
        chat,
        {
          text: "🎵 Escribe el nombre de una canción.\n\nEjemplo: .play Bad Bunny"
        },
        { quoted: msg }
      );
      return true;
    }

    const consulta = args.join(" ");

    await sock.sendMessage(
      chat,
      { text: `🔎 Buscando: ${consulta}...` },
      { quoted: msg }
    );

    const resultado = await ytSearch(consulta);
    const video = resultado.videos?.[0];

    if (!video) {
      await sock.sendMessage(
        chat,
        { text: "❌ No encontré ninguna canción." },
        { quoted: msg }
      );
      return true;
    }

    const mensaje =
      `🎵 *TITANBOT PLAY*\n\n` +
      `🎶 *Título:* ${video.title}\n` +
      `👤 *Canal:* ${video.author?.name || "Desconocido"}\n` +
      `⏱️ *Duración:* ${video.timestamp || "Desconocida"}\n` +
      `👁️ *Vistas:* ${
        video.views != null
          ? Number(video.views).toLocaleString("es-CO")
          : "No disponibles"
      }\n\n` +
      `🔗 *Escuchar en YouTube:*\n${video.url}\n\n` +
      `✨ _TITANBOT · Música_`;

    if (video.thumbnail) {
      await sock.sendMessage(
        chat,
        {
          image: { url: video.thumbnail },
          caption: mensaje
        },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(
        chat,
        { text: mensaje },
        { quoted: msg }
      );
    }

    return true;
  } catch (error) {
    console.error("[PLAY ERROR]", error);

    await sock.sendMessage(
      chat,
      {
        text: "❌ No pude buscar la canción. Inténtalo de nuevo."
      },
      { quoted: msg }
    ).catch(() => {});

    return true;
  }
}

module.exports = play;
