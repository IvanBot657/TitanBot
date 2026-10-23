// =========================================
// 🖤 DARK - COMANDO SECRETO DE TITANBOT
// Disponible para todos los usuarios
// =========================================

module.exports = async (sock, chat, comando, args = [], id, msg) => {
  if (comando !== "dark") return false;

  try {
    const opcion = (args[0] || "").toLowerCase();

    if (!opcion) {
      const texto = `
🖤 *TITANBOT DARK*

Bienvenido al lado oscuro...

🌑 *Comandos secretos:*

.dark 1 — Mensaje oscuro
.dark 2 — Frase misteriosa
.dark 3 — Activar modo tenebroso

⚡ Disponible para todos los usuarios.
      `.trim();

      await sock.sendMessage(chat, { text: texto }, { quoted: msg });
      return true;
    }

    const respuestas = {
      "1": "🖤 *DARK MODE*\nLa oscuridad también tiene su propio brillo... 🌑",
      "2": "🌘 *FRASE MISTERIOSA*\nNo todos los monstruos viven en la oscuridad; algunos sonríen bajo la luz.",
      "3": "☠️ *MODO TENEBROSO*\nLas sombras despiertan... 🖤⚡"
    };

    if (!respuestas[opcion]) {
      await sock.sendMessage(
        chat,
        {
          text: "❌ Opción inválida.\n\nEscribe *.dark* para ver las opciones."
        },
        { quoted: msg }
      );
      return true;
    }

    await sock.sendMessage(
      chat,
      { text: respuestas[opcion] },
      { quoted: msg }
    );

    return true;
  } catch (error) {
    console.error("Error en el comando dark:", error);

    await sock.sendMessage(chat, {
      text: "❌ No se pudo ejecutar el comando .dark. Inténtalo de nuevo."
    });

    return true;
  }
};
