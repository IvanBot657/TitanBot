const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const QRCode = require("qrcode");
const http = require("http");

const PORT = process.env.PORT || 3000;

// Número para vinculación por código.
// En Render se configura como variable de entorno.
const PAIRING_NUMBER = process.env.PAIRING_NUMBER || "";

let qrActual = null;
let codigoVinculacion = null;
let conectado = false;
let sockActual = null;


// =====================================
// 🌐 PÁGINA WEB
// =====================================

const server = http.createServer((req, res) => {

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate"
  });

  res.end(`
<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

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
  max-width: 550px;
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

.codigo {
  font-size: 30px;
  font-weight: bold;
  letter-spacing: 5px;
  background: #333;
  padding: 18px;
  border-radius: 12px;
  margin: 20px 0;
}

.opcion {
  background: #333;
  padding: 18px;
  margin: 15px 0;
  border-radius: 15px;
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

      <p>WhatsApp vinculado correctamente.</p>
    `
    : `
      <div class="opcion">

        <h2>📱 Opción 1 — QR</h2>

        ${
          qrActual
            ? `
              <p>Escanea este código desde WhatsApp:</p>

              <img
                src="${qrActual}"
                alt="Código QR de TitanBot"
              >

              <p>
                🔄 El QR se actualiza automáticamente.
              </p>
            `
            : `
              <p>⏳ Esperando código QR...</p>
            `
        }

      </div>


      <div class="opcion">

        <h2>🔢 Opción 2 — Código de vinculación</h2>

        ${
          codigoVinculacion
            ? `
              <p>
                En WhatsApp ve a:
              </p>

              <p>
                <b>
                Ajustes → Dispositivos vinculados
                → Vincular un dispositivo
                → Vincular con número de teléfono
                </b>
              </p>

              <div class="codigo">
                ${codigoVinculacion}
              </div>

              <p>
                Introduce este código en WhatsApp.
              </p>
            `
            : `
              <p>
                El código aparecerá aquí si
                configuraste PAIRING_NUMBER en Render.
              </p>
            `
        }

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

  console.log(
    "🌐 TitanBot disponible en el puerto " + PORT
  );

});


// =====================================
// 🤖 INICIAR BOT
// =====================================

async function iniciarBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({

    auth: state,

    logger: P({
      level: "silent"
    }),

    printQRInTerminal: false

  });

  sockActual = sock;

  sock.ev.on(
    "creds.update",
    saveCreds
  );


  // =====================================
  // 📱 CONEXIÓN
  // =====================================

  sock.ev.on(
    "connection.update",
    async ({
      connection,
      lastDisconnect,
      qr
    }) => {


      // -------------------------------
      // 📱 QR
      // -------------------------------

      if (qr) {

        console.log(
          "📱 Generando nuevo código QR..."
        );

        try {

          qrActual =
            await QRCode.toDataURL(qr);

          codigoVinculacion = null;

          conectado = false;

          console.log(
            "✅ Nuevo QR generado correctamente."
          );

        } catch (error) {

          console.error(
            "❌ Error generando QR:",
            error
          );

        }

      }


      // -------------------------------
      // 🔢 CÓDIGO DE VINCULACIÓN
      // -------------------------------

      if (
        !state.creds.registered &&
        PAIRING_NUMBER &&
        !codigoVinculacion
      ) {

        try {

          const numero =
            PAIRING_NUMBER
              .replace(/\D/g, "");

          console.log(
            "🔢 Generando código de vinculación..."
          );

          codigoVinculacion =
            await sock.requestPairingCode(numero);

          console.log(
            "🔢 Código de vinculación:",
            codigoVinculacion
          );

        } catch (error) {

          console.error(
            "❌ Error generando código de vinculación:",
            error
          );

        }

      }


      // -------------------------------
      // ✅ CONECTADO
      // -------------------------------

      if (connection === "open") {

        conectado = true;

        qrActual = null;

        codigoVinculacion = null;

        console.log(
          "✅ TitanBot conectado correctamente."
        );

      }


      // -------------------------------
      // 🔄 DESCONECTADO
      // -------------------------------

      if (connection === "close") {

        conectado = false;

        qrActual = null;

        codigoVinculacion = null;

        const codigo =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;

        if (
          codigo !==
          DisconnectReason.loggedOut
        ) {

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


  // =====================================
  // 💬 MENSAJES
  // =====================================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      const msg = messages[0];

      if (
        !msg.message ||
        msg.key.fromMe
      ) return;

      const texto =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const comando =
        texto
          .toLowerCase()
          .trim();


      // =================================
      // 🏓 PING
      // =================================

      if (comando === ".ping") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              "🏓 Pong! TitanBot está funcionando."
          }
        );

      }


      // =================================
      // 📋 MENU
      // =================================

      else if (comando === ".menu") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:

`╭━━━〔 🤖 TITANBOT 〕━━━╮
┃
┃ 📋 COMANDOS
┃
┃ 🏓 .ping
┃ 🤖 .bot
┃ ℹ️ .info
┃ 🟢 .estado
┃ 🕐 .hora
┃ 📅 .fecha
┃ 🆔 .id
┃ ❓ .ayuda
┃
┃ 🎮 DIVERSIÓN
┃
┃ 🎲 .dado
┃ 🪙 .moneda
┃ 🔮 .8ball
┃ 🎯 .reto
┃ 🤔 .verdad
┃
┃ 🛠️ UTILIDADES
┃
┃ 🧮 .calcular
┃ 🔠 .mayus texto
┃ 🔡 .minus texto
┃ 🔢 .contador texto
┃
┃ 👥 GRUPOS
┃
┃ 👥 .grupo
┃ 👑 .admins
┃ 👤 .miembros
┃ 📜 .reglas
┃
╰━━━━━━━━━━━━━━━━━━━━╯`

          }
        );

      }


      // =================================
      // 🤖 BOT
      // =================================

      else if (comando === ".bot") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:

`🤖 TITANBOT

⚡ Bot de WhatsApp
🟢 Estado: funcionando
🚀 Sistema activo

Escribe .menu para
ver todos los comandos.`

          }
        );

      }


      // =================================
      // ℹ️ INFO
      // =================================

      else if (comando === ".info") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:

`ℹ️ INFORMACIÓN

🤖 Nombre: TitanBot
⚡ Estado: Activo
📱 Plataforma: WhatsApp
🚀 Versión: 1.0.0`

          }
        );

      }


      // =================================
      // 🟢 ESTADO
      // =================================

      else if (comando === ".estado") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:

`🟢 ESTADO DE TITANBOT

🤖 Bot: Activo
📡 Conexión: Estable
⚡ Sistema: Funcionando`

          }
        );

      }


      // =================================
      // 🕐 HORA
      // =================================

      else if (comando === ".hora") {

        const hora =
          new Date().toLocaleTimeString(
            "es-CO",
            {
              timeZone:
                "America/Bogota"
            }
          );

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🕐 Hora actual:\n${hora}`
          }
        );

      }


      // =================================
      // 📅 FECHA
      // =================================

      else if (comando === ".fecha") {

        const fecha =
          new Date().toLocaleDateString(
            "es-CO",
            {
              timeZone:
                "America/Bogota",

              weekday: "long",

              year: "numeric",

              month: "long",

              day: "numeric"
            }
          );

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `📅 Hoy es:\n${fecha}`
          }
        );

      }


      // =================================
      // 🆔 ID
      // =================================

      else if (comando === ".id") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🆔 ID de este chat:\n${msg.key.remoteJid}`
          }
        );

      }


      // =================================
      // 🎲 DADO
      // =================================

      else if (comando === ".dado") {

        const numero =
          Math.floor(
            Math.random() * 6
          ) + 1;

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🎲 El dado cayó en:\n\n⭐ ${numero}`
          }
        );

      }


      // =================================
      // 🪙 MONEDA
      // =================================

      else if (comando === ".moneda") {

        const resultado =
          Math.random() < 0.5
            ? "🟡 CARA"
            : "⚪ SELLO";

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🪙 Lanzando moneda...\n\n${resultado}`
          }
        );

      }


      // =================================
      // 🔮 8BALL
      // =================================

      else if (comando === ".8ball") {

        const respuestas = [

          "🔮 Sí, definitivamente.",

          "🔮 Parece que sí.",

          "🔮 Puede ser.",

          "🔮 No estoy seguro.",

          "🔮 Probablemente no.",

          "🔮 No.",

          "🔮 Inténtalo más tarde."

        ];

        const respuesta =
          respuestas[
            Math.floor(
              Math.random() *
              respuestas.length
            )
          ];

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: respuesta
          }
        );

      }


      // =================================
      // 🎯 RETO
      // =================================

      else if (comando === ".reto") {

        const retos = [

          "🎯 Di algo positivo sobre alguien del grupo.",

          "🎯 Cuenta un chiste.",

          "🎯 Di tu comida favorita.",

          "🎯 Recomienda una película.",

          "🎯 Di tres cosas que te gustan."

        ];

        const reto =
          retos[
            Math.floor(
              Math.random() *
              retos.length
            )
          ];

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: reto
          }
        );

      }


      // =================================
      // 🤔 VERDAD
      // =================================

      else if (comando === ".verdad") {

        const preguntas = [

          "🤔 ¿Cuál es tu comida favorita?",

          "🤔 ¿Cuál es tu película favorita?",

          "🤔 ¿Qué lugar te gustaría visitar?",

          "🤔 ¿Cuál es tu videojuego favorito?",

          "🤔 ¿Qué canción te gusta mucho?"

        ];

        const pregunta =
          preguntas[
            Math.floor(
              Math.random() *
              preguntas.length
            )
          ];

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: pregunta
          }
        );

      }


      // =================================
      // 🔠 MAYÚSCULAS
      // =================================

      else if (
        comando.startsWith(".mayus ")
      ) {

        const contenido =
          texto.slice(7).toUpperCase();

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🔠 ${contenido}`
          }
        );

      }


      // =================================
      // 🔡 MINÚSCULAS
      // =================================

      else if (
        comando.startsWith(".minus ")
      ) {

        const contenido =
          texto.slice(7).toLowerCase();

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🔡 ${contenido}`
          }
        );

      }


      // =================================
      // 🔢 CONTADOR
      // =================================

      else if (
        comando.startsWith(".contador ")
      ) {

        const contenido =
          texto.slice(10);

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:

`🔢 CONTADOR

Caracteres: ${contenido.length}

Texto:
${contenido}`

          }
        );

      }


      // =================================
      // 🧮 CALCULADORA
      // =================================

      else if (
        comando.startsWith(".calcular ")
      ) {

        const operacion =
          texto.slice(10).trim();

        if (
          !/^[0-9+\-*/().\s]+$/
            .test(operacion)
        ) {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ Solo puedes usar números y operadores + - * /"
            }
          );

          return;
        }

        try {

          const resultado =
            Function(
              `"use strict"; return (${operacion})`
            )();

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
`🧮 CALCULADORA

${operacion} = ${resultado}`
            }
          );

        } catch {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ No pude calcular esa operación."
            }
          );

        }

      }


      // =================================
      // 👥 GRUPO
      // =================================

      else if (comando === ".grupo") {

        if (
          !msg.key.remoteJid
            .endsWith("@g.us")
        ) {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ Este comando funciona solamente en grupos."
            }
          );

          return;
        }

        try {

          const metadata =
            await sock.groupMetadata(
              msg.key.remoteJid
            );

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:

`👥 INFORMACIÓN DEL GRUPO

📛 Nombre:
${metadata.subject}

👤 Miembros:
${metadata.participants.length}

🆔 ID:
${msg.key.remoteJid}`

            }
          );

        } catch {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ No pude obtener la información del grupo."
            }
          );

        }

      }


      // =================================
      // 👤 MIEMBROS
      // =================================

      else if (
        comando === ".miembros"
      ) {

        if (
          !msg.key.remoteJid
            .endsWith("@g.us")
        ) {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ Este comando funciona solamente en grupos."
            }
          );

          return;
        }

        const metadata =
          await sock.groupMetadata(
            msg.key.remoteJid
          );

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `👤 Este grupo tiene ${metadata.participants.length} miembros.`
          }
        );

      }


      // =================================
      // 👑 ADMINS
      // =================================

      else if (
        comando === ".admins"
      ) {

        if (
          !msg.key.remoteJid
            .endsWith("@g.us")
        ) {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ Este comando funciona solamente en grupos."
            }
          );

          return;
        }

        const metadata =
          await sock.groupMetadata(
            msg.key.remoteJid
          );

        const admins =
          metadata.participants
            .filter(
              p =>
                p.admin === "admin" ||
                p.admin === "superadmin"
            )
            .map(
              p =>
                `👑 @${p.id.split("@")[0]}`
            )
            .join("\n");

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `👑 ADMINISTRADORES\n\n${admins || "No encontrados"}`
          }
        );

      }


      // =================================
      // 📜 REGLAS
      // =================================

      else if (
        comando === ".reglas"
      ) {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:

`📜 REGLAS

1️⃣ Respeta a los demás.
2️⃣ No hagas spam.
3️⃣ No compartas contenido inapropiado.
4️⃣ Mantén el respeto.
5️⃣ Sigue las normas del grupo.

🤖 TitanBot`

          }
        );

      }


      // =================================
      // ❓ AYUDA
      // =================================

      else if (
        comando === ".ayuda"
      ) {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:

`❓ AYUDA TITANBOT

Escribe:

.menu

para ver todos los comandos disponibles.`

          }
        );

      }

    }
  );

}

iniciarBot();
