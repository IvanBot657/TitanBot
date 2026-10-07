// =========================================
// ⚡ TITANBOT - SISTEMA DE TEMPORADAS
// =========================================
// Comandos:
// .temporada
// .temporadatop
// .temporadarecompensas
// .temporadamision
//
// Funciones:
// - Temporadas de 30 días
// - 12 temporadas por ciclo
// - 50 niveles
// - PT y ranking
// - Misiones diarias
// - Recompensas por nivel
// - Recompensa para el campeón
// - Historial de temporadas y ciclos
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

const DURACION_TEMPORADA = 30 * 24 * 60 * 60 * 1000;
const DURACION_MISION = 24 * 60 * 60 * 1000;

const TOTAL_TEMPORADAS = 12;
const TOTAL_NIVELES = 50;

const PT_POR_NIVEL = 400;

// =========================================
// 🌌 TEMPORADAS
// =========================================

const temporadas = [
  { numero: 1, nombre: "El Despertar TITAN", icono: "🌌" },
  { numero: 2, nombre: "La Era del Fuego", icono: "🔥" },
  { numero: 3, nombre: "Reino Helado", icono: "❄️" },
  { numero: 4, nombre: "Bosque Oscuro", icono: "🌲" },
  { numero: 5, nombre: "Imperio del Mar", icono: "🌊" },
  { numero: 6, nombre: "Tormenta TITAN", icono: "⚡" },
  { numero: 7, nombre: "Reino Perdido", icono: "🏜️" },
  { numero: 8, nombre: "Eclipse", icono: "🌑" },
  { numero: 9, nombre: "Dimensión TITAN", icono: "🌠" },
  { numero: 10, nombre: "Reino de los Dragones", icono: "🐉" },
  { numero: 11, nombre: "Imperio Cristal", icono: "💎" },
  { numero: 12, nombre: "La Gran Era TITAN", icono: "👑" }
];

// =========================================
// 🎁 RECOMPENSAS
// =========================================
// Las recompensas quedan registradas en el jugador.
// Para conectarlas a la economía de tu bot,
// otro comando puede leer "recompensasPendientes".

function obtenerRecompensaNivel(nivel) {
  const monedas = nivel * 100;

  return {
    nivel,
    ptRequeridos: (nivel - 1) * PT_POR_NIVEL,
    monedas,
    titulo: `TITAN NIVEL ${nivel}`
  };
}

// =========================================
// 🎯 MISIÓN DIARIA
// =========================================

function crearMisionDiaria() {
  return {
    tipo: "duelos",
    objetivo: 2,
    progreso: 0,
    recompensaPT: 100,
    recompensaMonedas: 300,
    completada: false,
    reclamada: false,
    inicio: Date.now()
  };
}

function asegurarMision(jugador) {
  const ahora = Date.now();

  if (
    !jugador.misionDiaria ||
    ahora - jugador.misionDiaria.inicio >= DURACION_MISION
  ) {
    jugador.misionDiaria = crearMisionDiaria();
  }

  return jugador.misionDiaria;
}

// =========================================
// 🎯 REGISTRAR PROGRESO DE MISIÓN
// =========================================

function registrarVictoriaDuelo(id, nombre) {
  const db = cargarDatabase();
  comprobarTemporada(db);

  const jugador = obtenerJugador(db, id, nombre);
  const mision = asegurarMision(jugador);

  if (!mision.completada) {
    mision.progreso = Math.min(
      mision.objetivo,
      mision.progreso + 1
    );

    if (mision.progreso >= mision.objetivo) {
      mision.completada = true;
    }
  }

  guardarDatabase(db);

  return {
    jugador,
    mision
  };
}

// =========================================
// 🎁 RECLAMAR MISIÓN
// =========================================

function reclamarMision(id, nombre) {
  const db = cargarDatabase();
  comprobarTemporada(db);

  const jugador = obtenerJugador(db, id, nombre);
  const mision = asegurarMision(jugador);

  if (!mision.completada) {
    guardarDatabase(db);
    return {
      ok: false,
      mensaje: "❌ Primero completa la misión."
    };
  }

  if (mision.reclamada) {
    guardarDatabase(db);
    return {
      ok: false,
      mensaje: "❌ Ya reclamaste esta misión."
    };
  }

  jugador.pt += mision.recompensaPT;
  jugador.nivel = calcularNivel(jugador.pt);

  jugador.monedasTemporada =
    (jugador.monedasTemporada || 0) +
    mision.recompensaMonedas;

  mision.reclamada = true;

  guardarDatabase(db);

  return {
    ok: true,
    jugador,
    mensaje:
      `🎁 MISIÓN COMPLETADA\n\n` +
      `⭐ +${mision.recompensaPT} PT\n` +
      `💰 +${mision.recompensaMonedas} monedas`
  };
}

// =========================================
// 🎯 DATABASE
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

function normalizarDatabase(db) {
  if (!db || typeof db !== "object") {
    return crearDatabase();
  }

  if (!Number.isInteger(db.ciclo) || db.ciclo < 1) {
    db.ciclo = 1;
  }

  if (
    !Number.isInteger(db.temporadaActual) ||
    db.temporadaActual < 1 ||
    db.temporadaActual > TOTAL_TEMPORADAS
  ) {
    db.temporadaActual = 1;
  }

  if (!Number.isFinite(db.inicioTemporada)) {
    db.inicioTemporada = Date.now();
  }

  if (!db.jugadores || typeof db.jugadores !== "object") {
    db.jugadores = {};
  }

  if (!Array.isArray(db.historialTemporadas)) {
    db.historialTemporadas = [];
  }

  if (!Array.isArray(db.historialCiclos)) {
    db.historialCiclos = [];
  }

  for (const jugador of Object.values(db.jugadores)) {
    jugador.pt = Number(jugador.pt) || 0;
    jugador.nivel = calcularNivel(jugador.pt);
    jugador.victoriasTemporada =
      Number(jugador.victoriasTemporada) || 0;
    jugador.misionesCompletadas =
      Number(jugador.misionesCompletadas) || 0;
    jugador.monedasTemporada =
      Number(jugador.monedasTemporada) || 0;

    if (!jugador.recompensasPendientes) {
      jugador.recompensasPendientes = [];
    }
  }

  return db;
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

    const contenido = fs.readFileSync(
      databasePath,
      "utf8"
    );

    if (!contenido.trim()) {
      const db = crearDatabase();
      guardarDatabase(db);
      return db;
    }

    const db = normalizarDatabase(
      JSON.parse(contenido)
    );

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
      JSON.stringify(db, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error(
      "❌ Error guardando temporada.json:",
      error
    );
  }
}

// =========================================
// 👤 JUGADOR
// =========================================

function obtenerJugador(db, id, nombre) {
  if (!db.jugadores[id]) {
    db.jugadores[id] = {
      id,
      nombre,
      pt: 0,
      nivel: 1,
      victoriasTemporada: 0,
      misionesCompletadas: 0,
      monedasTemporada: 0,
      recompensasPendientes: [],
      misionDiaria: crearMisionDiaria()
    };
  }

  db.jugadores[id].nombre = nombre;

  if (!Array.isArray(db.jugadores[id].recompensasPendientes)) {
    db.jugadores[id].recompensasPendientes = [];
  }

  asegurarMision(db.jugadores[id]);

  return db.jugadores[id];
}

// =========================================
// ⭐ NIVEL
// =========================================

function calcularNivel(pt) {
  return Math.min(
    Math.floor(Math.max(0, pt) / PT_POR_NIVEL) + 1,
    TOTAL_NIVELES
  );
}

// =========================================
// ⭐ AGREGAR PT
// =========================================

function agregarPT(id, nombre, cantidad) {
  const db = cargarDatabase();

  comprobarTemporada(db);

  const jugador = obtenerJugador(
    db,
    id,
    nombre
  );

  const antes = jugador.nivel;

  const puntos = Number(cantidad);

  if (!Number.isFinite(puntos) || puntos <= 0) {
    guardarDatabase(db);
    return jugador;
  }

  jugador.pt += Math.floor(puntos);

  jugador.nivel = calcularNivel(jugador.pt);

  // Registrar recompensas por cada nivel nuevo.
  if (jugador.nivel > antes) {
    for (
      let nivel = antes + 1;
      nivel <= jugador.nivel;
      nivel++
    ) {
      const recompensa =
        obtenerRecompensaNivel(nivel);

      jugador.recompensasPendientes.push(
        recompensa
      );
    }
  }

  guardarDatabase(db);

  return jugador;
}

// =========================================
// 🏆 VICTORIA DE DUELO
// =========================================

function registrarVictoria(id, nombre, pt = 50) {
  const db = cargarDatabase();

  comprobarTemporada(db);

  const jugador = obtenerJugador(
    db,
    id,
    nombre
  );

  jugador.victoriasTemporada += 1;

  const resultado = agregarPT(
    id,
    nombre,
    pt
  );

  guardarDatabase(db);

  return resultado;
}

// =========================================
// ⏳ TIEMPO
// =========================================

function tiempoRestante(db) {
  const final =
    db.inicioTemporada +
    DURACION_TEMPORADA;

  const restante = Math.max(
    0,
    final - Date.now()
  );

  const dias = Math.floor(
    restante /
    (24 * 60 * 60 * 1000)
  );

  const horas = Math.floor(
    (restante %
      (24 * 60 * 60 * 1000)) /
    (60 * 60 * 1000)
  );

  return `${dias}d ${horas}h`;
}

// =========================================
// 🏆 FINALIZAR TEMPORADA
// =========================================

function finalizarTemporada(db) {
  const numero = db.temporadaActual;
  const temporada = temporadas[numero - 1];

  const jugadores = Object.values(
    db.jugadores
  );

  jugadores.sort(
    (a, b) => b.pt - a.pt
  );

  const campeon =
    jugadores[0] || null;

  db.historialTemporadas.push({
    ciclo: db.ciclo,
    temporada: numero,
    nombre: temporada.name || temporada.nombre,
    campeon: campeon
      ? {
          id: campeon.id,
          nombre: campeon.nombre,
          pt: campeon.pt
        }
      : null,
    fechaInicio: db.inicioTemporada,
    fechaFinal: Date.now()
  });

  if (
    db.temporadaActual <
    TOTAL_TEMPORADAS
  ) {
    db.temporadaActual++;
  } else {
    const historial =
      db.historialTemporadas.filter(
        t => t.ciclo === db.ciclo
      );

    db.historialCiclos.push({
      ciclo: db.ciclo,
      fechaInicio:
        historial[0]?.fechaInicio ||
        db.inicioTemporada,
      fechaFinal: Date.now(),
      campeones:
        historial
          .map(t => t.campeon)
          .filter(Boolean)
    });

    db.ciclo++;
    db.temporadaActual = 1;
  }

  db.inicioTemporada = Date.now();

  for (const jugador of Object.values(db.jugadores)) {
    jugador.pt = 0;
    jugador.nivel = 1;
    jugador.victoriasTemporada = 0;
    jugador.misionesCompletadas = 0;
    jugador.monedasTemporada = 0;
    jugador.recompensasPendientes = [];
    jugador.misionDiaria = crearMisionDiaria();
  }

  guardarDatabase(db);

  return {
    campeon,
    temporadaAnterior: numero,
    temporadaNueva: db.temporadaActual,
    ciclo: db.ciclo
  };
}

// =========================================
// ⏳ COMPROBAR TEMPORADA
// =========================================

function comprobarTemporada(db) {
  const ahora = Date.now();

  const tiempoPasado =
    ahora - db.inicioTemporada;

  if (tiempoPasado < DURACION_TEMPORADA) {
    return false;
  }

  finalizarTemporada(db);
  return true;
}

// =========================================
// 🎁 RECLAMAR RECOMPENSAS
// =========================================

function reclamarRecompensas(id, nombre) {
  const db = cargarDatabase();

  comprobarTemporada(db);

  const jugador = obtenerJugador(
    db,
    id,
    nombre
  );

  if (!jugador.recompensasPendientes.length) {
    guardarDatabase(db);

    return {
      ok: false,
      mensaje:
        "🎁 No tienes recompensas pendientes."
    };
  }

  const recompensas =
    jugador.recompensasPendientes.splice(
      0
    );

  const monedas = recompensas.reduce(
    (total, r) => total + r.monedas,
    0
  );

  jugador.monedasTemporada += monedas;

  guardarDatabase(db);

  return {
    ok: true,
    recompensas,
    monedas,
    jugador
  };
}

// =========================================
// 🏆 COMANDO
// =========================================

async function temporada(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {
  const db = cargarDatabase();

  comprobarTemporada(db);

  const nombre =
    msg?.pushName ||
    msg?.name ||
    id.split("@")[0];

  const comandoLimpio = String(
    comando || ""
  )
    .toLowerCase()
    .trim();

  // =====================================
  // ⚡ .temporada
  // =====================================

  if (
    comandoLimpio === "temporada" ||
    comandoLimpio === ".temporada"
  ) {
    const jugador = obtenerJugador(
      db,
      id,
      nombre
    );

    jugador.nivel =
      calcularNivel(jugador.pt);

    const actual =
      temporadas[
        db.temporadaActual - 1
      ];

    const posicion =
      Object.values(db.jugadores)
        .sort(
          (a, b) => b.pt - a.pt
        )
        .findIndex(
          j => j.id === id
        ) + 1;

    guardarDatabase(db);

    await sock.sendMessage(
      chat,
      {
        text:
`⚡╔════════════════════╗⚡
     TEMPORADA TITAN
⚡╚════════════════════╝⚡

${actual.icono} TEMPORADA ${actual.numero}
🔥 ${actual.nombre}

📅 CICLO TITAN: ${db.ciclo}
⏳ RESTANTE: ${tiempoRestante(db)}

👤 ${nombre}
━━━━━━━━━━━━━━━━━━━━
⭐ PT: ${jugador.pt}
⚡ NIVEL: ${jugador.nivel}/50
🏆 POSICIÓN: #${posicion}

🎯 MISIONES COMPLETADAS
${jugador.misionesCompletadas}

🏆 VICTORIAS
${jugador.victoriasTemporada}

🎁 RECOMPENSAS PENDIENTES
${jugador.recompensasPendientes.length}

━━━━━━━━━━━━━━━━━━━━
🏆 .temporadatop
🎁 .temporadarecompensas
🎯 .temporadamision
🎁 .temporadareclamar`
      }
    );

    return true;
  }

  // =====================================
  // 🏆 TOP
  // =====================================

  if (
    comandoLimpio === "temporadatop" ||
    comandoLimpio === ".temporadatop"
  ) {
    const ranking =
      Object.values(db.jugadores)
        .sort(
          (a, b) => b.pt - a.pt
        )
        .slice(0, 10);

    let texto =
`🏆╔════════════════════╗🏆
       TOP TEMPORADA
🏆╚════════════════════╝🏆

⚡ CICLO ${db.ciclo}
📅 TEMPORADA ${db.temporadaActual}

`;

    if (!ranking.length) {
      texto +=
        "❌ Todavía no hay jugadores registrados.";
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
      { text: texto }
    );

    return true;
  }

  // =====================================
  // 🎁 RECOMPENSAS
  // =====================================

  if (
    comandoLimpio === "temporadarecompensas" ||
    comandoLimpio === ".temporadarecompensas"
  ) {
    let texto =
`🎁╔════════════════════╗🎁
       RECOMPENSAS TITAN
🎁╚════════════════════╝🎁

⚡ TEMPORADA ${db.temporadaActual}

`;

    for (
      let nivel = 1;
      nivel <= TOTAL_NIVELES;
      nivel++
    ) {
      const recompensa =
        obtenerRecompensaNivel(nivel);

      texto +=
`⚡ NIVEL ${nivel}
⭐ ${recompensa.ptRequeridos} PT
💰 ${recompensa.monedas} monedas
🏷️ ${recompensa.titulo}

`;
    }

    texto +=
`🎁 Usa:
.temporadareclamar
para reclamar tus recompensas pendientes.`;

    await sock.sendMessage(
      chat,
      { text: texto }
    );

    return true;
  }

  // =====================================
  // 🎯 MISIÓN
  // =====================================

  if (
    comandoLimpio === "temporadamision" ||
    comandoLimpio === ".temporadamision"
  ) {
    const jugador = obtenerJugador(
      db,
      id,
      nombre
    );

    const mision =
      asegurarMision(jugador);

    const restante =
      Math.max(
        0,
        mision.inicio +
          DURACION_MISION -
          Date.now()
      );

    const horas = Math.floor(
      restante /
      (60 * 60 * 1000)
    );

    await sock.sendMessage(
      chat,
      {
        text:
`🎯╔════════════════════╗🎯
       MISIÓN DIARIA
🎯╚════════════════════╝🎯

⚔️ Gana 2 duelos

📊 PROGRESO
${mision.progreso}/${mision.objetivo}

🎁 RECOMPENSA
⭐ +${mision.recompensaPT} PT
💰 +${mision.recompensaMonedas} monedas

${mision.completada && !mision.reclamada
  ? "✅ ¡MISIÓN COMPLETADA!\n🎁 Usa .temporadareclamar"
  : mision.reclamada
    ? "🎁 Misión ya reclamada."
    : "⚔️ Sigue ganando duelos."}

⏳ Reinicio: ${horas}h`
      }
    );

    guardarDatabase(db);
    return true;
  }

  // =====================================
  // 🎁 RECLAMAR
  // =====================================

  if (
    comandoLimpio === "temporadareclamar" ||
    comandoLimpio === ".temporadareclamar"
  ) {
    const resultado =
      reclamarRecompensas(
        id,
        nombre
      );

    await sock.sendMessage(
      chat,
      {
        text: resultado.ok
          ? `🎁╔════════════════════╗🎁
      RECOMPENSAS TITAN
🎁╚════════════════════╝🎁

✅ Recompensas reclamadas.

💰 +${resultado.monedas} monedas
🎁 Recompensas: ${resultado.recompensas.length}`
          : resultado.mensaje
      }
    );

    return true;
  }

  // =====================================
  // ❌ NO ES COMANDO DE TEMPORADA
  // =====================================

  guardarDatabase(db);
  return false;
}

// =========================================
// 📤 EXPORTACIONES
// =========================================

// Mantiene el export principal:
// require("./temporada")
module.exports = temporada;

// Funciones auxiliares para que otros comandos,
// especialmente duelos, puedan dar PT y actualizar
// la misión diaria.
module.exports.agregarPT = agregarPT;
module.exports.registrarVictoria = registrarVictoria;
module.exports.registrarVictoriaDuelo =
  registrarVictoriaDuelo;
module.exports.reclamarMision = reclamarMision;
module.exports.cargarDatabase = cargarDatabase;
module.exports.guardarDatabase = guardarDatabase;
module.exports.comprobarTemporada =
  comprobarTemporada;
