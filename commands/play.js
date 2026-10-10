
const axios = require("axios");
const ytSearch = require("yt-search");
const { ogmp3 } = require("../lib/ogmp3");

async function play(sock, chat, comando, args, id, msg) {
  try {
    if (!args || !args.length) {
      await sock.sendMessage(
        chat,
        { text: "🎵 Escribe el nombre de una canción.\nEjemplo: .play Bad Bunny" },
        { quoted: msg }
      );
      return true;
    }

    const consulta = args.join(" ");

    await sock.sendMessage(
      chat,
      { text: "🔎 Buscando la canción: " + consulta },
      { quoted: msg }
    );

    const resultado = await ytSearch(consulta);
    const video = resultado.videos && resultado.videos[0];

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
          "🎵 *" + video.title + "*\n\n" +
          "👤 Canal: " + (video.author?.name || "Desconocido") + "\n" +
          "⏱️ Duración: " + (video.timestamp || "Desconocida") + "\n" +
          "🔗 " + video.url + "\n\n" +
          "⏳ Preparando el audio..."
      },
      { quoted: msg }
    );

    const descarga = await ogmp3.download(video.url, "192", "audio");

    if (!descarga || !descarga.status || !descarga.result?.download) {
      await sock.sendMessage(
        chat,
        { text: "❌ No se pudo obtener el audio. Intenta más tarde." },
        { quoted: msg }
      );
      return true;
    }

    // Descargar el archivo de audio desde la URL devuelta por OGMP3.
    const respuesta = await axios.get(descarga.result.download, {
      responseType: "arraybuffer",
      timeout: 120000,
      maxContentLength: 40 * 1024 * 1024
    });

    const audio = Buffer.from(respuesta.data);

    await sock.sendMessage(
      chat,
      {
        audio,
        mimetype: "audio/mpeg",
        fileName: (descarga.result.title || video.title) + ".mp3"
      },
      { quoted: msg }
    );

    return true;
  } catch (error) {
    console.error("[PLAY ERROR]", error);

    try {
      await sock.sendMessage(
        chat,
        { text: "❌ Error al obtener el audio. Inténtalo nuevamente más tarde." },
        { quoted: msg }
      );
    } catch (sendError) {
      console.error("[PLAY SEND ERROR]", sendError);
    }

    return true;
  }
}

module.exports = play;
