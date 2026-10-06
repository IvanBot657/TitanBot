// =========================================
// 🎵 MÚSICA DEL GRUPO - TITANBOT
// 🎧 DESCARGA Y ENVÍO DE AUDIO
// =========================================

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const util = require("util");

const execFileAsync = util.promisify(execFile);

// =========================================
// 📁 CARPETA TEMPORAL
// =========================================

const tempDir = path.join(__dirname, "..", "temp_audio");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// =========================================
// 🎵 FUNCIÓN PRINCIPAL
// =========================================

async function musicagrupo(sock, chat, args, id) {

  let archivoMP3 = null;

  try {

    // =========================================
    // 🔎 COMPROBAR CANCIÓN
    // =========================================

    if (!args || args.length === 0) {

      await sock.sendMessage(chat, {
        text:
          "🎵 *TITANBOT - PLAY*\n\n" +
          "Escribe el nombre de una canción.\n\n" +
          "Ejemplo:\n" +
          "`.play Believer Imagine Dragons`"
      });

      return true;
    }

    // =========================================
    // 🎶 NOMBRE DE LA CANCIÓN
    // =========================================

    const cancion = args.join(" ");

    // =========================================
    // 🔎 BUSCANDO
    // =========================================

    await sock.sendMessage(chat, {
      text:
        "🎵 *TITANBOT - PLAY*\n\n" +
        `🔎 Buscando: *${cancion}*`
    });

    // =========================================
    // 🔑 API KEY
    // =========================================

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {

      await sock.sendMessage(chat, {
        text:
          "❌ Falta la variable de entorno:\n\n" +
          "`YOUTUBE_API_KEY`\n\n" +
          "Agrégala en Render."
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
    // 🎵 VIDEO
    // =========================================

    const video = resultados[0];

    const videoId = video.id?.videoId;

    if (!videoId) {

      await sock.sendMessage(chat, {
        text:
          "❌ No pude obtener el video de YouTube."
      });

      return true;
    }

    const titulo =
      video.snippet?.title ||
      cancion;

    const canal =
      video.snippet?.channelTitle ||
      "Desconocido";

    const enlace =
      `https://www.youtube.com/watch?v=${videoId}`;

    // =========================================
    // ⏳ DESCARGANDO
    // =========================================

    await sock.sendMessage(chat, {
      text:
        "⬇️ *DESCARGANDO AUDIO...*\n\n" +
        `🎵 ${titulo}\n` +
        `👤 ${canal}\n\n` +
        "⏳ Espera un momento..."
    });

    // =========================================
    // 📁 NOMBRE TEMPORAL
    // =========================================

    const nombreBase =
      `titanbot_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

    archivoMP3 = path.join(
      tempDir,
      `${nombreBase}.mp3`
    );

    // =========================================
    // 🎧 BUSCAR YT-DLP
    // =========================================

    let ytDlp = "yt-dlp";

    try {

      await execFileAsync(
        ytDlp,
        ["--version"],
        {
          timeout: 15000
        }
      );

    } catch {

      ytDlp = "python3";

    }

    // =========================================
    // 🎧 DESCARGAR AUDIO
    // =========================================

    if (ytDlp === "yt-dlp") {

      await execFileAsync(
        ytDlp,
        [
          "--no-playlist",
          "--extract-audio",
          "--audio-format",
          "mp3",
          "--audio-quality",
          "128K",
          "--ffmpeg-location",
          "/usr/bin",
          "-o",
          archivoMP3,
          enlace
        ],
        {
          timeout: 180000,
          maxBuffer: 1024 * 1024 * 10
        }
      );

    } else {

      await execFileAsync(
        ytDlp,
        [
          "-m",
          "yt_dlp",
          "--no-playlist",
          "--extract-audio",
          "--audio-format",
          "mp3",
          "--audio-quality",
          "128K",
          "--ffmpeg-location",
          "/usr/bin",
          "-o",
          archivoMP3,
          enlace
        ],
        {
          timeout: 180000,
          maxBuffer: 1024 * 1024 * 10
        }
      );

    }

    // =========================================
    // 🔎 COMPROBAR ARCHIVO
    // =========================================

    if (!fs.existsSync(archivoMP3)) {

      throw new Error(
        "yt-dlp terminó pero no creó el archivo MP3"
      );
    }

    const stats = fs.statSync(archivoMP3);

    if (stats.size < 1000) {

      throw new Error(
        "El archivo MP3 está vacío o es demasiado pequeño"
      );
    }

    // =========================================
    // 📤 ENVIAR AUDIO
    // =========================================

    await sock.sendMessage(chat, {

      audio: {
        url: archivoMP3
      },

      mimetype: "audio/mpeg",

      fileName:
        `${titulo.replace(/[\\/:*?"<>|]/g, "_")}.mp3`,

      ptt: false

    });

    // =========================================
    // ✅ CONFIRMACIÓN
    // =========================================

    await sock.sendMessage(chat, {
      text:
        "✅ *AUDIO ENVIADO*\n\n" +
        `🎵 ${titulo}`
    });

    return true;

  } catch (error) {

    console.error(
      "❌ ERROR EN MUSICAGRUPO:",
      error?.stderr ||
      error?.stdout ||
      error?.response?.data ||
      error?.message ||
      error
    );

    await sock.sendMessage(chat, {
      text:
        "❌ *NO PUDE DESCARGAR EL AUDIO*\n\n" +
        "Puede que YouTube haya bloqueado la descarga " +
        "o que FFmpeg/yt-dlp no esté disponible en Render.\n\n" +
        "Revisa los logs de Render para ver el error exacto."
    });

    return true;

  } finally {

    // =========================================
    // 🧹 BORRAR ARCHIVO TEMPORAL
    // =========================================

    if (archivoMP3) {

      try {

        if (fs.existsSync(archivoMP3)) {
          fs.unlinkSync(archivoMP3);
        }

      } catch (error) {

        console.error(
          "⚠️ No pude borrar el archivo temporal:",
          error.message
        );

      }
    }
  }
}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = musicagrupo;
