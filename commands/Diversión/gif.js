// =========================================
// 🎬 TITANBOT - COMANDO GIF
// =========================================

const axios = require("axios");

const TITANGIF_API = "https://titangif-api.onrender.com";

async function gif(sock, chat, comando, args = []) {

  const cmd = String(comando || "")
    .toLowerCase()
    .trim();

  if (cmd !== "gif") {
    return false;
  }

  try {

    await sock.sendMessage(chat, {
      text: "🎬 Buscando GIF..."
    });

    const respuesta = await axios.get(
      `${TITANGIF_API}/gif`,
      {
        timeout: 30000
      }
    );

    const datos = respuesta.data;

    if (!datos || !datos.gif) {

      await sock.sendMessage(chat, {
        text: "❌ La API no devolvió ningún GIF."
      });

      return true;
    }

    await sock.sendMessage(chat, {
      video: {
        url: datos.gif
      },
      gifPlayback: true,
      caption: "🎬 *TITAN GIF*"
    });

  } catch (error) {

    console.log("❌ ERROR TITANGIF-API:");
    console.log(
      error.response?.data ||
      error.message
    );

    await sock.sendMessage(chat, {
      text: "❌ No pude conectar con TitanGIF-API."
    });
  }

  return true;
}

module.exports = gif;
module.exports.gif = gif;
