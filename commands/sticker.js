// ========================================
// 🎨 TITANBOT - SISTEMA DE STICKERS
// ========================================

const {
  downloadMediaMessage
} = require("@whiskeysockets/baileys");

const sharp = require("sharp");

// ========================================
// 📩 MENSAJE CITADO
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
      participant: contexto.participant,
      fromMe: false
    },
    message: contexto.quotedMessage
  };
}

// ========================================
// 🔎 BUSCAR IMAGEN O STICKER
// ========================================

function obtenerMedia(msg) {
  const mensaje = msg?.message;

  if (!mensaje) return null;

  if (mensaje.imageMessage) {
    return {
      tipo: "imagen",
      mensaje: msg
    };
  }

  if (mensaje.stickerMessage) {
    return {
      tipo: "sticker",
      mensaje: msg
    };
  }

  return null;
}

// ========================================
// 📥 DESCARGAR ARCHIVO
// ========================================

async function descargarMedia(sock, mensaje) {
  const buffer = await downloadMediaMessage(
    mensaje,
    "buffer",
    {},
    {
      logger: console,
      reuploadRequest: sock.updateMediaMessage
    }
  );

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("La descarga no devolvió una imagen válida.");
  }

  return buffer;
}

// ========================================
// 🧪 VALIDAR IMAGEN
// ========================================

async function validarImagen(buffer) {
  try {
    const metadata = await sharp(buffer, {
      failOn: "error"
    }).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("La imagen no tiene dimensiones válidas.");
    }

    return metadata;
  } catch (error) {
    throw new Error(
      `Formato de imagen no compatible o archivo dañado: ${error.message}`
    );
  }
}

// ========================================
// 🎨 CONVERTIR A STICKER WEBP
// ========================================

async function convertirASticker(buffer) {
  await validarImagen(buffer);

  return sharp(buffer)
    .rotate()
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
      quality: 85,
      effort: 4
    })
    .toBuffer();
}

// ========================================
// 📝 ESCAPAR TEXTO PARA SVG
// ========================================

function escaparTexto(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ========================================
// 🚀 COMANDO PRINCIPAL
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
    // 🎨 .sticker
    // ====================================

    if (comando === "sticker") {
      const citado = obtenerMensajeCitado(msg);

      const mediaDirecta = obtenerMedia(msg);
      const mediaCitada = citado
        ? obtenerMedia(citado)
        : null;

      const mensajeMedia =
        mediaDirecta?.mensaje ||
        mediaCitada?.mensaje;

      if (!mensajeMedia) {
        await sock.sendMessage(
          chat,
          {
            text:
              "🎨 *STICKER*\n\n" +
              "1. Envía una imagen y escribe *.sticker* en el texto.\n" +
              "2. O responde a una imagen con *.sticker*.\n\n" +
              "Nota: los videos no se convierten en esta versión."
          },
          { quoted: msg }
        );

        return true;
      }

      const buffer = await descargarMedia(
        sock,
        mensajeMedia
      );

      const webp = await convertirASticker(buffer);

      await sock.sendMessage(
        chat,
        { sticker: webp },
        { quoted: msg }
      );

      return true;
    }

    // ====================================
    // 📝 .stickertexto
    // ====================================

    if (comando === "stickertexto") {
      const texto = args.join(" ").trim();

      if (!texto) {
        await sock.sendMessage(
          chat,
          {
            text:
              "📝 *STICKER DE TEXTO*\n\n" +
              "Ejemplo:\n" +
              ".stickertexto Hola TitanBot"
          },
          { quoted: msg }
        );

        return true;
      }

      const textoSeguro = escaparTexto(texto)
        .replace(/\r?\n/g, " ");

      const svg = `
        <svg
          width="512"
          height="512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            width="512"
            height="512"
            rx="55"
            fill="white"
          />
          <foreignObject
            x="30"
            y="30"
            width="452"
            height="452"
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style="
                width:452px;
                height:452px;
                display:flex;
                align-items:center;
                justify-content:center;
                text-align:center;
                overflow-wrap:anywhere;
                font-family:Arial,sans-serif;
                font-size:36px;
                font-weight:bold;
                color:black;
              "
            >${textoSeguro}</div>
          </foreignObject>
        </svg>
      `;

      const webp = await sharp(
        Buffer.from(svg)
      )
        .webp({ quality: 90 })
        .toBuffer();

      await sock.sendMessage(
        chat,
        { sticker: webp },
        { quoted: msg }
      );

      return true;
    }

    // ====================================
    // 🖼️ .toimg
    // ====================================

    if (comando === "toimg") {
      const citado = obtenerMensajeCitado(msg);

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

      const buffer = await descargarMedia(
        sock,
        citado
      );

      await validarImagen(buffer);

      const imagen = await sharp(buffer)
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
    // ✏️ .take
    // ====================================

    if (comando === "take") {
      const citado = obtenerMensajeCitado(msg);

      if (!citado?.message?.stickerMessage) {
        await sock.sendMessage(
          chat,
          {
            text:
              "✏️ Responde a un sticker con:\n" +
              "*.take TitanBot*"
          },
          { quoted: msg }
        );

        return true;
      }

      const buffer = await descargarMedia(
        sock,
        citado
      );

      const webp = await convertirASticker(buffer);

      await sock.sendMessage(
        chat,
        { sticker: webp },
        { quoted: msg }
      );

      return true;
    }

    // ====================================
    // ❌ COMANDO NO RECONOCIDO AQUÍ
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
            "❌ No pude procesar el sticker.\n\n" +
            `Motivo: ${error.message}`
        },
        { quoted: msg }
      );
    } catch (_) {}

    return true;
  }
}

module.exports = sticker;
