const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");

const PORT = process.env.PORT || 3000;
const PAIRING_NUMBER = process.env.PAIRING_NUMBER || "";

let codigoVinculacion = null;
let conectado = false;
let solicitandoCodigo = false;
let reconectando = false;

// ===============================
// PERFILES
// ===============================

const perfiles = {};
const perfilesEnProceso = {};
const personajesReclamados = {};

// ===============================
// SERVIDOR WEB PARA RENDER
// ===============================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
  });

  res.end(`
    <html>
      <head>
        <title>TitanBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family:Arial;text-align:center;padding:40px;background:#111;color:white;">
        <h1>🤖 TitanBot</h1>
        <h2>${conectado ? "🟢 Conectado" : "🟡 Conectando..."}</h2>

        ${
          codigoVinculacion
            ? `<p>🔢 Código de vinculación:</p>
               <h1 style="letter-spacing:8px;">${codigoVinculacion}</h1>
               <p>WhatsApp → Dispositivos vinculados → Vincular con número de teléfono</p>`
            : ""
        }
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor web activo en el puerto ${PORT}`);
});

// ===============================
// INICIAR BOT
// ===============================

async function iniciarBot() {
  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("auth_info");

    let version;

    try {
      const latest = await fetchLatestBaileysVersion();
      version = latest.version;
      console.log("📦 Versión de WhatsApp:", version);
    } catch (error) {
      console.log("⚠️ No se pudo obtener la versión más reciente.");
    }

    const sock = makeWASocket({
      auth: state,
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      ...(version ? { version } : {})
    });

    sock.ev.on("creds.update", saveCreds);

    // ===============================
    // CONEXIÓN
    // ===============================

    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect
        } = update;

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
                setTimeout(resolve, 5000)
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
                "❌ Error generando código:"
              );
              console.error(error);

              codigoVinculacion = null;
              solicitandoCodigo = false;
            }
          }
        }

        if (connection === "open") {
          conectado = true;
          codigoVinculacion = null;
          solicitandoCodigo = false;
          reconectando = false;

          console.log("================================");
          console.log("🟢 TITANBOT CONECTADO");
          console.log("🤖 WhatsApp conectado correctamente");
          console.log("================================");
        }

        if (connection === "close") {
          conectado = false;

          const statusCode =
            lastDisconnect?.error?.output?.statusCode;

          const loggedOut =
            statusCode === DisconnectReason.loggedOut;

          console.log(
            "🔴 Conexión cerrada."
          );

          if (loggedOut) {
            console.log(
              "❌ La sesión fue cerrada desde WhatsApp."
            );
            return;
          }

          if (!reconectando) {
            reconectando = true;

            console.log(
              "🔄 Intentando reconectar en 3 segundos..."
            );

            setTimeout(() => {
              iniciarBot();
            }, 3000);
          }
        }
      }
    );

    // ===============================
    // MENSAJES
    // ===============================

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

          const remoteJid = msg.key.remoteJid;

          if (!remoteJid) {
            return;
          }

          // ===============================
          // OBTENER TEXTO
          // ===============================

          const tipoMensaje =
            Object.keys(msg.message)[0];

          let texto = "";

          if (tipoMensaje === "conversation") {
            texto =
              msg.message.conversation || "";
          }

          else if (
            tipoMensaje === "extendedTextMessage"
          ) {
            texto =
              msg.message.extendedTextMessage?.text ||
              "";
          }

          else if (
            tipoMensaje === "imageMessage"
          ) {
            texto =
              msg.message.imageMessage?.caption ||
              "";
          }

          else if (
            tipoMensaje === "videoMessage"
          ) {
            texto =
              msg.message.videoMessage?.caption ||
              "";
          }

          if (!texto) {
            return;
          }

          texto = texto.trim();

          const numeroPerfil =
            remoteJid.split("@")[0];

          // ===============================
          // RESPUESTA A MENSAJE DEL BOT
          // ===============================

          const contexto =
            msg.message.extendedTextMessage
              ?.contextInfo;

          if (
            contexto?.quotedMessage &&
            contexto?.fromMe
          ) {
            await sock.sendMessage(
              remoteJid,
              {
                text:
`🤖 *TITANBOT*

✅ Recibí tu respuesta al mensaje del bot.

💬 Dijiste:
"${texto}"

⚡ TitanBot está atento.`
              }
            );

            return;
          }

          // ===============================
          // COMPLETAR PERFIL
          // ===============================

          if (
            perfilesEnProceso[numeroPerfil] &&
            !texto.startsWith(".")
          ) {
            const proceso =
              perfilesEnProceso[numeroPerfil];

            if (proceso.paso === 1) {
              proceso.datos.nombre = texto;
              proceso.paso = 2;

              await sock.sendMessage(
                remoteJid,
                {
                  text:
`🎂 *PERFIL*

Perfecto.

Ahora escribe tu *edad*.`
                }
              );

              return;
            }

            if (proceso.paso === 2) {
              proceso.datos.edad = texto;
              proceso.paso = 3;

              await sock.sendMessage(
                remoteJid,
                {
                  text:
`📅 *PERFIL*

Ahora escribe tu *cumpleaños*.

Ejemplo:
15/08/2010`
                }
              );

              return;
            }

            if (proceso.paso === 3) {
              proceso.datos.cumpleanos = texto;
              proceso.paso = 4;

              await sock.sendMessage(
                remoteJid,
                {
                  text:
`💬 *PERFIL*

Por último, escribe tu *frase favorita*.`
                }
              );

              return;
            }

            if (proceso.paso === 4) {
              proceso.datos.frase = texto;

              perfiles[numeroPerfil] =
                proceso.datos;

              delete perfilesEnProceso[
                numeroPerfil
              ];

              await sock.sendMessage(
                remoteJid,
                {
                  text:
`✅ *PERFIL COMPLETADO*

👤 Nombre:
${proceso.datos.nombre}

🎂 Edad:
${proceso.datos.edad}

📅 Cumpleaños:
${proceso.datos.cumpleanos}

💬 Frase:
"${proceso.datos.frase}"

🆔 Ya puedes usar *.id* para ver tu tarjeta.`
                }
              );

              return;
            }
          }

          // ===============================
          // SOLO COMANDOS
          // ===============================

          if (!texto.startsWith(".")) {
            return;
          }

          const partes =
            texto.split(/\s+/);

          const comando =
            partes[0].toLowerCase();

          const argumentos =
            partes.slice(1).join(" ");

          // ===============================
          // PING
          // ===============================

          if (comando === ".ping") {
            await sock.sendMessage(
              remoteJid,
              {
                text:
                  "🏓 *Pong!*\n\n🤖 TitanBot está funcionando."
              }
            );
          }

          // ===============================
          // MENU
          // ===============================

          else if (comando === ".menu") {
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
┣━━〔 👤 PERFIL 〕━━
┃
┃ 📝 .completarperfil
┃
┣━━〔 🎴 ANIME 〕━━
┃
┃ 🎴 .s
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

          // ===============================
          // BOT
          // ===============================

          else if (comando === ".bot") {
            await sock.sendMessage(
              remoteJid,
              {
                text:
`🤖 *TITANBOT*

⚡ Estado: ${conectado ? "🟢 ONLINE" : "🔴 OFFLINE"}

🚀 Sistema activo.
📱 WhatsApp conectado.
🛠️ Bot funcionando correctamente.`
              }
            );
          }

          // ===============================
          // INFO
          // ===============================

          else if (comando === ".info") {
            await sock.sendMessage(
              remoteJid,
              {
                text:
`ℹ️ *INFORMACIÓN DE TITANBOT*

🤖 Nombre: TitanBot
⚡ Estado: ${conectado ? "Online" : "Offline"}
📱 Plataforma: WhatsApp
🛠️ Sistema: Baileys

🚀 Bot desarrollado para administrar comandos y funciones en WhatsApp.`
              }
            );
          }

          // ===============================
          // ESTADO
          // ===============================

          else if (comando === ".estado") {
            await sock.sendMessage(
              remoteJid,
              {
                text:
`📊 *ESTADO DE TITANBOT*

🤖 Bot: ${conectado ? "🟢 ONLINE" : "🔴 OFFLINE"}
📱 WhatsApp: ${conectado ? "🟢 CONECTADO" : "🔴 DESCONECTADO"}
⚡ Sistema: 🟢 ACTIVO`
              }
            );
          }

          // ===============================
          // HORA
          // ===============================

          else if (comando === ".hora") {
            const ahora = new Date();

            const hora =
              ahora.toLocaleTimeString(
                "es-CO",
                {
                  timeZone: "America/Bogota"
                }
              );

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  `🕐 *HORA ACTUAL*\n\n🇨🇴 Colombia: *${hora}*`
              }
            );
          }

          // ===============================
          // FECHA
          // ===============================

          else if (comando === ".fecha") {
            const ahora = new Date();

            const fecha =
              ahora.toLocaleDateString(
                "es-CO",
                {
                  timeZone: "America/Bogota",
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                }
              );

            await sock.sendMessage(
              remoteJid,
              {
                text:
                  `📅 *FECHA ACTUAL*\n\n🇨🇴 ${fecha}`
              }
            );
          }

          // ===============================
          // ID / PERFIL
          // ===============================

          else if (comando === ".id") {
            const perfil =
              perfiles[numeroPerfil];

            let fotoPerfil = null;

            try {
              fotoPerfil =
                await sock.profilePictureUrl(
                  remoteJid,
                  "image"
                );
            } catch (error) {
              fotoPerfil = null;
            }

            if (!perfil) {
              await sock.sendMessage(
                remoteJid,
                {
                  text:
`🆔 *TU ID*

📱 ID:
${numeroPerfil}

❌ Todavía no tienes un perfil.

📝 Usa:
*.completarperfil*

para crear tu perfil.`
                }
              );

              return;
            }

            const tarjeta =
`╭━━━〔 🪪 TITAN ID 〕━━━╮
┃
┃ 🆔 ID: ${numeroPerfil}
┃ 👤 Nombre: ${perfil.nombre}
┃ 🎂 Edad: ${perfil.edad}
┃ 📅 Cumpleaños: ${perfil.cumpleanos}
┃
┃ 💬 Frase favorita:
┃ "${perfil.frase}"
┃
╰━━━━━━━━━━━━━━━━━━╯
        🤖 TitanBot`;

            if (fotoPerfil) {
              await sock.sendMessage(
                remoteJid,
                {
                  image: {
                    url: fotoPerfil
                  },
                  caption: tarjeta
                }
              );
            } else {
              await sock.sendMessage(
                remoteJid,
                {
                  text: tarjeta
                }
              );
            }
          }

          // ===============================
          // COMPLETAR PERFIL
          // ===============================

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

          // ===============================
          // DADO
          // ===============================

          else if (comando === ".dado") {
            const numero =
              Math.floor(
                Math.random() * 6
              ) + 1;

            await sock.sendMessage(
              remoteJid,
              {
                text:
`🎲 *DADO*

🎯 Resultado: *${numero}*`
              }
            );
          }

          // ===============================
          // MONEDA
          // ===============================

          else if (comando === ".moneda") {
            const resultado =
              Math.random() < 0.5
                ? "🟡 CARA"
                : "⚪ SELLO";

            await sock.sendMessage(
              remoteJid,
              {
                text:
`🪙 *MONEDA*

🎯 Resultado: *${resultado}*`
              }
            );
          }

          // ===============================
          // 8 BALL
          // ===============================

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
                Math.floor(
                  Math.random() *
                  respuestas.length
                )
              ];

            await sock.sendMessage(
              remoteJid,
              {
                text:
`🔮 *8 BALL*

${respuesta}`
              }
            );
          }

          // ===============================
          // RETO
          // ===============================

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
                Math.floor(
                  Math.random() *
                  retos.length
                )
              ];

            await sock.sendMessage(
              remoteJid,
              {
                text:
`🎯 *RETO*

${reto}`
              }
            );
          }

          // ===============================
          // VERDAD
          // ===============================

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
                Math.floor(
                  Math.random() *
                  preguntas.length
                )
              ];

            await sock.sendMessage(
              remoteJid,
              {
                text:
`😈 *VERDAD*

${pregunta}`
              }
            );
          }

          // ===============================
          // MAYUS
          // ===============================

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
                text:
`🔠 *MAYÚSCULAS*

${argumentos.toUpperCase()}`
              }
            );
          }

          // ===============================
          // MINUS
          // ===============================

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
                text:
`🔡 *MINÚSCULAS*

${argumentos.toLowerCase()}`
              }
            );
          }

          // ===============================
          // CONTADOR
          // ===============================

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

            const caracteres =
              argumentos.length;

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

          // ===============================
          // CALCULADORA
          // ===============================

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
              const operacion =
                argumentos.replace(
                  /[^0-9+\-*/().% ]/g,
                  ""
                );

              if (!operacion.trim()) {
                throw new Error(
                  "Operación inválida"
                );
              }

              const resultado =
                Function(
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

          // ===============================
          // TARJETA ANIME
          // ===============================

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

            if (
              !personajesReclamados[
                numeroPerfil
              ]
            ) {
              const personaje =
                personajes[
                  Math.floor(
                    Math.random() *
                    personajes.length
                  )
                ];

              personajesReclamados[
                numeroPerfil
              ] = personaje;
            }

            const personaje =
              personajesReclamados[
                numeroPerfil
              ];

            await sock.sendMessage(
              remoteJid,
              {
                text:
`╭━━━〔 🎴 ANIME CARD 〕━━━╮
┃
┃ 🆔 *ID:* ${numeroPerfil}
┃ 👤 *Nombre:* ${
                  perfiles[numeroPerfil]?.nombre ||
                  "Sin registrar"
                }
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

          // ===============================
          // ADMINS
          // ===============================

          else if (comando === ".admins") {
            if (
              !remoteJid.endsWith("@g.us")
            ) {
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
              await sock.groupMetadata(
                remoteJid
              );

            const admins =
              metadata.participants.filter(
                participante =>
                  participante.admin ===
                    "admin" ||
                  participante.admin ===
                    "superadmin"
              );

            let textoAdmins =
              "👑 *ADMINISTRADORES*\n\n";

            for (
              const admin of admins
            ) {
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

          // ===============================
          // MIEMBROS
          // ===============================

          else if (comando === ".miembros") {
            if (
              !remoteJid.endsWith("@g.us")
            ) {
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
              await sock.groupMetadata(
                remoteJid
              );

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

          // ===============================
          // GRUPO
          // ===============================

          else if (comando === ".grupo") {
            if (
              !remoteJid.endsWith("@g.us")
            ) {
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
              await sock.groupMetadata(
                remoteJid
              );

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

          // ===============================
          // REGLAS
          // ===============================

          else if (comando === ".reglas") {
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

          // ===============================
          // AYUDA
          // ===============================

          else if (comando === ".ayuda") {
            await sock.sendMessage(
              remoteJid,
              {
                text:
`❓ *AYUDA TITANBOT*

📋 Escribe *.menu* para ver todos los comandos.

💬 También puedes responder directamente a un mensaje enviado por TitanBot y el bot responderá.`
              }
            );
          }

          // ===============================
          // COMANDO DESCONOCIDO
          // ===============================

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

        } catch (error) {
          console.error(
            "❌ Error procesando mensaje:",
            error
          );
        }
      }
    );

  } catch (error) {
    console.error(
      "❌ Error iniciando TitanBot:"
    );

    console.error(error);

    if (!reconectando) {
      reconectando = true;

      setTimeout(() => {
        reconectando = false;
        iniciarBot();
      }, 5000);
    }
  }
}

// ===============================
// INICIAR TITANBOT
// ===============================

iniciarBot();

console.log(
  "🚀 TitanBot iniciado correctamente."
);

console.log(
  "📱 Sistema de vinculación por número activo."
);

console.log(
  "🤖 Esperando conexión con WhatsApp..."
);
