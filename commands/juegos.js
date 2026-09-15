async function juegos(
  sock,
  chat,
  comando,
  args,
  id
) {

  // ==========================
  // DADO
  // ==========================

  if (comando === "dado") {

    const numero =
      Math.floor(
        Math.random() * 6
      ) + 1;

    return sock.sendMessage(
      chat,
      {
        text:
`🎲 DADO

Resultado:

${numero}`
      }
    );

  }

  // ==========================
  // MONEDA
  // ==========================

  if (comando === "moneda") {

    const resultado =
      Math.random() < 0.5
        ? "🪙 Cara"
        : "🪙 Sello";

    return sock.sendMessage(
      chat,
      {
        text:
`🪙 MONEDA

Resultado:

${resultado}`
      }
    );

  }

  // ==========================
  // ADIVINA
  // ==========================

  if (comando === "adivina") {

    const numeroUsuario =
      Number(args[0]);

    if (
      !numeroUsuario ||
      numeroUsuario < 1 ||
      numeroUsuario > 10
    ) {

      return sock.sendMessage(
        chat,
        {
          text:
`🎯 ADIVINA

Usa:

.adivina número

Ejemplo:

.adivina 7`
        }
      );

    }

    const secreto =
      Math.floor(
        Math.random() * 10
      ) + 1;

    if (
      numeroUsuario === secreto
    ) {

      return sock.sendMessage(
        chat,
        {
          text:
`🎯 ADIVINA

Número secreto:

${secreto}

🏆 ¡Ganaste!`
        }
      );

    }

    return sock.sendMessage(
      chat,
      {
        text:
`🎯 ADIVINA

Número secreto:

${secreto}

❌ Perdiste`
      }
    );

  }

  // ==========================
  // SLOT
  // ==========================

  if (comando === "slot") {

    const simbolos = [
      "🍒",
      "🍋",
      "🍇",
      "💎",
      "7️⃣"
    ];

    const a =
      simbolos[
        Math.floor(
          Math.random() *
          simbolos.length
        )
      ];

    const b =
      simbolos[
        Math.floor(
          Math.random() *
          simbolos.length
        )
      ];

    const c =
      simbolos[
        Math.floor(
          Math.random() *
          simbolos.length
        )
      ];

    let mensaje =
`🎰 SLOT

${a} ${b} ${c}

`;

    if (
      a === b &&
      b === c
    ) {

      mensaje +=
        "🏆 ¡JACKPOT!";

    } else {

      mensaje +=
        "😢 Sigue intentando";

    }

    return sock.sendMessage(
      chat,
      {
        text: mensaje
      }
    );

  }

  // ==========================
  // TRIVIA
  // ==========================

  if (comando === "trivia") {

    const preguntas = [

      {
        pregunta:
          "¿Capital de Colombia?",
        respuesta:
          "Bogotá"
      },

      {
        pregunta:
          "¿Cuántos días tiene una semana?",
        respuesta:
          "7"
      },

      {
        pregunta:
          "¿Planeta rojo?",
        respuesta:
          "Marte"
      }

    ];

    const trivia =
      preguntas[
        Math.floor(
          Math.random() *
          preguntas.length
        )
      ];

    return sock.sendMessage(
      chat,
      {
        text:
`❓ TRIVIA

${trivia.pregunta}

Respuesta:

${trivia.respuesta}`
      }
    );

  }

  // ==========================
  // RULETA
  // ==========================

  if (comando === "ruleta") {

    const opciones = [
      "🔴 Rojo",
      "⚫ Negro",
      "🟢 Verde"
    ];

    const resultado =
      opciones[
        Math.floor(
          Math.random() *
          opciones.length
        )
      ];

    return sock.sendMessage(
      chat,
      {
        text:
`🎡 RULETA

Resultado:

${resultado}`
      }
    );

  }

  return false;

}

module.exports = juegos;
