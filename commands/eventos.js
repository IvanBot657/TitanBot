// commands/eventos.js
// TitanBot - Sistema de Eventos

const eventos = new Map();
const encuestas = new Map();

function obtenerChat(chat) {
  if (!eventos.has(chat)) {
    eventos.set(chat, []);
  }

  return eventos.get(chat);
}

async function eventosCommand(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {
  try {
    comando = String(comando || "")
      .toLowerCase()
      .replace(/^\./, "");

    // =========================
    // .evento
    // =========================

    if (comando === "evento") {
      const accion = String(args[0] || "").toLowerCase();

      // .evento crear
      if (accion === "crear") {
        if (args.length < 3) {
          await sock.sendMessage(
            chat,
            {
              text:
                "📅 *CREAR EVENTO*\n\n" +
                "Uso:\n" +
                ".evento crear <nombre> <fecha>\n\n" +
                "Ejemplo:\n" +
                ".evento crear Reunion 20/09/2026"
            },
            { quoted: msg }
          );

          return true;
        }

        const nombre = args[1];
        const fecha = args.slice(2).join(" ");

        const lista = obtenerChat(chat);

        const nuevoEvento = {
          id: Date.now().toString(),
          nombre,
          fecha,
          creador: id,
          participantes: []
        };

        lista.push(nuevoEvento);

        await sock.sendMessage(
          chat,
          {
            text:
              "📅 *EVENTO CREADO*\n\n" +
              `🎯 Nombre: *${nombre}*\n` +
              `📆 Fecha: *${fecha}*\n` +
              `🆔 ID: *${nuevoEvento.id}*\n\n` +
              `Usa *.evento info ${nuevoEvento.id}* para verlo.`
          },
          { quoted: msg }
        );

        return true;
      }

      // .evento lista
      if (accion === "lista") {
        const lista = obtenerChat(chat);

        if (lista.length === 0) {
          await sock.sendMessage(
            chat,
            {
              text: "📅 No hay eventos creados en este grupo."
            },
            { quoted: msg }
          );

          return true;
        }

        let texto = "📅 *EVENTOS DEL GRUPO*\n\n";

        lista.forEach((evento, index) => {
          texto +=
            `${index + 1}. 🎯 *${evento.nombre}*\n` +
            `   📆 ${evento.fecha}\n` +
            `   👥 ${evento.participantes.length} participantes\n` +
            `   🆔 ${evento.id}\n\n`;
        });

        await sock.sendMessage(
          chat,
          { text: texto },
          { quoted: msg }
        );

        return true;
      }

      // .evento info ID
      if (accion === "info") {
        const eventoId = args[1];

        if (!eventoId) {
          await sock.sendMessage(
            chat,
            {
              text:
                "❌ Escribe el ID del evento.\n\n" +
                "Ejemplo:\n" +
                ".evento info 123456"
            },
            { quoted: msg }
          );

          return true;
        }

        const lista = obtenerChat(chat);

        const evento = lista.find(
          e => e.id === eventoId
        );

        if (!evento) {
          await sock.sendMessage(
            chat,
            {
              text: "❌ No encontré ese evento."
            },
            { quoted: msg }
          );

          return true;
        }

        await sock.sendMessage(
          chat,
          {
            text:
              "📅 *INFORMACIÓN DEL EVENTO*\n\n" +
              `🎯 Nombre: *${evento.nombre}*\n` +
              `📆 Fecha: *${evento.fecha}*\n` +
              `👥 Participantes: *${evento.participantes.length}*\n` +
              `🆔 ID: *${evento.id}*`
          },
          { quoted: msg }
        );

        return true;
      }

      // .evento participar ID
      if (accion === "participar") {
        const eventoId = args[1];

        if (!eventoId) {
          await sock.sendMessage(
            chat,
            {
              text:
                "❌ Escribe el ID del evento.\n\n" +
                "Ejemplo:\n" +
                ".evento participar 123456"
            },
            { quoted: msg }
          );

          return true;
        }

        const lista = obtenerChat(chat);

        const evento = lista.find(
          e => e.id === eventoId
        );

        if (!evento) {
          await sock.sendMessage(
            chat,
            {
              text: "❌ Ese evento no existe."
            },
            { quoted: msg }
          );

          return true;
        }

        if (evento.participantes.includes(id)) {
          await sock.sendMessage(
            chat,
            {
              text: "ℹ️ Ya estás registrado en este evento."
            },
            { quoted: msg }
          );

          return true;
        }

        evento.participantes.push(id);

        await sock.sendMessage(
          chat,
          {
            text:
              "✅ *TE HAS REGISTRADO*\n\n" +
              `📅 Evento: *${evento.nombre}*\n` +
              `📆 Fecha: *${evento.fecha}*\n` +
              `👥 Participantes: *${evento.participantes.length}*`
          },
          { quoted: msg }
        );

        return true;
      }

      // .evento cancelar ID
      if (accion === "cancelar") {
        const eventoId = args[1];

        if (!eventoId) {
          await sock.sendMessage(
            chat,
            {
              text:
                "❌ Escribe el ID del evento."
            },
            { quoted: msg }
          );

          return true;
        }

        const lista = obtenerChat(chat);

        const indice = lista.findIndex(
          e => e.id === eventoId
        );

        if (indice === -1) {
          await sock.sendMessage(
            chat,
            {
              text: "❌ Ese evento no existe."
            },
            { quoted: msg }
          );

          return true;
        }

        lista.splice(indice, 1);

        await sock.sendMessage(
          chat,
          {
            text: "🗑️ Evento cancelado correctamente."
          },
          { quoted: msg }
        );

        return true;
      }

      // Ayuda de .evento
      await sock.sendMessage(
        chat,
        {
          text:
            "📅 *SISTEMA DE EVENTOS*\n\n" +
            "`.evento crear <nombre> <fecha>`\n" +
            "`.evento lista`\n" +
            "`.evento info <ID>`\n" +
            "`.evento participar <ID>`\n" +
            "`.evento cancelar <ID>`"
        },
        { quoted: msg }
      );

      return true;
    }

    // =========================
    // .encuesta
    // =========================

    if (comando === "encuesta") {
      if (args.length < 3) {
        await sock.sendMessage(
          chat,
          {
            text:
              "📊 *ENCUESTA*\n\n" +
              "Uso:\n" +
              ".encuesta pregunta | opcion1 | opcion2\n\n" +
              "Ejemplo:\n" +
              ".encuesta ¿Jugamos hoy? | Sí | No"
          },
          { quoted: msg }
        );

        return true;
      }

      const texto = args.join(" ");
      const partes = texto
        .split("|")
        .map(x => x.trim())
        .filter(Boolean);

      if (partes.length < 3) {
        await sock.sendMessage(
          chat,
          {
            text:
              "❌ Necesitas una pregunta y al menos 2 opciones."
          },
          { quoted: msg }
        );

        return true;
      }

      const pregunta = partes[0];
      const opciones = partes.slice(1);

      const encuestaId = Date.now().toString();

      encuestas.set(
        `${chat}:${encuestaId}`,
        {
          pregunta,
          opciones,
          votos: {},
          creador: id
        }
      );

      let textoEncuesta =
        `📊 *ENCUESTA*\n\n` +
        `❓ ${pregunta}\n\n`;

      opciones.forEach((opcion, index) => {
        textoEncuesta +=
          `${index + 1}. ${opcion}\n`;
      });

      textoEncuesta +=
        `\n🆔 ID: ${encuestaId}\n\n` +
        `Vota con:\n` +
        `.votar ${encuestaId} <número>`;

      await sock.sendMessage(
        chat,
        {
          text: textoEncuesta
        },
        { quoted: msg }
      );

      return true;
    }

    // =========================
    // .votar
    // =========================

    if (comando === "votar") {
      const encuestaId = args[0];
      const numero = parseInt(args[1]);

      if (!encuestaId || isNaN(numero)) {
        await sock.sendMessage(
          chat,
          {
            text:
              "❌ Uso correcto:\n" +
              ".votar <ID> <número>"
          },
          { quoted: msg }
        );

        return true;
      }

      const encuesta =
        encuestas.get(`${chat}:${encuestaId}`);

      if (!encuesta) {
        await sock.sendMessage(
          chat,
          {
            text: "❌ No encontré esa encuesta."
          },
          { quoted: msg }
        );

        return true;
      }

      if (
        numero < 1 ||
        numero > encuesta.opciones.length
      ) {
        await sock.sendMessage(
          chat,
          {
            text: "❌ Esa opción no existe."
          },
          { quoted: msg }
        );

        return true;
      }

      encuesta.votos[id] = numero;

      await sock.sendMessage(
        chat,
        {
          text:
            `✅ Voto registrado.\n\n` +
            `🗳️ Elegiste: *${encuesta.opciones[numero - 1]}*`
        },
        { quoted: msg }
      );

      return true;
    }

    // =========================
    // .sorteo
    // =========================

    if (comando === "sorteo") {
      const participantes =
        args.length > 0
          ? args
              .filter(x => x.includes("@"))
          : [];

      if (participantes.length < 2) {
        await sock.sendMessage(
          chat,
          {
            text:
              "🎉 *SORTEO*\n\n" +
              "Menciona al menos 2 participantes.\n\n" +
              "Ejemplo:\n" +
              ".sorteo @usuario1 @usuario2"
          },
          { quoted: msg }
        );

        return true;
      }

      const ganador =
        participantes[
          Math.floor(
            Math.random() * participantes.length
          )
        ];

      const numero =
        ganador.replace(/\D/g, "");

      await sock.sendMessage(
        chat,
        {
          text:
            `🎉 *SORTEO*\n\n` +
            `🏆 Ganador: @${numero} 🎊`,
          mentions: [`${numero}@s.whatsapp.net`]
        },
        { quoted: msg }
      );

      return true;
    }

    return false;

  } catch (error) {
    console.error(
      "❌ Error en eventos:",
      error
    );

    return true;
  }
}

module.exports = eventosCommand;
