async function herramientas(sock, chat, comando, args) {

  // ==============================
  // MENÚ
  // ==============================

  if (comando === "herramientas") {

    return sock.sendMessage(chat, {
      text:
`🛠️ HERRAMIENTAS TITANBOT

🕐 .hora
📅 .fecha
🧮 .calculadora 5+5
🔢 .numero
🆔 .id
🤖 .botinfo`
    });

  }

  // ==============================
  // HORA
  // ==============================

  if (comando === "hora") {

    const ahora =
      new Date();

    const hora =
      ahora.toLocaleTimeString(
        "es-CO",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      );

    return sock.sendMessage(chat, {
      text:
`🕐 HORA ACTUAL

🇨🇴 Colombia:
${hora}`
    });

  }

  // ==============================
  // FECHA
  // ==============================

  if (comando === "fecha") {

    const ahora =
      new Date();

    const fecha =
      ahora.toLocaleDateString(
        "es-CO",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );

    return sock.sendMessage(chat, {
      text:
`📅 FECHA

${fecha}`
    });

  }

  // ==============================
  // CALCULADORA
  // ==============================

  if (comando === "calculadora") {

    const expresion =
      args.join("");

    if (!expresion) {

      return sock.sendMessage(chat, {
        text:
`🧮 CALCULADORA

Ejemplo:

.calculadora 5+5

También puedes usar:

.calculadora 10*5
.calculadora 20/4
.calculadora 10-3`
      });

    }

    // Solo permite números y operaciones básicas
    if (
      !/^[0-9+\-*/().% ]+$/
        .test(expresion)
    ) {

      return sock.sendMessage(chat, {
        text:
          "❌ Solo puedes utilizar números y operaciones matemáticas básicas."
      });

    }

    try {

      const resultado =
        Function(
          `"use strict"; return (${expresion})`
        )();

      if (
        typeof resultado !== "number" ||
        !Number.isFinite(resultado)
      ) {

        throw new Error();

      }

      return sock.sendMessage(chat, {
        text:
`🧮 CALCULADORA

📌 Operación:
${expresion}

✅ Resultado:
${resultado}`
      });

    } catch {

      return sock.sendMessage(chat, {
        text:
          "❌ No pude calcular esa operación."
      });

    }

  }

  // ==============================
  // ID
  // ==============================

  if (comando === "id") {

    return sock.sendMessage(chat, {
      text:
`🆔 ID DEL CHAT

${chat}`
    });

  }

  // ==============================
  // INFORMACIÓN DEL BOT
  // ==============================

  if (comando === "botinfo") {

    return sock.sendMessage(chat, {
      text:
`🤖 TITANBOT

📦 Versión: 2.5.0
🟢 Estado: Online
⚡ Sistema: WhatsApp
🛠️ Categoría: Herramientas`
    });

  }

  return false;
}

module.exports = herramientas;
