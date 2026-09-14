const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const http = require("http");
const QRCode = require("qrcode");

// ==============================
// COMANDOS
// ==============================

const inicio = require("./commands/inicio");
const usuario = require("./commands/usuario");
const economia = require("./commands/economia");
const juegos = require("./commands/juegos");
const grupos = require("./commands/grupos");

// ==============================
// CONFIGURACIÓN
// ==============================

const PORT = process.env.PORT || 10000;

let qrActual = null;
let estado = "Iniciando TitanBot...";
let sockActual = null;
let iniciando = false;

// ==============================
// PÁGINA WEB DEL QR
// ==============================

const server = http.createServer(async (req, res) => {

  if (req.url === "/qr") {

    let contenidoQR = "";

    if (qrActual) {

      try {

        contenidoQR =
          await QRCode.toDataURL(qrActual);

      } catch (error) {

        contenidoQR = "";
      }
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
<!DOCTYPE html>
<html lang="es">
<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>TitanBot QR</title>

<style>

body {
  margin: 0;
  padding: 0;
  background: #111;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
}

.contenedor {
  max-width: 500px;
  margin: 40px auto;
  padding: 25px;
}

h1 {
  font-size: 30px;
}

.estado {
  margin: 20px 0;
  font-size: 18px;
}

.qr {
  background: white;
  padding: 15px;
  border-radius: 15px;
  display: inline-block;
}

.qr img {
  width: 280px;
  height: 280px;
}

.info {
  margin-top: 25px;
  line-height: 1.7;
}

.boton {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 20px;
  background: #25D366;
  color: white;
  text-decoration: none;
  border-radius: 10px;
}

</style>

<meta http-equiv="refresh" content="5">

</head>

<body>

<div class="contenedor">

<h1>🤖 TitanBot v2.5</h1>

<div class="estado">
${estado}
</div>

${
  contenidoQR
    ? `
<div class="qr">
<img src="${contenidoQR}" alt="QR de WhatsApp">
</div>

<div class="info">
📱 Abre WhatsApp<br>
➡️ Dispositivos vinculados<br>
➡️ Vincular dispositivo<br>
➡️ Escanea este código QR
</div>
`
    : `
<div class="info">
⏳ Esperando código QR...
<br><br>
La página se actualizará automáticamente.
</div>
`
}

</div>

</body>
</html>
`);

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
<meta name="viewport"
content="width=device-width, initial-scale=1.0">
<title>TitanBot</title>
</head>

<body style="
font-family:Arial;
text-align:center;
background:#111;
color:white;
padding:40px;
">

<h1>🤖 TitanBot v2.5</h1>

<p>${estado}</p>

<a href="/qr"
style="
display:inline-block;
padding:15px 25px;
background:#25D366;
color:white;
text-decoration:none;
border-radius:10px;
">
📱 Ver QR de WhatsApp
</a>

</body>
</html>
`);
});

server.listen(PORT, "0.0.0.0", () => {

  console.log(
    `🌐 Servidor iniciado en puerto ${PORT}`
  );

  console.log(
    "📱 Abre la URL de Render y entra en /qr"
  );
});

// ==============================
// INICIAR WHATSAPP
// ==============================

async function iniciarBot() {

  if (iniciando) return;

  iniciando = true;

  try {

    estado = "🔄 Conectando con WhatsApp...";

    console.log("");
    console.log(
      "🤖 Iniciando TitanBot v2.5..."
    );

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({

      auth: state,

      logger: pino({
        level: "silent"
      }),

      printQRInTerminal: false,

      markOnlineOnConnect: false,

      browser: [
        "TitanBot",
        "Chrome",
        "1.0.0"
      ]
    });

    sockActual = sock;

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ==============================
    // CONEXIÓN Y QR
    // ==============================

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          qr,
          lastDisconnect
        } = update;

        // NUEVO QR
        if (qr) {

          qrActual = qr;

          estado =
            "📱 QR listo. Escanéalo desde WhatsApp.";

          console.log("");
          console.log(
            "📱 ¡QR GENERADO!"
          );

          console.log(
            "🌐 Abre la URL de Render y entra en /qr"
          );

          console.log("");
        }

        // CONECTANDO
        if (connection === "connecting") {

          estado =
            "🔄 Conectando con WhatsApp...";

          console.log(
            "🔄 Conectando con WhatsApp..."
          );
        }

        // CONECTADO
        if (connection === "open") {

          iniciando = false;

          qrActual = null;

          estado =
            "🟢 TitanBot conectado a WhatsApp.";

          console.log("");
          console.log(
            "╔════════════════════════════╗"
          );
          console.log(
            "║     🤖 TITANBOT V2.5      ║"
          );
          console.log(
            "║      🟢 CONECTADO         ║"
          );
          console.log(
            "╚════════════════════════════╝"
          );
          console.log("");
        }

        // CERRADO
        if (connection === "close") {

          iniciando = false;

          const codigo =
            lastDisconnect?.error?.output?.statusCode;

          console.log("");
          console.log(
            "⚠️ Conexión cerrada."
          );

          console.log(
            "Código:",
            codigo || "desconocido"
          );

          estado =
            "⚠️ Conexión cerrada. Esperando reconexión...";

          // Si se cerró la sesión
          if (
            codigo === DisconnectReason.loggedOut
          ) {

            qrActual = null;

            estado =
              "❌ Sesión cerrada. Se necesita volver a vincular.";

            console.log(
              "❌ Sesión cerrada."
            );

            return;
          }

          // Esperar antes de reconectar
          setTimeout(() => {

            console.log(
              "🔄 Intentando reconectar..."
            );

            iniciarBot();

          }, 10000);
        }
      }
    );

    // ==============================
    // MENSAJES
    // ==============================

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {

        try {

          const mensaje = messages[0];

          if (!mensaje) return;

          if (!mensaje.message) return;

          if (mensaje.key.fromMe) return;

          const chat =
            mensaje.key.remoteJid;

          if (!chat) return;

          const texto =
            mensaje.message.conversation ||
            mensaje.message.extendedTextMessage?.text ||
            "";

          if (!texto.startsWith(".")) return;

          const partes =
            texto
              .slice(1)
              .trim()
              .split(/\s+/);

          const comando =
            (partes.shift() || "")
              .toLowerCase();

          const args = partes;

          const id =
            mensaje.key.participant ||
            mensaje.key.remoteJid;

          const isGroup =
            chat.endsWith("@g.us");

          let isAdmin = false;

          // ==========================
          // ADMIN
          // ==========================

          if (isGroup) {

            try {

              const metadata =
                await sock.groupMetadata(chat);

              const participante =
                metadata.participants.find(
                  p => p.id === id
                );

              isAdmin =
                participante?.admin === "admin" ||
                participante?.admin === "superadmin";

            } catch {

              isAdmin = false;
            }
          }

          let respondio = false;

          // INICIO
          if (!respondio) {

            respondio =
              await inicio(
                sock,
                chat,
                comando
              );
          }

          // USUARIO
          if (!respondio) {

            respondio =
              await usuario.usuario(
                sock,
                chat,
                comando,
                id
              );
          }

          // ECONOMÍA
          if (!respondio) {

            respondio =
              await economia(
                sock,
                chat,
                comando,
                args,
                id
              );
          }

          // JUEGOS
          if (!respondio) {

            respondio =
              await juegos(
                sock,
                chat,
                comando,
                args,
                id
              );
          }

          // GRUPOS
          if (!respondio) {

            respondio =
              await grupos(
                sock,
                chat,
                comando,
                args,
                id,
                isGroup,
                isAdmin
              );
          }

        } catch (error) {

          console.log(
            "❌ Error procesando mensaje:"
          );

          console.log(
            error.message
          );
        }
      }
    );

  } catch (error) {

    iniciando = false;

    estado =
      "❌ Error iniciando TitanBot.";

    console.log("");
    console.log(
      "❌ Error iniciando TitanBot:"
    );

    console.log(
      error.message
    );

    console.log("");
  }
}

// ==============================
// INICIAR
// ==============================

iniciarBot();
