// commands/sticker.js
// TitanBot - Sistema de Stickers

const sharp = require("sharp");

// ========================================
// OBTENER MENSAJE CITADO
// ========================================

function obtenerMensajeCitado(msg) {
  return (
    msg?.message?.extendedTextMessage?.contextInfo
      ?.quotedMessage || null
  );
}

// ========================================
// OBTENER TIPO DE MEDIA
// ========================================

function obtenerMedia(msg) {
  if (!msg?.message) return null;

  if (msg.message.imageMessage) {
    return {
      tipo: "imagen",
      mensaje: msg.message.imageMessage
    };
  }

  if (msg.message.videoMessage) {
    return {
      tipo: "video",
      mensaje: msg.message.videoMessage
    };
  }

  return null;
}

// ========================================
// COMANDO PRINCIPAL
// ========================================

async function sticker(sock, msg, comando, args = []) {
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

    if (comando === "sticker" || comando === "s") {
      const citado = obtenerMensajeCitado(msg);

      const media =
        obtenerMedia(msg) ||
        obtenerMedia({
          message: citado
        });

      if (!media) {
        await sock.sendMessage(
          chat,
          {
            text:
              "🎨 *STICKER*\n\n" +
              "Envía o responde a una imagen con:\n" +
              "*.sticker*\n\n" +
              "También puedes usar un video corto."
          },
          { quoted: msg }
        );

        return true;
      }

      // Baileys descarga el contenido mediante downloadContentFromMessage
      const { downloadContentFromMessage } =
        require("@whiskeysockets/baileys");

      const stream = await downloadContentFromMessage(
        media.mensaje,
        media.tipo
      );

      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Convertir a WEBP
      const webp = await sharp(buffer)
        .resize(512, 512, {
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({
          quality: 85
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
    // .stickertexto
    // ====================================

    if (comando === "stickertexto") {
      const texto = args.join(" ").trim();

      if (!texto) {
        await sock.sendMessage(
          chat,
          {
            text:
              "📝 Escribe el texto del sticker.\n\n" +
              "Ejemplo:\n" +
              "*.stickertexto Hola TitanBot*"
          },
          { quoted: msg }
        );

        return true;
      }

      // SVG temporal convertido a WebP
      const svg = `
        <svg width="512" height="512"
             xmlns="http://www.w3.org/2000/svg">
          <rect
            width="512"
            height="512"
            rx="60"
            fill="white"/>
          <text
            x="256"
            y="256"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Arial"
            font-size="48"
            font-weight="bold"
            fill="black">
            ${texto
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}
          </text>
        </svg>
      `;

      const webp = await sharp(
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
      const citado = obtenerMensajeCitado(msg);

      const stickerMsg =
        citado?.stickerMessage;

      if (!stickerMsg) {
        await sock.sendMessage(
          chat,
          {
            text:
              "🖼️ Responde a un sticker con:\n" +
              "*.toimg*"
          },
          { quoted: msg }
        );

        return true;
      }

      const {
        downloadContentFromMessage
      } = require("@whiskeysockets/baileys");

      const stream =
        await downloadContentFromMessage(
          stickerMsg,
          "sticker"
        );

      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer =
        Buffer.concat(chunks);

      const imagen =
        await sharp(buffer)
          .png()
          .toBuffer();

      await sock.sendMessage(
        chat,
        {
          image: imagen,
          caption: "🖼️ Sticker convertido a imagen."
        },
        { quoted: msg }
      );

      return true;
    }

    // ====================================
    // .take
    // ====================================

    if (comando === "take") {
      const citado = obtenerMensajeCitado(msg);

      const stickerMsg =
        citado?.stickerMessage;

      if (!stickerMsg) {
        await sock.sendMessage(
          chat,
          {
            text:
              "✏️ Responde a un sticker con:\n" +
              "*.take Nombre*"
          },
          { quoted: msg }
        );

        return true;
      }

      const nombre =
        args.join(" ").trim() ||
        "TitanBot";

      const {
        downloadContentFromMessage
      } = require("@whiskeysockets/baileys");

      const stream =
        await downloadContentFromMessage(
          stickerMsg,
          "sticker"
        );

      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer =
        Buffer.concat(chunks);

      const webp =
        await sharp(buffer)
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
