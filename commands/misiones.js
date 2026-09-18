// =========================================
// 🎯 SISTEMA DE MISIONES - TITANBOT
// =========================================

const {
  obtenerUsuario,
  agregarXP
} = require("./datosUsuarios");

// =========================================
// 🎯 MISIONES DIARIAS
// =========================================

const MISIONES = [
  {
    id: "jugar",
    nombre: "🎮 Jugador",
    descripcion: "Juega 3 partidas",
    objetivo: 3,
    recompensa: 30
  },

  {
    id: "trivia",
    nombre: "🧠 Cerebro",
    descripcion: "Completa 2 trivias correctamente",
    objetivo: 2,
    recompensa: 40
  },

  {
    id: "adivina",
    nombre: "🔢 Adivinador",
    descripcion: "Acierta 1 número",
    objetivo: 1,
    recompensa: 20
  },

  {
    id: "ppt",
    nombre: "✊ Competidor",
    descripcion: "Gana 2 partidas de PPT",
    objetivo: 2,
    recompensa: 35
  },

  {
    id: "dado",
    nombre: "🎲 Lanzador",
    descripcion: "Lanza el dado 3 veces",
    objetivo: 3,
    recompensa: 25
  }
];

// =========================================
// 📅 FECHA ACTUAL
// =========================================

function fechaActual() {

  const ahora = new Date();

  return ahora
    .toISOString()
    .split("T")[0];
}

// =========================================
// 🔄 PREPARAR MISIONES
// =========================================

function prepararMisiones(usuario) {

  const hoy =
    fechaActual();

  if (
    usuario.misionesFecha !== hoy
  ) {

    usuario.misionesFecha = hoy;

    usuario.misiones = {};

    for (const mision of MISIONES) {

      usuario.misiones[mision.id] = {
        progreso: 0,
        completada: false
      };
    }
  }

  return usuario;
}

// =========================================
// 📋 OBTENER MISIONES
// =========================================

function obtenerMisiones(jid) {

  const usuario =
    obtenerUsuario(jid);

  return prepararMisiones(usuario);
}

// =========================================
// ➕ PROGRESO DE MISIÓN
// =========================================

function avanzarMision(
  jid,
  tipo,
  cantidad = 1
) {

  const usuario =
    obtenerUsuario(jid);

  prepararMisiones(usuario);

  const mision =
    MISIONES.find(
      m => m.id === tipo
    );

  if (!mision) {
    return null;
  }

  const progreso =
    usuario.misiones[mision.id];

  if (progreso.completada) {
    return null;
  }

  progreso.progreso += cantidad;

  if (
    progreso.progreso >=
    mision.objetivo
  ) {

    progreso.progreso =
      mision.objetivo;

    progreso.completada = true;

    const recompensa =
      agregarXP(
        jid,
        mision.recompensa
      );

    return {
      completada: true,
      mision,
      recompensa,
      usuario
    };
  }

  return {
    completada: false,
    mision,
    usuario
  };
}

// =========================================
// 🎯 MOSTRAR MISIONES
// =========================================

async function misiones(
  sock,
  chat,
  comando,
  args,
  id
) {

  if (
    comando !== "misiones"
  ) {
    return false;
  }

  const usuario =
    obtenerMisiones(id);

  let texto =
`🎯 *MISIONES DIARIAS*

━━━━━━━━━━━━━━━━━━━━
📅 ${usuario.misionesFecha}
━━━━━━━━━━━━━━━━━━━━

`;

  for (
    const mision of MISIONES
  ) {

    const progreso =
      usuario.misiones[mision.id];

    const estado =
      progreso.completada
        ? "✅ COMPLETADA"
        : `${progreso.progreso}/${mision.objetivo}`;

    texto +=
`${mision.nombre}
📌 ${mision.descripcion}
📊 Progreso: ${estado}
⭐ Recompensa: +${mision.recompensa} XP

`;
  }

  texto +=
`━━━━━━━━━━━━━━━━━━━━
🎁 Las misiones se reinician cada día.
✨ ¡Completa todas las que puedas!`;

  await sock.sendMessage(chat, {
    text: texto
  });

  return true;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = misiones;

module.exports.misiones =
  misiones;

module.exports.avanzarMision =
  avanzarMision;

module.exports.obtenerMisiones =
  obtenerMisiones;
