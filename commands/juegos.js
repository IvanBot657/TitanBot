// ========================================
// TITANBOT v3.1
// JUEGOS
// ========================================

async function juegos(
  sock,
  chat,
  comando,
  args,
  id
) {

  // ========================================
  // DADO
  // ========================================

  if (comando === "dado") {

    const resultado =
      Math.floor(Math.random() * 6) + 1;

    await sock.sendMessage(chat, {
      text:
`🎲 DADO

🎯 Resultado: ${resultado}

${resultado === 6
  ? "🔥 ¡Sacaste el máximo!"
  : "¡Buen lanzamiento!"}`
    });

    return true;
  }

  // ========================================
  // MONEDA
  // ========================================

  if (comando === "moneda") {

    const resultado =
      Math.random() < 0.5
        ? "CARA"
        : "SELLO";

    await sock.sendMessage(chat, {
      text:
`🪙 MONEDA

🎯 Resultado: ${resultado}`
    });

    return true;
  }

  // ========================================
  // ADIVINA
  // ========================================

  if (comando === "adivina") {

    const numero =
      parseInt(args[0]);

    if (
      isNaN(numero) ||
      numero < 1 ||
      numero > 10
    ) {

      await sock.sendMessage(chat, {
        text:
`🔢 ADIVINA EL NÚMERO

Debes escribir un número del 1 al 10.

Ejemplo:

.adivina 7`
      });

      return true;
    }

    const secreto =
      Math.floor(
        Math.random() * 10
      ) + 1;

    if (numero === secreto) {

      await sock.sendMessage(chat, {
        text:
`🎉 ¡CORRECTO!

🔢 Número: ${secreto}

🏆 ¡Adivinaste!`
      });

    } else {

      await sock.sendMessage(chat, {
        text:
`❌ No acertaste.

🔢 Tu número: ${numero}
🎯 Era: ${secreto}

¡Inténtalo nuevamente!`
      });
    }

    return true;
  }

  // ========================================
  // PIEDRA PAPEL TIJERA
  // ========================================

  if (
    comando === "ppt" ||
    comando === "piedrapapeltijera"
  ) {

    const opciones = [
      "piedra",
      "papel",
      "tijera"
    ];

    const jugador =
      args[0]?.toLowerCase();

    if (
      !opciones.includes(jugador)
    ) {

      await sock.sendMessage(chat, {
        text:
`✊ PIEDRA, PAPEL O TIJERA

Usa:

.ppt piedra
.ppt papel
.ppt tijera`
      });

      return true;
    }

    const bot =
      opciones[
        Math.floor(
          Math.random() *
          opciones.length
        )
      ];

    let resultado;

    if (jugador === bot) {
      resultado = "🤝 EMPATE";
    }

    else if (
      (jugador === "piedra" && bot === "tijera") ||
      (jugador === "papel" && bot === "piedra") ||
      (jugador === "tijera" && bot === "papel")
    ) {
      resultado = "🏆 ¡GANASTE!";
    }

    else {
      resultado = "🤖 ¡GANÉ YO!";
    }

    await sock.sendMessage(chat, {
      text:
`🎮 PIEDRA, PAPEL O TIJERA

👤 Tú: ${jugador}
🤖 TitanBot: ${bot}

${resultado}`
    });

    return true;
  }

  // ========================================
  // TRIVIA
  // ========================================

  if (comando === "trivia") {

    const preguntas = [

      {
        pregunta:
          "¿Cuál es el planeta más grande del Sistema Solar?",
        respuesta: "jupiter"
      },

      {
        pregunta:
          "¿Cuántos continentes existen?",
        respuesta: "7"
      },

      {
        pregunta:
          "¿Cuál es la capital de Colombia?",
        respuesta: "bogota"
      },

      {
        pregunta:
          "¿Cuánto es 8 × 8?",
        respuesta: "64"
      },

      {
        pregunta:
          "¿Cuál es el océano más grande?",
        respuesta: "pacifico"
      }

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
`🧠 TRIVIA

❓ ${pregunta.pregunta}

💡 Responde usando:

.triviarespuesta TU_RESPUESTA`
    });

    return true;
  }

  // ========================================
  // RESPUESTA DE TRIVIA
  // ========================================

  if (comando === "triviarespuesta") {

    const respuestas = [
      {
        respuesta: "jupiter",
        texto: "Júpiter"
      },
      {
        respuesta: "7",
        texto: "7"
      },
      {
        respuesta: "bogota",
        texto: "Bogotá"
      },
      {
        respuesta: "64",
        texto: "64"
      },
      {
        respuesta: "pacifico",
        texto: "Pacífico"
      }
    ];

    const respuesta =
      args.join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const correcta =
      respuestas.some(
        item =>
          item.respuesta === respuesta
      );

    if (correcta) {

      await sock.sendMessage(chat, {
        text:
`🎉 ¡CORRECTO!

🧠 Muy buena respuesta.`
      });

    } else {

      await sock.sendMessage(chat, {
        text:
`❌ Respuesta incorrecta.

💡 ¡Sigue intentando!`
      });
    }

    return true;
  }

  // ========================================
  // NÚMERO ALEATORIO
  // ========================================

  if (comando === "numero") {

    let max =
      parseInt(args[0]);

    if (
      isNaN(max) ||
      max < 1
    ) {
      max = 100;
    }

    const resultado =
      Math.floor(
        Math.random() * max
      ) + 1;

    await sock.sendMessage(chat, {
      text:
`🔢 NÚMERO ALEATORIO

🎯 Resultado: ${resultado}

📊 Rango: 1-${max}`
    });

    return true;
  }

  // ========================================
  // SUERTE
  // ========================================

  if (comando === "suerte") {

    const resultados = [
      "🍀 ¡Hoy tienes mucha suerte!",
      "⭐ ¡Un buen día te espera!",
      "🔥 ¡Hoy puede ser tu día!",
      "🌟 ¡Algo interesante podría pasar!",
      "😎 ¡Parece que todo va bien!"
    ];

    const resultado =
      resultados[
        Math.floor(
          Math.random() *
          resultados.length
        )
      ];

    await sock.sendMessage(chat, {
      text:
`🔮 SUERTE

${resultado}`
    });

    return true;
  }

  // ========================================
  // 8 BALL
  // ========================================

  if (
    comando === "8ball" ||
    comando === "8bola"
  ) {

    const respuestas = [
      "🎱 Sí, definitivamente.",
      "🎱 Probablemente sí.",
      "🎱 No estoy seguro.",
      "🎱 Probablemente no.",
      "🎱 No.",
      "🎱 Las posibilidades son buenas.",
      "🎱 Mejor inténtalo después."
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
`🎱 8 BALL

${respuesta}`
    });

    return true;
  }

  // ========================================
  // JUEGOS
  // ========================================

  if (comando === "juegos") {

    await sock.sendMessage(chat, {
      text:
`🎮 TITANBOT — JUEGOS

🎲 .dado
🪙 .moneda
🔢 .adivina
✊ .ppt
🧠 .trivia
🎯 .numero
🍀 .suerte
🎱 .8ball

━━━━━━━━━━━━━━

Ejemplo:

.adivina 5
.ppt piedra
.numero 50`
    });

    return true;
  }

  // ========================================
  // NO ES UN COMANDO DE JUEGOS
  // ========================================

  return false;
}

module.exports = juegos;
