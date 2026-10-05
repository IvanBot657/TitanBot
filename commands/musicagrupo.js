// =========================================
// 🎵 MÚSICA PARA EL GRUPO - TITANBOT
// =========================================

const { Innertube, Utils } = require("youtubei.js");

async function musicagrupo(sock, chat, args, id) {

  try {

    // =========================================
    // 🔎 COMPROBAR ARGUMENTOS
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

    console.log(`🎵 MUSICAGRUPО: buscando "${cancion}"`);

    // =========================================
    // ▶️ CONECTAR CON YOUTUBE
    // =========================================

    console.log("🔵 Creando conexión con YouTube...");

    const youtube = await Innertube.create();

    console.log("🟢 Conexión con YouTube creada.");

    // =========================================
    // 🔎 BUSCAR CANCIÓN
    // =========================================

    console.log("🔵 Buscando canción...");

    const resultado = await youtube.search(cancion);

    console.log("🟢 Búsqueda terminada.");

    if (
      !resultado ||
      !resultado.results ||
      resultado.results.length === 0
    ) {

      console.log("🔴 No hubo resultados.");

      await sock.sendMessage(chat, {
        text: "❌ No encontré esa canción en YouTube."
      });

      return true;
    }

    // =========================================
    // 🎬 ENCONTRAR VIDEO
    // =========================================

    const video = resultado.results.find(
      item => item.video_id
    );

    if (!video) {

      console.log("🔴 No se encontró ningún video válido.");

      await sock.sendMessage(chat, {
        text:
          "❌ Encontré resultados, pero ninguno era un video válido."
      });

      return true;
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
    console.log(`🎶 Título: ${titulo}`);
    console.log(`👤 Autor: ${autor}`);

    // =========================================
    // 🎶 MOSTRAR INFORMACIÓN
    // =========================================

    await sock.sendMessage(chat, {
      text:
        "🎵 *MÚSICA DEL GRUPO*\n\n" +
        `🎶 *${titulo}*\n` +
        `👤 ${autor}\n\n` +
        `🔗 ${enlace}\n\n` +
        "⬇️ Obteniendo audio..."
    });

    // =========================================
    // 🎧 OBTENER INFORMACIÓN DEL AUDIO
    // =========================================

    console.log("🔵 Obteniendo información del audio...");

    const info = await youtube.getBasicInfo(videoId);

    console.log("🟢 Información del video obtenida.");

    // =========================================
    // 🎧 SELECCIONAR AUDIO
    // =========================================

    console.log("🔵 Seleccionando formato de audio...");

    const formato = info.chooseFormat({
      type: "audio",
      quality: "best"
    });

    if (!formato) {
      throw new Error(
        "YouTube no devolvió ningún formato de audio."
      );
    }

    console.log("🟢 Formato de audio encontrado.");

    console.log(
      `🎧 MIME: ${formato.mime_type || formato.mimeType || "desconocido"}`
    );

    console.log(
      `🎧 Codec: ${formato.audio_codec || "desconocido"}`
    );

    // =========================================
    // 🔗 DESCIFRAR URL
    // =========================================

    console.log("🔵 Generando URL de audio...");

    const url = await formato.decipher(
      youtube.session.player
    );

    if (!url) {
      throw new Error(
        "No se pudo generar la URL del audio."
      );
    }

    console.log("🟢 URL de audio generada.");

    // =========================================
    // ⬇️ DESCARGAR AUDIO
    // =========================================

    console.log("🔵 Descargando audio...");

    const audioStream = await youtube.download(
      videoId,
      {
        type: "audio",
        quality: "best"
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

    const chunks = [];

    console.log("🔵 Convirtiendo audio a Buffer...");

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
    // 🎧 ENVIAR A WHATSAPP
    // =========================================

    console.log("🔵 Enviando audio a WhatsApp...");

    await sock.sendMessage(chat, {

      audio: audioBuffer,

      mimetype:
        formato.mime_type ||
        formato.mimeType ||
        "audio/mp4",

      ptt: false,

      fileName:
        `${titulo}.m4a`

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

    console.error(
      error
    );

    console.error(
      "========================================="
    );

    try {

      await sock.sendMessage(chat, {
        text:
          "❌ No pude descargar el audio.\n\n" +
          "⚠️ Revisa los logs de Render para ver el error exacto."
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
