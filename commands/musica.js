const axios = require("axios");

// =========================================
// 🎵 TITANBOT - MÚSICA CON JAMENDO
// =========================================

const JAMENDO_API =
  "https://api.jamendo.com/v3.0";

const JAMENDO_CLIENT_ID =
  process.env.JAMENDO_CLIENT_ID;

// =========================================
// 🔎 BUSCAR CANCIÓN
// =========================================

async function buscarCancion(busqueda) {

  if (!JAMENDO_CLIENT_ID) {
    throw new Error(
      "Falta JAMENDO_CLIENT_ID en las variables de entorno."
    );
  }

  const respuesta = await axios.get(
    `${JAMENDO_API}/tracks/`,
    {
      params: {
        client_id: JAMENDO_CLIENT_ID,
        format: "json",
        limit: 10,
        search: busqueda,
        audioformat: "mp31",
        imagesize: 300
      },

      timeout: 30000
    }
  );

  const pistas =
    respuesta.data?.results || [];

  if (!pistas.length) {
    return null;
  }

  // Preferimos una pista que permita descarga
  const pistaDisponible =
    pistas.find(
      pista =>
        pista.audiodownload_allowed === true &&
        pista.audio
    );

  return pistaDisponible || pistas[0];
}

// =========================================
// 🖼️ OBTENER IMAGEN
// =========================================

function obtenerImagen(track) {

  return (
    track.image ||
    track.album_image ||
    null
  );
}

// =========================================
// 🎧 OBTENER AUDIO
// =========================================

function obtenerAudio(track) {

  // Jamendo entrega directamente la URL
  // de streaming en el campo "audio".
  return track.audio || null;
}

// =========================================
// ⏱️ FORMATEAR DURACIÓN
// =========================================

function formatearDuracion(segundos) {

  const total =
    Number(segundos || 0);

  const minutos =
    Math.floor(total / 60);

  const segundosRestantes =
    String(total % 60)
      .padStart(2, "0");

  return `${minutos}:${segundosRestantes}`;
}

// =========================================
// 🧹 LIMPIAR NOMBRE DEL ARCHIVO
// =========================================

function limpiarNombre(nombre) {

  return String(nombre || "audio")
    .replace(
      /[\\/:*?"<>|]/g,
      "_"
    )
    .slice(0, 80);
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
            "🔎 Buscando en Jamendo..."
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

No encontré una pista disponible en Jamendo para:

🎵 ${busqueda}

Prueba con otro nombre.`
          }
        );

        return true;
      }

      const titulo =
        track.name ||
        "Canción desconocida";

      const artista =
        track.artist_name ||
        "Artista desconocido";

      const duracion =
        formatearDuracion(
          track.duration
        );

      const imagen =
        obtenerImagen(track);

      const audio =
        obtenerAudio(track);

      if (!audio) {

        await sock.sendMessage(
          chat,
          {
            text:
`❌ *AUDIO NO DISPONIBLE*

Encontré:

🎵 ${titulo}

pero Jamendo no entregó una URL de audio para esta pista.

🔄 Prueba con otra canción.`
          }
        );

        return true;
      }

      // =================================
      // 🖼️ RESULTADO
      // =================================

      const texto =
`🎵 *${titulo}*

👤 Artista:
${artista}

⏱️ Duración:
${duracion}

🎧 Fuente:
Jamendo

🔗 ${track.shareurl || "Jamendo"}

⚡ *TITANBOT*`;

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
      // 🎧 ENVIAR AUDIO
      // =================================

      await sock.sendMessage(
        chat,
        {
          audio: {
            url: audio
          },

          mimetype:
            "audio/mpeg",

          fileName:
            `${limpiarNombre(titulo)}.mp3`,

          ptt: false
        }
      );

      console.log(
        "✅ AUDIO JAMENDO ENVIADO:",
        titulo
      );

    } catch (error) {

      console.log(
        "❌ ERROR PLAY JAMENDO:"
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
`❌ *ERROR CON JAMENDO*

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
            "🔎 Buscando en Jamendo..."
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
              "❌ No encontré esa canción en Jamendo."
          }
        );

        return true;
      }

      const titulo =
        track.name ||
        "audio";

      const artista =
        track.artist_name ||
        "Jamendo";

      const audio =
        obtenerAudio(track);

      if (!audio) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ Esta pista no tiene audio disponible."
          }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          audio: {
            url: audio
          },

          mimetype:
            "audio/mpeg",

          fileName:
            `${limpiarNombre(titulo)}.mp3`,

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

🎧 Jamendo
⚡ TITANBOT`
        }
      );

      console.log(
        "✅ MP3 JAMENDO ENVIADO:",
        titulo
      );

    } catch (error) {

      console.log(
        "❌ ERROR MP3 JAMENDO:"
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

Jamendo no pudo entregar esta pista.

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
