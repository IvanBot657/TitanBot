async function juegos(sock, chat, comando, args) {

  // ==============================
  // DADO
  // ==============================

  if (comando === "dado") {

    const numero =
      Math.floor(Math.random() * 6) + 1;

    return sock.sendMessage(chat, {
      text:
`🎲 DADO

🎯 Salió:
${numero}`
    });

  }

  // ==============================
  // MONEDA
  // ==============================

  if (comando === "moneda") {

    const resultado =
      Math.random() < 0.5
        ? "🪙 CARA"
        : "🪙 CRUZ";

    return sock.sendMessage(chat, {
      text:
`🪙 MONEDA

Resultado:
${resultado}`
    });

  }

  // ==============================
  // 8 BALL
  // ==============================

  if (comando === "8ball") {

    const respuestas = [

      "🎱 Sí, definitivamente.",
      "🎱 Parece que sí.",
      "🎱 Probablemente.",
      "🎱 No estoy seguro.",
      "🎱 Mejor pregunta después.",
      "🎱 Las señales dicen que no.",
      "🎱 No.",
      "🎱 Definitivamente no."

    ];

    const respuesta =
      respuestas[
        Math.floor(
          Math.random() *
          respuestas.length
        )
      ];

    return sock.sendMessage(chat, {
      text:
`🎱 8 BALL

${respuesta}`
    });

  }

  // ==============================
  // SUERTE
  // ==============================

  if (comando === "suerte") {

    const suerte =
      Math.floor(
        Math.random() * 101
      );

    return sock.sendMessage(chat, {
      text:
`🍀 TU SUERTE

✨ Nivel de suerte:
${suerte}%`
    });

  }

  // ==============================
  // NÚMERO ALEATORIO
  // ==============================

  if (comando === "numero") {

    const numero =
      Math.floor(
        Math.random() * 100
      ) + 1;

    return sock.sendMessage(chat, {
      text:
`🔢 NÚMERO ALEATORIO

🎯 Número:
${numero}`
    });

  }

  // ==============================
  // ADIVINA EL NÚMERO
  // ==============================

  if (comando === "adivina") {

    const numeroSecreto =
      Math.floor(
        Math.random() * 10
      ) + 1;

    const intento =
      parseInt(args[0]);

    if (
      !intento ||
      intento < 1 ||
      intento > 10
    ) {

      return sock.sendMessage(chat, {
        text:
`🎯 ADIVINA EL NÚMERO

Estoy pensando en un número del 1 al 10.

Usa:

.adivina 5`
      });

    }

    if (
      intento === numeroSecreto
    ) {

      return sock.sendMessage(chat, {
        text:
`🎉 ¡GANASTE!

🎯 El número era:
${numeroSecreto}

🏆 ¡Acertaste!`
      });

    }

    return sock.sendMessage(chat, {
      text:
`❌ No acertaste.

Tu número:
${intento}

El número correcto era:
${numeroSecreto}

🎯 ¡Inténtalo otra vez!`
    });

  }

  // ==============================
  // PIEDRA PAPEL TIJERA
  // ==============================

  if (comando === "ppt") {

    const opciones = [
      "piedra",
      "papel",
      "tijera"
    ];

    const eleccionBot =
      opciones[
        Math.floor(
          Math.random() *
          opciones.length
        )
      ];

    const eleccionUsuario =
      (args[0] || "")
        .toLowerCase();

    if (
      !opciones.includes(
        eleccionUsuario
      )
    ) {

      return sock.sendMessage(chat, {
        text:
`✊ PIEDRA • PAPEL • TIJERA

Usa:

.ppt piedra
.ppt papel
.ppt tijera`
      });

    }

    let resultado = "";

    if (
      eleccionUsuario ===
      eleccionBot
    ) {

      resultado =
        "🤝 ¡EMPATE!";

    } else if (

      (eleccionUsuario === "piedra" &&
        eleccionBot === "tijera") ||

      (eleccionUsuario === "papel" &&
        eleccionBot === "piedra") ||

      (eleccionUsuario === "tijera" &&
        eleccionBot === "papel")

    ) {

      resultado =
        "🎉 ¡GANASTE!";

    } else {

      resultado =
        "😢 ¡PERDISTE!";

    }

    return sock.sendMessage(chat, {
      text:
`✊ PIEDRA • PAPEL • TIJERA

👤 Tú:
${eleccionUsuario}

🤖 TitanBot:
${eleccionBot}

${resultado}`
    });

  }

  // ==============================
  // JUEGO DE DADOS
  // ==============================

  if (comando === "dados") {

    const dado1 =
      Math.floor(
        Math.random() * 6
      ) + 1;

    const dado2 =
      Math.floor(
        Math.random() * 6
      ) + 1;

    const total =
      dado1 + dado2;

    return sock.sendMessage(chat, {
      text:
`🎲🎲 DOBLE DADO

Dado 1: ${dado1}
Dado 2: ${dado2}

🎯 Total:
${total}`
    });

  }

  // ==============================
  // MENÚ DE JUEGOS
  // ==============================

  if (comando === "juegos") {

    return sock.sendMessage(chat, {
      text:
`🎮 JUEGOS TITANBOT

🎲 .dado
🪙 .moneda
🎱 .8ball
🍀 .suerte
🔢 .numero
🎯 .adivina 5
✊ .ppt piedra
🎲 .dados`
    });

  }

  return false;
}

module.exports = juegos;
