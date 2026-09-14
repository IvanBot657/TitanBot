const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const QRCode = require("qrcode");
const fs = require("fs");

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("📱 Escanea el siguiente QR:");

      try {
        await QRCode.toFile("qr.png", qr);
        console.log("✅ QR generado correctamente en qr.png");
      } catch (error) {
        console.error("❌ Error generando QR:", error);
      }
    }

    if (connection === "open") {
      console.log("✅ TitanBot conectado correctamente.");
    }

    if (connection === "close") {
      const codigo = lastDisconnect?.error?.output?.statusCode;

      if (codigo !== DisconnectReason.loggedOut) {
        console.log("🔄 Conexión cerrada. Intentando reconectar...");
        iniciarBot();
      } else {
        console.log("❌ Sesión cerrada. Debes volver a vincular el bot.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (texto.toLowerCase() === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong! TitanBot está funcionando."
      });
    }
  });
}

iniciarBot();
