// ========================================
// 🎉 TITANBOT - SISTEMA DE EVENTOS
// ========================================
// .evento  -> Inicia el evento
// .eventos -> Lista eventos registrados
// .evento crear Nombre Fecha Descripción
// .evento info ID
// .evento borrar ID
// ========================================

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL no está configurada.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

// ========================================
// CONFIGURACIÓN
// ========================================

const TIEMPO_VOTACION = 50 * 60 * 1000;
const TIEMPO_EVENTO = 10 * 60 * 1000;

const encuestasActivas = new Map();

// ========================================
// BASE DE DATOS
// ========================================

let baseInicializada = false;

async function inicializarBaseDatos() {
  if (baseInicializada) return;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS eventos (
      id TEXT PRIMARY KEY,
      chat TEXT NOT NULL,
      nombre TEXT NOT NULL,
      fecha TEXT NOT NULL,
      descripcion TEXT DEFAULT '',
      creador TEXT,
      creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  baseInicializada = true;

  console.log("✅ Base de datos de eventos lista.");
}

// ========================================
// CREAR EVENTO
// ========================================

async function crearEvento(
  chat,
  nombre,
  fecha,
  descripcion = "",
  creador = ""
) {
  await inicializarBaseDatos();

  const id =
    Date.now().toString() +
    Math.floor(Math.random() * 1000);

  const resultado = await pool.query(
    `
    INSERT INTO eventos
    (id, chat, nombre, fecha, descripcion, creador)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
    `,
    [
      id,
      chat,
      nombre,
      fecha,
      descripcion,
      creador
    ]
  );

  return resultado.rows[0];
}

// ========================================
// OBTENER EVENTOS
// ========================================

async function obtenerEventos(chat) {
  await inicializarBaseDatos();

  const resultado = await pool.query(
    `
    SELECT *
    FROM eventos
    WHERE chat = $1
    ORDER BY creado ASC;
    `,
    [chat]
  );

  return resultado.rows;
}

// ========================================
// OBTENER EVENTO
// ========================================

async function obtenerEvento(chat, id) {
  await inicializarBaseDatos();

  const resultado = await pool.query(
    `
    SELECT *
    FROM eventos
    WHERE chat = $1
    AND id = $2
    LIMIT 1;
    `,
    [chat, id]
  );

  return resultado.rows[0] || null;
}

// ========================================
// ELIMINAR EVENTO
// ========================================

async function eliminarEvento(chat, id) {
  await inicializarBaseDatos();

  const resultado = await pool.query(
    `
    DELETE FROM eventos
    WHERE chat = $1
    AND id = $2
    RETURNING *;
    `,
    [chat, id]
  );

  return resultado.rowCount > 0;
}

// ========================================
// FORMATEAR LISTA
// ========================================

function formatearEventos(eventos) {
  if (!eventos.length) {
    return (
      "📅 *EVENTOS DEL GRUPO*\n\n" +
      "No hay eventos registrados."
    );
  }

  let texto =
    "📅 *EVENTOS DEL GRUPO*\n\n";

  eventos.forEach((evento, index) => {
    texto +=
      `🎉 *${index + 1}. ${evento.nombre}*\n` +
      `📆 Fecha: ${evento.fecha}\n`;

    if (evento.descripcion) {
      texto +=
        `📝 ${evento.descripcion}\n`;
    }

    texto +=
      `🆔 ID: ${evento.id}\n\n`;
  });

  return texto.trim();
}

// ========================================
// OBTENER PARTICIPANTES DEL GRUPO
// ========================================

async function obtenerParticipantes(sock, chat) {
  try {
    const metadata =
      await sock.groupMetadata(chat);

    return metadata.participants || [];
  } catch (error) {
    console.error(
      "❌ No se pudieron obtener participantes:",
      error
    );

    return [];
  }
}

// ========================================
// MENCIONAR TODOS
// ========================================

async function anunciarInicio(sock, chat, m) {
  const participantes =
    await obtenerParticipantes(
      sock,
      chat
    );

  const menciones =
    participantes.map(
      p => p.id
    );

  let texto =
`🎉 *EVENTO DEL GRUPO INICIADO*

🌑 Se aproxima la *Noche Misteriosa*...

🎮 Primero debemos saber quiénes participarán.

🗳️ *VOTA EN LA ENCUESTA DE ABAJO*

⏱️ La inscripción estará abierta durante *50 minutos*.

🎮 *Yo juego* = Participas
❌ *No juego* = No participas`;

  await sock.sendMessage(
    chat,
    {
      text: texto,
      mentions: menciones
    },
    { quoted: m }
  );
}

// ========================================
// CREAR ENCUESTA
// ========================================

async function crearEncuesta(sock, chat) {
  try {
    const encuesta =
      await sock.sendMessage(
        chat,
        {
          poll: {
            name:
              "🎮 ¿QUIÉNES JUEGAN EN EL EVENTO?",
            values: [
              "🎮 Yo juego",
              "❌ No juego"
            ],
            selectableCount: 1
          }
        }
      );

    console.log(
      "✅ Encuesta creada:",
      encuesta?.key?.id
    );

    return encuesta;

  } catch (error) {

    console.error(
      "❌ ERROR CREANDO ENCUESTA:",
      error
    );

    await sock.sendMessage(
      chat,
      {
        text:
`❌ *NO SE PUDO CREAR LA ENCUESTA*

WhatsApp/Baileys rechazó la encuesta.

Revisa la versión de @whiskeysockets/baileys.`
      }
    );

    return null;
  }
}

// ========================================
// INICIAR EVENTO
// ========================================

async function iniciarEvento(
  sock,
  chat,
  m
) {
  if (encuestasActivas.has(chat)) {
    await sock.sendMessage(
      chat,
      {
        text:
          "⚠️ Ya hay un evento activo en este grupo."
      },
      { quoted: m }
    );

    return true;
  }

  // -----------------------------
  // ANUNCIO
  // -----------------------------

  await anunciarInicio(
    sock,
    chat,
    m
  );

  // -----------------------------
  // ENCUESTA
  // -----------------------------

  const encuesta =
    await crearEncuesta(
      sock,
      chat
    );

  if (!encuesta) {
    return true;
  }

  const encuestaId =
    encuesta.key?.id;

  encuestasActivas.set(
    chat,
    {
      id: encuestaId,
      mensaje: encuesta,
      participantes: [],
      iniciado: Date.now()
    }
  );

  console.log(
    `🗳️ Evento iniciado en ${chat}`
  );

  // -----------------------------
  // 50 MINUTOS
  // -----------------------------

  setTimeout(
    async () => {

      try {

        const evento =
          encuestasActivas.get(
            chat
          );

        if (!evento) return;

        console.log(
          `⏱️ Terminó votación en ${chat}`
        );

        await finalizarVotacion(
          sock,
          chat,
          evento
        );

      } catch (error) {

        console.error(
          "❌ Error finalizando evento:",
          error
        );

      }

    },
    TIEMPO_VOTACION
  );

  return true;
}

// ========================================
// FINALIZAR VOTACIÓN
// ========================================

async function finalizarVotacion(
  sock,
  chat,
  evento
) {
  try {

    await sock.sendMessage(
      chat,
      {
        text:
`⏰ *VOTACIÓN TERMINADA*

🎮 Se cerraron las inscripciones.

🌑 Ahora comienza la *Noche Misteriosa*...`
      }
    );

    // --------------------------------
    // PARTICIPANTES
    // --------------------------------

    const participantes =
      evento.participantes || [];

    if (
      participantes.length === 0
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
            "😕 Nadie se registró para el evento."
        }
      );

      encuestasActivas.delete(
        chat
      );

      return;
    }

    // --------------------------------
    // INTENTAR PROMOVER
    // --------------------------------

    let promovidos = [];

    try {

      const metadata =
        await sock.groupMetadata(
          chat
        );

      const botId =
        sock.user?.id;

      const bot =
        metadata.participants.find(
          p =>
            p.id === botId ||
            p.id?.split(":")[0] ===
            botId?.split(":")[0]
        );

      const botEsAdmin =
        bot?.admin === "admin" ||
        bot?.admin === "superadmin";

      if (botEsAdmin) {

        for (
          const participante
          of participantes
        ) {

          try {

            await sock.groupParticipantsUpdate(
              chat,
              [participante],
              "promote"
            );

            promovidos.push(
              participante
            );

          } catch (error) {

            console.log(
              "⚠️ No se pudo promover:",
              participante
            );

          }

        }

      } else {

        await sock.sendMessage(
          chat,
          {
            text:
`⚠️ *TITANBOT NO ES ADMINISTRADOR*

Los participantes fueron registrados,
pero no puedo promoverlos ni cerrar el grupo.`
          }
        );

      }

    } catch (error) {

      console.error(
        "❌ Error comprobando administrador:",
        error
      );

    }

    // --------------------------------
    // CERRAR GRUPO
    // --------------------------------

    try {

      const metadata =
        await sock.groupMetadata(
          chat
        );

      const bot =
        metadata.participants.find(
          p =>
            p.id ===
            sock.user?.id
        );

      const botEsAdmin =
        bot?.admin === "admin" ||
        bot?.admin === "superadmin";

      if (botEsAdmin) {

        await sock.groupSettingUpdate(
          chat,
          "announcement"
        );

        await sock.sendMessage(
          chat,
          {
            text:
`🔒 *GRUPO CERRADO*

🌑 *NOCHE MISTERIOSA*

🎯 Los participantes deben completar
la misión del evento.

⏱️ Tiempo: *10 minutos*`
          }
        );

        // -------------------------
        // MISIÓN
        // -------------------------

        await enviarMision(
          sock,
          chat,
          participantes
        );

        // -------------------------
        // 10 MINUTOS
        // -------------------------

        setTimeout(
          async () => {

            try {

              await sock.groupSettingUpdate(
                chat,
                "not_announcement"
              );

              await sock.sendMessage(
                chat,
                {
                  text:
`🔓 *EVENTO TERMINADO*

🎉 La *Noche Misteriosa* ha terminado.

🏆 Gracias a todos por participar.

🌟 El grupo vuelve a estar abierto.`
                }
              );

              encuestasActivas.delete(
                chat
              );

            } catch (error) {

              console.error(
                "❌ Error reabriendo grupo:",
                error
              );

            }

          },
          TIEMPO_EVENTO
        );

      }

    } catch (error) {

      console.error(
        "❌ Error cerrando grupo:",
        error
      );

    }

  } catch (error) {

    console.error(
      "❌ Error en finalizarVotacion:",
      error
    );

  }
}

// ========================================
// MISIÓN
// ========================================

async function enviarMision(
  sock,
  chat,
  participantes
) {

  const misiones = [
    "⚔️ Completa una batalla.",
    "🎭 Responde una pregunta de verdad.",
    "🎯 Supera un reto del grupo.",
    "🧩 Resuelve un acertijo.",
    "🏆 Consigue una victoria en un juego."
  ];

  const mision =
    misiones[
      Math.floor(
        Math.random() *
        misiones.length
      )
    ];

  const menciones =
    participantes;

  await sock.sendMessage(
    chat,
    {
      text:
`🎯 *MISIÓN DEL EVENTO*

${mision}

⏱️ Tienen *10 minutos* para completarla.`,
      mentions: menciones
    }
  );
}

// ========================================
// PROCESAR VOTOS
// ========================================

async function procesarVotos(
  sock,
  updates
) {

  for (
    const update
    of updates
  ) {

    try {

      const key =
        update.key;

      if (!key?.remoteJid) {
        continue;
      }

      const chat =
        key.remoteJid;

      const evento =
        encuestasActivas.get(
          chat
        );

      if (!evento) {
        continue;
      }

      if (
        key.id !==
        evento.id
      ) {
        continue;
      }

      /*
       * Baileys proporciona los votos
       * mediante pollUpdates.
       */

      const pollUpdates =
        update.update
          ?.pollUpdates;

      if (!pollUpdates) {
        continue;
      }

      for (
        const poll
        of pollUpdates
      ) {

        const voter =
          poll?.vote?.voterPn ||
          poll?.vote?.voterJid ||
          poll?.vote?.voter;

        if (!voter) {
          continue;
        }

        const opciones =
          poll?.vote?.selectedOptions ||
          [];

        if (
          opciones.includes(
            "🎮 Yo juego"
          )
        ) {

          if (
            !evento.participantes.includes(
              voter
            )
          ) {

            evento.participantes.push(
              voter
            );

            console.log(
              `🎮 Participante registrado: ${voter}`
            );

          }

        } else {

          const index =
            evento.participantes.indexOf(
              voter
            );

          if (index !== -1) {

            evento.participantes.splice(
              index,
              1
            );

          }

        }

      }

    } catch (error) {

      console.error(
        "❌ Error procesando voto:",
        error
      );

    }

  }

}

// ========================================
// COMANDOS
// ========================================

async function eventos(
  sock,
  m,
  comando,
  args = []
) {

  try {

    if (
      !m?.key?.remoteJid
    ) {
      return true;
    }

    const chat =
      m.key.remoteJid;

    if (
      !chat.endsWith("@g.us")
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ Este sistema solo funciona en grupos."
        },
        { quoted: m }
      );

      return true;
    }

    comando =
      String(
        comando || ""
      )
        .toLowerCase()
        .replace(
          /^\./,
          ""
        );

    // ====================================
    // .EVENTO
    // ====================================

    if (
      comando === "evento"
    ) {

      /*
       * SIN ARGUMENTOS:
       * INICIAR EVENTO
       */

      if (
        args.length === 0
      ) {

        return await iniciarEvento(
          sock,
          chat,
          m
        );

      }

      const accion =
        String(
          args[0]
        ).toLowerCase();

      // ----------------------------------
      // CREAR
      // ----------------------------------

      if (
        accion === "crear"
      ) {

        if (
          args.length < 3
        ) {

          await sock.sendMessage(
            chat,
            {
              text:
`📅 *CREAR EVENTO*

Uso:

.evento crear Nombre Fecha Descripción

Ejemplo:

.evento crear Cumpleaños 20/10 Fiesta del grupo 🎉`
            },
            { quoted: m }
          );

          return true;
        }

        const nombre =
          args[1];

        const fecha =
          args[2];

        const descripcion =
          args
            .slice(3)
            .join(" ");

        const creador =
          m.key.participant ||
          "";

        const evento =
          await crearEvento(
            chat,
            nombre,
            fecha,
            descripcion,
            creador
          );

        await sock.sendMessage(
          chat,
          {
            text:
`✅ *EVENTO CREADO*

🎉 Nombre: *${evento.nombre}*
📆 Fecha: *${evento.fecha}*
${evento.descripcion ? `📝 ${evento.descripcion}\n` : ""}🆔 ID: *${evento.id}*`
          },
          { quoted: m }
        );

        return true;
      }

      // ----------------------------------
      // INFO
      // ----------------------------------

      if (
        accion === "info"
      ) {

        const id =
          args[1];

        if (!id) {

          await sock.sendMessage(
            chat,
            {
              text:
                "❌ Debes indicar el ID."
            },
            { quoted: m }
          );

          return true;
        }

        const evento =
          await obtenerEvento(
            chat,
            id
          );

        if (!evento) {

          await sock.sendMessage(
            chat,
            {
              text:
                "❌ No encontré ese evento."
            },
            { quoted: m }
          );

          return true;
        }

        await sock.sendMessage(
          chat,
          {
            text:
`📅 *INFORMACIÓN DEL EVENTO*

🎉 Nombre: *${evento.nombre}*
📆 Fecha: *${evento.fecha}*
${evento.descripcion ? `📝 ${evento.descripcion}\n` : ""}🆔 ID: *${evento.id}*`
          },
          { quoted: m }
        );

        return true;
      }

      // ----------------------------------
      // BORRAR
      // ----------------------------------

      if (
        accion === "borrar" ||
        accion === "eliminar"
      ) {

        const id =
          args[1];

        if (!id) {

          await sock.sendMessage(
            chat,
            {
              text:
                "❌ Indica el ID del evento."
            },
            { quoted: m }
          );

          return true;
        }

        const eliminado =
          await eliminarEvento(
            chat,
            id
          );

        await sock.sendMessage(
          chat,
          {
            text:
              eliminado
                ? "🗑️ Evento eliminado."
                : "❌ Evento no encontrado."
          },
          { quoted: m }
        );

        return true;
      }

      // ----------------------------------
      // AYUDA
      // ----------------------------------

      if (
        accion === "ayuda"
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
`📅 *SISTEMA DE EVENTOS*

🎉 *.evento*
Iniciar evento.

📋 *.eventos*
Ver eventos registrados.

➕ *.evento crear Nombre Fecha Descripción*
Crear evento.

🔎 *.evento info ID*
Ver información.

🗑️ *.evento borrar ID*
Eliminar evento.`
          },
          { quoted: m }
        );

        return true;
      }

      return false;
    }

    // ====================================
    // .EVENTOS
    // ====================================

    if (
      comando === "eventos"
    ) {

      const lista =
        await obtenerEventos(
          chat
        );

      await sock.sendMessage(
        chat,
        {
          text:
            formatearEventos(
              lista
            )
        },
        { quoted: m }
      );

      return true;
    }

    return false;

  } catch (error) {

    console.error(
      "❌ Error en eventos:",
      error
    );

    try {

      await sock.sendMessage(
        m.key.remoteJid,
        {
          text:
            "❌ Ocurrió un error en el sistema de eventos."
        },
        { quoted: m }
      );

    } catch (_) {}

    return true;
  }
}

// ========================================
// EXPORTACIONES
// ========================================

module.exports = eventos;

module.exports.crearEvento =
  crearEvento;

module.exports.obtenerEventos =
  obtenerEventos;

module.exports.obtenerEvento =
  obtenerEvento;

module.exports.eliminarEvento =
  eliminarEvento;

module.exports.procesarVotos =
  procesarVotos;

module.exports.encuestasActivas =
  encuestasActivas;
