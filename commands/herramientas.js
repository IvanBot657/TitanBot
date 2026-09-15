// ==========================================
// TITANBOT v3.1
// HERRAMIENTAS.JS
// ==========================================

async function herramientas(
  sock,
  chat,
  comando,
  args,
  id
) {
  const cmd = comando.toLowerCase();

  // ========================================
  // MENÚ DE HERRAMIENTAS
  // ========================================

  if (cmd === "herramientas" || cmd === "herramienta") {
    await sock.sendMessage(chat, {
      text:
`╔══════════════════════════╗
      🛠️ *HERRAMIENTAS*
╚══════════════════════════╝

🕐 .hora
📅 .fecha
🆔 .id
🎲 .random
🧮 .calculadora
🔠 .mayusculas
🔡 .minusculas
🏓 .ping

⚡ *TitanBot v3.1*`
    });

    return true;
  }

  // ========================================
  // HORA
  // ========================================

  if (cmd === "hora") {
    const ahora = new Date();

    const hora = ahora.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "America/Bogota"
    });

    await sock.sendMessage(chat, {
      text: `🕐 *HORA ACTUAL*\n\n🇨🇴 Colombia: ${hora}`
    });

    return true;
  }

  // ========================================
  // FECHA
  // ========================================

  if (cmd === "fecha") {
    const ahora = new Date();

    const fecha = ahora.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Bogota"
    });

    await sock.sendMessage(chat, {
      text: `📅 *FECHA ACTUAL*\n\n🇨🇴 ${fecha}`
    });

    return true;
  }

  // ========================================
  // ID
  // ========================================

  if (cmd === "id") {
    await sock.sendMessage(chat, {
      text:
`🆔 *ID DEL CHAT*

${chat}

👤 Tu ID:
${id}`
    });

    return true;
  }

  // ========================================
  // RANDOM
  // ========================================

  if (cmd === "random") {
    const minimo = parseInt(args[0]) || 1;
    const maximo = parseInt(args[1]) || 100;

    if (minimo >= maximo) {
      await sock.sendMessage(chat, {
        text: "❌ El primer número debe ser menor que el segundo."
      });

      return true;
    }

    const numero =
      Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;

    await sock.sendMessage(chat, {
      text:
`🎲 *NÚMERO ALEATORIO*

🔢 Resultado: *${numero}*`
    });

    return true;
  }

  // ========================================
  // CALCULADORA
  // ========================================

  if (cmd === "calculadora" || cmd === "calc") {
    if (!args.length) {
      await sock.sendMessage(chat, {
        text:
`🧮 *CALCULADORA*

Uso:

.calculadora 10 + 5
.calculadora 20 * 4
.calculadora 100 / 5
.calculadora 50 - 20`
      });

      return true;
    }

    const expresion = args.join(" ");

    // Solo permite números y operaciones matemáticas básicas
    if (!/^[0-9+\-*/().%\s]+$/.test(expresion)) {
      await sock.sendMessage(chat, {
        text: "❌ Solo puedes utilizar números y operaciones matemáticas básicas."
      });

      return true;
    }

    try {
      const resultado = Function(
        `"use strict"; return (${expresion})`
      )();

      if (!Number.isFinite(resultado)) {
        throw new Error("Resultado inválido");
      }

      await sock.sendMessage(chat, {
        text:
`🧮 *CALCULADORA*

📌 Operación:
${expresion}

✅ Resultado:
*${resultado}*`
      });

    } catch (error) {
      await sock.sendMessage(chat, {
        text: "❌ No pude calcular esa operación."
      });
    }

    return true;
  }

  // ========================================
  // MAYÚSCULAS
  // ========================================

  if (cmd === "mayusculas" || cmd === "mayus") {
    if (!args.length) {
      await sock.sendMessage(chat, {
        text: "❌ Escribe un texto.\n\nEjemplo:\n.mayusculas hola mundo"
      });

      return true;
    }

    const texto = args.join(" ");

    await sock.sendMessage(chat, {
      text: `🔠 *MAYÚSCULAS*\n\n${texto.toUpperCase()}`
    });

    return true;
  }

  // ========================================
  // MINÚSCULAS
  // ========================================

  if (cmd === "minusculas" || cmd === "minus") {
    if (!args.length) {
      await sock.sendMessage(chat, {
        text: "❌ Escribe un texto.\n\nEjemplo:\n.minusculas HOLA MUNDO"
      });

      return true;
    }

    const texto = args.join(" ");

    await sock.sendMessage(chat, {
      text: `🔡 *MINÚSCULAS*\n\n${texto.toLowerCase()}`
    });

    return true;
  }

  // ========================================
  // PING
  // ========================================

  if (cmd === "ping") {
    const inicio = Date.now();

    await sock.sendMessage(chat, {
      text: "🏓 Calculando velocidad..."
    });

    const velocidad = Date.now() - inicio;

    await sock.sendMessage(chat, {
      text:
`🏓 *PONG*

⚡ Velocidad: *${velocidad} ms*
🟢 Estado: ONLINE`
    });

    return true;
  }

  // ========================================
  // NO ES DE ESTE MÓDULO
  // ========================================

  return false;
}

// ==========================================
// EXPORTACIÓN
// ==========================================

module.exports = herramientas;
module.exports.herramientas = herramientas;
