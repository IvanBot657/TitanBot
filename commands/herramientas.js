async function herramientas(
  sock,
  chat,
  comando,
  args,
  id
) {

  // =========================
  // MENÚ DE HERRAMIENTAS
  // =========================

  if (comando === "herramientas") {

    return sock.sendMessage(chat, {
      text:
`🛠️ HERRAMIENTAS TITANBOT

🕐 .hora
📅 .fecha
🧮 .calculadora
🆔 .id
🤖 .botinfo

Ejemplos:

.calculadora 25+25
.hora
.fecha
.id`
    });
  }

  // =========================
  // HORA
  // =========================

  if (comando === "hora") {

    const ahora =
      new Date();

    const hora =
      ahora.toLocaleTimeString(
        "es-CO",
        {
          timeZone: "America/Bogota",
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

  // =========================
  // FECHA
  // =========================

  if (comando === "fecha") {

    const ahora =
      new Date();

    const fecha =
      ahora.toLocaleDateString(
        "es-CO",
        {
          timeZone: "America/Bogota",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );

    return sock.sendMessage(chat, {
      text:
`📅 FECHA

🇨🇴 ${fecha}`
    });
  }

  // =========================
  // CALCULADORA
  // =========================

  if (comando === "calculadora") {

    const expresion =
      args.join("");

    if (!expresion) {

      return sock.sendMessage(chat, {
        text:
`🧮 CALCULADORA

Escribe una operación.

Ejemplos:

.calculadora 25+25
.calculadora 100/4
.calculadora 10*5
.calculadora 50-20`
      });
    }

    // Solo permite números y operadores
    if (
      !/^[0-9+\-*/().% ]+$/.test(
        expresion
      )
    ) {

      return sock.sendMessage(chat, {
        text:
          "❌ La operación contiene caracteres no permitidos."
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

  // =========================
  // ID
  // =========================

  if (comando === "id") {

    return sock.sendMessage(chat, {
      text:
`🆔 ID

${id}`
    });
  }

  // =========================
  // INFORMACIÓN DEL BOT
  // =========================

  if (comando === "botinfo") {

    return sock.sendMessage(chat, {
      text:
`🤖 TITANBOT

📦 Versión:
2.5.0

🟢 Estado:
Online

⚡ Plataforma:
WhatsApp

🔧 Sistema:
Baileys

👨‍💻 Proyecto:
TitanBot`
    });
  }

  return false;
}

module.exports = herramientas;
