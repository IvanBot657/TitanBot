// commands/play.js
// TITANBOT ⚡ - Buscar y enviar música como audio normal

const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;

async function play(sock, chat, comando, args, id, msg) {
  let archivoTemporal = null;

  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(
        chat,
        {
          text:
            "🎵 *TITANBOT PLAY*\n\n" +
            "Escribe el nombre de una canción.\n\n" +
            "Ejemplo: .play música electrónica"
        },
        { quoted: msg }
      );

      return true;
    }

    if (!JAMENDO_CLIENT_ID) {
      await sock.sendMessage(
        chat,
        {
          text:
            "⚠️ El sistema de música aún no está configurado.\n" +
            "Falta la variable JAMENDO_CLIENT_ID."
        },
        { quoted: msg }
      );

      return true;
    }

    const consulta = args.join(" ").trim();

    await sock.sendMessage(
      chat,
      {
        text: `🔎 *TITANBOT PLAY*\n\nBuscando música: ${consulta}...`
      },
      { quoted: msg }
    );

    // Buscar pistas en el catálogo de Jamendo.
    const respuesta = await axios.get(
      "https://api.jamendo.com/v3.0/tracks/",
      {
        params: {
          client_id: JAMENDO_CLIENT_ID,
          format: "json",
          limit: 10,
          namesearch: consulta,
          audiodownload_allowed: true,
          audioformat: "mp32",
          order: "relevance"
        },
        timeout: 15000
      }
    );

    const canciones = respuesta.data?.results || [];

    // Elegir únicamente una pista que permita descargar el audio.
    const cancion = canciones.find(
      pista =>
        pista.audiodownload_allowed === true &&
        typeof pista.audiodownload === "string" &&
        pista.audiodownload.startsWith("https://")
    );

    if (!cancion) {
      await sock.sendMessage(
        chat,
        {
          text:
            "😕 No encontré una pista descargable para esa búsqueda.\n\n" +
            "Prueba con otro título o artista.\n" +
            "Este catálogo contiene música independiente, no todas las canciones comerciales."
        },
        { quoted: msg }
      );

      return true;
    }

    // Descargar el audio autorizado.
    const descarga = await axios.get(cancion.audiodownload, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: 25 * 1024 * 1024,
      maxBodyLength: 25 * 1024 * 1024
    });

    const audio = Buffer.from(descarga.data);

    if (!audio.length || audio.length > 25 * 1024 * 1024) {
      throw new Error("El audio está vacío o supera el límite permitido.");
    }

    // Comprobar que la respuesta parece ser un archivo de audio.
    const contentType = String(
      descarga.headers["content-type"] || ""
    ).toLowerCase();

    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json")
    ) {
      throw new Error("La fuente no devolvió un archivo de audio.");
    }

    // Archivo temporal: no se guarda dentro del repositorio.
    archivoTemporal = path.join(
      os.tmpdir(),
      `titanbot-play-${Date.now()}.mp3`
    );

    fs.writeFileSync(archivoTemporal, audio);

    await sock.sendMessage(
      chat,
      {
        text:
          `🎵 *TITANBOT PLAY*\n\n` +
          `🎶 *Título:* ${cancion.name || "Desconocido"}\n` +
          `👤 *Artista:* ${cancion.artist_name || "Desconocido"}\n` +
          `💿 *Álbum:* ${cancion.album_name || "No disponible"}\n\n` +
          `📤 Enviando audio...`
      },
      { quoted: msg }
    );

    // ptt: false = audio normal, no nota de voz.
    await sock.sendMessage(
      chat,
      {
        audio: fs.readFileSync(archivoTemporal),
        mimetype: "audio/mpeg",
        ptt: false
      },
      { quoted: msg }
    );

    console.log(
      `[PLAY] Audio enviado: ${cancion.name} - ${cancion.artist_name}`
    );

    return true;

  } catch (error) {
    console.error(
      "[PLAY ERROR]",
      error.response?.status || "",
      error.message
    );

    await sock.sendMessage(
      chat,
      {
        text:
          "❌ No pude obtener o enviar el audio.\n\n" +
          "Comprueba la conexión, la configuración de música y vuelve a intentarlo."
      },
      { quoted: msg }
    ).catch(() => {});

    return true;

  } finally {
    // Limpiar el archivo temporal incluso si ocurre un error.
    if (archivoTemporal) {
      try {
        if (fs.existsSync(archivoTemporal)) {
          fs.unlinkSync(archivoTemporal);
        }
      } catch (error) {
        console.error(
          "[PLAY] No se pudo eliminar el temporal:",
          error.message
        );
      }
    }
  }
}

module.exports = play;
