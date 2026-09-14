const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

const PORT = process.env.PORT || 3000;

// Número configurado en Render
const PAIRING_NUMBER = process.env.PAIRING_NUMBER || "";

let codigoVinculacion = null;
let conectado = false;
let generandoCodigo = false;

// ==========================================
// 🌐 SERVIDOR WEB
// ==========================================

const server = http.createServer((req, res) => {

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
  });

  let contenido = "";

  if (conectado) {

    contenido = `
      <h1>🤖 TitanBot</h1>
      <h2>✅ TitanBot está conectado</h2>
      <p>El bot ya está conectado a WhatsApp.</p>
    `;

  } else if (codigoVinculacion) {

    contenido = `
      <h1>🤖 TitanBot</h1>

      <h2>🔢 Código de vinculación</h2>

      <p>Para conectar el bot:</p>

      <ol>
        <li>Abre WhatsApp.</li>
        <li>Ve a <b>Ajustes</b>.</li>
        <li>Entra en <b>Dispositivos vinculados</b>.</li>
        <li>Pulsa <b>Vincular un dispositivo</b>.</li>
        <li>Selecciona <b>Vincular con número de teléfono</b>.</li>
        <li>Introduce el siguiente código:</li>
      </ol>

      <div class="codigo">
        ${codigoVinculacion}
      </div>

      <p>⏳ La página se actualizará automáticamente.</p>
    `;

  } else {

    contenido = `
      <h1>🤖 TitanBot</h1>
      <h2>⏳ Generando código...</h2>
      <p>Espera unos segundos.</p>
    `;
  }

  res.end(`
<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<meta http-equiv="refresh" content="5">

<title>TitanBot</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  min-height: 100vh;

  font-family: Arial, sans-serif;

  background:
  linear-gradient(
    135deg,
    #0f172a,
    #111827,
    #020617
  );

  color: white;

  display: flex;

  justify-content: center;

  align-items: center;

  padding: 20px;
}

.container {

  width: 100%;

  max-width: 600px;

  background: rgba(31, 41, 55, 0.95);

  border-radius: 25px;

  padding: 35px 25px;

  text-align: center;

  box-shadow:
  0 20px 50px rgba(0,0,0,0.4);
}

h1 {

  font-size: 42px;

  margin-bottom: 10px;
}

h2 {

  margin-top: 25px;

  font-size: 25px;
}

p, li {

  font-size: 17px;

  line-height: 1.6;
}

ol {

  text-align: left;

  max-width: 450px;

  margin: 20px auto;
}

.codigo {

  display: inline-block;

  background: #020617;

  border: 2px solid #334155;

  border-radius: 15px;

  padding: 20px 30px;

  margin: 20px;

  font-size: 36px;

  font-weight: bold;

  letter-spacing: 7px;

  color: #ffffff;
}

.estado {

  font-size: 22px;

  margin-top: 20px;
}

</style>

</head>

<body>

<div class="container">

${contenido}

</div>

</body>

</html>
  `);

});

server.listen(PORT, () => {

  console.log(
    `🌐 TitanBot disponible en el puerto ${PORT}`
  );

});

// ==========================================
// 🤖 INICIAR BOT
// ==========================================

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

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  // ========================================
  // 🔢 CÓDIGO DE VINCULACIÓN
  // ========================================

  if (
    !state.creds.registered &&
    PAIRING_NUMBER &&
    !generandoCodigo
  ) {

    generandoCodigo = true;

    try {

      const numero =
        PAIRING_NUMBER.replace(/\D/g, "");

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
        "❌ Error generando código:",
        error
      );

      codigoVinculacion = null;

      generandoCodigo = false;
    }
  }

  // ========================================
  // 🔌 CONEXIÓN
  // ========================================

  sock.ev.on(
    "connection.update",
    (update) => {

      const {
        connection,
        lastDisconnect
      } = update;

      // ====================================
      // 🟢 CONECTADO
      // ====================================

      if (connection === "open") {

        conectado = true;

        codigoVinculacion = null;

        console.log(
          "✅ TitanBot conectado correctamente."
        );
      }

      // ====================================
      // 🔴 DESCONECTADO
      // ====================================

      if (connection === "close") {

        conectado = false;

        const codigo =
          lastDisconnect?.error?.output?.statusCode;

        console.log(
          "❌ Sesión cerrada."
        );

        if (
          codigo !== DisconnectReason.loggedOut
        ) {

          console.log(
            "🔄 Intentando conectar nuevamente..."
          );

          codigoVinculacion = null;

          generandoCodigo = false;

          setTimeout(() => {

            iniciarBot();

          }, 3000);

        } else {

          console.log(
            "❌ WhatsApp cerró la sesión."
          );

          codigoVinculacion = null;

          generandoCodigo = false;
        }
      }

    }
  );

  // ========================================
  // 💬 MENSAJES
  // ========================================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      const msg = messages[0];

      if (!msg.message) return;

      if (msg.key.fromMe) return;

      const texto =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const comando =
        texto.trim().toLowerCase();

      // ====================================
      // 🏓 PING
      // ====================================

      if (comando === ".ping") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              "🏓 Pong! TitanBot está funcionando."
          }
        );
      }

      // ====================================
      // 📋 MENÚ
      // ====================================

      else if (comando === ".menu") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: `╭━━━〔 🤖 TITANBOT 〕━━━╮
┃
┃ 👋 ¡Hola! Soy TitanBot.
┃ 📚 Aquí tienes mis comandos:
┃
┣━━〔 ⚡ GENERAL 〕━━
┃
┃ 🏓 .ping
┃ 🤖 .bot
┃ ℹ️ .info
┃ 📊 .estado
┃ 🕐 .hora
┃ 📅 .fecha
┃ 🆔 .id
┃
┣━━〔 🎮 DIVERSIÓN 〕━━
┃
┃ 🎲 .dado
┃ 🪙 .moneda
┃ 🔮 .8ball
┃ 🎯 .reto
┃ 😈 .verdad
┃
┣━━〔 🛠️ HERRAMIENTAS 〕━━
┃
┃ 🔠 .mayus texto
┃ 🔡 .minus texto
┃ 🔢 .contador texto
┃ 🧮 .calcular 2+2
┃
┣━━〔 👥 GRUPOS 〕━━
┃
┃ 👥 .grupo
┃ 👤 .miembros
┃ 👑 .admins
┃ 📜 .reglas
┃
┣━━〔 ❓ AYUDA 〕━━
┃
┃ 📋 .ayuda
┃
╰━━━━━━━━━━━━━━━━━━╯
        🤖 TitanBot`
          }
        );
      }

      // ====================================
      // 🤖 BOT
      // ====================================

      else if (comando === ".bot") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              "🤖 Soy TitanBot, un bot de WhatsApp."
          }
        );
      }

      // ====================================
      // ℹ️ INFO
      // ====================================

      else if (comando === ".info") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: `🤖 *TITANBOT*

⚡ Bot para WhatsApp
🟢 Estado: funcionando
💻 Node.js + Baileys
🚀 Servidor: Render`
          }
        );
      }

      // ====================================
      // 📊 ESTADO
      // ====================================

      else if (comando === ".estado") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: conectado
              ? "🟢 TitanBot está conectado."
              : "🔴 TitanBot está desconectado."
          }
        );
      }

      // ====================================
      // 🕐 HORA
      // ====================================

      else if (comando === ".hora") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🕐 Hora actual: ${new Date().toLocaleTimeString("es-CO")}`
          }
        );
      }

      // ====================================
      // 📅 FECHA
      // ====================================

      else if (comando === ".fecha") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `📅 Fecha: ${new Date().toLocaleDateString("es-CO")}`
          }
        );
      }

      // ====================================
      // 🆔 ID
      // ====================================

      else if (comando === ".id") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🆔 ID del chat:

${msg.key.remoteJid}`
          }
        );
      }

      // ====================================
      // 🎲 DADO
      // ====================================

      else if (comando === ".dado") {

        const numero =
          Math.floor(
            Math.random() * 6
          ) + 1;

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🎲 Salió el número: *${numero}*`
          }
        );
      }

      // ====================================
      // 🪙 MONEDA
      // ====================================

      else if (comando === ".moneda") {

        const resultado =
          Math.random() < 0.5
            ? "🪙 Cara"
            : "🪙 Sello";

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: resultado
          }
        );
      }

      // ====================================
      // 🔮 8 BALL
      // ====================================

      else if (comando === ".8ball") {

        const respuestas = [

          "🔮 Sí.",

          "🔮 No.",

          "🔮 Probablemente.",

          "🔮 No estoy seguro.",

          "🔮 Puede ser.",

          "🔮 Definitivamente.",

          "🔮 Mejor pregunta después."

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

      // ====================================
      // 🎯 RETO
      // ====================================

      else if (comando === ".reto") {

        const retos = [

          "🎯 Di algo positivo sobre alguien del grupo.",

          "🎯 Cuenta un dato curioso.",

          "🎯 Di tu comida favorita.",

          "🎯 Haz una pregunta divertida al grupo."

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

      // ====================================
      // 😈 VERDAD
      // ====================================

      else if (comando === ".verdad") {

        const preguntas = [

          "😈 ¿Cuál es tu comida favorita?",

          "😈 ¿Qué lugar te gustaría visitar?",

          "😈 ¿Cuál es tu película favorita?",

          "😈 ¿Qué habilidad te gustaría aprender?"

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

      // ====================================
      // 🔠 MAYÚSCULAS
      // ====================================

      else if (
        comando.startsWith(".mayus ")
      ) {

        const texto2 =
          texto.slice(7);

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              texto2.toUpperCase()
          }
        );
      }

      // ====================================
      // 🔡 MINÚSCULAS
      // ====================================

      else if (
        comando.startsWith(".minus ")
      ) {

        const texto2 =
          texto.slice(7);

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              texto2.toLowerCase()
          }
        );
      }

      // ====================================
      // 🔢 CONTADOR
      // ====================================

      else if (
        comando.startsWith(".contador ")
      ) {

        const texto2 =
          texto.slice(10);

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              `🔢 El texto tiene *${texto2.length}* caracteres.`
          }
        );
      }

      // ====================================
      // 🧮 CALCULADORA
      // ====================================

      else if (
        comando.startsWith(".calcular ")
      ) {

        const operacion =
          texto.slice(10);

        try {

          if (
            !/^[0-9+\-*/().\s]+$/
              .test(operacion)
          ) {

            throw new Error(
              "Operación inválida"
            );
          }

          const resultado =
            Function(
              `"use strict"; return (${operacion})`
            )();

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                `🧮 Resultado: *${resultado}*`
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

      // ====================================
      // 👥 GRUPO
      // ====================================

      else if (comando === ".grupo") {

        try {

          const metadata =
            await sock.groupMetadata(
              msg.key.remoteJid
            );

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text: `👥 *INFORMACIÓN DEL GRUPO*

📌 Nombre: ${metadata.subject}
👤 Miembros: ${metadata.participants.length}`
            }
          );

        } catch {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ Este comando solo funciona en grupos."
            }
          );
        }
      }

      // ====================================
      // 👤 MIEMBROS
      // ====================================

      else if (comando === ".miembros") {

        try {

          const metadata =
            await sock.groupMetadata(
              msg.key.remoteJid
            );

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                `👥 Este grupo tiene *${metadata.participants.length} miembros*.`
            }
          );

        } catch {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ Este comando solo funciona en grupos."
            }
          );
        }
      }

      // ====================================
      // 👑 ADMINS
      // ====================================

      else if (comando === ".admins") {

        try {

          const metadata =
            await sock.groupMetadata(
              msg.key.remoteJid
            );

          const admins =
            metadata.participants
              .filter(
                p => p.admin
              )
              .map(
                p => `@${p.id.split("@")[0]}`
              )
              .join("\n");

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text: `👑 *ADMINISTRADORES*

${admins || "No encontrados."}`
            }
          );

        } catch {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "❌ Este comando solo funciona en grupos."
            }
          );
        }
      }

      // ====================================
      // 📜 REGLAS
      // ====================================

      else if (comando === ".reglas") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text: `📜 *REGLAS DEL GRUPO*

1️⃣ Respeta a los demás.
2️⃣ No hagas spam.
3️⃣ No compartas contenido inapropiado.
4️⃣ Mantén el orden del grupo.
5️⃣ Diviértete responsablemente.`
          }
        );
      }

      // ====================================
      // ❓ AYUDA
      // ====================================

      else if (comando === ".ayuda") {

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            text:
              "❓ Escribe *.menu* para ver todos los comandos disponibles."
          }
        );
      }

    }
  );
}

// ==========================================
// 🚀 INICIAR
// ==========================================

iniciarBot();
