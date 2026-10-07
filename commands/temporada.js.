// =========================================
// ⚡ TITANBOT - SISTEMA DE TEMPORADAS
// =========================================

const fs = require("fs");
const path = require("path");

const databaseDir = path.join(__dirname, "..", "database");
const databasePath = path.join(databaseDir, "temporada.json");

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

// =========================================
// ⚡ CONFIGURACIÓN
// =========================================

const DURACION_TEMPORADA =
  30 * 24 * 60 * 60 * 1000;

const TOTAL_TEMPORADAS = 12;

const TOTAL_NIVELES = 50;

// =========================================
// 🌌 TEMPORADAS
// =========================================

const temporadas = [

  {
    numero: 1,
    nombre: "El Despertar TITAN",
    icono: "🌌"
  },

  {
    numero: 2,
    nombre: "La Era del Fuego",
    icono: "🔥"
  },

  {
    numero: 3,
    nombre: "Reino Helado",
    icono: "❄️"
  },

  {
    numero: 4,
    nombre: "Bosque Oscuro",
    icono: "🌲"
  },

  {
    numero: 5,
    nombre: "Imperio del Mar",
    icono: "🌊"
  },

  {
    numero: 6,
    nombre: "Tormenta TITAN",
    icono: "⚡"
  },

  {
    numero: 7,
    nombre: "Reino Perdido",
    icono: "🏜️"
  },

  {
    numero: 8,
    nombre: "Eclipse",
    icono: "🌑"
  },

  {
    numero: 9,
    nombre: "Dimensión TITAN",
    icono: "🌠"
  },

  {
    numero: 10,
    nombre: "Reino de los Dragones",
    icono: "🐉"
  },

  {
    numero: 11,
    nombre: "Imperio Cristal",
    icono: "💎"
  },

  {
    numero: 12,
    nombre: "La Gran Era TITAN",
    icono: "👑"
  }

];

// =========================================
// 🎯 CREAR BASE DE DATOS
// =========================================

function crearDatabase() {

  return {

    ciclo: 1,

    temporadaActual: 1,

    inicioTemporada: Date.now(),

    jugadores: {},

    historialTemporadas: [],

    historialCiclos: []

  };

}

// =========================================
// 📂 CARGAR DATABASE
// =========================================

function cargarDatabase() {

  try {

    if (!fs.existsSync(databasePath)) {

      const db = crearDatabase();

      guardarDatabase(db);

      return db;

    }

    const contenido =
      fs.readFileSync(
        databasePath,
        "utf8"
      );

    if (!contenido.trim()) {

      const db = crearDatabase();

      guardarDatabase(db);

      return db;

    }

    const db =
      JSON.parse(contenido);

    return db;

  } catch (error) {

    console.error(
      "❌ Error leyendo temporada.json:",
      error
    );

    const db = crearDatabase();

    guardarDatabase(db);

    return db;

  }

}

// =========================================
// 💾 GUARDAR DATABASE
// =========================================

function guardarDatabase(db) {

  try {

    fs.writeFileSync(

      databasePath,

      JSON.stringify(
        db,
        null,
        2
      )

    );

  } catch (error) {

    console.error(
      "❌ Error guardando temporada.json:",
      error
    );

  }

}

// =========================================
// 👤 CREAR / OBTENER JUGADOR
// =========================================

function obtenerJugador(
  db,
  id,
  nombre
) {

  if (!db.jugadores[id]) {

    db.jugadores[id] = {

      id,

      nombre,

      pt: 0,

      nivel: 1,

      victoriasTemporada: 0,

      misionesCompletadas: 0

    };

  }

  db.jugadores[id].nombre =
    nombre;

  return db.jugadores[id];

}

// =========================================
// ⭐ CALCULAR NIVEL
// =========================================

function calcularNivel(pt) {

  const nivel =
    Math.floor(pt / 400) + 1;

  return Math.min(
    nivel,
    TOTAL_NIVELES
  );

}

// =========================================
// ⏳ COMPROBAR TEMPORADA
// =========================================

function comprobarTemporada(db) {

  const ahora = Date.now();

  const tiempoPasado =
    ahora - db.inicioTemporada;

  if (
    tiempoPasado <
    DURACION_TEMPORADA
  ) {

    return false;

  }

  finalizarTemporada(db);

  return true;

}

// =========================================
// 🏆 FINALIZAR TEMPORADA
// =========================================

function finalizarTemporada(db) {

  const numero =
    db.temporadaActual;

  const temporada =
    temporadas[numero - 1];

  const jugadores =
    Object.values(
      db.jugadores
    );

  jugadores.sort(
    (a, b) =>
      b.pt - a.pt
  );

  const campeon =
    jugadores[0] || null;

  db.historialTemporadas.push({

    ciclo: db.ciclo,

    temporada: numero,

    nombre:
      temporada.nombre,

    campeon: campeon
      ? {
          id: campeon.id,
          nombre: campeon.nombre,
          pt: campeon.pt
        }
      : null,

    fechaInicio:
      db.inicioTemporada,

    fechaFinal:
      Date.now()

  });

  // =====================================
  // 🔄 SIGUIENTE TEMPORADA
  // =====================================

  if (
    db.temporadaActual <
    TOTAL_TEMPORADAS
  ) {

    db.temporadaActual++;

  } else {

    // ===================================
    // 👑 FINAL DEL CICLO ANUAL
    // ===================================

    const historial =
      db.historialTemporadas.filter(
        t => t.ciclo === db.ciclo
      );

    db.historialCiclos.push({

      ciclo: db.ciclo,

      fechaInicio:
        historial[0]?.fechaInicio ||
        db.inicioTemporada,

      fechaFinal:
        Date.now(),

      campeones:
        historial.map(
          t => t.campeon
        ).filter(Boolean)

    });

    db.ciclo++;

    db.temporadaActual = 1;

  }

  // ===================================
  // 🔄 REINICIAR TEMPORADA
  // ===================================

  db.inicioTemporada =
    Date.now();

  for (
    const jugador of
    Object.values(db.jugadores)
  ) {

    jugador.pt = 0;

    jugador.nivel = 1;

    jugador.victoriasTemporada = 0;

    jugador.misionesCompletadas = 0;

  }

}

// =========================================
// ⭐ AGREGAR PUNTOS
// =========================================

function agregarPT(
  id,
  nombre,
  cantidad
) {

  const db =
    cargarDatabase();

  comprobarTemporada(db);

  const jugador =
    obtenerJugador(
      db,
      id,
      nombre
    );

  jugador.pt += cantidad;

  jugador.nivel =
    calcularNivel(
      jugador.pt
    );

  guardarDatabase(db);

  return jugador;

}

// =========================================
// ⏱️ TIEMPO RESTANTE
// =========================================

function tiempoRestante(
  db
) {

  const final =
    db.inicioTemporada +
    DURACION_TEMPORADA;

  const restante =
    Math.max(
      0,
      final - Date.now()
    );

  const dias =
    Math.floor(
      restante /
      (24 * 60 * 60 * 1000)
    );

  const horas =
    Math.floor(
      (restante %
        (24 * 60 * 60 * 1000)) /
      (60 * 60 * 1000)
    );

  return `${dias}d ${horas}h`;

}

// =========================================
// ⚡ COMANDO PRINCIPAL
// =========================================

async function temporada(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const db =
    cargarDatabase();

  comprobarTemporada(db);

  // =====================================
  // ⚡ .temporada
  // =====================================

  if (comando === "temporada") {

    const nombre =
      msg?.pushName ||
      msg?.name ||
      id.split("@")[0];

    const jugador =
      obtenerJugador(
        db,
        id,
        nombre
      );

    jugador.nivel =
      calcularNivel(
        jugador.pt
      );

    const actual =
      temporadas[
        db.temporadaActual - 1
      ];

    const posicion =
      Object.values(
        db.jugadores
      )
      .sort(
        (a, b) =>
          b.pt - a.pt
      )
      .findIndex(
        j => j.id === id
      ) + 1;

    guardarDatabase(db);

    await sock.sendMessage(
      chat,
      {

        text:
`⚡ ━━━ TEMPORADA TITAN ━━━ ⚡

${actual.icono} TEMPORADA ${actual.numero}
🌌 ${actual.nombre}

📅 Ciclo TITAN: ${db.ciclo}
⏳ Tiempo restante: ${tiempoRestante(db)}

👤 ${nombre}

⭐ PT: ${jugador.pt}
⚡ Nivel: ${jugador.nivel}/50
🏆 Posición: #${posicion}

🎯 Misiones completadas:
${jugador.misionesCompletadas}

🏆 Victorias:
${jugador.victoriasTemporada}

━━━━━━━━━━━━━━━━━━

📌 Usa:
.temporadatop
.temporadarecompensas
.temporadamision`

      }
    );

    return true;

  }

  // =====================================
  // 🏆 .temporadatop
  // =====================================

  if (
    comando === "temporadatop"
  ) {

    const ranking =
      Object.values(
        db.jugadores
      )
      .sort(
        (a, b) =>
          b.pt - a.pt
      )
      .slice(0, 10);

    let texto =
`🏆 ━━━ TOP TEMPORADA ━━━ 🏆

⚡ CICLO ${db.ciclo}
📅 TEMPORADA ${db.temporadaActual}

`;

    if (!ranking.length) {

      texto +=
        "Todavía no hay jugadores registrados.";

    } else {

      ranking.forEach(
        (jugador, index) => {

          const medallas = [
            "🥇",
            "🥈",
            "🥉"
          ];

          const puesto =
            medallas[index] ||
            `${index + 1}️⃣`;

          texto +=
`${puesto} ${jugador.nombre}
⭐ ${jugador.pt} PT
⚡ Nivel ${jugador.nivel}

`;

        }
      );

    }

    await sock.sendMessage(
      chat,
      {
        text: texto
      }
    );

    return true;

  }

  // =====================================
  // 🎁 .temporadarecompensas
  // =====================================

  if (
    comando ===
    "temporadarecompensas"
  ) {

    let texto =
`🎁 ━━━ RECOMPENSAS ━━━ 🎁

⚡ TEMPORADA ${db.temporadaActual}

`;

    for (
      let nivel = 1;
      nivel <= TOTAL_NIVELES;
      nivel++
    ) {

      const pt =
        (nivel - 1) * 400;

      texto +=
`⚡ Nivel ${nivel}
⭐ ${pt} PT
🎁 Recompensa TITAN

`;

    }

    await sock.sendMessage(
      chat,
      {
        text: texto
      }
    );

    return true;

  }

  // =====================================
  // 🎯 .temporadamision
  // =====================================

  if (
    comando ===
    "temporadamision"
  ) {

    await sock.sendMessage(
      chat,
      {

        text:
`🎯 ━━━ MISIÓN DIARIA ━━━ 🎯

⚔️ Gana 2 duelos

📊 Progreso:
0/2

🎁 Recompensa:
⭐ +100 PT
💰 +300 monedas

⏳ Se reinicia cada 24 horas.`

      }
    );

    return true;

  }

  guardarDatabase(db);

  return false;

}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = temporada;
