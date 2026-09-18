// =========================================
// 🎯 SISTEMA DE MISIONES - TITANBOT
// =========================================

const {
  obtenerUsuario,
  guardarUsuario,
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
// 📅 FECHA
// =========================================

function fechaActual() {
  const ahora = new Date();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(ahora);
}

// =========================================
// 🔄 PREPARAR MISIONES
// =========================================

function prepararMisiones(usuario) {

  const hoy = fechaActual();

  if (usuario.misionesFecha !== hoy) {

    usuario.misionesFecha = hoy;
    usuario.misiones = {};

    for (const mision of MISIONES) {

      usuario.misiones[mision.id] = {
        progreso: 0,
        completada: false,
        reclamada: false
      };

    }
  }

  return usuario;
}

// =========================================
// 📋 OBTENER MISIONES
// =========================================

function obtenerMisiones(jid) {

  const usuario = obtenerUsuario(jid);

  prepararMisiones(usuario);

  guardarUsuario(jid, usuario);

  return usuario;
}

// =========================================
// ➕ AVANZAR MISIÓN
// =========================================

function avanzarMision(
  jid,
  tipo,
  cantidad = 1
) {

  const usuario = obtenerUsuario(jid);

  prepararMisiones(usuario);

  const mision = MISIONES.find(
    m => m.id === tipo
  );

  if (!mision) {
    return null;
  }

  const progreso =
    usuario.misiones[mision.id];

  if (progreso.completada) {
    return {
      completada: true,
      yaCompletada: true,
      mision,
      usuario
    };
  }

  progreso.progreso += cantidad;

  if (
    progreso.progreso >=
    mision.objetivo
  ) {

    progreso.progreso =
      mision.objetivo;

    progreso.completada = true;

  }

  guardarUsuario(jid, usuario);

  return {
    completada: progreso.completada,
    mision,
    usuario
  };
}

// =========================================
// 🔎 BUSCAR MISIÓN
// =========================================

function buscarMision(nombre) {

  const texto = String(
    nombre || ""
  )
    .toLowerCase()
    .trim();

  return MISIONES.find(
    m =>
      m.id === texto ||
      m.nombre.toLowerCase().includes(texto)
  );
}

// =========================================
// 🎯 .misiones
// =========================================

async function mostrarMisiones(
  sock,
  chat,
  id
) {

  const usuario =
    obtenerMisiones(id);

  let texto =
`🎯 *MISIÓNES DIARIAS*

━━━━━━━━━━━━━━━━━━━━
📅 ${usuario.misionesFecha}
━━━━━━━━━━━━━━━━━━━━

`;

  for (const mision of MISIONES) {

    const progreso =
      usuario.misiones[mision.id];

    let estado;

    if (progreso.reclamada) {

      estado = "🎁 RECLAMADA";

    } else if (progreso.completada) {

      estado = "✅ COMPLETADA";

    } else {

      estado =
        `${progreso.progreso}/${mision.objetivo}`;
    }

    texto +=
`${mision.nombre}
📌 ${mision.descripcion}
📊 ${estado}
⭐ Recompensa: +${mision.recompensa} XP

`;
  }

  texto +=
`━━━━━━━━━━━━━━━━━━━━
🎁 Completa una misión y usa:
.misionreclamar`;

  await sock.sendMessage(chat, {
    text: texto
  });
}

// =========================================
// 🔎 .mision
// =========================================

async function mostrarMision(
  sock,
  chat,
  id,
  args
) {

  const usuario =
    obtenerMisiones(id);

  const mision =
    buscarMision(args[0]);

  if (!mision) {

    await sock.sendMessage(chat, {
      text:
`❌ Misión no encontrada.

Usa:
.misiones`
    });

    return;
  }

  const progreso =
    usuario.misiones[mision.id];

  let estado = "🔄 EN PROGRESO";

  if (progreso.reclamada) {
    estado = "🎁 RECLAMADA";
  } else if (progreso.completada) {
    estado = "✅ COMPLETADA";
  }

  const texto =
`🎯 *DETALLE DE MISIÓN*

━━━━━━━━━━━━━━━━━━━━
${mision.nombre}

📌 ${mision.descripcion}

📊 Progreso:
${progreso.progreso}/${mision.objetivo}

⭐ Recompensa:
+${mision.recompensa} XP

📍 Estado:
${estado}
━━━━━━━━━━━━━━━━━━━━`;

  await sock.sendMessage(chat, {
    text: texto
  });
}

// =========================================
// ℹ️ .misionesinfo
// =========================================

async function mostrarInfo(
  sock,
  chat
) {

  const texto =
`ℹ️ *INFORMACIÓN DE MISIONES*

━━━━━━━━━━━━━━━━━━━━

🎯 Las misiones son objetivos
que puedes completar jugando
y usando TITANBOT.

🎮 Completa los objetivos para
desbloquear recompensas.

⭐ Las recompensas entregan XP.

🎁 Cuando completes una misión,
usa:

.misionreclamar

📋 Para ver tus misiones:

.misiones

🔎 Para ver una misión:

.mision [nombre]

━━━━━━━━━━━━━━━━━━━━
🔄 Las misiones se reinician
cada día.`;

  await sock.sendMessage(chat, {
    text: texto
  });
}

// =========================================
// 🔄 .misioncompletar
// =========================================

async function comprobarMisiones(
  sock,
  chat,
  id
) {

  const usuario =
    obtenerMisiones(id);

  const completadas =
    MISIONES.filter(
      m =>
        usuario.misiones[m.id] &&
        usuario.misiones[m.id].completada
    );

  if (!completadas.length) {

    await sock.sendMessage(chat, {
      text:
`🔄 *MISIÓNES*

Todavía no tienes misiones
completadas.

🎯 Sigue jugando para avanzar.`
    });

    return;
  }

  let texto =
`✅ *MISIONES COMPLETADAS*

━━━━━━━━━━━━━━━━━━━━

`;

  for (const mision of completadas) {

    const progreso =
      usuario.misiones[mision.id];

    texto +=
`${mision.nombre}
📊 ${mision.objetivo}/${mision.objetivo}
⭐ +${mision.recompensa} XP
${progreso.reclamada
  ? "🎁 Recompensa reclamada"
  : "🎁 Recompensa disponible"}

`;

  }

  texto +=
`━━━━━━━━━━━━━━━━━━━━
Usa .misionreclamar para
recibir tus recompensas.`;

  await sock.sendMessage(chat, {
    text: texto
  });
}

// =========================================
// 🎁 .misionreclamar
// =========================================

async function reclamarMision(
  sock,
  chat,
  id,
  args
) {

  const usuario =
    obtenerMisiones(id);

  let misionesParaReclamar = [];

  if (args[0]) {

    const mision =
      buscarMision(args[0]);

    if (!mision) {

      await sock.sendMessage(chat, {
        text:
`❌ Misión no encontrada.

Usa:
.misiones`
      });

      return;
    }

    misionesParaReclamar.push(mision);

  } else {

    misionesParaReclamar =
      MISIONES.filter(
        m =>
          usuario.misiones[m.id] &&
          usuario.misiones[m.id].completada &&
          !usuario.misiones[m.id].reclamada
      );
  }

  if (!misionesParaReclamar.length) {

    await sock.sendMessage(chat, {
      text:
`🎁 No tienes recompensas
pendientes por reclamar.`
    });

    return;
  }

  let recompensaTotal = 0;
  let nombres = [];

  for (const mision of misionesParaReclamar) {

    const progreso =
      usuario.misiones[mision.id];

    if (
      !progreso.completada ||
      progreso.reclamada
    ) {
      continue;
    }

    progreso.reclamada = true;

    recompensaTotal +=
      mision.recompensa;

    nombres.push(
      `${mision.nombre} → +${mision.recompensa} XP`
    );
  }

  if (!recompensaTotal) {

    await sock.sendMessage(chat, {
      text:
`❌ Esa misión todavía no está
completada o ya reclamaste
su recompensa.`
    });

    return;
  }

  guardarUsuario(id, usuario);

  const resultado =
    agregarXP(
      id,
      recompensaTotal
    );

  let texto =
`🎁 *RECOMPENSA RECLAMADA*

━━━━━━━━━━━━━━━━━━━━

${nombres.join("\n")}

━━━━━━━━━━━━━━━━━━━━
⭐ XP recibida: +${recompensaTotal}
📊 Nivel: ${resultado.usuario.nivel}`;

  if (resultado.subioNivel) {

    texto +=
`\n🎉 *¡SUBISTE DE NIVEL!*`;
  }

  await sock.sendMessage(chat, {
    text: texto
  });
}

// =========================================
// 🚀 CONTROL PRINCIPAL
// =========================================

async function misiones(
  sock,
  chat,
  comando,
  args = [],
  id
) {

  const cmd =
    String(comando || "")
      .toLowerCase()
      .trim();

  if (cmd === "misiones") {

    await mostrarMisiones(
      sock,
      chat,
      id
    );

    return true;
  }

  if (cmd === "mision") {

    await mostrarMision(
      sock,
      chat,
      id,
      args
    );

    return true;
  }

  if (cmd === "misionesinfo") {

    await mostrarInfo(
      sock,
      chat
    );

    return true;
  }

  if (cmd === "misioncompletar") {

    await comprobarMisiones(
      sock,
      chat,
      id
    );

    return true;
  }

  if (cmd === "misionreclamar") {

    await reclamarMision(
      sock,
      chat,
      id,
      args
    );

    return true;
  }

  return false;
}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = misiones;

module.exports.misiones = misiones;
module.exports.avanzarMision = avanzarMision;
module.exports.obtenerMisiones = obtenerMisiones;
module.exports.MISIONES = MISIONES;
