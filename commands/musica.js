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

      return true;
  }

  return false;
}

 if (cmd === "play") {

  const busqueda = args.join(" ");

  if (!busqueda) {

    await sock.sendMessage(chat, {
      text: "🎵 Escribe el nombre de una canción.\n\nEjemplo:\n.play Believer"
    });

    return true;
  }

  const cancion = await buscarCancion(busqueda);

  if (!cancion) {

    await sock.sendMessage(chat, {
      text: "❌ No encontré resultados."
    });

    return true;
  }

  await sock.sendMessage(chat, {
    image: {
      url: cancion.artworkUrl100.replace("100x100", "600x600")
    },
    caption:
`🎵 *${cancion.trackName}*

🎤 Artista: ${cancion.artistName}
💿 Álbum: ${cancion.collectionName}

🔗 Vista previa:
${cancion.trackViewUrl}`
  });

  return true;
 }
