const yts = require("yt-search");
const youtubedl = require("youtube-dl-exec");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

// ==============================
// 🎵 MÚSICA - TITANBOT v4.0
// Sin Tunelio / sin créditos
// ==============================

const TEMP_DIR = path.join(__dirname, "..", "temp_audio");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ==============================
// 🧹 LIMPIAR TEMPORALES
// ==============================

function limpiarTemporales() {
  try {
    const ahora = Date.now();

    const archivos = fs.readdirSync(TEMP_DIR);

    for (const archivo of archivos) {
      const ruta = path.join(TEMP_DIR, archivo);
      const stats = fs.statSync(ruta);

      if (
        ahora - stats.mtimeMs >
        30 * 60 * 1000
      ) {
        fs.unlinkSync(ruta);
      }
    }

  } catch (error) {
    console.log(
      "⚠️ Error limpiando temporales:",
      error.message
    );
  }
}

// ==============================
// 🎵 ENVIAR AUDIO
// ==============================

async function enviarAudio(
  sock,
  chat,
  video
) {

  const idSeguro = String(
    video.videoId || Date.now()
  ).replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  );

  const baseSalida =
    path.join(
      TEMP_DIR,
      idSeguro
    );

  try {

    await sock.sendMessage(
      chat,
      {
        text:
`🎵 *${video.title}*

⏳ Descargando y preparando el audio...`
      }
    );

    console.log(
      "🎵 DESCARGANDO:",
      video.url
    );

    // ==============================
    // 🎧 YT-DLP
    // ==============================

    await youtubedl(
      video.url,
      {

        noPlaylist: true,

        noWarnings: true,

        // Extraer audio
        extractAudio: true,

        audioFormat: "mp3",

        audioQuality: "5",

        // Archivo de salida
        output:
          `${baseSalida}.%(ext)s`,

        // FFmpeg
        ffmpegLocation:
          ffmpegPath,

        // Runtime Node
        jsRuntimes: "node",

        remoteComponents:
          "ejs:npm",

        // Evitar archivos innecesarios
        noWriteThumbnail: true,

        noWriteInfoJson: true,

        noWriteDescription: true

      },
      {
        timeout: 180000
      }
    );

    // ==============================
    // 📁 COMPROBAR MP3
    // ==============================

    const archivoFinal =
      `${baseSalida}.mp3`;

    if (
      !fs.existsSync(
        archivoFinal
      )
    ) {

      throw new Error(
        "yt-dlp terminó pero no se encontró el MP3."
      );
    }

    const stats =
      fs.statSync(
        archivoFinal
      );

    console.log(
      `✅ MP3 generado: ${
        (
          stats.size /
          1024 /
          1024
        ).toFixed(2)
      } MB`
    );

    // ==============================
    // 📤 ENVIAR AUDIO
    // ==============================

    await sock.sendMessage(
      chat,
      {
        audio:
          fs.readFileSync(
            archivoFinal
          ),

        mimetype:
          "audio/mpeg",

        fileName:
          `${video.title
            .replace(
              /[\\/:*?"<>|]/g,
              "_"
            )
            .slice(
              0,
              80
            )}.mp3`,

        ptt: false
      }
    );

    console.log(
      "✅ AUDIO ENVIADO A WHATSAPP"
    );

    // ==============================
    // ✅ MENSAJE FINAL
    // ==============================

    await sock.sendMessage(
      chat,
      {
        text:
`✅ *AUDIO ENVIADO*

🎵 ${video.title}

📺 ${
  video.author?.name ||
  "YouTube"
}

⚡ TITANBOT`
      }
    );

  } finally {

    // ==============================
    // 🧹 BORRAR ARCHIVO
    // ==============================

    try {

      const archivos =
        fs.readdirSync(
          TEMP_DIR
        );

      for (
        const archivo
        of archivos
      ) {

        if (
          archivo.startsWith(
            idSeguro
          )
        ) {

          fs.unlinkSync(
            path.join(
              TEMP_DIR,
              archivo
            )
          );
        }
      }

    } catch (error) {

      console.log(
        "⚠️ No se pudo limpiar el audio:",
        error.message
      );
    }
  }
}

// ==============================
// 🔎 BUSCAR VIDEO
// ==============================

async function buscarVideo(
  busqueda
) {

  const resultado =
    await yts(busqueda);

  if (
    !resultado ||
    !resultado.videos ||
    !resultado.videos.length
  ) {

    return null;
  }

  // Evitar clips extremadamente cortos
  const videos =
    resultado.videos.filter(
      (video) => {

        const segundos =
          Number(
            video.seconds || 0
          );

        return segundos >= 30;
      }
    );

  return (
    videos[0] ||
    resultado.videos[0] ||
    null
  );
}

// ==============================
// 🎵 COMANDO MÚSICA
// ==============================

async function musica(
  sock,
  chat,
  comando,
  args,
  id
) {

  const cmd =
    String(
      comando || ""
    ).toLowerCase();

  console.log(
    "🎵 MUSICA CMD:",
    cmd
  );

  // ==============================
  // ▶️ .PLAY
  // ==============================

  if (
    cmd === "play"
  ) {

    const busqueda =
      args
        .join(" ")
        .trim();

    if (!busqueda) {

      await sock.sendMessage(
        chat,
        {
          text:
`🎵 *MÚSICA*

Escribe el nombre de una canción.

Ejemplo:

.play Believer`
        }
      );

      return true;
    }

    try {

      await sock.sendMessage(
        chat,
        {
          text:
            "🔍 Buscando la canción..."
        }
      );

      // Buscar canción
      const video =
        await buscarVideo(
          busqueda
        );

      if (!video) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No encontré resultados."
          }
        );

        return true;
      }

      // ==============================
      // 🖼️ MOSTRAR RESULTADO
      // ==============================

      await sock.sendMessage(
        chat,
        {
          image: {
            url:
              video.thumbnail
          },

          caption:
`🎵 *${video.title}*

📺 Canal:
${
  video.author?.name ||
  "Desconocido"
}

⏱️ Duración:
${
  video.timestamp ||
  "Desconocida"
}

▶️ ${
  video.url
}

⏳ Preparando audio...`
        }
      );

      // ==============================
      // 🎧 GENERAR AUDIO
      // ==============================

      await enviarAudio(
        sock,
        chat,
        video
      );

    } catch (error) {

      console.log(
        "❌ ERROR PLAY:"
      );

      console.log(
        error?.stderr ||
        error?.message ||
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *ERROR AL GENERAR AUDIO*

No se pudo preparar el audio de esta canción.

🔄 Intenta nuevamente.`
        }
      );
    }

    limpiarTemporales();

    return true;
  }

  // ==============================
  // 🎵 .MP3
  // ==============================

  if (
    cmd === "mp3"
  ) {

    const busqueda =
      args
        .join(" ")
        .trim();

    if (!busqueda) {

      await sock.sendMessage(
        chat,
        {
          text:
`🎵 *MP3*

Escribe el nombre de una canción.

Ejemplo:

.mp3 Believer`
        }
      );

      return true;
    }

    try {

      await sock.sendMessage(
        chat,
        {
          text:
            "🔍 Buscando..."
        }
      );

      const video =
        await buscarVideo(
          busqueda
        );

      if (!video) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No encontré resultados."
          }
        );

        return true;
      }

      // Generar audio
      await enviarAudio(
        sock,
        chat,
        video
      );

    } catch (error) {

      console.log(
        "❌ ERROR MP3:"
      );

      console.log(
        error?.stderr ||
        error?.message ||
        error
      );

      let detalle =
        "No se pudo preparar el audio.";

      const textoError =
        String(
          error?.stderr ||
          error?.message ||
          ""
        ).toLowerCase();

      if (
        textoError.includes(
          "sign in"
        ) ||
        textoError.includes(
          "bot"
        ) ||
        textoError.includes(
          "captcha"
        )
      ) {

        detalle =
          "YouTube rechazó temporalmente la solicitud desde el servidor.";

      } else if (
        textoError.includes(
          "ffmpeg"
        ) ||
        textoError.includes(
          "postprocessing"
        )
      ) {

        detalle =
          "No se pudo completar la conversión del audio.";
      }

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *ERROR AL GENERAR AUDIO*

${detalle}

🔄 Intenta nuevamente.`
        }
      );
    }

    limpiarTemporales();

    return true;
  }

  // ==============================
  // ❌ NO ES MÚSICA
  // ==============================

  return false;
}

// ==============================
// 📦 EXPORTAR
// ==============================

module.exports = musica;

module.exports.musica =
  musica;
