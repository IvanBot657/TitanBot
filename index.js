const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const http = require("http");

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
const NUMERO = process.env.PHONE_NUMBER;

let bot;
let iniciando = false;
let conectado = false;
let codigoSolicitado = false;

// ==============================
// SERVIDOR PARA RENDER
// ==============================

const server = http.createServer((req, res) => {

  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("🤖 TitanBot v2.5 ONLINE");
});

server.listen(PORT, "0.0.0.0", () => {

  console.log(
    `🌐 Servidor iniciado en puerto ${PORT}`
  );
});

// ==============================
// INICIAR TITANBOT
// ==============================

async function iniciarBot() {

  if (iniciando) return;

  iniciando = true;

  try {

    console.log("");
    console.log(
      "🤖 Iniciando TitanBot v2.5..."
    );

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState("./session");

    bot = makeWASocket({

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

    bot.ev.on(
      "creds.update",
      saveCreds
    );

    // ==========================
    // ESTADO DE CONEXIÓN
    // ==========================

    bot.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect
        } = update;

        if (connection === "connecting") {

          console.log(
            "🔄 Conectando con WhatsApp..."
          );
        }

        if (connection === "open") {

          conectado = true;
          iniciando = false;

          console.log("");
          console.log(
            "╔══════════════════════════╗"
          );
          console.log(
            "║   🤖 TITANBOT V2.5      ║"
          );
          console.log(
            "║    🟢 CONECTADO         ║"
          );
          console.log(
            "╚══════════════════════════╝"
          );
          console.log("");
        }

        if (connection === "close") {

          conectado = false;
          iniciando = false;

          const codigo =
            lastDisconnect?.error?.output?.statusCode;

          console.log("");
          console.log(
            "⚠️ WhatsApp cerró la conexión."
          );

          console.log(
            "Código:",
            codigo || "desconocido"
          );

          // Si ya estaba vinculado y WhatsApp
          // cerró la conexión, esperamos antes
          // de volver a intentar.

          if (
            codigo === DisconnectReason.loggedOut
          ) {

            console.log(
              "❌ La sesión fue cerrada."
            );

            return;
          }

          if (state.creds.registered) {

            console.log(
              "🔄 Se intentará reconectar en 30 segundos..."
            );

            setTimeout(() => {

              iniciarBot();

            }, 30000);

          } else {

            console.log("");
            console.log(
              "⏳ La cuenta todavía no está vinculada."
            );
            console.log(
              "No se realizará un bucle rápido de reconexión."
            );
            console.log("");
          }
        }
      }
    );

    // ==========================
    // CÓDIGO DE VINCULACIÓN
    // ==========================

    if (
      !state.creds.registered &&
      !codigoSolicitado
    ) {

      codigoSolicitado = true;

      if (!NUMERO) {

        console.log("");
        console.log(
          "❌ Falta PHONE_NUMBER en Render."
        );
        console.log("");

        return;
      }

      try {

        // Esperamos a que la conexión
        // inicial esté preparada.

        await new Promise(resolve => {
          setTimeout(resolve, 3000);
        });

        console.log("");
        console.log(
          "🔗 Generando código de vinculación..."
        );

        const codigo =
          await bot.requestPairingCode(
            NUMERO
          );

        console.log("");
        console.log(
          "╔════════════════════════════╗"
        );
        console.log(
          "║   🔗 TITANBOT V2.5        ║"
        );
        console.log(
          "║   CÓDIGO DE VINCULACIÓN   ║"
        );
        console.log(
          "╚════════════════════════════╝"
        );
        console.log("");
        console.log(
          "📱 CÓDIGO:"
        );
        console.log("");
        console.log(
          "       " + codigo
        );
        console.log("");
        console.log(
          "AHORA EN WHATSAPP:"
        );
        console.log(
          "1. Dispositivos vinculados"
        );
        console.log(
          "2. Vincular dispositivo"
        );
        console.log(
          "3. Vincular con número de teléfono"
        );
        console.log(
          "4. Introduce el código mostrado arriba"
        );
        console.log("");
        console.log(
          "⏳ Esperando la vinculación..."
        );
        console.log("");

      } catch (error) {

        console.log("");
        console.log(
          "❌ ERROR AL GENERAR EL CÓDIGO"
        );
        console.log(
          error.message
        );
        console.log("");
      }
    }

    // ==========================
    // MENSAJES
    // ==========================

    bot.ev.on(
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
          // ADMIN DEL GRUPO
          // ==========================

          if (isGroup) {

            try {

              const metadata =
                await bot.groupMetadata(chat);

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
                bot,
                chat,
                comando
              );
          }

          // USUARIO
          if (!respondio) {

            respondio =
              await usuario.usuario(
                bot,
                chat,
                comando,
                id
              );
          }

          // ECONOMÍA
          if (!respondio) {

            respondio =
              await economia(
                bot,
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
                bot,
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
                bot,
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
// ARRANCAR
// ==============================

iniciarBot();
