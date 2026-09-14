const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const http = require("http");

// ===============================
// COMANDOS
// ===============================

const inicio = require("./commands/inicio");
const usuario = require("./commands/usuario");
const economia = require("./commands/economia");
const juegos = require("./commands/juegos");
const grupos = require("./commands/grupos");

// ===============================
// CONFIGURACIÓN
// ===============================

const PORT = process.env.PORT || 3000;
const NUMERO = process.env.PHONE_NUMBER;

let reiniciando = false;

// ===============================
// SERVIDOR PARA RENDER
// ===============================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("🤖 TitanBot v2.5 funcionando");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor iniciado en puerto ${PORT}`);
});

// ===============================
// INICIAR BOT
// ===============================

async function iniciarBot() {

  if (reiniciando) return;

  try {

    console.log("");
    console.log("🤖 Iniciando TitanBot v2.5...");
    console.log("");

    const { state, saveCreds } =
      await useMultiFileAuthState("./session");

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

    sock.ev.on(
      "creds.update",
      saveCreds
    );

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

          console.log(
            "🔄 Conectando con WhatsApp..."
          );
        }

        if (connection === "open") {

          reiniciando = false;

          console.log("");
          console.log(
            "╔════════════════════════════╗"
          );
          console.log(
            "║     🤖 TITANBOT V2.5      ║"
          );
          console.log(
            "║      🟢 CONECTADO          ║"
          );
          console.log(
            "╚════════════════════════════╝"
          );
          console.log("");
        }

        if (connection === "close") {

          const codigo =
            lastDisconnect?.error?.output?.statusCode;

          console.log("");
          console.log(
            "⚠️ Conexión de WhatsApp cerrada."
          );

          console.log(
            "Código:",
            codigo || "desconocido"
          );

          if (
            codigo === DisconnectReason.loggedOut
          ) {

            console.log(
              "❌ WhatsApp cerró la sesión."
            );

            return;
          }

          if (!reiniciando) {

            reiniciando = true;

            console.log(
              "🔄 Reiniciando conexión en 10 segundos..."
            );

            setTimeout(() => {

              reiniciando = false;

              iniciarBot();

            }, 10000);
          }
        }
      }
    );

    // ===============================
    // CÓDIGO DE VINCULACIÓN
    // ===============================

    if (!state.creds.registered) {

      if (!NUMERO) {

        console.log("");
        console.log(
          "❌ Falta la variable PHONE_NUMBER."
        );
        console.log("");

        return;
      }

      try {

        // Esperar a que Baileys establezca
        // la conexión inicial.

        await new Promise(resolve => {
          setTimeout(resolve, 5000);
        });

        const codigo =
          await sock.requestPairingCode(
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
          "   " + codigo
        );
        console.log("");
        console.log(
          "WhatsApp → Dispositivos vinculados"
        );
        console.log(
          "→ Vincular dispositivo"
        );
        console.log(
          "→ Vincular con número de teléfono"
        );
        console.log("");

      } catch (error) {

        console.log("");
        console.log(
          "❌ No se pudo generar el código."
        );

        console.log(
          error.message
        );

        console.log("");
      }
    }

    // ===============================
    // MENSAJES
    // ===============================

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

          if (!texto.startsWith(".")) {
            return;
          }

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

          // ===============================
          // ADMINISTRADOR
          // ===============================

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

          // ===============================
          // INICIO
          // ===============================

          if (!respondio) {

            respondio =
              await inicio(
                sock,
                chat,
                comando
              );
          }

          // ===============================
          // USUARIO
          // ===============================

          if (!respondio) {

            respondio =
              await usuario.usuario(
                sock,
                chat,
                comando,
                id
              );
          }

          // ===============================
          // ECONOMÍA
          // ===============================

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

          // ===============================
          // JUEGOS
          // ===============================

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

          // ===============================
          // GRUPOS
          // ===============================

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

// ===============================
// INICIAR
// ===============================

iniciarBot();
