const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");
const QRCode = require("qrcode");

const config = require("./config");

const inicio = require("./commands/inicio");
const {
  usuario,
  ganarXP
} = require("./commands/usuario");

const economia = require("./commands/economia");
const juegos = require("./commands/juegos");
const grupos = require("./commands/grupos");
const anime = require("./commands/anime");
const herramientas = require("./commands/herramientas");
const ajustes = require("./commands/ajustes");
const owner = require("./commands/owner");

const PORT = process.env.PORT || 10000;

let qrActual = null;
let estado = "🔴 Desconectado";
let sockActual = null;
let iniciando = false;

// ==========================================
// SERVIDOR WEB
// ==========================================

const server = http.createServer(async (req, res) => {

  // ----------------------------------------
  // PÁGINA PRINCIPAL
  // ----------------------------------------

  if (req.url === "/") {

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TitanBot</title>
</head>

<body style="
  background:#111;
  color:white;
  font-family:Arial;
  text-align:center;
  padding:40px;
">

<h1>🤖 TitanBot v2.5.0</h1>

<p>Servidor funcionando correctamente.</p>

<a href="/qr"
style="
display:inline-block;
padding:15px 25px;
background:#25D366;
color:white;
text-decoration:none;
border-radius:10px;
font-weight:bold;
">
📱 VER QR
</a>

</body>
</html>
`);

    return;
  }

  // ----------------------------------------
  // PÁGINA QR
  // ----------------------------------------

  if (req.url === "/qr") {

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });

    let imagenQR = "";

    if (qrActual) {
      try {
        imagenQR = await QRCode.toDataURL(qrActual);
      } catch (error) {
        console.log(
          "❌ Error creando imagen QR:",
          error.message
        );
      }
    }

    res.end(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<meta
http-equiv="Cache-Control"
content="no-cache, no-store, must-revalidate"
>

<title>TitanBot QR</title>

<style>

body {
  margin: 0;
  background: #111;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 25px;
}

h1 {
  margin-bottom: 10px;
}

.estado {
  font-size: 18px;
  margin: 20px;
}

.qr {
  width: 300px;
  height: 300px;
  background: white;
  padding: 10px;
  border-radius: 12px;
}

.mensaje {
  margin-top: 20px;
  font-size: 17px;
}

</style>

</head>

<body>

<h1>🤖 TITANBOT V2.5</h1>

<div class="estado">
${estado}
</div>

${
  imagenQR
    ? `
<img
class="qr"
src="${imagenQR}"
alt="Código QR de TitanBot"
>
`
    : `
<div class="mensaje">
⏳ Esperando código QR...
</div>
`
}

<div class="mensaje">

${
  imagenQR
    ? "📱 Escanea este código con WhatsApp"
    : "🔄 Actualiza esta página en unos segundos"
}

</div>

<script>

setTimeout(function() {
  location.reload();
}, 3000);

</script>

</body>

</html>
`);

    return;
  }

  // ----------------------------------------
  // DATOS DEL QR
  // ----------------------------------------

  if (req.url.startsWith("/qr-data")) {

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });

    let qrImagen = null;

    if (qrActual) {

      try {

        qrImagen =
          await QRCode.toDataURL(qrActual);

      } catch (error) {

        console.log(
          "❌ Error generando QR:",
          error.message
        );

      }

    }

    res.end(
      JSON.stringify({
        estado: estado,
        qr: qrImagen
      })
    );

    return;
  }

  // ----------------------------------------
  // 404
  // ----------------------------------------

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("404 - Página no encontrada");

});

server.listen(PORT, () => {

  console.log(
    `🚀 Servidor iniciado en puerto ${PORT}`
  );

  console.log(
    `📱 Página QR disponible en /qr`
  );

});

// ==========================================
// INICIAR WHATSAPP
// ==========================================

async function iniciarBot() {

  if (iniciando) {
    console.log(
      "⚠️ Ya hay una conexión en proceso."
    );
    return;
  }

  iniciando = true;

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({

      auth: state,

      logger: P({
        level: "silent"
      }),

      printQRInTerminal: false,

      browser: [
        "TitanBot",
        "Chrome",
        "2.5.0"
      ]

    });

    sockActual = sock;

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect,
          qr
        } = update;

        // ------------------------------
        // QR NUEVO
        // ------------------------------

        if (qr) {

          qrActual = qr;

          estado =
            "🟡 Esperando escaneo del QR";

          console.log(
            "📱 Nuevo QR disponible"
          );

        }

        // ------------------------------
        // CONECTANDO
        // ------------------------------

        if (
          connection === "connecting"
        ) {

          estado =
            "🟡 Conectando TitanBot...";

          console.log(
            "🔄 Conectando TitanBot..."
          );

        }

        // ------------------------------
        // CONECTADO
        // ------------------------------

        if (
          connection === "open"
        ) {

          qrActual = null;

          estado =
            "🟢 TitanBot conectado";

          iniciando = false;

          console.log(
            `✅ ${config.nombre} conectado correctamente`
          );

        }

        // ------------------------------
        // DESCONECTADO
        // ------------------------------

        if (
          connection === "close"
        ) {

          iniciando = false;

          const codigo =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          console.log(
            "❌ Conexión cerrada:",
            codigo
          );

          if (
            codigo !== DisconnectReason.loggedOut
          ) {

            estado =
              "🟠 Reconectando TitanBot...";

            qrActual = null;

            setTimeout(() => {

              iniciarBot();

            }, 3000);

          } else {

            estado =
              "🔴 Sesión cerrada";

            qrActual = null;

            console.log(
              "❌ La sesión fue cerrada."
            );

          }

        }

      }
    );

    // ==================================
    // MENSAJES
    // ==================================

    sock.ev.on(
      "messages.upsert",
      async ({
        messages
      }) => {

        try {

          const msg = messages[0];

          if (!msg.message) {
            return;
          }

          if (msg.key.fromMe) {
            return;
          }

          const chat =
            msg.key.remoteJid;

          if (!chat) {
            return;
          }

          const texto =
            msg.message.conversation ||
            msg.message.extendedTextMessage
              ?.text ||
            "";

          if (!texto) {
            return;
          }

          if (
            !texto.startsWith(config.prefijo)
          ) {
            return;
          }

          const contenido =
            texto.slice(
              config.prefijo.length
            ).trim();

          if (!contenido) {
            return;
          }

          const partes =
            contenido.split(/\s+/);

          const comando =
            partes[0].toLowerCase();

          const args =
            partes.slice(1);

          const id =
            msg.key.participant ||
            chat;

          // ------------------------------
          // XP
          // ------------------------------

          try {
            ganarXP(id);
          } catch (error) {
            console.log(
              "⚠️ Error XP:",
              error.message
            );
          }

          // ------------------------------
          // GRUPO
          // ------------------------------

          let esGrupo = chat.endsWith("@g.us");

          let esAdmin = false;

          if (esGrupo) {

            try {

              const metadata =
                await sock.groupMetadata(chat);

              const participante =
                metadata.participants.find(
                  p =>
                    p.id === id
                );

              esAdmin =
                participante?.admin === "admin" ||
                participante?.admin === "superadmin";

            } catch (error) {

              console.log(
                "⚠️ Error obteniendo grupo:",
                error.message
              );

            }

          }

          // ------------------------------
          // COMANDOS
          // ------------------------------

          let respondido = false;

          try {
            respondido =
              await inicio(
                sock,
                chat,
                comando
              );
          } catch (error) {
            console.log(
              "❌ Error inicio:",
              error.message
            );
          }

          if (respondido) return;

          try {
            respondido =
              await usuario(
                sock,
                chat,
                comando,
                id
              );
          } catch (error) {
            console.log(
              "❌ Error usuario:",
              error.message
            );
          }

          if (respondido) return;

          try {
            respondido =
              await economia(
                sock,
                chat,
                comando,
                args,
                id
              );
          } catch (error) {
            console.log(
              "❌ Error economía:",
              error.message
            );
          }

          if (respondido) return;

          try {
            respondido =
              await juegos(
                sock,
                chat,
                comando,
                args,
                id
              );
          } catch (error) {
            console.log(
              "❌ Error juegos:",
              error.message
            );
          }

          if (respondido) return;

          try {
            respondido =
              await grupos(
                sock,
                chat,
                comando,
                args,
                id,
                esAdmin,
                esGrupo
              );
          } catch (error) {
            console.log(
              "❌ Error grupos:",
              error.message
            );
          }

          if (respondido) return;

          try {
            respondido =
              await anime(
                sock,
                chat,
                comando,
                args
              );
          } catch (error) {
            console.log(
              "❌ Error anime:",
              error.message
            );
          }

          if (respondido) return;

          try {
            respondido =
              await herramientas(
                sock,
                chat,
                comando,
                args,
                id
              );
          } catch (error) {
            console.log(
              "❌ Error herramientas:",
              error.message
            );
          }

          if (respondido) return;

          try {
            respondido =
              await ajustes(
                sock,
                chat,
                comando,
                args,
                id,
                esAdmin,
                esGrupo
              );
          } catch (error) {
            console.log(
              "❌ Error ajustes:",
              error.message
            );
          }

          if (respondido) return;

          try {
            respondido =
              await owner(
                sock,
                chat,
                comando,
                args,
                id
              );
          } catch (error) {
            console.log(
              "❌ Error owner:",
              error.message
            );
          }

          if (respondido) return;

          // ------------------------------
          // COMANDO DESCONOCIDO
          // ------------------------------

          await sock.sendMessage(chat, {
            text:
`❌ Comando no encontrado.

Escribe:
${config.prefijo}menu

para ver los comandos disponibles.`
          });

        } catch (error) {

          console.log(
            "❌ Error procesando mensaje:",
            error.message
          );

        }

      }
    );

  } catch (error) {

    iniciando = false;

    console.log(
      "❌ Error iniciando TitanBot:",
      error
    );

    setTimeout(() => {
      iniciarBot();
    }, 5000);

  }

}

// ==========================================
// ARRANCAR
// ==========================================

iniciarBot();
