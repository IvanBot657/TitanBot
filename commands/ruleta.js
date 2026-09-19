// =========================================
// 🎡 TITANBOT - RULETA AVANZADA
// =========================================

const resultados = [
  ["⚡", "RETO"],
  ["❓", "VERDAD"],
  ["😂", "CHISTE"],
  ["🎁", "PREMIO"],
  ["🍀", "SUERTE"],
  ["🧩", "ACERTIJO"],
  ["🎭", "IMITACIÓN"],
  ["🎤", "CANTA"],
  ["🧠", "PREGUNTA"],
  ["🎨", "DIBUJA"],
  ["😎", "PODER"],
  ["👀", "CONFIESA"],
  ["🔮", "MISTERIO"],
  ["😅", "NADA"],
  ["🎯", "OBJETIVO"],
  ["🤣", "HAZ REÍR"],
  ["📖", "CUENTA UNA HISTORIA"],
  ["🗣️", "DI UNA PALABRA"],
  ["🔤", "DI UNA LETRA"],
  ["🔢", "ELIGE UN NÚMERO"],
  ["🌟", "ESTRELLA"],
  ["💫", "BONUS"],
  ["🏆", "CAMPEÓN"],
  ["🥇", "PRIMER LUGAR"],
  ["🎲", "DADO"],
  ["🪙", "MONEDA"],
  ["🧠", "MEMORIA"],
  ["🔍", "INVESTIGA"],
  ["🕵️", "DETECTIVE"],
  ["🎪", "SHOW"],
  ["🎬", "ACTÚA"],
  ["📢", "ANUNCIA"],
  ["🎧", "MÚSICA"],
  ["🎵", "TARAREA"],
  ["📸", "FOTO"],
  ["✍️", "ESCRIBE"],
  ["📝", "FRASE"],
  ["💭", "IMAGINA"],
  ["🚀", "VIAJE"],
  ["🌈", "COLOR"],
  ["🐉", "PERSONAJE"],
  ["👑", "REY"],
  ["⚔️", "GUERRERO"],
  ["🧙", "MAGO"],
  ["🤖", "ROBOT"],
  ["👽", "ALIEN"],
  ["🦸", "HÉROE"],
  ["🦹", "VILLANO"],
  ["🔥", "FUEGO"],
  ["❄️", "HIELO"],
  ["⚡", "RAYO"],
  ["🌪️", "TORMENTA"],
  ["🌊", "OCÉANO"],
  ["🌙", "LUNA"],
  ["☀️", "SOL"],
  ["🌌", "GALAXIA"],
  ["💎", "DIAMANTE"],
  ["🪄", "MAGIA"],
  ["🎰", "JACKPOT"],
  ["🔓", "DESBLOQUEO"],
  ["💥", "SORPRESA"]
];

// =========================================
// ⏳ ESPERA
// =========================================

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =========================================
// 🎲 MEZCLAR
// =========================================

function mezclar(lista) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

// =========================================
// 🎡 ANIMACIÓN
// =========================================

async function animacionRuleta(sock, chat, participantes) {

  const cuadros = [
    "⬜⬜⬜⬜⬜\n⬜🔵⬜⬜⬜\n⬜⬜🟣⬜⬜\n⬜⬜⬜🟢⬜",

    "⬜🔵⬜⬜⬜\n⬜⬜🟣⬜⬜\n⬜⬜⬜🟢⬜\n⬜⬜⬜⬜🔵",

    "⬜⬜🟣⬜⬜\n⬜⬜⬜🟢⬜\n⬜⬜⬜⬜🔵\n🟣⬜⬜⬜⬜",

    "⬜⬜⬜🟢⬜\n⬜⬜⬜⬜🔵\n🟣⬜⬜⬜⬜\n⬜🟢⬜⬜⬜"
  ];

  await sock.sendMessage(chat, {
    text:
`🎡 RULETA TITANBOT

🎯 Seleccionando participantes...

👥 ${participantes.length} participantes
🎲 Preparando resultados...`
  });

  await esperar(1000);

  for (const cuadro of cuadros) {

    await sock.sendMessage(chat, {
      text:
`🎰 GIRANDO...

${cuadro}`
    });

    await esperar(450);
  }
}

// =========================================
// 🎡 EJECUTAR RULETA
// =========================================

async function ruleta(sock, chat, comando, args, id, msg) {

  if (comando !== "ruleta") {
    return false;
  }

  // =========================================
  // 👥 SOLO GRUPOS
  // =========================================

  if (!chat.endsWith("@g.us")) {

    await sock.sendMessage(chat, {
      text: "❌ La ruleta solo funciona en grupos."
    });

    return true;
  }

  try {

    // =========================================
    // 👥 INFORMACIÓN DEL GRUPO
    // =========================================

    const metadata = await sock.groupMetadata(chat);

    let participantes = metadata.participants || [];

    // =========================================
    // 🤖 IDENTIFICAR BOT
    // =========================================

    const botId = sock.user?.id || "";

    const botNumero = botId
      .split(":")[0]
      .split("@")[0];

    // =========================================
    // 🚫 EXCLUIR BOT
    // =========================================

    participantes = participantes.filter(p => {

      const numero = p.id
        ?.split(":")[0]
        ?.split("@")[0];

      return numero && numero !== botNumero;
    });

    // =========================================
    // 🚫 SIN PARTICIPANTES
    // =========================================

    if (participantes.length === 0) {

      await sock.sendMessage(chat, {
        text:
`❌ No hay participantes disponibles.

🎡 La ruleta necesita al menos un participante.`
      });

      return true;
    }

    // =========================================
    // 👥 LISTA DE PARTICIPANTES
    // =========================================

    let lista = "";

    for (let i = 0; i < participantes.length; i++) {

      const numero = participantes[i].id
        .split(":")[0]
        .split("@")[0];

      lista +=
        `${i + 1}. 👤 @${numero}\n`;
    }

    await sock.sendMessage(chat, {
      text:
`╭━━━ 🎡 RULETA TITANBOT ━━━╮
┃
┃ 👥 PARTICIPANTES
┃
${lista}
┃ 🎯 ¡Todos están dentro!
┃
╰━━━━━━━━━━━━━━━━━━━━╯`,
      mentions: participantes.map(p => p.id)
    });

    // =========================================
    // 🎲 PREPARAR RESULTADOS
    // =========================================

    let resultadosDisponibles = mezclar(resultados);

    const resultadosFinales = [];

    // =========================================
    // 🎡 ANIMACIÓN GENERAL
    // =========================================

    await esperar(1200);

    await animacionRuleta(
      sock,
      chat,
      participantes
    );

    // =========================================
    // 🎯 SELECCIONAR CADA PARTICIPANTE
    // =========================================

    for (let i = 0; i < participantes.length; i++) {

      const participante = participantes[i];

      // Si se acabaran los resultados,
      // volvemos a mezclar la lista.
      if (resultadosDisponibles.length === 0) {
        resultadosDisponibles = mezclar(resultados);
      }

      const resultado =
        resultadosDisponibles.pop();

      const numero = participante.id
        .split(":")[0]
        .split("@")[0];

      // =========================================
      // 🎯 SELECCIÓN
      // =========================================

      await sock.sendMessage(chat, {
        text:
`🎯 ¡SELECCIONANDO!

🔄 La ruleta está buscando...

👤 @${numero}`,
        mentions: [participante.id]
      });

      await esperar(800);

      // =========================================
      // 🎉 RESULTADO
      // =========================================

      await sock.sendMessage(chat, {
        text:
`🎉 ¡SE DETUVO!

👤 @${numero}

${resultado[0]} ¡TE TOCÓ: ${resultado[1]}!`,
        mentions: [participante.id]
      });

      resultadosFinales.push({
        id: participante.id,
        numero,
        emoji: resultado[0],
        nombre: resultado[1]
      });

      await esperar(900);
    }

    // =========================================
    // 🏆 RESUMEN FINAL
    // =========================================

    let resumen = "";

    for (const resultado of resultadosFinales) {

      resumen +=
        `👤 @${resultado.numero} → ${resultado.emoji} ${resultado.nombre}\n`;
    }

    await sock.sendMessage(chat, {
      text:
`╭━━━ 🎉 RESULTADOS ━━━╮
┃
${resumen}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🔥 ¡RULETA TERMINADA!
🎡 Gracias por participar.`,
      mentions: resultadosFinales.map(r => r.id)
    });

    return true;

  } catch (error) {

    console.error(
      "❌ Error en la ruleta:",
      error
    );

    await sock.sendMessage(chat, {
      text:
`❌ Ocurrió un error al ejecutar la ruleta.

🔄 Inténtalo nuevamente.`
    });

    return true;
  }
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = ruleta;
