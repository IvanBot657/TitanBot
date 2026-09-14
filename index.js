const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const QRCode = require("qrcode");
const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
let qrDisponible = false;

// Servidor web para mostrar el QR
const server = http.createServer((req, res) => {
  if (req.url === "/qr.png" && fs.existsSync("qr.png")) {
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache"
    });

    fs.createReadStream("qr.png").pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
  });

  res.end(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TitanBot - QR</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          background: #111;
          color: white;
          padding: 30px;
        }

        .contenedor {
          max-width: 500px;
          margin: auto;
          background: #222;
          padding: 25px;
          border-radius: 20px;
        }

        img {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 10px;
          border-radius: 10px;
        }

        .estado {
          margin: 20px;
          font-size: 18px;
        }
      </style>
    </head>

    <body>
      <div class="contenedor">
        <h1>🤖 TitanBot</h1>
        <div class="estado">
          ${
            qrDisponible
              ? "📱 Escanea este código QR con WhatsApp"
              : "⏳ Esperando el código QR..."
          }
        </div>

        ${
          qrDisponible
            ? `<img src="/qr.png?t=${Date.now()}" alt="Código QR de TitanBot">`
            : ""
        }

        <p>Si el QR cambia, actualiza esta página.</p>
      </div>
    </body>
    </html>
  `);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 TitanBot disponible en el puerto ${PORT}`);
});

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect, qr }) => {

      if (qr) {
        console.log("📱 Generando código QR...");

        try {
          await QRCode.toFile("qr.png", qr);

          qrDisponible = true;

          console.log("✅ QR generado correctamente en qr.png");
          console.log("🌐 Abre la URL de Render para escanearlo.");
        } catch (error) {
          console.error("❌ Error generando QR:", error);
        }
      }

      if (connection === "open") {
        qrDisponible = false;

        console.log("✅ TitanBot conectado correctamente.");
      }

      if (connection === "close") {
        qrDisponible = false;

        const codigo =
          lastDisconnect?.error?.output?.statusCode;

        if (codigo !== DisconnectReason.loggedOut) {
          console.log("🔄 Conexión cerrada. Intentando reconectar...");

          setTimeout(() => {
            iniciarBot();
          }, 3000);
        } else {
          console.log(
            "❌ Sesión cerrada. Debes volver a vincular el bot."
          );
        }
      }
    }
  );

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
