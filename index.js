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
let codigoVinculacion = null;

// ==========================================
// SERVIDOR WEB
// ==========================================

const server = http.createServer(async (req, res) => {

  // ========================================
  // PÁGINA PRINCIPAL
  // ========================================

  if (req.url === "/") {

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>TitanBot</title>

<style>
body {
  margin: 0;
  background: #111;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 30px;
}

button {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

a {
  text-decoration: none;
}
</style>

</head>

<body>

<h1>🤖 TitanBot v2.5.0</h1>

<p>🟢 Servidor funcionando</p>

<a href="/qr">
<button>
📱 CONECTAR TITANBOT
</button>
</a>

</body>
</html>
`);

    return;
  }

  // ========================================
  // PÁGINA DE CONEXIÓN
  // ========================================

  if (req.url === "/qr") {

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });

    let imagenQR = "";

    if (qrActual) {

      try {

        imagenQR =
          await QRCode.toDataURL(qrActual);

      } catch (error) {

        console.log(
          "❌ Error creando QR:",
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

<title>TitanBot - Conexión</title>

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

.contenedor {
  max-width: 400px;
  margin: auto;
}

.tarjeta {
  background: #1d1d1d;
  padding: 25px;
  margin-top: 20px;
  border-radius: 15px;
}

.qr {
  width: 280px;
  height: 280px;
  background: white;
  padding: 10px;
  border-radius: 12px;
}

input {
  width: 90%;
  padding: 13px;
  margin: 10px 0;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  box-sizing: border-box;
}

button {
  padding: 13px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin: 5px;
}

.btnQR {
  background: #25D366;
  color: white;
}

.btnCodigo {
  background: #2196F3;
  color: white;
}

.codigo {
  font-size: 25px;
  font-weight: bold;
  letter-spacing: 4px;
  margin-top: 15px;
  padding: 15px;
  background: #000;
  border-radius: 8px;
}

.mensaje {
  margin-top: 15px;
  font-size: 16px;
}

.separador {
  margin: 30px 0;
  color: #aaa;
}

</style>

</head>

<body>

<div class="contenedor">

<h1>🤖 TITANBOT V2.5</h1>

<div class="estado">
${estado}
</div>

<!-- ================================= -->
<!-- QR -->
<!-- ================================= -->

<div class="tarjeta">

<h2>📱 Código QR</h2>

${
  imagenQR
    ? `
<img
class="qr"
src="${imagenQR}"
alt="Código QR"
>
`
    : `
<p>⏳ Esperando código QR...</p>
`
}

<p class="mensaje">
${
  imagenQR
    ? "📱 Escanea el QR con WhatsApp"
    : "🔄 Esperando conexión..."
}
</p>

</div>

<div class="separador">
──────────────
<br>
O
<br>
──────────────
</div>

<!-- ================================= -->
<!-- CÓDIGO DE VINCULACIÓN -->
<!-- ================================= -->

<div class="tarjeta">

<h2>🔢 Código de vinculación</h2>

<p>
Escribe tu número con código de país.
</p>

<p>
Ejemplo: <b>573001234567</b>
</p>

<form action="/pairing" method="GET">

<input
type="tel"
name="numero"
placeholder="573001234567"
required
>

<br>

<button
class="btnCodigo"
type="submit"
>
🔐 GENERAR CÓDIGO
</button>

</form>

${
  codigoVinculacion
    ? `
<div class="codigo">
${codigoVinculacion}
</div>

<p class="mensaje">
📱 Abre WhatsApp → Dispositivos vinculados
→ Vincular dispositivo → Vincular con número
</p>
`
    : ""
}

</div>

</div>

<script>

setTimeout(function() {
  location.reload();
}, 5000);

</script>

</body>

</html>
`);

    return;
  }

  // ========================================
  // GENERAR CÓDIGO DE VINCULACIÓN
  // ========================================

  if (req.url.startsWith("/pairing")) {

    const url =
      new URL(
        req.url,
        "http://" + (req.headers.host || "localhost")
      );

    let numero =
      url.searchParams.get("numero");

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });

    if (!numero) {

      res.end(`
        <h2>❌ Falta el número</h2>
        <a href="/qr">Volver</a>
      `);

      return;
    }

    // Solo números
    numero =
      numero.replace(/\D/g, "");

    // Validación básica
    if (
      numero.length < 10 ||
      numero.length > 15
    ) {

      res.end(`
        <h2>❌ Número inválido</h2>

        <p>
        Escribe el número con código de país.
        </p>

        <p>
        Ejemplo: 573001234567
        </p>

        <a href="/qr">
        Volver
        </a>
      `);

      return;
    }

    if (!sockActual) {

      res.end(`
        <h2>⏳ TitanBot todavía está iniciando</h2>
        <p>Espera unos segundos y vuelve a intentarlo.</p>
        <a href="/qr">Volver</a>
      `);

      return;
    }

    try {

      // Si ya existe una sesión registrada
      if (
        sockActual.authState &&
        sockActual.authState.creds &&
        sockActual.authState.creds.registered
      ) {

        res.end(`
          <h2>🟢 TitanBot ya está conectado</h2>

          <p>
          Esta sesión ya está vinculada a WhatsApp.
          </p>

          <a href="/qr">
          Volver
          </a>
        `);

        return;
      }

      estado =
        "🟡 Generando código de vinculación...";

      qrActual = null;

      console.log(
        "📱 Solicitando código para:",
        numero
      );

      const codigo =
        await sockActual.requestPairingCode(
          numero
        );

      codigoVinculacion = codigo;

      estado =
        "🟡 Código de vinculación generado";

      console.log(
        "🔐 Código de vinculación:",
        codigo
      );

      res.end(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>Código TitanBot</title>

<style>

body {
  background: #111;
  color: white;
  font-family: Arial;
  text-align: center;
  padding: 40px;
}

.codigo {
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 6px;
  background: #000;
  padding: 20px;
  border-radius: 10px;
  display: inline-block;
  margin: 20px;
}

a {
  color: white;
}

</style>

</head>

<body>

<h1>🔐 Código de vinculación</h1>

<p>
Tu código es:
</p>

<div class="codigo">
${codigo}
</div>

<p>
📱 En WhatsApp:
</p>

<p>
Dispositivos vinculados
<br>
↓
<br>
Vincular dispositivo
<br>
↓
<br>
Vincular con número de teléfono
<br>
↓
<br>
Introduce el código mostrado arriba
</p>

<br>

<a href="/qr">
⬅️ Volver a TitanBot
</a>

</body>

</html>
`);

    } catch (error) {

      console.log(
        "❌ Error generando código:",
        error.message
      );

      estado =
        "🔴 Error generando código";

      codigoVinculacion = null;

      res.end(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<title>Error</title>

</head>

<body style="
background:#111;
color:white;
font-family:Arial;
text-align:center;
padding:40px;
">

<h2>❌ No se pudo generar el código</h2>

<p>
${error.message}
</p>

<p>
Si el QR funciona, puedes utilizar el QR para conectar TitanBot.
</p>

<a href="/qr" style="color:white;">
⬅️ Volver
</a>

</body>

</html>
`);

    }

    return;
  }

  // ========================================
  // QR DATA
  // ========================================

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
        estado,
        qr: qrImagen,
        codigo: codigoVinculacion
      })
    );

    return;
  }

  // ========================================
  // 404
  // ========================================

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end(
    "404 - Página no encontrada"
  );

});

server.listen(PORT, () => {

  console.log(
    `🚀 Servidor iniciado en puerto ${PORT}`
  );

  console.log(
    `📱 Página de conexión: /qr`
  );

});

// ==========================================
// INICIAR BOT
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
    } =
      await useMultiFileAuthState(
        "./session"
      );

    const sock =
      makeWASocket({

        auth: state,

        logger:
          P({
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

    // ======================================
    // CONEXIÓN
    // ======================================

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect,
          qr
        } = update;

        // -------------------------------
        // QR
        // -------------------------------

        if (qr) {

          qrActual = qr;

          codigoVinculacion = null;

          estado =
            "🟡 Esperando escaneo del QR";

          console.log(
            "📱 Nuevo QR disponible"
          );

        }

        // -------------------------------
        // CONECTANDO
        // -------------------------------

        if (
          connection === "connecting"
        ) {

          estado =
            "🟡 Conectando TitanBot...";

          console.log(
            "🔄 Conectando TitanBot..."
          );

        }

        // -------------------------------
        // CONECTADO
        // -------------------------------

        if (
          connection === "open"
        ) {

          qrActual = null;

          codigoVinculacion = null;

          estado =
            "🟢 TitanBot conectado";

          iniciando = false;

          console.log(
            `✅ ${config.nombre} conectado correctamente`
          );

        }

        // -------------------------------
        // DESCONECTADO
        // -------------------------------

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
            codigo !==
            DisconnectReason.loggedOut
          ) {

            estado =
              "🟠 Reconectando TitanBot...";

            qrActual = null;

            codigoVinculacion = null;

            setTimeout(() => {

              iniciarBot();

            }, 3000);

          } else {

            estado =
              "🔴 Sesión cerrada";

            qrActual = null;

            codigoVinculacion = null;

          }

        }

      }
    );

    // ======================================
    // MENSAJES
    // ======================================

    sock.ev.on(
      "messages.upsert",
      async ({
        messages
      }) => {

        try {

          const msg =
            messages[0];

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
            !texto.startsWith(
              config.prefijo
            )
          ) {
            return;
          }

          const contenido =
            texto
              .slice(
                config.prefijo.length
              )
              .trim();

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

          // -------------------------------
          // XP
          // -------------------------------

          try {

            ganarXP(id);

          } catch (error) {

            console.log(
              "⚠️ Error XP:",
              error.message
            );

          }

          // -------------------------------
          // GRUPO
          // -------------------------------

          const esGrupo =
            chat.endsWith("@g.us");

          let esAdmin = false;

          if (esGrupo) {

            try {

              const metadata =
                await sock.groupMetadata(
                  chat
                );

              const participante =
                metadata.participants.find(
                  p => p.id === id
                );

              esAdmin =
                participante?.admin ===
                  "admin" ||
                participante?.admin ===
                  "superadmin";

            } catch (error) {

              console.log(
                "⚠️ Error grupo:",
                error.message
              );

            }
          }

          // -------------------------------
          // INICIO
          // -------------------------------

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

          // -------------------------------
          // USUARIO
          // -------------------------------

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

          // -------------------------------
          // ECONOMÍA
          // -------------------------------

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

          // -------------------------------
          // JUEGOS
          // -------------------------------

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

          // -------------------------------
          // GRUPOS
          // -------------------------------

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

          // -------------------------------
          // ANIME
          // -------------------------------

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

          // -------------------------------
          // HERRAMIENTAS
          // -------------------------------

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

          // -------------------------------
          // AJUSTES
          // -------------------------------

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

          // -------------------------------
          // OWNER
          // -------------------------------

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

          // -------------------------------
          // DESCONOCIDO
          // -------------------------------

          await sock.sendMessage(
            chat,
            {
              text:
`❌ Comando no encontrado.

Escribe:
${config.prefijo}menu

para ver los comandos.`
            }
          );

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
// INICIAR
// ==========================================

iniciarBot();
