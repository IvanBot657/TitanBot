// commands/diversion.js
// TitanBot - Comandos de diversión

function obtenerObjetivo(msg, args = []) {
  const contexto =
    msg?.message?.extendedTextMessage?.contextInfo;

  // Persona mencionada
  if (contexto?.mentionedJid?.length) {
    return contexto.mentionedJid[0];
  }

  // Persona a la que se respondió
  if (contexto?.participant) {
    return contexto.participant;
  }

  // Número escrito después del comando
  if (Array.isArray(args) && args.length > 0) {
    const numero = String(args[0]).replace(/\D/g, "");

    if (numero.length >= 7) {
      return `${numero}@s.whatsapp.net`;
    }
  }

  return null;
}

async function diversion(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {
  try {
    if (!sock || !chat) {
      console.error("❌ Datos incorrectos en diversión");
      return false;
    }

    comando = String(comando || "")
      .toLowerCase()
      .replace(/^\./, "");

    // ==============================
    // OBJETIVO
    // ==============================

    const objetivo = obtenerObjetivo(msg, args);

    // ==============================
    // SHIP
    // ==============================

    if (comando === "ship") {
      if (!objetivo) {
        await sock.sendMessage(
          chat,
          {
            text:
              "💘 *SHIP*\n\n" +
              "Menciona a alguien para calcular el ship.\n\n" +
              "Ejemplo:\n" +
              ".ship @usuario"
          },
          { quoted: msg }
        );

        return true;
      }

      const amor = Math.floor(Math.random() * 101);
      const numero = objetivo.split("@")[0];

      await sock.sendMessage(
        chat,
        {
          text:
            `💘 *SHIP*\n\n` +
            `❤️ Compatibilidad: *${amor}%*\n\n` +
            `@${numero} 💕`,
          mentions: [objetivo]
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // COMPATIBILIDAD
    // ==============================

    if (comando === "compatibilidad") {
      if (!objetivo) {
        await sock.sendMessage(
          chat,
          {
            text:
              "🤝 *COMPATIBILIDAD*\n\n" +
              "Menciona a alguien.\n\n" +
              "Ejemplo:\n" +
              ".compatibilidad @usuario"
          },
          { quoted: msg }
        );

        return true;
      }

      const porcentaje =
        Math.floor(Math.random() * 101);

      const numero = objetivo.split("@")[0];

      await sock.sendMessage(
        chat,
        {
          text:
            `🤝 *COMPATIBILIDAD*\n\n` +
            `@${numero}: *${porcentaje}%*`,
          mentions: [objetivo]
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // GAY
    // ==============================

    if (comando === "gay") {
      const porcentaje =
        Math.floor(Math.random() * 101);

      await sock.sendMessage(
        chat,
        {
          text:
            `🏳️‍🌈 *GAYÓMETRO*\n\n` +
            `Resultado: *${porcentaje}%* 😂`
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // CRUSH
    // ==============================

    if (comando === "crush") {
      const porcentaje =
        Math.floor(Math.random() * 101);

      await sock.sendMessage(
        chat,
        {
          text:
            `💘 *CRUSH*\n\n` +
            `Nivel de crush: *${porcentaje}%* 😳💕`
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // SUERTE
    // ==============================

    if (comando === "suerte") {
      const mensajes = [
        "🍀 Hoy la suerte está de tu lado.",
        "✨ Puede que tengas un día increíble.",
        "🎯 Todo depende de tus decisiones.",
        "🍀 La suerte te sonríe hoy.",
        "😎 Parece que vienen cosas buenas.",
        "🌟 Hoy puede ser un gran día.",
        "💫 Las cosas pueden salir mejor de lo esperado."
      ];

      const resultado =
        mensajes[
          Math.floor(Math.random() * mensajes.length)
        ];

      await sock.sendMessage(
        chat,
        {
          text:
            `🍀 *SUERTE*\n\n${resultado}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // FRASE
    // ==============================

    if (comando === "frase") {
      const frases = [
        "✨ Cada día es una nueva oportunidad.",
        "🔥 Nunca dejes de aprender.",
        "😎 Sé tú mismo.",
        "🚀 Los grandes sueños empiezan con pequeños pasos.",
        "💫 Todo esfuerzo cuenta.",
        "🌟 Cree en lo que puedes lograr."
      ];

      const frase =
        frases[
          Math.floor(Math.random() * frases.length)
        ];

      await sock.sendMessage(
        chat,
        {
          text:
            `💭 *FRASE DEL DÍA*\n\n${frase}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // CHISTE
    // ==============================

    if (comando === "chiste") {
      const chistes = [
        "😂 ¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
        "🤣 ¿Qué le dijo un techo a otro? Techo de menos.",
        "😂 ¿Cuál es el colmo de un electricista? No encontrar su corriente de trabajo.",
        "🤣 ¿Qué hace un pez? ¡Nada!",
        "😂 ¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas."
      ];

      const chiste =
        chistes[
          Math.floor(Math.random() * chistes.length)
        ];

      await sock.sendMessage(
        chat,
        {
          text:
            `😂 *CHISTE*\n\n${chiste}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // VERDAD
    // ==============================

    if (comando === "verdad") {
      const preguntas = [
        "👀 ¿Cuál es tu mayor sueño?",
        "😳 ¿Cuál ha sido tu momento más vergonzoso?",
        "🤔 ¿Qué cosa cambiarías de tu pasado?",
        "😂 ¿Cuál es tu hábito más raro?",
        "💭 ¿Qué persona admiras mucho?",
        "🎯 ¿Cuál es una meta que quieres conseguir?"
      ];

      const pregunta =
        preguntas[
          Math.floor(Math.random() * preguntas.length)
        ];

      await sock.sendMessage(
        chat,
        {
          text:
            `🗣️ *VERDAD*\n\n${pregunta}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // RETO
    // ==============================

    if (comando === "reto") {
      const retos = [
        "😎 Envía un emoji que represente tu estado de ánimo.",
        "😂 Cuenta un chiste en el grupo.",
        "🎵 Escribe el nombre de una canción que te guste.",
        "⭐ Di algo positivo sobre alguien del grupo.",
        "🤣 Manda un mensaje usando solamente emojis."
      ];

      const reto =
        retos[
          Math.floor(Math.random() * retos.length)
        ];

      await sock.sendMessage(
        chat,
        {
          text:
            `🔥 *RETO*\n\n${reto}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // 8 BALL
    // ==============================

    if (
      comando === "8ball" ||
      comando === "8ball"
    ) {
      const respuestas = [
        "🎱 Sí.",
        "🎱 No.",
        "🎱 Definitivamente.",
        "🎱 Probablemente.",
        "🎱 No estoy seguro.",
        "🎱 Pregunta nuevamente.",
        "🎱 Las señales apuntan a que sí."
      ];

      const respuesta =
        respuestas[
          Math.floor(Math.random() * respuestas.length)
        ];

      await sock.sendMessage(
        chat,
        {
          text:
            `🎱 *8 BALL*\n\n${respuesta}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ==============================
    // COMANDO NO ENCONTRADO
    // ==============================

    return false;

  } catch (error) {
    console.error(
      "❌ Error en diversión:",
      error
    );

    return true;
  }
}

module.exports = diversion;
