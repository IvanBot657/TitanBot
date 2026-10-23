
const comandosDark = new Map();

module.exports = async (sock, msg, args = []) => {
  try {
    const chatId = msg.key.remoteJid;
    const remitente = msg.pushName || "Usuario";
    const texto = args.join(" ").trim();

    const menu = `╔════════════════════╗
       🖤  T I T A N   D A R K
╚════════════════════╝

👤 Usuario: ${remitente}

⚡ MODO SECRETO ACTIVADO

Elige una opción:

1️⃣  Perfil oscuro
2️⃣  Frase oscura
3️⃣  Ayuda

Escribe:
.dark 1
.dark 2
.dark 3

━━━━━━━━━━━━━━━━━━━━
⚠️ TITANBOT · DARK MODE`;

    if (!texto || texto === "3") {
      await sock.sendMessage(chatId, { text: menu }, { quoted: msg });
      return;
    }

    if (texto === "1") {
      await sock.sendMessage(chatId, {
        text: `🖤 PERFIL DARK\n\n👤 Nombre: ${remitente}\n⚡ Estado: Modo oscuro activado\n🌑 Bienvenido al lado secreto de TITANBOT.`
      }, { quoted: msg });
      return;
    }

    if (texto === "2") {
      const frases = [
        "🌑 Incluso la noche más oscura termina con el amanecer.",
        "🖤 El silencio también puede ser una respuesta.",
        "⚡ No necesitas hacer ruido para demostrar tu poder.",
        "🌘 Tu historia no termina en tus momentos más oscuros."
      ];

      const frase = frases[Math.floor(Math.random() * frases.length)];

      await sock.sendMessage(chatId, {
        text: `🖤 FRASE DARK\n\n${frase}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(chatId, {
      text: "❌ Opción no válida.\nEscribe *.dark* para ver el menú."
    }, { quoted: msg });

  } catch (error) {
    console.error("Error en el comando dark:", error);
  }
};
