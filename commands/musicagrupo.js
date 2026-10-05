// =========================================
// 🎵 MÚSICA PARA EL GRUPO - TITANBOT
// =========================================

async function musicagrupo(sock, chat, args, id) {

  try {

    // =========================================
    // 🔎 COMPROBAR QUE ESCRIBIERON UNA CANCIÓN
    // =========================================

    if (!args || args.length === 0) {

      await sock.sendMessage(
        chat,
        {
          text:
            "🎵 *MÚSICA DEL GRUPO*\n\n" +
            "Escribe el nombre de una canción.\n\n" +
            "Ejemplo:\n" +
            "`.musicagrupo Believer`"
        },
        {
          quoted: {
            key: {
              remoteJid: chat,
              fromMe: false,
              id: id
            }
          }
        }
      );

      return true;
    }

    // =========================================
    // 🎶 NOMBRE DE LA CANCIÓN
    // =========================================

    const cancion = args.join(" ");

    // =========================================
    // 🔎 AVISO DE BÚSQUEDA
    // =========================================

    await sock.sendMessage(
      chat,
      {
        text:
          "🎵 *MÚSICA DEL GRUPO*\n\n" +
          `🔎 Buscando: *${cancion}*`
      }
    );

    // =========================================
    // 🚧 TEMPORAL
    // =========================================
    // Aquí conectaremos el buscador/descargador
    // de música.
    //
    // No ponemos todavía una API inventada.
    // Primero dejamos funcionando el comando.
    // =========================================

    await sock.sendMessage(
      chat,
      {
        text:
          "🎵 *MÚSICA DEL GRUPO*\n\n" +
          `🎶 Canción solicitada: *${cancion}*\n\n` +
          "⚙️ Sistema de reproducción en preparación..."
      }
    );

    return true;

  } catch (error) {

    console.error(
      "❌ ERROR EN MUSICAGRUPО:",
      error
    );

    try {

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ Ocurrió un error al procesar la música."
        }
      );

    } catch (errorMensaje) {

      console.error(
        "❌ No se pudo enviar el mensaje de error:",
        errorMensaje
      );

    }

    return true;
  }
}

module.exports = musicagrupo;
