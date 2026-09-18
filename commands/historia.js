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

async function historia(sock, chat, comando, args = [], id, msg) {

  const cmd = normalizar(comando);

  const comandos = [
    "historia",
    "origen",
    "aventura",
    "progreso",
    "niveles",
    "logros",
    "capitulos",
    "destino",
    "futuro",
    "leyenda"
  ];

  if (!comandos.includes(cmd)) {
    return false;
  }

  // =========================================
  // 👤 DETECTAR USUARIO
  // =========================================

  const context =
    msg?.message?.extendedTextMessage?.contextInfo;

  const mencionados = context?.mentionedJid || [];

  const objetivo = mencionados.length > 0
    ? mencionados[0]
    : id;

  const numero = objetivo.split("@")[0];

  const datos = obtenerUsuario(objetivo);

  // =========================================
  // ⏳ CARGANDO
  // =========================================

  await sock.sendMessage(chat, {
    text:
`📖 *CARGANDO HISTORIA...*

${barra(20)} 20%

🔄 Preparando información de @${numero}...

✨ _Sigue mejorando_`,
    mentions: [objetivo]
  });

  await new Promise(resolve => setTimeout(resolve, 700));

  await sock.sendMessage(chat, {
    text:
`📖 *CARGANDO HISTORIA...*

${barra(50)} 50%

🔍 Analizando progreso...

✨ _Sigue mejorando_`,
    mentions: [objetivo]
  });

  await new Promise(resolve => setTimeout(resolve, 700));

  await sock.sendMessage(chat, {
    text:
`📖 *CARGANDO HISTORIA...*

${barra(80)} 80%

⚡ Preparando resultados...

✨ _Sigue mejorando_`,
    mentions: [objetivo]
  });

  await new Promise(resolve => setTimeout(resolve, 700));

  // =========================================
  // 📈 ACTUALIZAR PROGRESO
  // =========================================

  datos.xp += 10;
  datos.aventuras += 1;

  if (datos.xp >= 100) {
    datos.xp -= 100;
    datos.nivel += 1;
    datos.capitulos += 1;
    datos.logros += 1;
  }

  // =========================================
  // 📖 HISTORIA
  // =========================================

  if (cmd === "historia") {

    await sock.sendMessage(chat, {
      text:
`📖 *HISTORIA DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

⭐ Nivel: ${datos.nivel}
✨ XP: ${datos.xp}/100
🏆 Logros: ${datos.logros}
⚔️ Aventuras: ${datos.aventuras}
📚 Capítulos: ${datos.capitulos}

━━━━━━━━━━━━━━━━━━━━

🌟 @${numero} continúa escribiendo
su propia historia.

Cada aventura aumenta su experiencia
y desbloquea nuevos capítulos.

🔮 *PRÓXIMOS NIVELES*

➡️ Nivel ${datos.nivel + 1}
➡️ Nivel ${datos.nivel + 2}
➡️ Nivel ${datos.nivel + 3}
➡️ Nivel ${datos.nivel + 4}
➡️ Nivel ${datos.nivel + 5}

💪 *Sigue mejorando...*

✨ _TITANBOT_`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // 🌱 ORIGEN
  // =========================================

  else if (cmd === "origen") {

    await sock.sendMessage(chat, {
      text:
`🌱 *ORIGEN DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

📖 Aquí comenzó la historia.

Desde sus primeros pasos en TITANBOT,
@${numero} empezó a construir su propio
camino.

⭐ Nivel inicial: 1
📚 Capítulo inicial: 1

🔥 Su historia apenas comienza...`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // ⚔️ AVENTURA
  // =========================================

  else if (cmd === "aventura") {

    await sock.sendMessage(chat, {
      text:
`⚔️ *AVENTURAS DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

🗺️ Aventuras realizadas:
${datos.aventuras}

⭐ Nivel actual:
${datos.nivel}

📚 Capítulos:
${datos.capitulos}

🔥 Cada aventura hace crecer
la historia de @${numero}.`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // 📈 PROGRESO
  // =========================================

  else if (cmd === "progreso") {

    await sock.sendMessage(chat, {
      text:
`📈 *PROGRESO DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

${barra(datos.xp)} ${datos.xp}%

⭐ Nivel: ${datos.nivel}
✨ XP: ${datos.xp}/100
⚔️ Aventuras: ${datos.aventuras}

💪 *Sigue mejorando...*`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // ⭐ NIVELES
  // =========================================

  else if (cmd === "niveles") {

    await sock.sendMessage(chat, {
      text:
`⭐ *NIVELES DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

📍 Nivel actual:
⭐ ${datos.nivel}

🔮 Próximos niveles:

➡️ ${datos.nivel + 1}
➡️ ${datos.nivel + 2}
➡️ ${datos.nivel + 3}
➡️ ${datos.nivel + 4}
➡️ ${datos.nivel + 5}

🔥 *Sigue avanzando para desbloquearlos.*`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // 🏆 LOGROS
  // =========================================

  else if (cmd === "logros") {

    await sock.sendMessage(chat, {
      text:
`🏆 *LOGROS DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

🏆 Logros desbloqueados:
${datos.logros}

⭐ Nivel:
${datos.nivel}

⚔️ Aventuras:
${datos.aventuras}

🎉 Sigue usando TITANBOT
para desbloquear nuevos logros.`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // 📚 CAPÍTULOS
  // =========================================

  else if (cmd === "capitulos") {

    await sock.sendMessage(chat, {
      text:
`📚 *CAPÍTULOS DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

📖 Capítulos desbloqueados:
${datos.capitulos}

🔒 Próximos capítulos:

📕 Capítulo ${datos.capitulos + 1}
📕 Capítulo ${datos.capitulos + 2}
📕 Capítulo ${datos.capitulos + 3}

✨ *La historia continúa...*`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // 🔮 DESTINO
  // =========================================

  else if (cmd === "destino") {

    const destinos = [
      "🌌 Un nuevo desafío está esperando.",
      "🏆 Una gran oportunidad podría aparecer.",
      "⚔️ Un nuevo capítulo está por comenzar.",
      "🚀 El camino de @${numero} apunta hacia algo grande.",
      "🗺️ Una nueva aventura está cerca."
    ];

    const destino =
      destinos[Math.floor(Math.random() * destinos.length)];

    await sock.sendMessage(chat, {
      text:
`🔮 *DESTINO DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

${destino}

⭐ Nivel actual: ${datos.nivel}
📚 Capítulos: ${datos.capitulos}

✨ *El futuro todavía está por escribirse.*`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // 🔮 FUTURO
  // =========================================

  else if (cmd === "futuro") {

    await sock.sendMessage(chat, {
      text:
`🔮 *FUTURO DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

⭐ Nivel actual:
${datos.nivel}

🚀 Próximo objetivo:
Nivel ${datos.nivel + 1}

🏆 Próximo logro:
Desbloquear una nueva etapa.

📚 Próximo capítulo:
${datos.capitulos + 1}

🔥 *Sigue mejorando y tu historia continuará.*`,
      mentions: [objetivo]
    });

  }

  // =========================================
  // 👑 LEYENDA
  // =========================================

  else if (cmd === "leyenda") {

    await sock.sendMessage(chat, {
      text:
`👑 *LEYENDA DE @${numero}*

━━━━━━━━━━━━━━━━━━━━

⭐ Nivel: ${datos.nivel}
🏆 Logros: ${datos.logros}
⚔️ Aventuras: ${datos.aventuras}
📚 Capítulos: ${datos.capitulos}

━━━━━━━━━━━━━━━━━━━━

🔥 @${numero} continúa construyendo
su propia leyenda.

👑 *La historia todavía no termina.*

✨ _TITANBOT_`,
      mentions: [objetivo]
    });

  }

  return true;
}

module.exports = historia;
module.exports.historia = historia;
