// =========================================
// 🎵 MÚSICA PARA EL GRUPO - TITANBOT
// =========================================

const { Innertube } = require("youtubei.js");

async function musicagrupo(sock, chat, args, id) {

  try {

    // =========================================
    // 🔎 COMPROBAR CANCIÓN
    // =========================================

    if (!args || args.length === 0) {

      await sock.sendMessage(
        chat,
        {
          text:
            "🎵 *MÚSICA DEL GRUPO*\n\n" +
            "Escribe el nombre de una canción.\n\n" +
            "Ejemplo:\n" +
            "`.musicagrupo Believer`"
        }
      );

      return true;
    }

    const cancion = args.join(" ");

    // =========================================
    // 🔎 AVISO
    // =========================================

    await sock.sendMessage(
      chat,
      {
        text:
          "🎵 *MÚSICA DEL GRUPO*\n\n" +
          `🔎 Buscando: *${cancion}*`
      }
    );

    // =========================================
    // ▶️ CONECTAR CON YOUTUBE
    // =========================================

    const youtube = await Innertube.create();

    const resultado = await youtube.search(cancion);

    if (
      !resultado ||
      !resultado.results ||
      resultado.results.length === 0
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No encontré esa canción en YouTube."
        }
      );

      return true;
    }

    // =========================================
    // 🎶 BUSCAR PRIMER VIDEO
    // =========================================

    const video = resultado.results.find(
      item => item.video_id
    );

    if (!video) {

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No encontré un video válido para esa canción."
        }
      );

      return true;
    }

    const titulo =
      video.title?.toString() ||
      cancion;

    const autor =
      video.author?.name ||
      "Artista desconocido";

    const videoId =
      video.video_id;

    const enlace =
      `https://www.youtube.com/watch?v=${videoId}`;

    // =========================================
    // 🎶 RESULTADO
    // =========================================

    await sock.sendMessage(
      chat,
      {
        text:
          "🎵 *MÚSICA DEL GRUPO*\n\n" +
          `🎶 *${titulo}*\n` +
          `👤 ${autor}\n\n` +
          `🔗 ${enlace}\n\n` +
          "🎧 Encontrada correctamente.\n" +
          "⚙️ Preparando audio..."
      }
    );

    return true;

  } catch (error) {

    console.error(
      "❌ ERROR EN MUSICAGRUPО:",
      error
    );

    await sock.sendMessage(
      chat,
      {
        text:
          "❌ No pude buscar la canción en este momento."
      }
    );

    return true;
  }
}

module.exports = musicagrupo;
