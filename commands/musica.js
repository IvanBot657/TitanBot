const axios = require("axios");
const yts = require("yt-search");
const config = require("../config");

// ==============================
// MÚSICA - TITANBOT v3.1
// ==============================

async function musica(
  sock,
  chat,
  comando,
  args,
  id
) {

  const cmd =
    String(comando || "").toLowerCase();

  // ==============================
  // PLAY
  // ==============================

  if (cmd === "play") {

    const busqueda = args.join(" ");

    if (!busqueda) {

      await sock.sendMessage(chat, {
        text:
`🎵 Escribe el nombre de una canción.

Ejemplo:
.play Believer`
      });

      return true;
    }

    try {

      const resultado =
        await yts(busqueda);

      const video =
        resultado.videos[0];

      if (!video) {

        await sock.sendMessage(chat, {
          text: "❌ No encontré resultados."
        });

        return true;
      }

      await sock.sendMessage(chat, {
        image: {
          url: video.thumbnail
        },
        caption:
`🎵 *${video.title}*

📺 Canal: ${video.author.name}
⏱️ Duración: ${video.timestamp}

🔗 YouTube:
${video.url}`
      });

    } catch (error) {

      console.log(error);

      await sock.sendMessage(chat, {
        text:
          "❌ Error al buscar la canción."
      });
    }

    return true;
  }

  // ==============================
  // MP3
  // ==============================

  if (cmd === "mp3") {

    const busqueda = args.join(" ");

    if (!busqueda) {

      await sock.sendMessage(chat, {
        text:
`🎵 Escribe el nombre de una canción.

Ejemplo:
.mp3 Believer`
      });

      return true;
    }

    try {

      await sock.sendMessage(chat, {
        text: "🔍 Buscando canción..."
      });

      const resultado =
        await yts(busqueda);

      const video =
        resultado.videos[0];

      if (!video) {

        await sock.sendMessage(chat, {
          text: "❌ No encontré resultados."
        });

        return true;
      }

      await sock.sendMessage(chat, {
        text: "⏳ Generando audio..."
      });

      const respuesta =
        await axios.get(
          `https://tunelio.dev/create?quality=mp3&url=${encodeURIComponent(video.url)}`,
          {
            headers: {
              Authorization:
                `Bearer ${config.tunelioKey}`
            }
          }
        );

      console.log("Tunelio:", respuesta.data);

      await sock.sendMessage(chat, {
        text:
`🎵 ${video.title}

✅ Solicitud enviada a Tunelio.

Revisa los logs de Render y envíame lo que aparece después de:

Tunelio:`
      });

    } catch (error) {

      console.log(error);

      await sock.sendMessage(chat, {
        text:
          "❌ Error al generar el audio."
      });
    }

    return true;
  }

  return false;
}

module.exports = musica;
module.exports.musica = musica;
