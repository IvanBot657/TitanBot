const axios = require("axios");

// =========================================
// 🎵 TITANBOT - MÚSICA CON AUDIUS
// =========================================

const AUDIUS_API =
  process.env.AUDIUS_API_URL ||
  "https://api.audius.co/v1";

const AUDIUS_API_KEY =
  process.env.AUDIUS_API_KEY;

const AUDIUS_BEARER_TOKEN =
  process.env.AUDIUS_BEARER_TOKEN;

// =========================================
// 🔐 HEADERS
// =========================================

function getHeaders() {
  const headers = {};

  if (AUDIUS_API_KEY) {
    headers["X-API-Key"] = AUDIUS_API_KEY;
  }

  if (AUDIUS_BEARER_TOKEN) {
    headers["Authorization"] =
      `Bearer ${AUDIUS_BEARER_TOKEN}`;
  }

  return headers;
}

// =========================================
// 🔎 BUSCAR CANCIÓN
// =========================================

async function buscarCancion(busqueda) {

  const respuesta = await axios.get(
    `${AUDIUS_API}/tracks/search`,
    {
      params: {
        query: busqueda,
        limit: 5,
        sort_method: "relevant"
      },

      headers: getHeaders(),

      timeout: 30000
    }
  );

  const pistas =
    respuesta.data?.data || [];

  if (!pistas.length) {
    return null;
  }

  return pistas[0];
}

// =========================================
// 🖼️ OBTENER IMAGEN
// =========================================

function obtenerImagen(track) {

  return (
    track.artwork?.["480x480"] ||
    track.artwork?.["150x150"] ||
    track.artwork?.["1000x1000"] ||
    null
  );
}

// =========================================
// 🎵 OBTENER STREAM
// =========================================

function obtenerStream(track) {

  return `${AUDIUS_API}/tracks/${track.id}/stream`;
}

// =========================================
// 🎵 COMANDO MÚSICA
// =========================================

async function musica(
  sock,
  chat,
  comando,
  args,
  id
) {

  const cmd =
    String(comando || "")
      .toLowerCase();

  console.log(
    "🎵 MUSICA CMD:",
    cmd
  );

  // =====================================
  // ▶️ .PLAY
  // =====================================

  if (cmd === "play") {

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
            "🔎 Buscando en Audius..."
        }
      );

      const track =
        await buscarCancion(
          busqueda
        );

      if (!track) {

        await sock.sendMessage(
          chat,
          {
            text:
`❌ *NO ENCONTRÉ LA CANCIÓN*

No encontré una pista disponible en Audius para:

🎵 ${busqueda}

Prueba con otro nombre.`
          }
        );

        return true;
      }

      const titulo =
        track.title ||
        "Canción desconocida";

      const artista =
        track.user?.name ||
        "Artista desconocido";

      const duracion =
        Number(track.duration || 0);

      const minutos =
        Math.floor(
          duracion / 60
        );

      const segundos =
        String(
          duracion % 60
        ).padStart(2, "0");

      const imagen =
        obtenerImagen(track);

      const stream =
        obtenerStream(track);

      // =================================
      // 🖼️ RESULTADO
      // =================================

      const texto =
`🎵 *${titulo}*

👤 Artista:
${artista}

⏱️ Duración:
${minutos}:${segundos}

🎧 Fuente:
Audius

▶️ *Reproducir:*
${stream}

⚡ TITANBOT`;

      if (imagen) {

        await sock.sendMessage(
          chat,
          {
            image: {
              url: imagen
            },

            caption: texto
          }
        );

      } else {

        await sock.sendMessage(
          chat,
          {
            text: texto
          }
        );
      }

      // =================================
      // 🎧 AUDIO
      // =================================

      await sock.sendMessage(
        chat,
        {
          audio: {
            url: stream
          },

          mimetype:
            "audio/mpeg",

          fileName:
            `${titulo
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
        "✅ AUDIO AUDIUS ENVIADO:",
        titulo
      );

    } catch (error) {

      console.log(
        "❌ ERROR PLAY AUDIUS:"
      );

      console.log(
        error?.response?.data ||
        error?.message ||
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *ERROR CON AUDIUS*

No se pudo obtener el audio.

🔄 Intenta nuevamente.

⚡ TITANBOT`
        }
      );
    }

    return true;
  }

  // =====================================
  // 🎵 .MP3
  // =====================================

  if (cmd === "mp3") {

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
            "🔎 Buscando en Audius..."
        }
      );

      const track =
        await buscarCancion(
          busqueda
        );

      if (!track) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No encontré esa canción en Audius."
          }
        );

        return true;
      }

      const titulo =
        track.title ||
        "audio";

      const artista =
        track.user?.name ||
        "Audius";

      const stream =
        obtenerStream(track);

      await sock.sendMessage(
        chat,
        {
          audio: {
            url: stream
          },

          mimetype:
            "audio/mpeg",

          fileName:
            `${titulo
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

      await sock.sendMessage(
        chat,
        {
          text:
`✅ *AUDIO ENVIADO*

🎵 ${titulo}

👤 ${artista}

🎧 Audius
⚡ TITANBOT`
        }
      );

      console.log(
        "✅ MP3 AUDIUS ENVIADO:",
        titulo
      );

    } catch (error) {

      console.log(
        "❌ ERROR MP3 AUDIUS:"
      );

      console.log(
        error?.response?.data ||
        error?.message ||
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *ERROR AL GENERAR AUDIO*

Audius no pudo entregar esta pista.

🔄 Intenta nuevamente.`
        }
      );
    }

    return true;
  }

  // =====================================
  // ❌ NO ES MÚSICA
  // =====================================

  return false;
}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = musica;

module.exports.musica =
  musica;
