// =========================================
// 🎵 MÚSICA PARA EL GRUPO - TITANBOT
// =========================================

const axios = require("axios");

async function musicagrupo(sock, chat, args, id) {

  try {

    // =========================================
    // 🔎 COMPROBAR CANCIÓN
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

    // =========================================
    // 🎶 NOMBRE
    // =========================================

    const cancion = args.join(" ");

    // =========================================
    // 🔎 BUSCANDO
    // =========================================

    await sock.sendMessage(chat, {
      text:
        "🎵 *MÚSICA DEL GRUPO*\n\n" +
        `🔎 Buscando: *${cancion}*`
    });

    // =========================================
    // 🔑 API KEY
    // =========================================

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {

      await sock.sendMessage(chat, {
        text:
          "❌ No encontré la variable:\n\n" +
          "`YOUTUBE_API_KEY`\n\n" +
          "Revisa las variables de entorno de Render."
      });

      return true;
    }

    // =========================================
    // 🔎 BUSCAR EN YOUTUBE
    // =========================================

    const respuesta = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: cancion,
          type: "video",
          maxResults: 1,
          regionCode: "CO",
          key: apiKey
        },
        timeout: 15000
      }
    );

    // =========================================
    // 📋 RESULTADOS
    // =========================================

    const resultados = respuesta.data?.items || [];

    if (resultados.length === 0) {

      await sock.sendMessage(chat, {
        text:
          "❌ No encontré ningún resultado para:\n\n" +
          `*${cancion}*`
      });

      return true;
    }

    // =========================================
    // 🎵 PRIMER RESULTADO
    // =========================================

    const video = resultados[0];

    const videoId = video.id?.videoId;

    const titulo =
      video.snippet?.title ||
      cancion;

    const canal =
      video.snippet?.channelTitle ||
      "Desconocido";

    const miniatura =
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.default?.url;

    const enlace =
      `https://www.youtube.com/watch?v=${videoId}`;

    // =========================================
    // 📤 MOSTRAR RESULTADO
    // =========================================

    const mensaje =
      "🎵 *RESULTADO ENCONTRADO*\n\n" +
      `🎶 *${titulo}*\n` +
      `👤 Canal: *${canal}*\n\n` +
      `🔗 ${enlace}`;

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

    // =========================================
    // ✅ TERMINADO
    // =========================================

    return true;

  } catch (error) {

    console.error(
      "❌ ERROR EN MUSICAGRUPO:",
      error.response?.data || error.message
    );

    await sock.sendMessage(chat, {
      text:
        "❌ Ocurrió un error al buscar la canción.\n\n" +
        "Revisa la consola de Render."
    });

    return true;
  }
}

module.exports = musicagrupo;
