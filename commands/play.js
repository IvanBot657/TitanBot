// TITANBOT - Búsqueda de música y envío de audio
// Comandos: .play, .mp3, .ytmp3, .ytaudio

const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");

const COMANDOS = new Set(["play", "mp3", "ytmp3", "ytaudio"]);
const DURACION_MAXIMA = 15 * 60; // 15 minutos
const TAMANO_MAXIMO = 30 * 1024 * 1024; // 30 MB

function nombreSeguro(nombre) {
  return String(nombre || "audio")
    .replace(/[\\/:*?"<>|\r\n]/g, "_")
    .slice(0, 100);
}

module.exports = async function play(sock, chat, comando, args, id, msg) {
  if (!COMANDOS.has(String(comando || "").toLowerCase())) return false;

  try {
    if (!args || !args.length) {
      await sock.sendMessage(chat, {
        text: "🎵 Escribe el nombre de la canción.\n\nEjemplo: .play nombre de la canción"
      }, { quoted: msg });
      return true;
    }

    const consulta = args.join(" ").trim();
    await sock.sendMessage(chat, {
      text: "🔎 Buscando la canción..."
    }, { quoted: msg });

    const resultado = await yts(consulta);
    const video = resultado?.videos?.[0];

    if (!video || !video.url) {
      await sock.sendMessage(chat, {
        text: "❌ No encontré esa canción. Intenta con otro nombre."
      }, { quoted: msg });
      return true;
    }

    if (Number(video.seconds || 0) > DURACION_MAXIMA) {
      await sock.sendMessage(chat, {
        text: "⚠️ El audio supera el límite de 15 minutos. Prueba con una canción más corta."
      }, { quoted: msg });
      return true;
    }

    const titulo = String(video.title || "Audio");
    const vistas = Number(video.views || 0).toLocaleString("es-CO");
    const caption =
      `🎵 *TITANBOT MUSIC*\n\n` +
      `🎶 *Título:* ${titulo}\n` +
      `📺 *Canal:* ${video.author?.name || "Desconocido"}\n` +
      `⏱️ *Duración:* ${video.timestamp || "Desconocida"}\n` +
      `👁️ *Vistas:* ${vistas}\n` +
      `🔗 *Enlace:* ${video.url}\n\n` +
      `⏳ Preparando el audio...`;

    if (video.thumbnail) {
      await sock.sendMessage(chat, {
        image: { url: video.thumbnail },
        caption
      }, { quoted: msg });
    } else {
      await sock.sendMessage(chat, { text: caption }, { quoted: msg });
    }

    const stream = ytdl(video.url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 20
    });

    const partes = [];
    let total = 0;

    try {
      for await (const parte of stream) {
        total += parte.length;
        if (total > TAMANO_MAXIMO) {
          stream.destroy();
          throw new Error("El audio supera el límite de 30 MB.");
        }
        partes.push(parte);
      }
    } catch (error) {
      stream.destroy();
      throw error;
    }

    const audio = Buffer.concat(partes);
    if (!audio.length) throw new Error("La descarga produjo un audio vacío.");

    await sock.sendMessage(chat, {
      audio,
      mimetype: "audio/mpeg",
      fileName: `${nombreSeguro(titulo)}.mp3`,
      ptt: false
    }, { quoted: msg });

    return true;
  } catch (error) {
    console.error("Error en comando play:", error?.message || error);
    await sock.sendMessage(chat, {
      text: "❌ No pude obtener el audio. YouTube puede haber bloqueado la descarga o el servicio puede necesitar una actualización. Inténtalo más tarde."
    }, { quoted: msg });
    return true;
  }
};
