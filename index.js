const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const QRCode = require("qrcode");
const http = require("http");

const PORT = process.env.PORT || 3000;

let qrActual = null;
let conectado = false;

// Servidor web
const server = http.createServer(async (req, res) => {

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate"
  });

  res.end(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TitanBot</title>

  <style>
    body {
      margin: 0;
      padding: 25px;
      background: #111;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    }

    .contenedor {
      max-width: 500px;
      margin: auto;
      background: #222;
      padding: 25px;
      border-radius: 20px;
    }

    img {
      width: 90%;
      max-width: 400px;
      background: white;
      padding: 10px;
      border-radius: 15px;
    }

    .estado {
      font-size: 18px;
      margin: 20px 0;
    }

    .boton {
      display: inline-block;
      margin-top: 15px;
      padding: 12px 20px;
      background: #25D366;
      color: white;
      text-decoration: none;
      border-radius: 10px;
    }
  </style>
</head>

<body>

<div class="contenedor">

  <h1>🤖 TitanBot</h1>

  ${
    conectado
      ? `
        <div class="estado">
          ✅ TitanBot está conectado
        </div>
      `
      : qrActual
        ? `
          <div class="estado">
            📱 Escanea este código QR con WhatsApp
          </div>

          <img src="${qrActual}" alt="Código QR de TitanBot">

          <div>
            ⏳ El código puede cambiar. Si deja de funcionar,
            actualiza esta página.
          </div>
        `
        : `
          <div class="estado">
            ⏳ Generando código QR...
          </div>
        `
  }

</div>

<script>
  setTimeout(() => {
    location.reload();
  }, 5000);
</script>

</body>
</html>
  `);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 TitanBot disponible en el puerto " + PORT);
});

async function iniciarBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect, qr }) => {

      // Nuevo QR
      if (qr) {

        console.log("📱 Generando nuevo código QR...");

        try {

          qrActual = await QRCode.toDataURL(qr);

          conectado = false;

          console.log("✅ Nuevo QR generado correctamente.");

        } catch (error) {

          console.error("❌ Error generando QR:", error);

        }
      }

      // Conectado
      if (connection === "open") {

        conectado = true;
        qrActual = null;

        console.log("✅ TitanBot conectado correctamente.");

      }

      // Desconectado
      if (connection === "close") {

        conectado = false;
        qrActual = null;

        const codigo =
          lastDisconnect?.error?.output?.statusCode;

        if (codigo !== DisconnectReason.loggedOut) {

          console.log(
            "🔄 Conexión cerrada. Generando una nueva conexión..."
          );

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

  // Comandos
  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (texto.toLowerCase() === ".ping") {

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: "🏓 Pong! TitanBot está funcionando."
        }
      );

    }

  });
}

iniciarBot();
