const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const http = require("http");
const QRCode = require("qrcode");

const config = require("./config");

// ==============================
// COMANDOS
// ==============================

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

// ==============================
// SERVIDOR WEB
// ==============================

const PORT = process.env.PORT || 10000;

let qrActual = null;
let estado = "🔴 Desconectado";

const server = http.createServer(async (req, res) => {

  if (req.url === "/qr") {

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    if (!qrActual) {

      res.end(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="5">

<title>TitanBot QR</title>

<style>
body {
  background: #111;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 30px;
}

h1 {
  color: #00ff88;
}

p {
  font-size: 18px;
}
</style>

</head>

<body>

<h1>🤖 TITANBOT V2.5</h1>

<p>Estado: ${estado}</p>

<p>⏳ Esperando código QR...</p>

<p>La página se actualizará automáticamente.</p>

</body>
</html>
`);

      return;
    }

    try {

      const imagen =
        await QRCode.toDataURL(qrActual);

      res.end(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Conectar TitanBot</title>

<style>
body {
  background: #111;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 20px;
}

h1 {
  color: #00ff88;
}

img {
  width: 320px;
  max-width: 90%;
  background: white;
  padding: 10px;
  border-radius: 15px;
}

p {
  font-size: 18px;
}
</style>

</head>

<body>

<h1>🤖 TITANBOT V2.5</h1>

<p>📱 Escanea este QR con WhatsApp</p>

<img src="${imagen}">

<p>Estado: ${estado}</p>

</body>
</html>
`);

    } catch (error) {

      res.end(`
        <h1>❌ Error generando QR</h1>
        <p>${error.message}</p>
      `);

    }

    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end(
    `🤖 ${config.nombre} v${config.version}\n${estado}`
  );

});

server.listen(PORT, () => {

  console.log(
    `🌐 Servidor iniciado en puerto ${PORT}`
  );

  console.log(
    `📱 Página QR disponible en /qr`
  );

});

// ==============================
// INICIAR BOT
// ==============================

async function iniciarBot() {

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

    browser: [
      "TitanBot",
      "Chrome",
      "2.5.0"
    ]

  });

  // ==============================
  // GUARDAR SESIÓN
  // ==============================

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  // ==============================
  // CONEXIÓN
  // ==============================

  sock.ev.on(
    "connection.update",
    async (update) => {

      const {
        connection,
        lastDisconnect,
        qr
      } = update;

      // NUEVO QR

      if (qr) {

        qrActual = qr;

        estado =
          "🟡 Esperando escaneo del QR";

        console.log(
          "📱 Nuevo QR disponible en /qr"
        );

      }

      // CONECTANDO

      if (connection === "connecting") {

        estado =
          "🟡 Conectando...";

        console.log(
          "🔄 Conectando TitanBot..."
        );

      }

      // CONECTADO

      if (connection === "open") {

        qrActual = null;

        estado =
          "🟢 Conectado";

        console.log(
          `✅ ${config.nombre} conectado correctamente`
        );

      }

      // DESCONECTADO

      if (connection === "close") {

        estado =
          "🔴 Desconectado";

        const codigo =
          lastDisconnect?.error?.output?.statusCode;

        const debeReconectar =
          codigo !== DisconnectReason.loggedOut;

        console.log(
          "❌ Conexión cerrada. Código:",
          codigo
        );

        if (debeReconectar) {

          console.log(
            "🔄 Reconectando en 10 segundos..."
          );

          setTimeout(() => {

            iniciarBot();

          }, 10000);

        } else {

          console.log(
            "🚪 Sesión cerrada."
          );

          console.log(
            "Elimina la carpeta session para volver a vincular."
          );

        }

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

        const msg =
          messages[0];

        if (!msg || !msg.message) {
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

        // ==============================
        // OBTENER TEXTO
        // ==============================

        const texto =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          "";

        if (!texto) {
          return;
        }

        const textoLimpio =
          texto.trim();

        // ==============================
        // COMPROBAR PREFIJO
        // ==============================

        if (
          !textoLimpio.startsWith(
            config.prefijo
          )
        ) {

          return;

        }

        // ==============================
        // COMANDO Y ARGUMENTOS
        // ==============================

        const partes =
          textoLimpio
            .slice(config.prefijo.length)
            .trim()
            .split(/\s+/);

        const comando =
          (partes.shift() || "")
            .toLowerCase();

        const args =
          partes;

        if (!comando) {
          return;
        }

        // ==============================
        // ID DEL USUARIO
        // ==============================

        const id =
          msg.key.participant ||
          msg.key.remoteJid;

        // ==============================
        // GRUPO
        // ==============================

        const isGroup =
          chat.endsWith("@g.us");

        let isAdmin = false;

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

          } catch (error) {

            console.log(
              "⚠️ No se pudo comprobar el administrador."
            );

          }

        }

        // ==============================
        // GANAR XP
        // ==============================

        try {

          const resultadoXP =
            ganarXP(id);

          if (
            resultadoXP &&
            resultadoXP.subioNivel
          ) {

            await sock.sendMessage(chat, {

              text:
`🎉 ¡SUBISTE DE NIVEL!

⭐ Nuevo nivel:
${resultadoXP.nivel}

✨ XP ganada:
+${resultadoXP.xpGanada}

💰 Recompensa:
+${resultadoXP.recompensa} monedas`

            });

          }

        } catch (error) {

          console.log(
            "⚠️ Error en XP:",
            error.message
          );

        }

        // ==============================
        // INICIO
        // ==============================

        try {

          const ejecutado =
            await inicio(
              sock,
              chat,
              comando,
              args,
              id
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en inicio:",
            error.message
          );

        }

        // ==============================
        // USUARIO
        // ==============================

        try {

          const ejecutado =
            await usuario(
              sock,
              chat,
              comando,
              args,
              id
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en usuario:",
            error.message
          );

        }

        // ==============================
        // ECONOMÍA
        // ==============================

        try {

          const ejecutado =
            await economia(
              sock,
              chat,
              comando,
              args,
              id
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en economía:",
            error.message
          );

        }

        // ==============================
        // JUEGOS
        // ==============================

        try {

          const ejecutado =
            await juegos(
              sock,
              chat,
              comando,
              args
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en juegos:",
            error.message
          );

        }

        // ==============================
        // GRUPOS
        // ==============================

        try {

          const ejecutado =
            await grupos(
              sock,
              chat,
              comando,
              args,
              id,
              isGroup,
              isAdmin
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en grupos:",
            error.message
          );

        }

        // ==============================
        // ANIME
        // ==============================

        try {

          const ejecutado =
            await anime(
              sock,
              chat,
              comando,
              args
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en anime:",
            error.message
          );

        }

        // ==============================
        // HERRAMIENTAS
        // ==============================

        try {

          const ejecutado =
            await herramientas(
              sock,
              chat,
              comando,
              args
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en herramientas:",
            error.message
          );

        }

        // ==============================
        // AJUSTES
        // ==============================

        try {

          const ejecutado =
            await ajustes(
              sock,
              chat,
              comando,
              args,
              id,
              isGroup,
              isAdmin
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en ajustes:",
            error.message
          );

        }

        // ==============================
        // OWNER
        // ==============================

        try {

          const ejecutado =
            await owner(
              sock,
              chat,
              comando,
              args,
              id
            );

          if (ejecutado) {
            return;
          }

        } catch (error) {

          console.log(
            "❌ Error en owner:",
            error.message
          );

        }

      } catch (error) {

        console.log(
          "❌ Error procesando mensaje:",
          error
        );

      }

    }
  );

}

// ==============================
// ARRANCAR
// ==============================

iniciarBot().catch(error => {

  console.error(
    "❌ Error iniciando TitanBot:",
    error
  );

});
