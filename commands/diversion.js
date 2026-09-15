// ==============================
// DIVERSIÓN - TITANBOT v3.1
// ==============================

async function diversion(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const cmd =
    String(comando || "").toLowerCase();

  // ==============================
  // SHIP
  // ==============================

  if (cmd === "ship") {

    const porcentaje =
      Math.floor(Math.random() * 101);

    await sock.sendMessage(chat, {
      text:
`💖 SHIP 💖

Compatibilidad:
${porcentaje}%`
    });

    return true;
  }

  // ==============================
  // COMPATIBILIDAD
  // ==============================

  if (cmd === "compatibilidad") {

    const porcentaje =
      Math.floor(Math.random() * 101);

    await sock.sendMessage(chat, {
      text:
`💕 Compatibilidad:

${porcentaje}%`
    });

    return true;
  }

  // ==============================
  // GAY
  // ==============================

  if (cmd === "gay") {

    const porcentaje =
      Math.floor(Math.random() * 101);

    await sock.sendMessage(chat, {
      text:
`🏳️‍🌈 Nivel Gay:

${porcentaje}%`
    });

    return true;
  }

  // ==============================
  // CRUSH
  // ==============================

  if (cmd === "crush") {

    const porcentaje =
      Math.floor(Math.random() * 101);

    await sock.sendMessage(chat, {
      text:
`😍 Tu crush te ama un:

${porcentaje}%`
    });

    return true;
  }

  // ==============================
  // SUERTE
  // ==============================

  if (cmd === "suerte") {

    const porcentaje =
      Math.floor(Math.random() * 101);

    await sock.sendMessage(chat, {
      text:
`🍀 Suerte de hoy:

${porcentaje}%`
    });

    return true;
  }

  // ==============================
  // FRASE
  // ==============================

  if (cmd === "frase") {

    const frases = [
      "Nunca te rindas.",
      "El éxito requiere esfuerzo.",
      "Todo gran viaje empieza con un paso.",
      "Confía en ti mismo.",
      "Hoy puede ser un gran día."
    ];

    const frase =
      frases[
        Math.floor(
          Math.random() *
          frases.length
        )
      ];

    await sock.sendMessage(chat, {
      text:
`📜 Frase:

${frase}`
    });

    return true;
  }

  // ==============================
  // CHISTE
  // ==============================

  if (cmd === "chiste") {

    const chistes = [
      "¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
      "¿Qué le dice un techo a otro? Techo de menos.",
      "¿Cómo se despiden los químicos? Ácido un placer.",
      "¿Qué hace una vaca cuando sale el sol? Sombra.",
      "¿Por qué lloraba el libro? Porque tenía muchos problemas."
    ];

    const chiste =
      chistes[
        Math.floor(
          Math.random() *
          chistes.length
        )
      ];

    await sock.sendMessage(chat, {
      text:
`😂 Chiste:

${chiste}`
    });

    return true;
  }

  // ==============================
  // VERDAD
  // ==============================

  if (cmd === "verdad") {

    const preguntas = [
      "¿Cuál es tu mayor miedo?",
      "¿Quién te gusta actualmente?",
      "¿Has mentido hoy?",
      "¿Qué secreto guardas?",
      "¿Qué cambiarías de tu vida?"
    ];

    const pregunta =
      preguntas[
        Math.floor(
          Math.random() *
          preguntas.length
        )
      ];

    await sock.sendMessage(chat, {
      text:
`🤔 Verdad:

${pregunta}`
    });

    return true;
  }

  // ==============================
  // RETO
  // ==============================

  if (cmd === "reto") {

    const retos = [
      "Envía un emoji raro.",
      "Habla solo con emojis por 5 minutos.",
      "Cambia tu foto por 10 minutos.",
      "Escribe tu nombre al revés.",
      "Cuenta un chiste."
    ];

    const reto =
      retos[
        Math.floor(
          Math.random() *
          retos.length
        )
      ];

    await sock.sendMessage(chat, {
      text:
`🔥 Reto:

${reto}`
    });

    return true;
  }

  // ==============================
  // 8BALL
  // ==============================

  if (cmd === "8ball") {

    const respuestas = [
      "Sí.",
      "No.",
      "Probablemente.",
      "Definitivamente.",
      "Pregunta más tarde.",
      "No lo creo.",
      "Claro que sí.",
      "Muy dudoso."
    ];

    const respuesta =
      respuestas[
        Math.floor(
          Math.random() *
          respuestas.length
        )
      ];

    await sock.sendMessage(chat, {
      text:
`🎱 Bola Mágica:

${respuesta}`
    });

    return true;
  }

  return false;
}

module.exports = diversion;
module.exports.diversion = diversion;
