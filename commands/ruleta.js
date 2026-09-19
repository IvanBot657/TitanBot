// =========================================
// 🎰 TITANBOT - SISTEMA DE RULETA
// =========================================

const resultados = [
  {
    nombre: "RETO",
    emoji: "⚡"
  },
  {
    nombre: "PREMIO",
    emoji: "🎁"
  },
  {
    nombre: "SUERTE",
    emoji: "🍀"
  },
  {
    nombre: "MISTERIO",
    emoji: "🕵️"
  },
  {
    nombre: "PODER",
    emoji: "🔥"
  },
  {
    nombre: "NADA",
    emoji: "😅"
  }
];

// =========================================
// 🎰 EJECUTAR RULETA
// =========================================

async function ruleta(sock, chat, comando, args, id, msg) {

  // Solo responder a .ruleta
  if (comando !== "ruleta") {
    return false;
  }

  // =========================================
  // 👤 DETECTAR USUARIO MENCIONADO
  // =========================================

  const menciones =
    msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

  let objetivo = id;
  let textoObjetivo = "¡Te tocó!";

  if (menciones.length > 0) {
    objetivo = menciones[0];
    textoObjetivo = `👤 @${objetivo.split("@")[0]}`;
  }

  // =========================================
  // 🎰 ANIMACIÓN
  // =========================================

  const mensajeInicial = await sock.sendMessage(
    chat,
    {
      text:
`🎰 GIRANDO...
⬜⬜⬜⬜⬜
⬜🔵⬜⬜⬜
⬜⬜🟣⬜⬜
⬜⬜⬜🟢⬜`
    }
  );

  // =========================================
  // ⏳ ESPERA
  // =========================================

  await new Promise(resolve => setTimeout(resolve, 1800));

  // =========================================
  // 🎯 RESULTADO ALEATORIO
  // =========================================

  const resultado =
    resultados[Math.floor(Math.random() * resultados.length)];

  // =========================================
  // 🎉 RESULTADO FINAL
  // =========================================

  await sock.sendMessage(
    chat,
    {
      text:
`🎉 ¡RESULTADO!

${textoObjetivo}
${resultado.emoji} ¡Te tocó: ${resultado.nombre}!`,
      mentions:
        menciones.length > 0 ? [objetivo] : []
    }
  );

  return true;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = ruleta;
