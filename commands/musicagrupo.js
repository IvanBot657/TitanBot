// =========================================
// 🎵 MÚSICA PARA EL GRUPO - TITANBOT
// =========================================

const { Innertube, Utils } = require("youtubei.js");

async function musicagrupo(sock, chat, args, id) {

  try {

    // =========================================
    // 📝 COMPROBAR COMANDO
    // =========================================

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

    // =========================================
    // 🔎 BUSCANDO
    // =========================================

    await sock.sendMessage(chat, {
      text:
        "🎵 *MÚSICA DEL GRUPO*\n\n" +
        `🔎 Buscando: *${cancion}*`
    });

    console.log(`🎵 Buscando: ${cancion}`);

    // =========================================
    // ▶️ CONECTAR CON YOUTUBE
    // =========================================

    console.log("🔵 Conectando con YouTube...");

    const youtube = await Innertube.create();

    console.log("🟢 YouTube conectado.");

    // =========================================
    // 🔎 BUSCAR
    // =========================================

    console.log("🔵 Buscando video...");

    const resultado = await youtube.search(cancion);

    if (
      !resultado ||
      !resultado.results ||
      resultado.results.length === 0
    ) {
      throw new Error("No se encontraron resultados.");
    }

    const video = resultado.results.find(
      item => item.video_id
    );

    if (!video) {
      throw new Error("No se encontró un video válido.");
    }

    const titulo =
      video.title?.toString() || cancion;

    const autor =
      video.author?.name || "Artista desconocido";

    const videoId =
      video.video_id;

    const enlace =
      `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`🟢 Video encontrado: ${videoId}`);
    console.log(`🎶 ${titulo}`);
    console.log(`👤 ${autor}`);

    // =========================================
    // 🎶 INFORMACIÓN
    // =========================================

    await sock.sendMessage(chat, {
      text:
        "🎵 *MÚSICA DEL GRUPO*\n\n" +
        `🎶 *${titulo}*\n` +
        `👤 ${autor}\n\n` +
        `🔗 ${enlace}\n\n` +
        "⬇️ Descargando audio..."
    });

    // =========================================
    // 🎧 DESCARGAR AUDIO WEBM / OPUS
    // =========================================

    console.log("🔵 Iniciando descarga de audio...");
    console.log("🔵 Formato solicitado: webm");
    console.log("🔵 Codec solicitado: opus");

    const audioStream = await youtube.download(
      videoId,
      {
        type: "audio",
        quality: "best",
        format: "webm",
        codec: "opus"
      }
    );

    if (!audioStream) {
      throw new Error(
        "youtube.download() no devolvió ningún stream."
      );
    }

    console.log("🟢 Stream de audio recibido.");

    // =========================================
    // 📦 CONVERTIR STREAM A BUFFER
    // =========================================

    console.log("🔵 Convirtiendo audio a Buffer...");

    const chunks = [];

    for await (
      const chunk of Utils.streamToIterable(audioStream)
    ) {

      chunks.push(
        Buffer.from(chunk)
      );

    }

    const audioBuffer =
      Buffer.concat(chunks);

    console.log(
      `🟢 Audio descargado: ${audioBuffer.length} bytes`
    );

    if (
      !audioBuffer ||
      audioBuffer.length === 0
    ) {
      throw new Error(
        "El Buffer del audio está vacío."
      );
    }

    // =========================================
    // 🎧 ENVIAR AUDIO A WHATSAPP
    // =========================================

    console.log("🔵 Enviando audio a WhatsApp...");

    await sock.sendMessage(chat, {

      audio: audioBuffer,

      mimetype: "audio/webm; codecs=opus",

      ptt: false,

      fileName: `${titulo}.webm`

    });

    console.log(
      `✅ AUDIO ENVIADO CORRECTAMENTE: ${titulo}`
    );

    return true;

  } catch (error) {

    // =========================================
    // ❌ ERROR
    // =========================================

    console.error(
      "========================================="
    );

    console.error(
      "❌ ERROR COMPLETO EN MUSICAGRUPO"
    );

    console.error(error);

    console.error(
      "========================================="
    );

    try {

      await sock.sendMessage(chat, {
        text:
          "❌ No pude descargar el audio.\n\n" +
          "⚠️ La descarga de YouTube falló."
      });

    } catch (errorMensaje) {

      console.error(
        "❌ Error enviando mensaje:",
        errorMensaje
      );

    }

    return true;
  }
}

module.exports = musicagrupo;
