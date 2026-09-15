const axios = require("axios");
const yts = require("yt-search");
const config = require("../config");

// ==============================
// 🎵 MÚSICA - TITANBOT v3.2
// ==============================

async function musica(
  sock,
  chat,
  comando,
  args,
  id
) {

  const cmd = String(comando || "").toLowerCase();

  console.log("🎵 MUSICA CMD:", cmd);

  // ==============================
  // ▶️ PLAY
  // ==============================

  if (cmd === "play") {

    const busqueda = args.join(" ");

    if (!busqueda) {
      await sock.sendMessage(chat, {
        text:
`🎵 *MÚSICA*

Escribe el nombre de una canción.

Ejemplo:
.play Believer`
      });

      return true;
    }

    try {

      const resultado = await yts(busqueda);
      const video = resultado.videos[0];

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

      console.log("ERROR PLAY:", error);

      await sock.sendMessage(chat, {
        text: "❌ Error al buscar la canción."
      });
    }

    return true;
  }

  // ==============================
  // 🎵 MP3
  // ==============================

  if (cmd === "mp3") {

    const busqueda = args.join(" ");

    if (!busqueda) {
      await sock.sendMessage(chat, {
        text:
`🎵 *MP3*

Escribe el nombre de una canción.

Ejemplo:
.mp3 Believer`
      });

      return true;
    }

    try {

      // ------------------------------
      // BUSCAR
      // ------------------------------

      await sock.sendMessage(chat, {
        text: "🔍 Buscando..."
      });

      const resultado = await yts(busqueda);
      const video = resultado.videos[0];

      if (!video) {
        await sock.sendMessage(chat, {
          text: "❌ No encontré resultados."
        });

        return true;
      }

      // ------------------------------
      // SOLICITUD A TUNELIO
      // ------------------------------

      await sock.sendMessage(chat, {
        text:
`🎵 *${video.title}*

⏳ Procesando audio...`
      });

      const respuesta = await axios.get(
        `https://tunelio.dev/create?quality=mp3&url=${encodeURIComponent(video.url)}`,
        {
          headers: {
            Authorization:
              `Bearer ${config.tunelioKey}`
          },
          timeout: 60000
        }
      );

      console.log("Tunelio:", respuesta.data);

      const datos = respuesta.data;

      // ------------------------------
      // ERROR DE TUNELIO
      // ------------------------------

      if (!datos || datos.status !== "ok") {

        console.log("❌ TUNELIO NO DEVOLVIÓ AUDIO");

        await sock.sendMessage(chat, {
          text:
`❌ No se pudo generar el audio.

Estado:
${datos?.status || "desconocido"}`
        });

        return true;
      }

      // ------------------------------
      // COMPROBAR URL
      // ------------------------------

      if (!datos.url) {

        await sock.sendMessage(chat, {
          text:
`❌ Tunelio respondió correctamente,
pero no entregó una URL de audio.`
        });

        return true;
      }

      console.log("🎵 URL DE AUDIO RECIBIDA");
      console.log(datos.url);

      // ------------------------------
      // ENVIAR AUDIO
      // ------------------------------

      await sock.sendMessage(chat, {
        audio: {
          url: datos.url
        },
        mimetype: "audio/mpeg",
        fileName:
          datos.filename ||
          "TITANBOT-Audio.mp3"
      });

      console.log("✅ AUDIO ENVIADO A WHATSAPP");

      // ------------------------------
      // INFORMACIÓN FINAL
      // ------------------------------

      await sock.sendMessage(chat, {
        text:
`✅ *AUDIO ENVIADO*

🎵 ${datos.filename || video.title}

📦 Tamaño: ${datos.file_size_str || "Desconocido"}

⚡ TITANBOT`
      });

    } catch (error) {

      console.log("❌ ERROR TUNELIO:");

      console.log(
        error.response?.data ||
        error.message
      );

      await sock.sendMessage(chat, {
        text:
`❌ *ERROR AL GENERAR AUDIO*

${error.response?.data?.status ||
 error.response?.data?.message ||
 error.message}`
      });
    }

    return true;
  }

  return false;
}

module.exports = musica;
module.exports.musica = musica;
