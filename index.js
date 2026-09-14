const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");

const inicio = require("./commands/inicio");
const usuario = require("./commands/usuario");
const economia = require("./commands/economia");
const juegos = require("./commands/juegos");
const grupos = require("./commands/grupos");

async function iniciarBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {

    const {
      connection,
      lastDisconnect,
      qr
    } = update;

    if (qr) {
      console.log("📱 Escanea este código QR:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ TITANBOT CONECTADO");
      console.log("🤖 TitanBot v2.5.0");
    }

    if (connection === "close") {

      const codigo =
        lastDisconnect?.error?.output?.statusCode;

      if (codigo !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...");
        iniciarBot();
      } else {
        console.log("❌ Sesión cerrada.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {

    try {

      const mensaje = messages[0];

      if (!mensaje.message) return;

      if (mensaje.key.fromMe) return;

      const chat = mensaje.key.remoteJid;

      const texto =
        mensaje.message.conversation ||
        mensaje.message.extendedTextMessage?.text ||
        "";

      if (!texto.startsWith(".")) return;

      const partes =
        texto.slice(1).trim().split(/\s+/);

      const comando =
        (partes.shift() || "").toLowerCase();

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

        } catch {}
      }

      let respondio = false;

      if (!respondio)
        respondio = await inicio(
          sock,
          chat,
          comando
        );

      if (!respondio)
        respondio = await usuario.usuario(
          sock,
          chat,
          comando,
          id
        );

      if (!respondio)
        respondio = await economia(
          sock,
          chat,
          comando,
          args,
          id
        );

      if (!respondio)
        respondio = await juegos(
          sock,
          chat,
          comando,
          args,
          id
        );

      if (!respondio)
        respondio = await grupos(
          sock,
          chat,
          comando,
          args,
          id,
          isGroup,
          isAdmin
        );

    } catch (error) {

      console.log(
        "❌ Error procesando mensaje:",
        error.message
      );

    }
  });
}

iniciarBot();
