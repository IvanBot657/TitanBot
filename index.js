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

const PAIRING_NUMBER =
  process.env.PAIRING_NUMBER || "";

let codigoVinculacion = null;
let conectado = false;
let solicitandoCodigo = false;
let reconectando = false;

// ==========================================
// 👤 SISTEMA DE PERFILES
// ==========================================

const perfiles = {};
const perfilesEnProceso = {};
const personajesReclamados = {};

// ==========================================
// 🌐 SERVIDOR WEB
// ==========================================

const server = http.createServer(
  (req, res) => {

    res.writeHead(
      200,
      {
        "Content-Type":
          "text/html; charset=utf-8"
      }
    );

    let contenido = "";

    if (conectado) {

      contenido = `
        <h1>🟢 TitanBot conectado</h1>
        <p>
          El bot está conectado correctamente
          a WhatsApp.
        </p>
      `;

    } else if (codigoVinculacion) {

      contenido = `
        <h1>🤖 TitanBot</h1>

        <h2>🔐 Código de vinculación</h2>

        <div class="codigo">
          ${codigoVinculacion}
        </div>

        <p>
          Abre WhatsApp en tu teléfono.
        </p>

        <p>
          Ve a
          <b>Dispositivos vinculados</b>.
        </p>

        <p>
          Selecciona
          <b>Vincular un dispositivo</b>.
        </p>

        <p>
          Elige
          <b>Vincular con número de teléfono</b>.
        </p>

        <p>
          Introduce el código mostrado arriba.
        </p>
      `;

    } else {

      contenido = `
        <h1>🤖 TitanBot</h1>

        <h2>
          ⏳ Preparando vinculación...
        </h2>

        <p>
          Espera unos segundos.
        </p>
      `;
    }

    res.end(`
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width,
          initial-scale=1.0"
        >

        <meta
          http-equiv="refresh"
          content="5"
        >

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

          .codigo {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            margin: 30px;
            padding: 20px;
            border: 2px solid white;
            border-radius: 12px;
            display: inline-block;
          }

        </style>

      </head>

      <body>

        ${contenido}

      </body>

      </html>
    `);
  }
);

// ==========================================
// 🌐 INICIAR SERVIDOR
// ==========================================

server.listen(
  PORT,
  () => {

    console.log(
      `🌐 Servidor iniciado en el puerto ${PORT}`
    );

  }
);

// ==========================================
// 🤖 INICIAR TITANBOT
// ==========================================

async function iniciarBot() {

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      "auth_info"
    );

    const sock = makeWASocket({

      auth: state,

      logger: P({
        level: "silent"
      }),

      printQRInTerminal: false

    });

    // ======================================
    // 💾 GUARDAR CREDENCIALES
    // ======================================

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    // ======================================
    // 🔌 ESTADO DE CONEXIÓN
    // ======================================

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect
        } = update;

        // ----------------------------------
        // 🟡 CONECTANDO
        // ----------------------------------

        if (
          connection === "connecting"
        ) {

          console.log(
            "🟡 Conectando TitanBot a WhatsApp..."
          );

          if (
            !state.creds.registered &&
            PAIRING_NUMBER &&
            !solicitandoCodigo
          ) {

            solicitandoCodigo = true;

            try {

              await new Promise(
                resolve =>
                  setTimeout(
                    resolve,
                    3000
                  )
              );

              const numero =
                PAIRING_NUMBER
                  .replace(/\D/g, "");

              console.log(
                "🔢 Generando código de vinculación..."
              );

              codigoVinculacion =
                await sock.requestPairingCode(
                  numero
                );

              console.log(
                "🔢 Código de vinculación:",
                codigoVinculacion
              );

            } catch (error) {

              console.error(
                "❌ Error generando código:"
              );

              console.error(error);

              codigoVinculacion =
                null;

              solicitandoCodigo =
                false;
            }
          }
        }

        // ----------------------------------
        // 🟢 CONECTADO
        // ----------------------------------

        if (
          connection === "open"
        ) {

          conectado = true;

          codigoVinculacion =
            null;

          solicitandoCodigo =
            false;

          reconectando =
            false;

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

        // ----------------------------------
        // 🔴 DESCONECTADO
        // ----------------------------------

        if (
          connection === "close"
        ) {

          conectado = false;

          codigoVinculacion =
            null;

          solicitandoCodigo =
            false;

          const codigo =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          console.log(
            "❌ Sesión cerrada."
          );

          console.log(
            "Código:",
            codigo
          );

          if (
            codigo !==
              DisconnectReason.loggedOut &&
            !reconectando
          ) {

            reconectando =
              true;

            console.log(
              "🔄 Reconectando en 3 segundos..."
            );

            setTimeout(
              () => {

                reconectando =
                  false;

                iniciarBot();

              },
              3000
            );

          } else if (
            codigo ===
            DisconnectReason.loggedOut
          ) {

            console.log(
              "❌ WhatsApp cerró la sesión."
            );

            console.log(
              "ℹ️ Será necesario volver a vincular el bot."
            );
          }
        }

      }
    );

     // ======================================
    // 💬 SISTEMA DE MENSAJES
    // ======================================

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {

        try {

          const msg = messages[0];

          if (!msg || !msg.message) {
            return;
          }

          if (msg.key.fromMe) {
            return;
          }

          const remoteJid =
            msg.key.remoteJid;

          if (!remoteJid) {
            return;
          }

          // ==================================
          // 📝 OBTENER TEXTO DEL MENSAJE
          // ==================================

          const tipoMensaje =
            Object.keys(msg.message)[0];

          let texto = "";

          if (
            tipoMensaje ===
            "conversation"
          ) {

            texto =
              msg.message.conversation ||
              "";

          } else if (
            tipoMensaje ===
            "extendedTextMessage"
          ) {

            texto =
              msg.message
                ?.extendedTextMessage
                ?.text ||
              "";
          }

          if (!texto) {
            return;
          }

          texto = texto.trim();

          // ==================================
          // 📝 RESPUESTAS DE COMPLETAR PERFIL
          // ==================================

          const numeroPerfil =
            remoteJid.replace(
              "@s.whatsapp.net",
              ""
            );

          if (
            perfilesEnProceso[
              numeroPerfil
            ] &&
            !texto.startsWith(".")
          ) {

            const proceso =
              perfilesEnProceso[
                numeroPerfil
              ];

            // ------------------------------
            // 👤 NOMBRE
            // ------------------------------

            if (
              proceso.paso === 1
            ) {

              proceso.datos.nombre =
                texto;

              proceso.paso = 2;

              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "🎂 Ahora escribe tu *edad*."
                }
              );

              return;
            }

            // ------------------------------
            // 🎂 EDAD
            // ------------------------------

            if (
              proceso.paso === 2
            ) {

              proceso.datos.edad =
                texto;

              proceso.paso = 3;

              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "🎉 Ahora escribe tu *cumpleaños*.\n\nEjemplo: 15/08/2010"
                }
              );

              return;
            }

            // ------------------------------
            // 🎉 CUMPLEAÑOS
            // ------------------------------

            if (
              proceso.paso === 3
            ) {

              proceso.datos.cumpleanos =
                texto;

              proceso.paso = 4;

              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "💬 Ahora escribe tu *frase favorita*."
                }
              );

              return;
            }

            // ------------------------------
            // 💬 FRASE
            // ------------------------------

            if (
              proceso.paso === 4
            ) {

              proceso.datos.frase =
                texto;

              perfiles[
                numeroPerfil
              ] =
                proceso.datos;

              delete perfilesEnProceso[
                numeroPerfil
              ];

              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    `╭━━〔 ✅ PERFIL COMPLETADO 〕━━╮
┃
┃ 👤 Nombre: ${proceso.datos.nombre}
┃ 🎂 Edad: ${proceso.datos.edad}
┃ 🎉 Cumpleaños: ${proceso.datos.cumpleanos}
┃ 💬 Frase: ${proceso.datos.frase}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

Ahora puedes usar:
.id`
                }
              );

              return;
            }
          }

          // ==================================
          // 🚫 IGNORAR MENSAJES SIN COMANDO
          // ==================================

          if (
            !texto.startsWith(".")
          ) {
            return;
          }

          // ==================================
          // ⚙️ SEPARAR COMANDO
          // ==================================

          const partes =
            texto.split(/\s+/);

          const comando =
            partes[0].toLowerCase();

          const argumento =
            partes
              .slice(1)
              .join(" ");

          // ==================================
          // 🏓 PING
          // ==================================

          if (
            comando === ".ping"
          ) {

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

          else if (
            comando === ".menu"
          ) {

            await sock.sendMessage(
              remoteJid,
              {
                text:
`╭━━━〔 🤖 TITANBOT 〕━━━╮
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
┣━━〔 👤 PERFIL 〕━━
┃
┃ 🆔 .id
┃ 📝 .completarperfil
┃
┣━━〔 🎴 ANIME 〕━━
┃
┃ 🎴 .s
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

          else if (
            comando === ".bot"
          ) {

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

          else if (
            comando === ".info"
          ) {

            await sock.sendMessage(
              remoteJid,
              {
                text:
`🤖 *TITANBOT*

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

          else if (
            comando === ".estado"
          ) {

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  conectado
                    ? "🟢 TitanBot está conectado."
                    : "🔴 TitanBot está desconectado."
              }
            );
          }

          // ==================================
          // 🕐 HORA
          // ==================================

          else if (
            comando === ".hora"
          ) {

            const hora =
              new Intl.DateTimeFormat(
                "es-CO",
                {
                  timeZone:
                    "America/Bogota",
                  hour:
                    "2-digit",
                  minute:
                    "2-digit",
                  second:
                    "2-digit"
                }
              ).format(
                new Date()
              );

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  `🕐 Hora de Colombia: ${hora}`
              }
            );
          }

          // ==================================
          // 📅 FECHA
          // ==================================

          else if (
            comando === ".fecha"
          ) {

            const fecha =
              new Intl.DateTimeFormat(
                "es-CO",
                {
                  timeZone:
                    "America/Bogota",
                  day:
                    "2-digit",
                  month:
                    "2-digit",
                  year:
                    "numeric"
                }
              ).format(
                new Date()
              );

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  `📅 Fecha: ${fecha}`
              }
            );
          }

          // ==================================
          // 🆔 ID
          // ==================================

          else if (
            comando === ".id"
          ) {

            const numero =
              remoteJid.replace(
                "@s.whatsapp.net",
                ""
              );

            const perfil =
              perfiles[numero];

            if (!perfil) {

              await sock.sendMessage(
                remoteJid,
                {
                  text:
`╭━━━〔 👤 PERFIL 〕━━━╮
┃
┃ 🆔 ID: ${numero}
┃
┃ ❌ Perfil incompleto.
┃
┃ Usa:
┃ .completarperfil
┃
╰━━━━━━━━━━━━━━━━━━╯`
                }
              );

              return;
            }

            await sock.sendMessage(
              remoteJid,
              {
                text:
`╭━━━〔 👤 PERFIL 〕━━━╮
┃
┃ 👤 Nombre: ${perfil.nombre}
┃ 🆔 ID: ${numero}
┃ 🎂 Edad: ${perfil.edad}
┃ 🎉 Cumpleaños: ${perfil.cumpleanos}
┃ 💬 Frase: ${perfil.frase}
┃
╰━━━━━━━━━━━━━━━━━━╯
        🤖 TitanBot`
              }
            );
          }

          // ==================================
          // 📝 COMPLETAR PERFIL
          // ==================================

          else if (
            comando === ".completarperfil"
          ) {

            perfilesEnProceso[
              numeroPerfil
            ] = {
              paso: 1,
              datos: {}
            };

            await sock.sendMessage(
              remoteJid,
              {
                text:
`📝 *COMPLETAR PERFIL*

Vamos a crear tu perfil.

👤 Escribe tu *nombre*.`
              }
            );
          }

                  else if (comando === ".dado") {
            const numero = Math.floor(Math.random() * 6) + 1;

            await sock.sendMessage(
              remoteJid,
              {
                text: `🎲 *DADO*

🎯 Resultado: *${numero}*`
              }
            );
          }

          else if (comando === ".moneda") {
            const resultado =
              Math.random() < 0.5
                ? "🟡 CARA"
                : "⚪ SELLO";

            await sock.sendMessage(
              remoteJid,
              {
                text: `🪙 *MONEDA*

🎯 Resultado: *${resultado}*`
              }
            );
          }

          else if (comando === ".8ball") {
            const respuestas = [
              "🔮 Sí, definitivamente.",
              "🔮 Todo apunta a que sí.",
              "🔮 Puede ser.",
              "🔮 No estoy seguro.",
              "🔮 Mejor no.",
              "🔮 Las probabilidades son bajas.",
              "🔮 Pregunta nuevamente más tarde."
            ];

            const respuesta =
              respuestas[
                Math.floor(Math.random() * respuestas.length)
              ];

            await sock.sendMessage(
              remoteJid,
              {
                text: `🔮 *8 BALL*

${respuesta}`
              }
            );
          }

          else if (comando === ".reto") {
            const retos = [
              "🎯 Di algo positivo sobre una persona del grupo.",
              "🎯 Cuenta un dato curioso que conozcas.",
              "🎯 Escribe una frase usando solo emojis.",
              "🎯 Di cuál es tu juego favorito.",
              "🎯 Cuenta cuál fue tu última película favorita."
            ];

            const reto =
              retos[
                Math.floor(Math.random() * retos.length)
              ];

            await sock.sendMessage(
              remoteJid,
              {
                text: `🎯 *RETO*

${reto}`
              }
            );
          }

          else if (comando === ".verdad") {
            const preguntas = [
              "😈 ¿Cuál es tu juego favorito?",
              "😈 ¿Qué canción escuchas más últimamente?",
              "😈 ¿Cuál es tu comida favorita?",
              "😈 ¿Qué lugar te gustaría visitar?",
              "😈 ¿Cuál es tu película o serie favorita?"
            ];

            const pregunta =
              preguntas[
                Math.floor(Math.random() * preguntas.length)
              ];

            await sock.sendMessage(
              remoteJid,
              {
                text: `😈 *VERDAD*

${pregunta}`
              }
            );
          }

          else if (comando === ".mayus") {
            if (!argumentos) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "🔠 Escribe algo después del comando.\n\nEjemplo: *.mayus hola mundo*"
                }
              );
              return;
            }

            await sock.sendMessage(
              remoteJid,
              {
                text: `🔠 *MAYÚSCULAS*

${argumentos.toUpperCase()}`
              }
            );
          }

          else if (comando === ".minus") {
            if (!argumentos) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "🔡 Escribe algo después del comando.\n\nEjemplo: *.minus HOLA MUNDO*"
                }
              );
              return;
            }

            await sock.sendMessage(
              remoteJid,
              {
                text: `🔡 *MINÚSCULAS*

${argumentos.toLowerCase()}`
              }
            );
          }

          else if (comando === ".contador") {
            if (!argumentos) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "🔢 Escribe un texto después del comando.\n\nEjemplo: *.contador hola mundo*"
                }
              );
              return;
            }

            const caracteres = argumentos.length;
            const palabras =
              argumentos
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .length;

            await sock.sendMessage(
              remoteJid,
              {
                text:
`🔢 *CONTADOR*

📝 Texto: ${argumentos}

🔤 Caracteres: *${caracteres}*
📚 Palabras: *${palabras}*`
              }
            );
          }

          else if (comando === ".calcular") {
            if (!argumentos) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "🧮 Escribe una operación.\n\nEjemplo: *.calcular 25+15*"
                }
              );
              return;
            }

            try {
              const operacion = argumentos
                .replace(/[^0-9+\-*/().% ]/g, "");

              if (!operacion.trim()) {
                throw new Error("Operación inválida");
              }

              const resultado = Function(
                `"use strict"; return (${operacion})`
              )();

              await sock.sendMessage(
                remoteJid,
                {
                  text:
`🧮 *CALCULADORA*

📌 Operación: ${operacion}
✅ Resultado: *${resultado}*`
                }
              );
            } catch (error) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "❌ No pude calcular esa operación."
                }
              );
            }
          }

          else if (comando === ".s") {
            const personajes = [
              "Naruto Uzumaki",
              "Goku",
              "Luffy",
              "Tanjiro Kamado",
              "Gojo Satoru",
              "Saitama",
              "Levi Ackerman",
              "Ichigo Kurosaki"
            ];

            if (!personajesReclamados[numeroPerfil]) {
              const personaje =
                personajes[
                  Math.floor(Math.random() * personajes.length)
                ];

              personajesReclamados[numeroPerfil] = personaje;
            }

            const personaje =
              personajesReclamados[numeroPerfil];

            await sock.sendMessage(
              remoteJid,
              {
                text:
`╭━━━〔 🎴 ANIME CARD 〕━━━╮
┃
┃ 👤 *ID:* ${numeroPerfil}
┃ 🏷️ *Nombre:* ${perfiles[numeroPerfil]?.nombre || "Sin registrar"}
┃
┃ 🎴 *Personaje:* ${personaje}
┃
┃ 🟢 *Estado:* LIBRE
┃
╰━━━━━━━━━━━━━━━━━━━━╯
        ⚔️ TITANBOT`
              }
            );
          }

          else if (
            comando === ".admins"
          ) {
            if (!remoteJid.endsWith("@g.us")) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "👑 Este comando solo funciona en grupos."
                }
              );
              return;
            }

            const metadata =
              await sock.groupMetadata(remoteJid);

            const admins =
              metadata.participants.filter(
                participante =>
                  participante.admin === "admin" ||
                  participante.admin === "superadmin"
              );

            let textoAdmins =
              "👑 *ADMINISTRADORES*\n\n";

            for (const admin of admins) {
              textoAdmins +=
                `• @${admin.id.split("@")[0]}\n`;
            }

            await sock.sendMessage(
              remoteJid,
              {
                text: textoAdmins,
                mentions: admins.map(admin => admin.id)
              }
            );
          }

          else if (
            comando === ".miembros"
          ) {
            if (!remoteJid.endsWith("@g.us")) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "👥 Este comando solo funciona en grupos."
                }
              );
              return;
            }

            const metadata =
              await sock.groupMetadata(remoteJid);

            await sock.sendMessage(
              remoteJid,
              {
                text:
`👥 *MIEMBROS DEL GRUPO*

📌 Grupo: *${metadata.subject}*
👤 Miembros: *${metadata.participants.length}*`
              }
            );
          }

          else if (
            comando === ".grupo"
          ) {
            if (!remoteJid.endsWith("@g.us")) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
                    "👥 Este comando solo funciona en grupos."
                }
              );
              return;
            }

            const metadata =
              await sock.groupMetadata(remoteJid);

            await sock.sendMessage(
              remoteJid,
              {
                text:
`👥 *INFORMACIÓN DEL GRUPO*

📛 Nombre: *${metadata.subject}*
👤 Miembros: *${metadata.participants.length}*
🆔 ID:
${remoteJid}`
              }
            );
              }

                  else if (
            comando === ".reglas"
          ) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
`📜 *REGLAS DEL GRUPO*

1️⃣ Respeta a los demás.
2️⃣ No hagas spam.
3️⃣ No compartas contenido inapropiado.
4️⃣ Mantén el orden del grupo.
5️⃣ Diviértete responsablemente.

🤖 TitanBot`
              }
            );
          }

          else if (
            comando === ".ayuda"
          ) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
`❓ *AYUDA TITANBOT*

📋 Escribe *.menu* para ver todos los comandos.

También puedes responder directamente a un mensaje enviado por TitanBot y el bot responderá automáticamente. 🤖`
              }
            );
          }

          else {
            await sock.sendMessage(
              remoteJid,
              {
                text:
`❌ *COMANDO NO RECONOCIDO*

No conozco el comando:
*${comando}*

📋 Escribe *.menu* para ver los comandos disponibles.`
              }
            );
          }

        }
      } catch (error) {
        console.error(
          "❌ Error procesando mensaje:",
          error
        );
      }
    }
  );

  }

// Iniciar TitanBot
iniciarBot();

console.log("🚀 TitanBot iniciado correctamente.");
console.log("📱 Sistema de vinculación por número activo.");
console.log("🤖 Esperando conexión con WhatsApp...");
