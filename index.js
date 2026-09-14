const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

// Comandos
const inicio = require("./commands/inicio");
const usuario = require("./commands/usuario");
const economia = require("./commands/economia");
const juegos = require("./commands/juegos");
const grupos = require("./commands/grupos");

// Número para vincular WhatsApp.
// En Render lo pondremos como variable de entorno.
const NUMERO = process.env.PHONE_NUMBER;

let conectando = false;

async function iniciarBot() {

  if (conectando) return;
  conectando = true;

  try {

    const { state, saveCreds } =
      await useMultiFileAuthState("./session");

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      markOnlineOnConnect: false
    });

    sock.ev.on("creds.update", saveCreds);

    // Código de vinculación
    if (!state.creds.registered) {

      if (!NUMERO) {
        console.log("");
        console.log("❌ FALTA PHONE_NUMBER");
        console.log("");
        console.log(
          "Agrega PHONE_NUMBER en las variables de entorno de Render."
        );
        console.log(
          "Ejemplo: 573001234567"
        );
        console.log("");
        process.exit(1);
      }

      try {

        // Esperamos a que la conexión esté preparada
        await new Promise(resolve =>
          setTimeout(resolve, 3000)
        );

        const codigo =
          await sock.requestPairingCode(NUMERO);

        console.log("");
        console.log("╔════════════════════════════╗");
        console.log("║   🔗 TITANBOT V2.5        ║");
        console.log("║   CÓDIGO DE VINCULACIÓN   ║");
        console.log("╚════════════════════════════╝");
        console.log("");
        console.log("📱 Código:");
        console.log("");
        console.log("   " + codigo);
        console.log("");
        console.log(
          "WhatsApp → Dispositivos vinculados →"
        );
        console.log(
          "Vincular dispositivo → Vincular con número de teléfono"
        );
        console.log("");

      } catch (error) {

        console.log(
          "❌ No se pudo generar el código:"
        );

        console.log(
          error.message
        );

      }
    }

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect
        } = update;

        if (connection === "connecting") {
          console.log("🔄 Conectando con WhatsApp...");
        }

        if (connection === "open") {

          conectando = false;

          console.log("");
          console.log("╔════════════════════════════╗");
          console.log("║     🤖 TITANBOT V2.5      ║");
          console.log("║      🟢 CONECTADO          ║");
          console.log("╚════════════════════════════╝");
          console.log("");

        }

        if (connection === "close") {

          conectando = false;

          const codigo =
            lastDisconnect?.error?.output?.statusCode;

          if (
            codigo === DisconnectReason.loggedOut
          ) {

            console.log(
              "❌ La sesión de WhatsApp fue cerrada."
            );

            return;
          }

          console.log(
            "⚠️ Conexión perdida."
          );

          console.log(
            "🔄 Intentando reconectar en 5 segundos..."
          );

          setTimeout(() => {
            iniciarBot();
          }, 5000);
        }
      }
    );

    // Recibir mensajes
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

              isAdmin = false;

            }
          }

          let respondio = false;

          // INICIO
          if (!respondio) {
            respondio =
              await inicio(
                sock,
                chat,
                comando
              );
          }

          // USUARIO
          if (!respondio) {
            respondio =
              await usuario.usuario(
                sock,
                chat,
                comando,
                id
              );
          }

          // ECONOMÍA
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

          // JUEGOS
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

          // GRUPOS
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

    conectando = false;

    console.log(
      "❌ Error iniciando TitanBot:"
    );

    console.log(
      error.message
    );

    setTimeout(() => {
      iniciarBot();
    }, 5000);
  }
}

console.log("");
console.log("🤖 Iniciando TitanBot v2.5...");
console.log("");

iniciarBot();
