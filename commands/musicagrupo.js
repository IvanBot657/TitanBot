// =========================================
// 🎵 MÚSICA PARA EL GRUPO - TITANBOT
// =========================================

const { Innertube, Utils } = require("youtubei.js");

async function musicagrupo(sock, chat, args, id) {

  try {

    if (!args || args.length === 0) {
      await sock.sendMessage(chat, {
        text:
          "🎵 *MÚSICA DEL GRUPO*\n\n" +
          "Escribe el nombre de una canción.\n\n" +
          "Ejemplo:\n" +
          "`.musicagrupo Believer`"
      });

      return true;
    }

    const cancion = args.join(" ");

    // 🔎 AVISO DE BÚSQUEDA
    await sock.sendMessage(chat, {
      text:
        "🎵 *MÚSICA DEL GRUPO*\n\n" +
        `🔎 Buscando: *${cancion}*`
    });

    // ▶️ CONECTAR CON YOUTUBE
    const youtube = await Innertube.create();

    // 🔎 BUSCAR
    const resultado = await youtube.search(cancion);

    if (!resultado || !resultado.results || resultado.results.length === 0) {
      await sock.sendMessage(chat, {
        text: "❌ No encontré esa canción en YouTube."
      });

      return true;
    }

    // 🎬 BUSCAR VIDEO
    const video = resultado.results.find(item => item.video_id);

    if (!video) {
      await sock.sendMessage(chat, {
        text: "❌ No encontré un video válido para esa canción."
      });

      return true;
    }

    const titulo = video.title?.toString() || cancion;
    const autor = video.author?.name || "Artista desconocido";
    const videoId = video.video_id;

    const enlace =
      `https://www.youtube.com/watch?v=${videoId}`;

    // 🎶 INFORMACIÓN
    await sock.sendMessage(chat, {
      text:
        "🎵 *MÚSICA DEL GRUPO*\n\n" +
        `🎶 *${titulo}*\n` +
        `👤 ${autor}\n\n` +
        `🔗 ${enlace}\n\n` +
        "⬇️ Descargando audio..."
    });

    // 🎧 DESCARGAR SOLO AUDIO
    const audioStream = await youtube.download(videoId, {
      type: "audio",
      quality: "best"
    });

    if (!audioStream) {
      throw new Error("No se pudo obtener el audio.");
    }

    // 📦 CONVERTIR STREAM A BUFFER
    const chunks = [];

    for await (const chunk of Utils.streamToIterable(audioStream)) {
      chunks.push(Buffer.from(chunk));
    }

    const audioBuffer = Buffer.concat(chunks);

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("El audio descargado está vacío.");
    }

    // 🎧 ENVIAR AUDIO A WHATSAPP
    await sock.sendMessage(chat, {
      audio: audioBuffer,
      mimetype: "audio/mp4",
      ptt: false,
      fileName: `${titulo}.m4a`
    });

    console.log(
      `✅ AUDIO ENVIADO: ${titulo} | ${audioBuffer.length} bytes`
    );

    return true;

  } catch (error) {

    console.error(
      "❌ ERROR EN MUSICAGRUPO:",
      error
    );

    try {

      await sock.sendMessage(chat, {
        text:
          "❌ No pude descargar el audio.\n\n" +
          "Intenta nuevamente con otra canción."
      });

    } catch (errorMensaje) {

      console.error(
        "❌ No se pudo enviar el mensaje de error:",
        errorMensaje
      );

    }

    return true;
  }
}

module.exports = musicagrupo;
