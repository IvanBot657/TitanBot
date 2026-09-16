// commands/eventos.js
// TitanBot - Sistema de Eventos del Grupo

const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "database");
const EVENTOS_DB = path.join(DB_DIR, "eventos.json");

// Crear carpeta/database si no existe
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

if (!fs.existsSync(EVENTOS_DB)) {
  fs.writeFileSync(EVENTOS_DB, JSON.stringify({}, null, 2));
}

// ================================
// FUNCIONES DE BASE DE DATOS
// ================================

function cargarEventos() {
  try {
    return JSON.parse(fs.readFileSync(EVENTOS_DB, "utf8"));
  } catch (error) {
    console.error("❌ Error cargando eventos:", error);
    return {};
  }
}

function guardarEventos(db) {
  try {
    fs.writeFileSync(
      EVENTOS_DB,
      JSON.stringify(db, null, 2)
    );
  } catch (error) {
    console.error("❌ Error guardando eventos:", error);
  }
}

// ================================
// CREAR EVENTO
// ================================

function crearEvento(chat, nombre, fecha, descripcion = "") {
  const db = cargarEventos();

  if (!db[chat]) {
    db[chat] = [];
  }

  const evento = {
    id: Date.now().toString(),
    nombre,
    fecha,
    descripcion,
    creado: new Date().toISOString()
  };

  db[chat].push(evento);

  guardarEventos(db);

  return evento;
}

// ================================
// OBTENER EVENTOS
// ================================

function obtenerEventos(chat) {
  const db = cargarEventos();

  return db[chat] || [];
}

// ================================
// ELIMINAR EVENTO
// ================================

function eliminarEvento(chat, id) {
  const db = cargarEventos();

  if (!db[chat]) {
    return false;
  }

  const cantidadAntes = db[chat].length;

  db[chat] = db[chat].filter(
    evento => evento.id !== id
  );

  if (db[chat].length === cantidadAntes) {
    return false;
  }

  guardarEventos(db);

  return true;
}

// ================================
// FORMATO DE EVENTOS
// ================================

function formatearEventos(eventos) {
  if (!eventos.length) {
    return "📅 *EVENTOS DEL GRUPO*\n\nNo hay eventos registrados.";
  }

  let texto = "📅 *EVENTOS DEL GRUPO*\n\n";

  eventos.forEach((evento, index) => {
    texto +=
      `🎉 *${index + 1}. ${evento.nombre}*\n` +
      `📆 Fecha: ${evento.fecha}\n`;

    if (evento.descripcion) {
      texto += `📝 ${evento.descripcion}\n`;
    }

    texto += `🆔 ID: ${evento.id}\n\n`;
  });

  return texto.trim();
}

// ================================
// COMANDO PRINCIPAL
// ================================

async function eventos(
  sock,
  m,
  comando,
  args = []
) {
  try {
    if (!m?.key?.remoteJid) {
      return true;
    }

    const chat = m.key.remoteJid;

    // Solo grupos
    if (!chat.endsWith("@g.us")) {
      await sock.sendMessage(
        chat,
        {
          text: "❌ Este sistema solo funciona en grupos."
        },
        { quoted: m }
      );

      return true;
    }

    // ============================
    // EVENTOS
    // ============================

    if (
      comando === "evento" ||
      comando === "eventos"
    ) {
      const accion = args[0]?.toLowerCase();

      // ----------------------------
      // LISTAR
      // ----------------------------

      if (!accion || accion === "lista") {
        const lista = obtenerEventos(chat);

        await sock.sendMessage(
          chat,
          {
            text: formatearEventos(lista)
          },
          { quoted: m }
        );

        return true;
      }

      // ----------------------------
      // CREAR
      // ----------------------------

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

        crearEvento(
          chat,
          nombre,
          fecha,
          descripcion
        );

        await sock.sendMessage(
          chat,
          {
            text:
              "✅ *EVENTO CREADO*\n\n" +
              `🎉 Nombre: *${nombre}*\n` +
              `📆 Fecha: *${fecha}*\n` +
              (descripcion
                ? `📝 ${descripcion}\n`
                : "") +
              "\n💾 Evento guardado correctamente."
          },
          { quoted: m }
        );

        return true;
      }

      // ----------------------------
      // BORRAR
      // ----------------------------

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

        const eliminado = eliminarEvento(
          chat,
          id
        );

        await sock.sendMessage(
          chat,
          {
            text: eliminado
              ? "🗑️ Evento eliminado correctamente."
              : "❌ No encontré un evento con ese ID."
          },
          { quoted: m }
        );

        return true;
      }

      // ----------------------------
      // AYUDA
      // ----------------------------

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

              "🗑️ *.evento borrar ID*\n" +
              "Eliminar un evento.\n\n" +

              "💡 Ejemplo:\n" +
              "*.evento crear Reunión 25/10 Reunión del grupo*"
          },
          { quoted: m }
        );

        return true;
      }

      // Comando no reconocido
      return false;
    }

    return false;

  } catch (error) {
    console.error("❌ Error en eventos:", error);

    return true;
  }
}

// ================================
// EXPORTAR
// ================================

module.exports = eventos;

// También exportamos funciones
module.exports.crearEvento = crearEvento;
module.exports.obtenerEventos = obtenerEventos;
module.exports.eliminarEvento = eliminarEvento;
