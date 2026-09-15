const axios = require("axios");

async function buscarCancion(nombre) {
  try {

    const respuesta = await axios.get(
      `https://itunes.apple.com/search?term=${encodeURIComponent(nombre)}&limit=1`
    );

    return respuesta.data.results[0];

  } catch (error) {
    console.log(error);
    return null;
  }
}

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

  if (cmd === "play") {

    const busqueda =
      args.join(" ");

    await sock.sendMessage(chat, {
      text:
`🎵 PLAY

Buscando:
${busqueda || "Sin nombre"}

⚠️ Sistema de música en desarrollo.`
    });

    return true;
  }

  if (cmd === "lyrics") {

    await sock.sendMessage(chat, {
      text:
"🎶 Letras no disponibles por ahora."
    });

    return true;
  }

  if (cmd === "playlist") {

    await sock.sendMessage(chat, {
      text:
"🎧 Playlist de TitanBot próximamente."
    });

    return true;
  }

  if (cmd === "cancionrandom") {

    await sock.sendMessage(chat, {
      text:
"🎵 Canción aleatoria: Believer - Imagine Dragons"
    });

    return true;
  }

  if (cmd === "artista") {

    await sock.sendMessage(chat, {
      text:
"🎤 Función artista en desarrollo."
    });

    return true;
  }

  if (cmd === "album") {

    await sock.sendMessage(chat, {
      text:
"💿 Función álbum en desarrollo."
    });

    return true;
  }

  if (cmd === "topmusic") {

    await sock.sendMessage(chat, {
      text:
"🏆 Top Music próximamente."
    });

    return true;
  }

  if (cmd === "genero") {

    await sock.sendMessage(chat, {
      text:
"🎼 Géneros disponibles próximamente."
    });

    return true;
  }

  if (cmd === "musica") {

    await sock.sendMessage(chat, {
      text:
"🎵 Módulo de música activo."
    });

    return true;
  }

  if (cmd === "recomendacion") {

    await sock.sendMessage(chat, {
      text:
"🎧 Recomendación: Believer - Imagine Dragons"
    });

    return true;
  }

  return false;
}

module.exports = musica;
module.exports.musica = musica;
