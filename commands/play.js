const ytSearch = require("yt-search");
const axios = require("axios");
const { playaudio } = require("../lib/playaudio");

async function play(sock, chat, comando, args, id, msg) {
  try {
    if (!args || !args.length) {
      await sock.sendMessage(
        chat,
        {
          text: "🎵 Escribe el nombre de una canción.\nEjemplo: .play Bad Bunny"
        },
        { quoted: msg }
      );
      return true;
    }

    const consulta = args.join(" ");

    await sock.sendMessage(
      chat,
      { text: `🔎 Buscando: ${consulta}` },
      { quoted: msg }
    );

    const resultado = await ytSearch(consulta);
    const video = resultado.videos?.[0];

    if (!video) {
      await sock.sendMessage(
        chat,
        { text: "❌ No encontré esa canción." },
        { quoted: msg }
      );
      return true;
    }

    await sock.sendMessage(
      chat,
      {
        image: { url: video.thumbnail },
        caption:
          `🎵 *${video.title}*\n\n` +
          `👤 Canal: ${video.author?.name || "Desconocido"}\n` +
          `⏱️ Duración: ${video.timestamp || "Desconocida"}\n` +
          `🔗 ${video.url}\n\n` +
          "⏳ Preparando el MP3..."
      },
      { quoted: msg }
    );

    const descarga = await playaudio.download(video.url, "128k");

    if (!descarga?.buffer?.length) {
      throw new Error("La API no devolvió audio.");
    }

    await sock.sendMessage(
      chat,
      {
        audio: descarga.buffer,
        mimetype: "audio/mpeg",
        fileName: descarga.fileName || "audio.mp3"
      },
      { quoted: msg }
    );

    return true;
  } catch (error) {
    console.error("[PLAY ERROR]", error);

    await sock.sendMessage(
      chat,
      {
        text:
          "❌ No pude obtener el audio.\n" +
          "La API puede estar caída o haber rechazado la conversión."
      },
      { quoted: msg }
    ).catch(() => {});

    return true;
  }
}

module.exports = play;
