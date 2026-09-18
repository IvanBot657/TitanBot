// =========================================
// 📖 HISTORIA PERSONAL - TITANBOT
// =========================================

const usuarios = {};

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obtenerUsuario(jid) {
  if (!usuarios[jid]) {
    usuarios[jid] = {
      nivel: 1,
      xp: 0,
      logros: 0,
      aventuras: 0,
      capitulos: 1
    };
  }

  return usuarios[jid];
}

function barra(progreso) {
  const total = 10;
  const llenos = Math.round(progreso / 10);

  return "█".repeat(llenos) +
         "░".repeat(total - llenos);
}

async function historia(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {

  const cmd = normalizar(comando);

  if (cmd !== "historia") {
    return false;
  }

  // =========================================
  // 👤 DETECTAR MENCIÓN
  // =========================================

  const context =
    msg?.message?.extendedTextMessage?.contextInfo;

  const mencionados = context?.mentionedJid || [];

  const objetivo = mencionados.length > 0
    ? mencionados[0]
    : id;

  const numero = objetivo.split("@")[0];

  // =========================================
  // ⏳ CARGANDO
  // =========================================

  const cargando = await sock.sendMessage(chat, {
    text:
`📖 *CARGANDO HISTORIA...*

${barra(20)} 20%

🔄 Preparando información de @${numero}...

✨ _Sigue mejorando_`,
    mentions: [objetivo]
  });

  await new Promise(resolve => setTimeout(resolve, 800));

  await sock.sendMessage(chat, {
    text:
`📖 *CARGANDO HISTORIA...*

${barra(50)} 50%

🔍 Analizando aventuras...

✨ _Sigue mejorando_`,
    mentions: [objetivo]
  });

  await new Promise(resolve => setTimeout(resolve, 800));

  await sock.sendMessage(chat, {
    text:
`📖 *CARGANDO HISTORIA...*

${barra(80)} 80%

⚡ Calculando progreso...

✨ _Sigue mejorando_`,
    mentions: [objetivo]
  });

  await new Promise(resolve => setTimeout(resolve, 800));

  await sock.sendMessage(chat, {
    text:
`📖 *HISTORIA CARGADA*

${barra(100)} 100%

🎉 ¡Historia preparada!

✨ _Sigue mejorando, todavía quedan muchos niveles._`,
    mentions: [objetivo]
  });

  // =========================================
  // 📊 DATOS
  // =========================================

  const datos = obtenerUsuario(objetivo);

  datos.xp += 10;
  datos.aventuras += 1;

  if (datos.xp >= 100) {
    datos.xp -= 100;
    datos.nivel += 1;
    datos.capitulos += 1;
    datos.logros += 1;
  }

  // =========================================
  // 📚 NIVELES FUTUROS
  // =========================================

  const nivelActual = datos.nivel;

  const siguientes = [
    nivelActual + 1,
    nivelActual + 2,
    nivelActual + 3,
    nivelActual + 4,
    nivelActual + 5
  ];

  const historias = [
    `🌟 @${numero} continúa escribiendo su propia historia. Cada aventura aumenta su experiencia.`,

    `⚔️ @${numero} sigue avanzando. Nuevos desafíos aparecen en el camino.`,

    `🔥 @${numero} ha comenzado una nueva etapa. Todavía quedan muchos capítulos por descubrir.`,

    `🚀 El progreso de @${numero} continúa creciendo. Su próxima aventura está por comenzar.`,

    `👑 @${numero} sigue mejorando. El futuro de su historia todavía tiene muchos capítulos.`
  ];

  const texto =
    historias[Math.floor(Math.random() * historias.length)];

  // =========================================
  // 📖 RESULTADO FINAL
  // =========================================

  await sock.sendMessage(chat, {
    text:
`📖 *HISTORIA DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

⭐ Nivel actual: ${datos.nivel}
✨ XP: ${datos.xp}/100
🏆 Logros: ${datos.logros}
⚔️ Aventuras: ${datos.aventuras}
📚 Capítulos: ${datos.capitulos}

━━━━━━━━━━━━━━━━━━━━

🔮 *PRÓXIMOS NIVELES*

➡️ Nivel ${siguientes[0]}
➡️ Nivel ${siguientes[1]}
➡️ Nivel ${siguientes[2]}
➡️ Nivel ${siguientes[3]}
➡️ Nivel ${siguientes[4]}

━━━━━━━━━━━━━━━━━━━━

${texto}

💪 *Sigue mejorando...*

✨ _TITANBOT_`,
    mentions: [objetivo]
  });

  return true;
}

module.exports = historia;
module.exports.historia = historia;
