const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

// ==========================================
// ⚙️ CONFIGURACIÓN
// ==========================================

const PORT = process.env.PORT || 3000;
const PAIRING_NUMBER = process.env.PAIRING_NUMBER || "";

let codigoVinculacion = null;
let conectado = false;
let solicitandoCodigo = false;
let reconectando = false;

// ==========================================
// 🌐 SERVIDOR WEB PARA RENDER
// ==========================================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
  });

  let contenido = "";

  if (conectado) {
    contenido = `
      <h1>🟢 TitanBot conectado</h1>
      <p>El bot está conectado correctamente a WhatsApp.</p>
    `;
  } else if (codigoVinculacion) {
    contenido = `
      <h1>🤖 TitanBot</h1>
      <h2>🔐 Código de vinculación</h2>

      <div style="
        font-size:32px;
        font-weight:bold;
        letter-spacing:6px;
        margin:20px;
      ">
        ${codigoVinculacion}
      </div>

      <p>Abre WhatsApp en tu teléfono.</p>
      <p>Ve a <b>Dispositivos vinculados</b>.</p>
      <p>Selecciona <b>Vincular un dispositivo</b>.</p>
      <p>Elige <b>Vincular con número de teléfono</b>.</p>
      <p>Introduce el código mostrado arriba.</p>
    `;
  } else {
    contenido = `
      <h1>🤖 TitanBot</h1>
      <h2>⏳ Preparando vinculación...</h2>
      <p>Espera unos segundos.</p>
    `;
  }

  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="5">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TitanBot</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #111;
            color: white;
            text-align: center;
            padding: 40px 20px;
          }

          h1 {
            font-size: 32px;
          }

          h2 {
            margin-top: 30px;
          }

          p {
            font-size: 18px;
            line-height: 1.6;
          }
        </style>
      </head>

      <body>
        ${contenido}
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor iniciado en el puerto ${PORT}`);
});

// ==========================================
// 🤖 INICIAR BOT
// ==========================================

async function iniciarBot() {
  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("auth_info");

    const sock = makeWASocket({
      auth: state,
      logger: P({ level: "silent" }),
      printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    // ======================================
    // 🔌 CONEXIÓN
    // ======================================

    sock.ev.on("connection.update", async (update) => {
      const {
        connection,
        lastDisconnect
      } = update;

      // --------------------------------------
      // 🟡 CONECTANDO
      // --------------------------------------

      if (connection === "connecting") {
        console.log("🟡 Conectando TitanBot a WhatsApp...");

        if (
          !state.creds.registered &&
          PAIRING_NUMBER &&
          !solicitandoCodigo
        ) {
          solicitandoCodigo = true;

          try {
            await new Promise(resolve =>
              setTimeout(resolve, 3000)
            );

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
              "❌ Error generando código de vinculación:"
            );

            console.error(error);

            codigoVinculacion = null;
            solicitandoCodigo = false;
          }
        }
      }

      // --------------------------------------
      // 🟢 CONECTADO
      // --------------------------------------

      if (connection === "open") {
        conectado = true;
        codigoVinculacion = null;
        solicitandoCodigo = false;
        reconectando = false;

        console.log(
          "===================================="
        );

        console.log(
          "✅ TITANBOT CONECTADO"
        );

        console.log(
          "===================================="
        );
      }

      // --------------------------------------
      // 🔴 DESCONECTADO
      // --------------------------------------

      if (connection === "close") {
        conectado = false;
        codigoVinculacion = null;
        solicitandoCodigo = false;

        const codigo =
          lastDisconnect?.error?.output?.statusCode;

        console.log("❌ Sesión cerrada.");
        console.log("Código:", codigo);

        if (
          codigo !== DisconnectReason.loggedOut &&
          !reconectando
        ) {
          reconectando = true;

          console.log(
            "🔄 Reconectando en 3 segundos..."
          );

          setTimeout(() => {
            reconectando = false;
            iniciarBot();
          }, 3000);

        } else if (
          codigo === DisconnectReason.loggedOut
        ) {
          console.log(
            "❌ WhatsApp cerró la sesión."
          );

          console.log(
            "ℹ️ Será necesario volver a vincular el bot."
          );
        }
      }
    });

    // ======================================
    // 💬 MENSAJES
    // ======================================

    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const msg = messages[0];

        if (!msg || !msg.message) {
          return;
        }

        if (msg.key.fromMe) {
          return;
        }

        const remoteJid = msg.key.remoteJid;

        if (!remoteJid) {
          return;
        }

        const tipoMensaje =
          Object.keys(msg.message)[0];

        let texto = "";

        if (
          tipoMensaje === "conversation"
        ) {
          texto =
            msg.message.conversation || "";

        } else if (
          tipoMensaje === "extendedTextMessage"
        ) {
          texto =
            msg.message.extendedTextMessage?.text || "";
        }

        if (!texto) {
          return;
        }

        texto = texto.trim();

        if (!texto.startsWith(".")) {
          return;
        }

        const partes = texto.split(/\s+/);

        const comando =
          partes[0].toLowerCase();

        const argumento =
          partes.slice(1).join(" ");

        // ==================================
        // 🏓 PING
        // ==================================

        if (comando === ".ping") {

          await sock.sendMessage(
            remoteJid,
            {
              text:
                "🏓 Pong! TitanBot está funcionando."
            }
          );
        }

        // ==================================
        // 📋 MENU
        // ==================================

        else if (comando === ".menu") {

          await sock.sendMessage(
            remoteJid,
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

        // ==================================
        // 🤖 BOT
        // ==================================

        else if (comando === ".bot") {

          await sock.sendMessage(
            remoteJid,
            {
              text:
                "🤖 Soy TitanBot, un bot de WhatsApp."
            }
          );
        }

        // ==================================
        // ℹ️ INFO
        // ==================================

        else if (comando === ".info") {

          await sock.sendMessage(
            remoteJid,
            {
              text: `🤖 *TITANBOT*

⚙️ Plataforma: Node.js
📦 Librería: Baileys
☁️ Servidor: Render
📱 Plataforma: WhatsApp

🚀 TitanBot está activo.`
            }
          );
        }

        // ==================================
        // 📊 ESTADO
        // ==================================

        else if (comando === ".estado") {

          await sock.sendMessage(
            remoteJid,
            {
              text: conectado
                ? "🟢 TitanBot está conectado."
                : "🔴 TitanBot está desconectado."
            }
          );
        }

        // ==================================
        // 🕐 HORA
        // ==================================

        else if (comando === ".hora") {

          const hora =
            new Intl.DateTimeFormat(
              "es-CO",
              {
                timeZone: "America/Bogota",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              }
            ).format(new Date());

          await sock.sendMessage(
            remoteJid,
            {
              text: `🕐 Hora de Colombia: ${hora}`
            }
          );
        }

        // ==================================
        // 📅 FECHA
        // ==================================

        else if (comando === ".fecha") {

          const fecha =
            new Intl.DateTimeFormat(
              "es-CO",
              {
                timeZone: "America/Bogota",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              }
            ).format(new Date());

          await sock.sendMessage(
            remoteJid,
            {
              text: `📅 Fecha: ${fecha}`
            }
          );
        }

        // ==================================
        // 🆔 ID
        // ==================================

        else if (comando === ".id") {

          await sock.sendMessage(
            remoteJid,
            {
              text:
                `🆔 ID del chat:\n${remoteJid}`
            }
          );
        }

        // ==================================
        // 🎲 DADO
        // ==================================

        else if (comando === ".dado") {

          const numero =
            Math.floor(Math.random() * 6) + 1;

          await sock.sendMessage(
            remoteJid,
            {
              text:
                `🎲 El dado cayó en: *${numero}*`
            }
          );
        }

        // ==================================
        // 🪙 MONEDA
        // ==================================

        else if (comando === ".moneda") {

          const resultado =
            Math.random() < 0.5
              ? "Cara"
              : "Sello";

          await sock.sendMessage(
            remoteJid,
            {
              text:
                `🪙 Salió: *${resultado}*`
            }
          );
        }

        // ==================================
        // 🔮 8 BALL
        // ==================================

        else if (comando === ".8ball") {

          const respuestas = [
            "🔮 Sí, probablemente.",
            "🔮 No parece buena idea.",
            "🔮 Puede ser.",
            "🔮 Definitivamente sí.",
            "🔮 Definitivamente no.",
            "🔮 Pregunta nuevamente.",
            "🔮 Todo apunta a que sí.",
            "🔮 Es difícil saberlo."
          ];

          const respuesta =
            respuestas[
              Math.floor(
                Math.random() *
                respuestas.length
              )
            ];

          await sock.sendMessage(
            remoteJid,
            {
              text: respuesta
            }
          );
        }

        // ==================================
        // 🎯 RETO
        // ==================================

        else if (comando === ".reto") {

          const retos = [
            "🎯 Di un dato curioso.",
            "🎯 Di algo positivo sobre alguien del grupo.",
            "🎯 Cuenta cuál es tu comida favorita.",
            "🎯 Comparte una recomendación de película.",
            "🎯 Di una habilidad que te gustaría aprender."
          ];

          const reto =
            retos[
              Math.floor(
                Math.random() *
                retos.length
              )
            ];

          await sock.sendMessage(
            remoteJid,
            {
              text: reto
            }
          );
        }

        // ==================================
        // 😈 VERDAD
        // ==================================

        else if (comando === ".verdad") {

          const preguntas = [
            "😈 ¿Cuál es tu comida favorita?",
            "😈 ¿Qué lugar te gustaría visitar?",
            "😈 ¿Cuál es tu película favorita?",
            "😈 ¿Qué habilidad te gustaría aprender?",
            "😈 ¿Cuál es tu pasatiempo favorito?"
          ];

          const pregunta =
            preguntas[
              Math.floor(
                Math.random() *
                preguntas.length
              )
            ];

          await sock.sendMessage(
            remoteJid,
            {
              text: pregunta
            }
          );
        }

        // ==================================
        // 🔠 MAYÚSCULAS
        // ==================================

        else if (comando === ".mayus") {

          if (!argumento) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "🔠 Escribe un texto después del comando."
              }
            );

            return;
          }

          await sock.sendMessage(
            remoteJid,
            {
              text:
                argumento.toUpperCase()
            }
          );
        }

        // ==================================
        // 🔡 MINÚSCULAS
        // ==================================

        else if (comando === ".minus") {

          if (!argumento) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "🔡 Escribe un texto después del comando."
              }
            );

            return;
          }

          await sock.sendMessage(
            remoteJid,
            {
              text:
                argumento.toLowerCase()
            }
          );
        }

        // ==================================
        // 🔢 CONTADOR
        // ==================================

        else if (comando === ".contador") {

          if (!argumento) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "🔢 Escribe un texto después del comando."
              }
            );

            return;
          }

          const cantidad =
            argumento.length;

          await sock.sendMessage(
            remoteJid,
            {
              text:
                `🔢 El texto tiene *${cantidad} caracteres*.`
            }
          );
        }

        // ==================================
        // 🧮 CALCULADORA
        // ==================================

        else if (comando === ".calcular") {

          if (!argumento) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "🧮 Ejemplo: *.calcular 2+2*"
              }
            );

            return;
          }

          if (
            !/^[0-9+\-*/().\s]+$/.test(
              argumento
            )
          ) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "❌ Solo se permiten operaciones matemáticas."
              }
            );

            return;
          }

          try {

            const resultado =
              Function(
                `"use strict"; return (${argumento})`
              )();

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  `🧮 Resultado: *${resultado}*`
              }
            );

          } catch {

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "❌ No pude calcular esa operación."
              }
            );
          }
        }

        // ==================================
        // 👥 GRUPO
        // ==================================

        else if (comando === ".grupo") {

          if (!remoteJid.endsWith("@g.us")) {

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "❌ Este comando solo funciona en grupos."
              }
            );

            return;
          }

          const metadata =
            await sock.groupMetadata(
              remoteJid
            );

          await sock.sendMessage(
            remoteJid,
            {
              text:
                `👥 *INFORMACIÓN DEL GRUPO*

📌 Nombre: ${metadata.subject}
👤 Miembros: ${metadata.participants.length}`
            }
          );
        }

        // ==================================
        // 👤 MIEMBROS
        // ==================================

        else if (comando === ".miembros") {

          if (!remoteJid.endsWith("@g.us")) {

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "❌ Este comando solo funciona en grupos."
              }
            );

            return;
          }

          const metadata =
            await sock.groupMetadata(
              remoteJid
            );

          await sock.sendMessage(
            remoteJid,
            {
              text:
                `👤 Este grupo tiene *${metadata.participants.length} miembros*.`
            }
          );
        }

        // ==================================
        // 👑 ADMINS
        // ==================================

        else if (comando === ".admins") {

          if (!remoteJid.endsWith("@g.us")) {

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "❌ Este comando solo funciona en grupos."
              }
            );

            return;
          }

          const metadata =
            await sock.groupMetadata(
              remoteJid
            );

          const admins =
            metadata.participants.filter(
              participante =>
                participante.admin
            );

          if (admins.length === 0) {

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "👑 No encontré administradores."
              }
            );

            return;
          }

          let textoAdmins =
            "👑 *ADMINISTRADORES DEL GRUPO*\n\n";

          for (const admin of admins) {

            textoAdmins +=
              `• @${admin.id.split("@")[0]}\n`;
          }

          await sock.sendMessage(
            remoteJid,
            {
              text: textoAdmins,
              mentions: admins.map(
                admin => admin.id
              )
            }
          );
        }

        // ==================================
        // 📜 REGLAS
        // ==================================

        else if (comando === ".reglas") {

          await sock.sendMessage(
            remoteJid,
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

        // ==================================
        // ❓ AYUDA
        // ==================================

        else if (comando === ".ayuda") {

          await sock.sendMessage(
            remoteJid,
            {
              text:
                "❓ Escribe *.menu* para ver todos los comandos disponibles."
            }
          );
        }

      } catch (error) {

        console.error(
          "❌ Error procesando mensaje:",
          error
        );
      }
    });

  } catch (error) {

    console.error(
      "❌ Error iniciando TitanBot:",
      error
    );

    if (!reconectando) {

      reconectando = true;

      setTimeout(() => {
        reconectando = false;
        iniciarBot();
      }, 5000);
    }
  }
}

// ==========================================
// 🚀 INICIAR TITANBOT
// ==========================================

iniciarBot();
