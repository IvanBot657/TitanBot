// =========================================
// 🎰 TITANBOT - RULETA
// Máximo 4 participantes aleatorios
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
// ⏳ ESPERAR
// =========================================

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =========================================
// 🔀 MEZCLAR LISTA
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
// 🎡 ANIMACIÓN DE RULETA
// =========================================

async function animacionRuleta(sock, chat, participantes) {

  await sock.sendMessage(chat, {
    text:
      `🎡 *RULETA TITANBOT* 🎡\n\n` +
      `👥 Participantes seleccionados: *${participantes.length}*\n\n` +
      `🎲 La ruleta está comenzando...`
  });

  await esperar(1200);

  const frames = [
    "⬜⬜⬜⬜⬜\n⬜🔵⬜⬜⬜",
    "⬜⬜⬜⬜⬜\n⬜⬜🟣⬜⬜",
    "⬜⬜⬜⬜⬜\n⬜⬜⬜🟢⬜",
    "⬜⬜⬜⬜⬜\n⬜⬜⬜⬜🔴",
    "⬜⬜⬜⬜⬜\n⬜⬜⬜🟡⬜",
    "⬜⬜⬜⬜⬜\n⬜⬜🟠⬜⬜"
  ];

  for (const frame of frames) {

    await sock.sendMessage(chat, {
      text:
        `🎡 *RULETA GIRANDO...*\n\n` +
        frame
    });

    await esperar(500);
  }

  await sock.sendMessage(chat, {
    text:
      `🔥 *¡RULETA LISTA!*\n\n` +
      `🎯 Se seleccionarán los participantes uno por uno...`
  });

  await esperar(1000);
}

// =========================================
// 🎰 FUNCIÓN PRINCIPAL
// =========================================

async function ruleta(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  // =========================================
  // COMANDO
  // =========================================

  if (comando !== "ruleta") {
    return false;
  }

  // =========================================
  // SOLO GRUPOS
  // =========================================

  if (!chat.endsWith("@g.us")) {

    await sock.sendMessage(chat, {
      text:
        "❌ *Este comando solo funciona en grupos.*"
    });

    return true;
  }

  try {

    // =========================================
    // OBTENER INFORMACIÓN DEL GRUPO
    // =========================================

    const metadata = await sock.groupMetadata(chat);

    let participantes = metadata.participants || [];

    // =========================================
    // OBTENER ID DEL BOT
    // =========================================

    const botId = sock.user?.id
      ? sock.user.id.split(":")[0] + "@s.whatsapp.net"
      : null;

    // =========================================
    // QUITAR AL BOT
    // =========================================

    participantes = participantes.filter(
      participante => {

        const participanteId =
          participante.id?.split(":")[0] +
          "@s.whatsapp.net";

        return participanteId !== botId;
      }
    );

    // =========================================
    // COMPROBAR PARTICIPANTES
    // =========================================

    if (participantes.length === 0) {

      await sock.sendMessage(chat, {
        text:
          "❌ No hay participantes disponibles para la ruleta."
      });

      return true;
    }

    // =========================================
    // 🎲 MEZCLAR PARTICIPANTES
    // =========================================

    participantes = mezclar(participantes);

    // =========================================
    // ⭐ MÁXIMO 4 PARTICIPANTES
    // =========================================

    participantes = participantes.slice(0, 4);

    // =========================================
    // MOSTRAR PARTICIPANTES
    // =========================================

    const menciones = participantes.map(
      participante => `@${participante.id.split("@")[0]}`
    );

    await sock.sendMessage(chat, {
      text:
        `🎰 *RULETA TITANBOT* 🎰\n\n` +
        `🎲 Se han seleccionado *${participantes.length} participantes* al azar.\n\n` +
        `👥 *Participantes:*\n\n` +
        menciones.map(
          (nombre, index) =>
            `${index + 1}. ${nombre}`
        ).join("\n") +
        `\n\n🎯 ¡La ruleta comenzará ahora!`,
      mentions: participantes.map(
        participante => participante.id
      )
    });

    await esperar(1500);

    // =========================================
    // 🎡 ANIMACIÓN
    // =========================================

    await animacionRuleta(
      sock,
      chat,
      participantes
    );

    // =========================================
    // 🎲 PREPARAR RESULTADOS
    // =========================================

    let resultadosDisponibles = mezclar(
      resultados
    );

    const resultadosFinales = [];

    // =========================================
    // 🎯 SELECCIONAR CADA PARTICIPANTE
    // =========================================

    for (
      let i = 0;
      i < participantes.length;
      i++
    ) {

      const participante = participantes[i];

      const numero =
        `@${participante.id.split("@")[0]}`;

      // -----------------------------------------
      // ANUNCIO
      // -----------------------------------------

      await sock.sendMessage(chat, {
        text:
          `🎯 *SELECCIONANDO...*\n\n` +
          `👤 ${numero}\n\n` +
          `🎡 La ruleta está girando...`,
        mentions: [participante.id]
      });

      await esperar(1200);

      // -----------------------------------------
      // TOMAR RESULTADO
      // -----------------------------------------

      if (resultadosDisponibles.length === 0) {
        resultadosDisponibles = mezclar(
          resultados
        );
      }

      const resultado =
        resultadosDisponibles.shift();

      resultadosFinales.push({
        participante,
        emoji: resultado[0],
        resultado: resultado[1]
      });

      // -----------------------------------------
      // RESULTADO
      // -----------------------------------------

      await sock.sendMessage(chat, {
        text:
          `🎉 *¡SE DETUVO!*\n\n` +
          `👤 ${numero}\n\n` +
          `${resultado[0]} *¡TE TOCÓ: ${resultado[1]}!*`,
        mentions: [participante.id]
      });

      await esperar(1200);
    }

    // =========================================
    // 🏆 RESULTADO FINAL
    // =========================================

    let resumen =
      `╭━━━ 🎉 RESULTADOS ━━━╮\n`;

    for (
      let i = 0;
      i < resultadosFinales.length;
      i++
    ) {

      const dato =
        resultadosFinales[i];

      const numero =
        `@${dato.participante.id.split("@")[0]}`;

      resumen +=
        `┃ ${i + 1}. ${numero}\n` +
        `┃    ${dato.emoji} ${dato.resultado}\n`;
    }

    resumen +=
      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `🔥 *¡RULETA TERMINADA!* 🔥`;

    await sock.sendMessage(chat, {
      text: resumen,
      mentions: resultadosFinales.map(
        dato => dato.participante.id
      )
    });

    return true;

  } catch (error) {

    console.error(
      "❌ Error en ruleta:",
      error
    );

    await sock.sendMessage(chat, {
      text:
        "❌ Ocurrió un error al ejecutar la ruleta."
    });

    return true;
  }
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = ruleta;
