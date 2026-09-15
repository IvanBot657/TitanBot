// commands/diversion.js
// TitanBot - Comandos de diversión

function limpiarNumero(jid) {
  return jid ? jid.split("@")[0] : "";
}

function obtenerObjetivo(m, args = []) {
  const contexto = m?.message?.extendedTextMessage?.contextInfo;

  if (contexto?.mentionedJid?.length) {
    return contexto.mentionedJid[0];
  }

  if (contexto?.participant) {
    return contexto.participant;
  }

  if (args.length > 0) {
    const numero = args[0].replace(/\D/g, "");

    if (numero.length >= 7) {
      return `${numero}@s.whatsapp.net`;
    }
  }

  return null;
}

async function diversion(sock, m, comando, args = []) {
  try {
    if (!m?.key?.remoteJid) return true;

    const chat = m.key.remoteJid;
    const objetivo = obtenerObjetivo(m, args);

    const porcentaje = Math.floor(Math.random() * 101);

    if (comando === "ship") {
      if (!objetivo) {
        await sock.sendMessage(
          chat,
          { text: "💘 Menciona a alguien para calcular el ship." },
          { quoted: m }
        );
        return true;
      }

      const amor = Math.floor(Math.random() * 101);

      await sock.sendMessage(
        chat,
        {
          text:
            `💘 *SHIP*\n\n` +
            `❤️ Compatibilidad: *${amor}%*\n\n` +
            `Que viva el amor 😂💕`,
          mentions: [objetivo],
        },
        { quoted: m }
      );

      return true;
    }

    if (comando === "compatibilidad") {
      if (!objetivo) {
        await sock.sendMessage(
          chat,
          { text: "🤝 Menciona a alguien para calcular la compatibilidad." },
          { quoted: m }
        );
        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text: `🤝 *Compatibilidad:* ${porcentaje}%`,
          mentions: [objetivo],
        },
        { quoted: m }
      );

      return true;
    }

    if (comando === "gay") {
      await sock.sendMessage(
        chat,
        {
          text: `🏳️‍🌈 Resultado: *${porcentaje}%* 😂`,
        },
        { quoted: m }
      );
      return true;
    }

    if (comando === "crush") {
      await sock.sendMessage(
        chat,
        {
          text:
            `💘 *CRUSH*\n\n` +
            `Tu nivel de crush es: *${porcentaje}%* 😳`,
        },
        { quoted: m }
      );
      return true;
    }

    if (comando === "suerte") {
      const mensajes = [
        "🍀 Hoy la suerte está de tu lado.",
        "✨ Puede que tengas un día increíble.",
        "🎯 Todo depende de tus decisiones.",
        "🍀 La suerte te sonríe hoy.",
        "😎 Parece que vienen cosas buenas.",
      ];

      const resultado =
        mensajes[Math.floor(Math.random() * mensajes.length)];

      await sock.sendMessage(
        chat,
        { text: `🍀 *SUERTE*\n\n${resultado}` },
        { quoted: m }
      );

      return true;
    }

    if (comando === "frase") {
      const frases = [
        "✨ Cada día es una nueva oportunidad.",
        "🔥 Nunca dejes de aprender.",
        "😎 Sé tú mismo.",
        "🚀 Los grandes sueños empiezan con pequeños pasos.",
        "💫 Todo esfuerzo cuenta.",
      ];

      await sock.sendMessage(
        chat,
        {
          text:
            `💭 *FRASE DEL DÍA*\n\n` +
            frases[Math.floor(Math.random() * frases.length)],
        },
        { quoted: m }
      );

      return true;
    }

    if (comando === "chiste") {
      const chistes = [
        "😂 ¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
        "🤣 ¿Qué le dijo un techo a otro? Techo de menos.",
        "😂 ¿Cuál es el colmo de un electricista? No encontrar su corriente de trabajo.",
        "🤣 ¿Qué hace un pez? ¡Nada!",
      ];

      await sock.sendMessage(
        chat,
        {
          text:
            `😂 *CHISTE*\n\n` +
            chistes[Math.floor(Math.random() * chistes.length)],
        },
        { quoted: m }
      );

      return true;
    }

    if (comando === "verdad") {
      const preguntas = [
        "👀 ¿Cuál es tu mayor sueño?",
        "😳 ¿Cuál ha sido tu momento más vergonzoso?",
        "🤔 ¿Qué cosa cambiarías de tu pasado?",
        "😂 ¿Cuál es tu hábito más raro?",
        "💭 ¿Qué persona admiras mucho?",
      ];

      await sock.sendMessage(
        chat,
        {
          text:
            `🗣️ *VERDAD*\n\n` +
            preguntas[Math.floor(Math.random() * preguntas.length)],
        },
        { quoted: m }
      );

      return true;
    }

    if (comando === "reto") {
      const retos = [
        "😎 Cambia tu foto de perfil durante 10 minutos.",
        "😂 Envía un emoji que represente tu estado de ánimo.",
        "🎵 Escribe el nombre de una canción que te guste.",
        "🤣 Cuenta un chiste en el grupo.",
        "⭐ Di algo positivo sobre alguien del grupo.",
      ];

      await sock.sendMessage(
        chat,
        {
          text:
            `🔥 *RETO*\n\n` +
            retos[Math.floor(Math.random() * retos.length)],
        },
        { quoted: m }
      );

      return true;
    }

    if (comando === "8ball") {
      const respuestas = [
        "🎱 Sí.",
        "🎱 No.",
        "🎱 Definitivamente.",
        "🎱 Probablemente.",
        "🎱 No estoy seguro.",
        "🎱 Pregunta nuevamente.",
        "🎱 Las señales apuntan a que sí.",
      ];

      await sock.sendMessage(
        chat,
        {
          text:
            `🎱 *8 BALL*\n\n` +
            respuestas[Math.floor(Math.random() * respuestas.length)],
        },
        { quoted: m }
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error en diversión:", error);
    return true;
  }
}

module.exports = diversion;
