const yts = require("yt-search");
const axios = require("axios");

const ALIAS = [
  "play",
  "mp3",
  "ytmp3",
  "ytaudio",
  "playaudio"
];

module.exports = async function ejecutarPlay(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {
  const cmd = String(comando || "")
    .toLowerCase()
    .replace(/^\./, "");

  if (!ALIAS.includes(cmd)) return false;

  const consulta = Array.isArray(args)
    ? args.join(" ").trim()
    : String(args || "").trim();

  if (!consulta) {
    await sock.sendMessage(
      chat,
      {
        text: "🎵 Escribe el nombre de una canción.\n\nEjemplo: .play Bad Bunny - Monaco"
      },
      { quoted: msg }
    );
    return true;
  }

  try {
    await sock.sendMessage(
      chat,
      { text: "🔎 Buscando tu canción..." },
      { quoted: msg }
    );

    const resultados = await yts(consulta);
    const video = resultados.videos?.[0];

    if (!video) {
      await sock.sendMessage(
        chat,
        { text: "❌ No encontré esa canción. Intenta con otro nombre." },
        { quoted: msg }
      );
      return true;
    }

    const info = [
      "🎵 *TITANBOT MUSIC*",
      "",
      `📌 *Título:* ${video.title}`,
      `⏱️ *Duración:* ${video.timestamp || "No disponible"}`,
      `👤 *Canal:* ${video.author?.name || "Desconocido"}`,
      `🔗 *Enlace:* ${video.url}`,
      "",
      "⬇️ Preparando descarga de audio..."
    ].join("\n");

    await sock.sendMessage(
      chat,
      {
        image: { url: video.thumbnail },
        caption: info
      },
      { quoted: msg }
    );

    const apiUrl = process.env.PLAY_API_URL;
    const apiKey = process.env.PLAY_API_KEY;

    if (!apiUrl || !apiKey) {
      await sock.sendMessage(
        chat,
        {
          text:
            "⚠️ La búsqueda funciona, pero falta configurar el servicio de descarga MP3.\n\n" +
            "Cuando tengamos una API compatible, podremos conectar la descarga."
        },
        { quoted: msg }
      );
      return true;
    }

    const endpoint =
      `${apiUrl.replace(/\/+$/, "")}/dl/ytmp3`;

    const respuesta = await axios.get(endpoint, {
      params: {
        url: video.url,
        key: apiKey
      },
      timeout: 60000
    });

    const datos = respuesta.data;
    const enlaceAudio = datos?.data?.dl;

    if (!datos?.status || !enlaceAudio) {
      throw new Error("La API no devolvió un enlace de audio válido.");
    }

    const descarga = await axios.get(enlaceAudio, {
      responseType: "arraybuffer",
      timeout: 120000
    });

    await sock.sendMessage(
      chat,
      {
        audio: Buffer.from(descarga.data),
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`
      },
      { quoted: msg }
    );

  } catch (error) {
    console.error("Error en comando play:", error.message);

    await sock.sendMessage(
      chat,
      {
        text:
          "❌ No pude obtener el audio en este momento.\n" +
          "La búsqueda puede funcionar aunque el servicio de descarga falle."
      },
      { quoted: msg }
    );
  }

  return true;
};
       
