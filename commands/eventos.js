// commands/eventos.js
// TitanBot - Sistema de Eventos del Grupo
// Almacenamiento: PostgreSQL

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
// INICIALIZAR BASE DE DATOS
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
// OBTENER UN EVENTO
// ========================================

async function obtenerEvento(chat, id) {
  await inicializarBaseDatos();

  const resultado = await pool.query(
    `
    SELECT *
    FROM eventos
    WHERE chat = $1 AND id = $2
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
    WHERE chat = $1 AND id = $2
    RETURNING *;
    `,
    [chat, id]
  );

  return resultado.rowCount > 0;
}

// ========================================
// FORMATEAR EVENTOS
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
// COMANDO PRINCIPAL
// ========================================

async function eventos(
  sock,
  m,
  comando,
  args = []
) {
  try {
    if (!m?.key?.remoteJid) {
      console.error(
        "❌ Eventos recibió un mensaje inválido."
      );

      return true;
    }

    const chat = m.key.remoteJid;

    // Solo grupos
    if (!chat.endsWith("@g.us")) {
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

    comando = String(comando || "")
      .toLowerCase()
      .replace(/^\./, "");

    // ====================================
    // EVENTO / EVENTOS
    // ====================================

    if (
      comando === "evento" ||
      comando === "eventos"
    ) {
      const accion = String(
        args[0] || ""
      ).toLowerCase();

      // ==================================
      // LISTAR
      // ==================================

      if (
        !accion ||
        accion === "lista"
      ) {
        const lista =
          await obtenerEventos(chat);

        await sock.sendMessage(
          chat,
          {
            text:
              formatearEventos(lista)
          },
          { quoted: m }
        );

        return true;
      }

      // ==================================
      // CREAR
      // ==================================

      if (accion === "crear") {
        if (args.length < 3) {
          await sock.sendMessage(
            chat,
            {
              text:
                "📅 *CREAR EVENTO*\n\n" +
                "Uso:\n" +
                ".evento crear Nombre Fecha Descripción\n\n" +
                "Ejemplo:\n" +
                ".evento crear Cumpleaños 20/10 Fiesta del grupo 🎉"
            },
            { quoted: m }
          );

          return true;
        }

        const nombre = args[1];
        const fecha = args[2];

        const descripcion = args
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
              "✅ *EVENTO CREADO*\n\n" +
              `🎉 Nombre: *${evento.nombre}*\n` +
              `📆 Fecha: *${evento.fecha}*\n` +
              (
                evento.descripcion
                  ? `📝 ${evento.descripcion}\n`
                  : ""
              ) +
              `🆔 ID: *${evento.id}*\n\n` +
              "💾 Guardado en PostgreSQL."
          },
          { quoted: m }
        );

        return true;
      }

      // ==================================
      // INFO
      // ==================================

      if (accion === "info") {
        const id = args[1];

        if (!id) {
          await sock.sendMessage(
            chat,
            {
              text:
                "❌ Debes indicar el ID del evento.\n\n" +
                "Ejemplo:\n" +
                ".evento info 123456"
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
              "📅 *INFORMACIÓN DEL EVENTO*\n\n" +
              `🎉 Nombre: *${evento.nombre}*\n` +
              `📆 Fecha: *${evento.fecha}*\n` +
              (
                evento.descripcion
                  ? `📝 ${evento.descripcion}\n`
                  : ""
              ) +
              `🆔 ID: *${evento.id}*`
          },
          { quoted: m }
        );

        return true;
      }

      // ==================================
      // BORRAR / ELIMINAR
      // ==================================

      if (
        accion === "borrar" ||
        accion === "eliminar"
      ) {
        const id = args[1];

        if (!id) {
          await sock.sendMessage(
            chat,
            {
              text:
                "❌ Debes indicar el ID del evento.\n\n" +
                "Usa *.eventos* para ver los IDs."
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
            text: eliminado
              ? "🗑️ Evento eliminado correctamente de PostgreSQL."
              : "❌ No encontré un evento con ese ID."
          },
          { quoted: m }
        );

        return true;
      }

      // ==================================
      // AYUDA
      // ==================================

      if (accion === "ayuda") {
        await sock.sendMessage(
          chat,
          {
            text:
              "📅 *SISTEMA DE EVENTOS*\n\n" +

              "📋 *.eventos*\n" +
              "Ver los eventos del grupo.\n\n" +

              "➕ *.evento crear Nombre Fecha Descripción*\n" +
              "Crear un evento.\n\n" +

              "🔎 *.evento info ID*\n" +
              "Ver información del evento.\n\n" +

              "🗑️ *.evento borrar ID*\n" +
              "Eliminar un evento.\n\n" +

              "💡 *Ejemplo:*\n" +
              ".evento crear Reunión 25/10 Reunión del grupo"
          },
          { quoted: m }
        );

        return true;
      }

      return false;
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
            "❌ Ocurrió un error al procesar el evento."
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
