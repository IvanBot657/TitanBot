// commands/sticker.js
// TitanBot - Sistema de Stickers

const {
  downloadMediaMessage
} = require("@whiskeysockets/baileys");

const sharp = require("sharp");

// ========================================
// MENSAJE CITADO
// ========================================

function obtenerMensajeCitado(msg) {
  const contexto =
    msg?.message?.extendedTextMessage?.contextInfo;

  if (!contexto?.quotedMessage) {
    return null;
  }

  return {
    key: {
      remoteJid: msg.key.remoteJid,
      id: contexto.stanzaId,
      participant: contexto.participant
    },
    message: contexto.quotedMessage
  };
}

// ========================================
// BUSCAR MEDIA
// ========================================

function obtenerMedia(msg) {
  if (!msg?.message) return null;

  if (msg.message.imageMessage) {
    return {
      tipo: "imagen",
      mensaje: msg
    };
  }

  if (msg.message.videoMessage) {
    return {
      tipo: "video",
      mensaje: msg
    };
  }

  if (msg.message.stickerMessage) {
    return {
      tipo: "sticker",
      mensaje: msg
    };
  }

  return null;
}

// ========================================
// DESCARGAR MEDIA
// ========================================

async function descargarMedia(sock, mensaje) {
  const buffer = await downloadMediaMessage(
    mensaje,
    "buffer",
    {},
    {
      logger: undefined,
      reuploadRequest: sock.updateMediaMessage
    }
  );

  return buffer;
}

// ========================================
// CREAR STICKER
// ========================================

async function convertirASticker(buffer) {
  return await sharp(buffer)
    .resize(512, 512, {
      fit: "contain",
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0
      }
    })
    .webp({
      quality: 85
    })
    .toBuffer();
}

// ========================================
// COMANDO PRINCIPAL
// ========================================

async function sticker(
  sock,
  msg,
  comando,
  args = []
) {
  try {
    if (!msg?.key?.remoteJid) {
      return true;
    }

    const chat = msg.key.remoteJid;

    comando = String(comando || "")
      .toLowerCase()
      .replace(/^\./, "");

    // ====================================
    // .sticker
    // ====================================

    if (comando === "sticker") {
      const citado =
        obtenerMensajeCitado(msg);

      let mensajeMedia = null;

      // Imagen/video enviado junto al comando
      const mediaDirecta =
        obtenerMedia(msg);

      if (mediaDirecta) {
        mensajeMedia =
          mediaDirecta.mensaje;
      }

      // Imagen/video citado
      if (!mensajeMedia && citado) {
        const mediaCitada =
          obtenerMedia(citado);

        if (mediaCitada) {
          mensajeMedia =
            mediaCitada.mensaje;
        }
      }

      if (!mensajeMedia) {
        await sock.sendMessage(
          chat,
          {
            text:
              "🎨 *STICKER*\n\n" +
              "Envía una imagen y responde con:\n" +
              "*.sticker*\n\n" +
              "También puedes responder a un video corto."
          },
          { quoted: msg }
        );

        return true;
      }

      const buffer =
        await descargarMedia(
          sock,
          mensajeMedia
        );

      const webp =
        await convertirASticker(buffer);

      await sock.sendMessage(
        chat,
        {
          sticker: webp
        },
        { quoted: msg }
      );

      return true;
    }

    // ====================================
    // .stickertexto
    // ====================================

    if (comando === "stickertexto") {
      const texto =
        args.join(" ").trim();

      if (!texto) {
        await sock.sendMessage(
          chat,
          {
            text:
              "📝 *STICKER DE TEXTO*\n\n" +
              "Escribe el texto.\n\n" +
              "Ejemplo:\n" +
              ".stickertexto Hola TitanBot 🤖"
          },
          { quoted: msg }
        );

        return true;
      }

      const textoSeguro =
        texto
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

      const svg = `
        <svg
          width="512"
          height="512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            width="512"
            height="512"
            rx="70"
            fill="white"
          />

          <text
            x="256"
            y="256"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial"
            font-size="46"
            font-weight="bold"
            fill="black"
          >
            ${textoSeguro}
          </text>
        </svg>
      `;

      const webp =
        await sharp(
          Buffer.from(svg)
        )
          .webp({
            quality: 90
          })
          .toBuffer();

      await sock.sendMessage(
        chat,
        {
          sticker: webp
        },
        { quoted: msg }
      );

      return true;
    }

    // ====================================
    // .toimg
    // ====================================

    if (comando === "toimg") {
      const citado =
        obtenerMensajeCitado(msg);

      if (!citado?.message?.stickerMessage) {
        await sock.sendMessage(
          chat,
          {
            text:
              "🖼️ Responde directamente a un sticker con:\n" +
              "*.toimg*"
          },
          { quoted: msg }
        );

        return true;
      }

      const buffer =
        await descargarMedia(
          sock,
          citado
        );

      const imagen =
        await sharp(buffer)
          .png()
          .toBuffer();

      await sock.sendMessage(
        chat,
        {
          image: imagen,
          caption:
            "🖼️ Sticker convertido a imagen."
        },
        { quoted: msg }
      );

      return true;
    }

    // ====================================
    // .take
    // ====================================

    if (comando === "take") {
      const citado =
        obtenerMensajeCitado(msg);

      if (!citado?.message?.stickerMessage) {
        await sock.sendMessage(
          chat,
          {
            text:
              "✏️ Responde directamente a un sticker con:\n" +
              "*.take TitanBot*"
          },
          { quoted: msg }
        );

        return true;
      }

      const buffer =
        await descargarMedia(
          sock,
          citado
        );

      const webp =
        await convertirASticker(buffer);

      await sock.sendMessage(
        chat,
        {
          sticker: webp
        },
        { quoted: msg }
      );

      return true;
    }

    // ====================================
    // COMANDO NO ES DE STICKERS
    // ====================================

    return false;

  } catch (error) {
    console.error(
      "❌ Error en sticker:",
      error
    );

    try {
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text:
            "❌ No pude crear/procesar el sticker."
        },
        { quoted: msg }
      );
    } catch (_) {}

    return true;
  }
}

module.exports = sticker;
