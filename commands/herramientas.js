async function herramientas(
  sock,
  chat,
  comando,
  args,
  id
) {

  // ==========================
  // HORA
  // ==========================

  if (comando === "hora") {

    const hora =
      new Date().toLocaleTimeString();

    return sock.sendMessage(chat, {

      text:
`🕒 HORA

${hora}`

    });

  }

  // ==========================
  // FECHA
  // ==========================

  if (comando === "fecha") {

    const fecha =
      new Date().toLocaleDateString();

    return sock.sendMessage(chat, {

      text:
`📅 FECHA

${fecha}`

    });

  }

  // ==========================
  // ID
  // ==========================

  if (comando === "id") {

    return sock.sendMessage(chat, {

      text:
`🆔 ID

${id}`

    });

  }

  // ==========================
  // RANDOM
  // ==========================

  if (comando === "random") {

    const min =
      Number(args[0]);

    const max =
      Number(args[1]);

    if (
      isNaN(min) ||
      isNaN(max)
    ) {

      return sock.sendMessage(chat, {

        text:
`🎲 Usa:

.random 1 100`

      });

    }

    const numero =
      Math.floor(
        Math.random() *
        (max - min + 1)
      ) + min;

    return sock.sendMessage(chat, {

      text:
`🎲 RANDOM

Resultado:

${numero}`

    });

  }

  // ==========================
  // CALCULADORA
  // ==========================

  if (comando === "calculadora") {

    const operacion =
      args.join("");

    if (!operacion) {

      return sock.sendMessage(chat, {

        text:
`🔢 Usa:

.calculadora 5+5`

      });

    }

    try {

      const resultado =
        eval(operacion);

      return sock.sendMessage(chat, {

        text:
`🔢 RESULTADO

${resultado}`

      });

    } catch {

      return sock.sendMessage(chat, {

        text:
"❌ Operación inválida."

      });

    }

  }

  // ==========================
  // MAYUSCULAS
  // ==========================

  if (comando === "mayusculas") {

    const texto =
      args.join(" ");

    if (!texto) {

      return sock.sendMessage(chat, {

        text:
`🔤 Usa:

.mayusculas hola mundo`

      });

    }

    return sock.sendMessage(chat, {

      text:
texto.toUpperCase()

    });

  }

  // ==========================
  // MINUSCULAS
  // ==========================

  if (comando === "minusculas") {

    const texto =
      args.join(" ");

    if (!texto) {

      return sock.sendMessage(chat, {

        text:
`🔡 Usa:

.minusculas HOLA MUNDO`

      });

    }

    return sock.sendMessage(chat, {

      text:
texto.toLowerCase()

    });

  }

  // ==========================
  // PING
  // ==========================

  if (comando === "ping") {

    return sock.sendMessage(chat, {

      text:
`🏓 PONG

🟢 TitanBot Online`

    });

  }

  return false;

}

module.exports = herramientas;
