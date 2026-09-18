// ========================================
// 🎮 JUEGOS - TITANBOT
// ⭐ XP + 🎯 MISIONES
// ========================================

const {
  agregarXP
} = require("./datosUsuarios");

const {
  avanzarMision
} = require("./misiones");

// ========================================
// ⭐ DAR XP
// ========================================

async function darXP(
  chat,
  id,
  cantidad
) {

  const resultado = agregarXP(
    id,
    cantidad
  );

  let mensaje =
    `\n\n✨ +${cantidad} XP`;

  if (resultado.subioNivel) {

    mensaje +=
      `\n🎉 ¡SUBISTE AL NIVEL ${resultado.usuario.nivel}!`;

  }

  return mensaje;
}

// ========================================
// 🎯 AVANZAR MISIÓN
// ========================================

function registrarMision(
  id,
  tipo
) {

  return avanzarMision(
    id,
    tipo,
    1
  );
}

// ========================================
// 🎁 MENSAJE DE MISIÓN
// ========================================

function mensajeMision(resultado) {

  if (
    !resultado ||
    !resultado.completada ||
    resultado.yaCompletada
  ) {
    return "";
  }

  return `

🎯 *¡MISIÓN COMPLETADA!*
${resultado.mision.nombre}

🎁 Recompensa disponible:
+${resultado.mision.recompensa} XP

💡 Usa:
.misionreclamar`;
}

// ========================================
// 🎮 JUEGOS
// ========================================

async function juegos(
  sock,
  chat,
  comando,
  args = [],
  id
) {

  // ========================================
  // 🎲 DADO
  // ========================================

  if (comando === "dado") {

    const resultado =
      Math.floor(
        Math.random() * 6
      ) + 1;

    const xp =
      await darXP(
        chat,
        id,
        5
      );

    const mision =
      registrarMision(
        id,
        "dado"
      );

    registrarMision(
      id,
      "jugar"
    );

    await sock.sendMessage(
      chat,
      {
        text:
`🎲 *DADO*

🎯 Resultado: ${resultado}

${
  resultado === 6
    ? "🔥 ¡Sacaste el máximo!"
    : "¡Buen lanzamiento!"
}${xp}${mensajeMision(mision)}`
      }
    );

    return true;
  }

  // ========================================
  // 🪙 MONEDA
  // ========================================

  if (comando === "moneda") {

    const resultado =
      Math.random() < 0.5
        ? "CARA"
        : "SELLO";

    const xp =
      await darXP(
        chat,
        id,
        5
      );

    const mision =
      registrarMision(
        id,
        "jugar"
      );

    await sock.sendMessage(
      chat,
      {
        text:
`🪙 *MONEDA*

🎯 Resultado: ${resultado}${xp}${mensajeMision(mision)}`
      }
    );

    return true;
  }

  // ========================================
  // 🔢 ADIVINA
  // ========================================

  if (comando === "adivina") {

    const numero =
      parseInt(args[0]);

    if (
      isNaN(numero) ||
      numero < 1 ||
      numero > 10
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`🔢 *ADIVINA EL NÚMERO*

Debes escribir un número del 1 al 10.

Ejemplo:

.adivina 7`
        }
      );

      return true;
    }

    const secreto =
      Math.floor(
        Math.random() * 10
      ) + 1;

    if (numero === secreto) {

      const xp =
        await darXP(
          chat,
          id,
          10
        );

      const mision =
        registrarMision(
          id,
          "adivina"
        );

      registrarMision(
        id,
        "jugar"
      );

      await sock.sendMessage(
        chat,
        {
          text:
`🎉 *¡CORRECTO!*

🔢 Número: ${secreto}

🏆 ¡Adivinaste!${xp}${mensajeMision(mision)}`
        }
      );

    } else {

      const xp =
        await darXP(
          chat,
          id,
          2
        );

      registrarMision(
        id,
        "jugar"
      );

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *No acertaste.*

🔢 Tu número: ${numero}
🎯 Era: ${secreto}

¡Inténtalo nuevamente!${xp}`
        }
      );
    }

    return true;
  }

  // ========================================
  // ✊ PIEDRA PAPEL TIJERA
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

      await sock.sendMessage(
        chat,
        {
          text:
`✊ *PIEDRA, PAPEL O TIJERA*

Usa:

.ppt piedra
.ppt papel
.ppt tijera`
        }
      );

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
    let cantidadXP = 5;
    let gano = false;

    if (jugador === bot) {

      resultado =
        "🤝 *EMPATE*";

    } else if (
      (jugador === "piedra" &&
        bot === "tijera") ||

      (jugador === "papel" &&
        bot === "piedra") ||

      (jugador === "tijera" &&
        bot === "papel")
    ) {

      resultado =
        "🏆 *¡GANASTE!*";

      cantidadXP = 10;
      gano = true;

    } else {

      resultado =
        "🤖 *¡GANÉ YO!*";

      cantidadXP = 2;
    }

    const xp =
      await darXP(
        chat,
        id,
        cantidadXP
      );

    registrarMision(
      id,
      "jugar"
    );

    let mision = null;

    if (gano) {

      mision =
        registrarMision(
          id,
          "ppt"
        );
    }

    await sock.sendMessage(
      chat,
      {
        text:
`🎮 *PIEDRA, PAPEL O TIJERA*

👤 Tú: ${jugador}
🤖 TitanBot: ${bot}

${resultado}${xp}${mensajeMision(mision)}`
      }
    );

    return true;
  }

  // ========================================
  // 🧠 TRIVIA
  // ========================================

  if (comando === "trivia") {

    const preguntas = [

      {
        pregunta:
          "¿Cuál es el planeta más grande del Sistema Solar?",
        respuesta:
          "jupiter"
      },

      {
        pregunta:
          "¿Cuántos continentes existen?",
        respuesta:
          "7"
      },

      {
        pregunta:
          "¿Cuál es la capital de Colombia?",
        respuesta:
          "bogota"
      },

      {
        pregunta:
          "¿Cuánto es 8 × 8?",
        respuesta:
          "64"
      },

      {
        pregunta:
          "¿Cuál es el océano más grande?",
        respuesta:
          "pacifico"
      }

    ];

    const pregunta =
      preguntas[
        Math.floor(
          Math.random() *
          preguntas.length
        )
      ];

    if (!global.triviasActivas) {
      global.triviasActivas = {};
    }

    global.triviasActivas[id] =
      pregunta;

    await sock.sendMessage(
      chat,
      {
        text:
`🧠 *TRIVIA*

❓ ${pregunta.pregunta}

💡 Responde usando:

.triviarespuesta TU_RESPUESTA`
      }
    );

    return true;
  }

  // ========================================
  // 💡 RESPUESTA TRIVIA
  // ========================================

  if (
    comando === "triviarespuesta"
  ) {

    if (
      !global.triviasActivas ||
      !global.triviasActivas[id]
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ No tienes una trivia activa.

Usa:

.trivia`
        }
      );

      return true;
    }

    const respuesta =
      args
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        );

    const pregunta =
      global.triviasActivas[id];

    delete global.triviasActivas[id];

    if (
      respuesta ===
      pregunta.respuesta
    ) {

      const xp =
        await darXP(
          chat,
          id,
          15
        );

      const mision =
        registrarMision(
          id,
          "trivia"
        );

      registrarMision(
        id,
        "jugar"
      );

      await sock.sendMessage(
        chat,
        {
          text:
`🎉 *¡CORRECTO!*

🧠 Excelente respuesta.${xp}${mensajeMision(mision)}`
        }
      );

    } else {

      const xp =
        await darXP(
          chat,
          id,
          2
        );

      registrarMision(
        id,
        "jugar"
      );

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *Respuesta incorrecta.*

💡 Sigue intentando.${xp}`
        }
      );
    }

    return true;
  }

  // ========================================
  // 🔢 NÚMERO ALEATORIO
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

    const xp =
      await darXP(
        chat,
        id,
        5
      );

    const mision =
      registrarMision(
        id,
        "jugar"
      );

    await sock.sendMessage(
      chat,
      {
        text:
`🔢 *NÚMERO ALEATORIO*

🎯 Resultado: ${resultado}

📊 Rango: 1-${max}${xp}${mensajeMision(mision)}`
      }
    );

    return true;
  }

  // ========================================
  // 🍀 SUERTE
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

    const xp =
      await darXP(
        chat,
        id,
        5
      );

    const mision =
      registrarMision(
        id,
        "jugar"
      );

    await sock.sendMessage(
      chat,
      {
        text:
`🔮 *SUERTE*

${resultado}${xp}${mensajeMision(mision)}`
      }
    );

    return true;
  }

  // ========================================
  // 🎱 8 BALL
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

    const xp =
      await darXP(
        chat,
        id,
        5
      );

    const mision =
      registrarMision(
        id,
        "jugar"
      );

    await sock.sendMessage(
      chat,
      {
        text:
`🎱 *8 BALL*

${respuesta}${xp}${mensajeMision(mision)}`
      }
    );

    return true;
  }

  // ========================================
  // 🎮 LISTA DE JUEGOS
  // ========================================

  if (comando === "juegos") {

    await sock.sendMessage(
      chat,
      {
        text:
`🎮 *TITANBOT — JUEGOS*

🎲 .dado
🪙 .moneda
🔢 .adivina
✊ .ppt
🧠 .trivia
💡 .triviarespuesta
🎯 .numero
🍀 .suerte
🎱 .8ball

━━━━━━━━━━━━━━━━━━

⭐ Todos los juegos dan XP.

🎯 Usa:

.misiones

para ver tus misiones diarias.`
      }
    );

    return true;
  }

  // ========================================
  // ❌ NO ES UN JUEGO
  // ========================================

  return false;
}

// ========================================
// 📦 EXPORTAR
// ========================================

module.exports = juegos;
