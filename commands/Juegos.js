async function juegos(sock, chat, comando, args) {

  if (comando === "dado") {
    const numero = Math.floor(Math.random() * 6) + 1;

    return sock.sendMessage(chat, {
      text: `🎲 DADO\n\nSalió: ${numero}`
    });
  }

  if (comando === "moneda") {
    const resultado =
      Math.random() < 0.5
        ? "🪙 Cara"
        : "🪙 Cruz";

    return sock.sendMessage(chat, {
      text: `🪙 MONEDA\n\nResultado: ${resultado}`
    });
  }

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
        Math.floor(Math.random() * respuestas.length)
      ];

    return sock.sendMessage(chat, {
      text: `🎱 8 BALL\n\n${respuesta}`
    });
  }

  if (comando === "suerte") {

    const suerte =
      Math.floor(Math.random() * 101);

    return sock.sendMessage(chat, {
      text:
`🍀 TU SUERTE

✨ Nivel de suerte: ${suerte}%`
    });
  }

  if (comando === "numero") {

    const numero =
      Math.floor(Math.random() * 100) + 1;

    return sock.sendMessage(chat, {
      text:
`🔢 NÚMERO ALEATORIO

🎯 Número: ${numero}`
    });
  }

  return false;
}

module.exports = juegos;
