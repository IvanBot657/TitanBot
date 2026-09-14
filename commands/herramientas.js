const config = require("../config");

async function herramientas(sock, chat, comando, args, id) {

  // ========================================
  // MENÚ DE HERRAMIENTAS
  // ========================================

  if (comando === "herramientas") {
    return sock.sendMessage(chat, {
      text:
`🛠️ HERRAMIENTAS TITANBOT

🕐 .hora
Ver la hora actual.

📅 .fecha
Ver la fecha actual.

🧮 .calculadora operación
Hacer cálculos.

🆔 .id
Ver tu ID.

🤖 .botinfo
Información del bot.

━━━━━━━━━━━━━━━━━━

Ejemplo:

.calculadora 25*4+10`
    });
  }


  // ========================================
  // HORA
  // ========================================

  if (comando === "hora") {

    const ahora = new Date();

    const hora = ahora.toLocaleTimeString(
      "es-CO",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "America/Bogota"
      }
    );

    return sock.sendMessage(chat, {
      text:
`🕐 HORA ACTUAL

🇨🇴 Colombia

⏰ ${hora}`
    });
  }


  // ========================================
  // FECHA
  // ========================================

  if (comando === "fecha") {

    const ahora = new Date();

    const fecha = ahora.toLocaleDateString(
      "es-CO",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Bogota"
      }
    );

    return sock.sendMessage(chat, {
      text:
`📅 FECHA ACTUAL

🇨🇴 Colombia

📆 ${fecha}`
    });
  }


  // ========================================
  // CALCULADORA
  // ========================================

  if (comando === "calculadora") {

    if (args.length === 0) {
      return sock.sendMessage(chat, {
        text:
`🧮 CALCULADORA

Escribe una operación.

Ejemplos:

.calculadora 10+5

.calculadora 20*3

.calculadora 100/4

.calculadora (10+5)*2`
      });
    }

    const expresion = args.join(" ");

    // Solo permite números y operaciones básicas
    if (!/^[0-9+\-*/().% ]+$/.test(expresion)) {
      return sock.sendMessage(chat, {
        text:
`❌ OPERACIÓN NO VÁLIDA

Solo puedes utilizar:

🔢 Números
➕ Suma
➖ Resta
✖️ Multiplicación
➗ División
% Porcentaje
( ) Paréntesis`
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

📥 Operación:
${expresion}

📤 Resultado:
${resultado}`
      });

    } catch {

      return sock.sendMessage(chat, {
        text:
`❌ No pude calcular esa operación.

Ejemplo:

.calculadora 25*4`
      });
    }
  }


  // ========================================
  // ID
  // ========================================

  if (comando === "id") {

    return sock.sendMessage(chat, {
      text:
`🆔 TU ID

${id}`
    });
  }


  // ========================================
  // BOT INFO
  // ========================================

  if (comando === "botinfo") {

    return sock.sendMessage(chat, {
      text:
`🤖 INFORMACIÓN DE TITANBOT

╔════════════════════╗
║    🤖 TITANBOT     ║
╚════════════════════╝

📦 Nombre:
${config.nombre}

🔢 Versión:
${config.version}

🟢 Estado:
Online

⚡ Plataforma:
WhatsApp

🔧 Sistema:
Baileys

👑 Creador:
${config.creador}

━━━━━━━━━━━━━━━━━━

🚀 TitanBot v${config.version}`
    });
  }


  return false;
}

module.exports = herramientas;
