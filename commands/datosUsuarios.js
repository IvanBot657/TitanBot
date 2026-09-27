// =========================================
// 👤 DATOS DE USUARIOS - TITANBOT
// =========================================

const fs = require("fs");
const path = require("path");

const archivoUsuarios = path.join(
  __dirname,
  "usuarios.json"
);

// =========================================
// 📂 CARGAR USUARIOS
// =========================================

function cargarUsuarios() {

  try {

    if (!fs.existsSync(archivoUsuarios)) {

      fs.writeFileSync(
        archivoUsuarios,
        "{}",
        "utf8"
      );

    }

    return JSON.parse(
      fs.readFileSync(
        archivoUsuarios,
        "utf8"
      )
    );

  } catch (error) {

    console.log(
      "❌ ERROR CARGANDO USUARIOS:",
      error
    );

    return {};

  }

}

// =========================================
// 💾 GUARDAR USUARIOS
// =========================================

function guardarUsuarios(usuarios) {

  try {

    fs.writeFileSync(
      archivoUsuarios,
      JSON.stringify(
        usuarios,
        null,
        2
      ),
      "utf8"
    );

  } catch (error) {

    console.log(
      "❌ ERROR GUARDANDO USUARIOS:",
      error
    );

  }

}

// =========================================
// 👤 CREAR USUARIO
// =========================================

function crearUsuario() {

  return {

    // =====================================
    // ⭐ EXPERIENCIA
    // =====================================

    nivel: 1,

    xp: 0,

    // =====================================
    // 🏆 ESTADÍSTICAS
    // =====================================

    logros: 0,

    aventuras: 0,

    capitulos: 0,

    // =====================================
    // 🎯 MISIONES
    // =====================================

    misionesFecha: "",

    misiones: {},

    // =====================================
    // 🐾 RACHA DE ANIMALES
    // =====================================

    rachaActual: 0,

    rachaMaxima: 0,

    nivelAnimal: 1,

    rachaUltimoDia: "",

    // =====================================
    // 🐾 MASCOTA
    // =====================================

    mascota: {

      adoptada: false,

      nombre: "",

      tipo: "",

      nivel: 1,

      experiencia: 0,

      felicidad: 100,

      energia: 100,

      hambre: 0,

      fechaAdopcion: ""

    }

  };

}

// =========================================
// 👤 OBTENER USUARIO
// =========================================

function obtenerUsuario(jid) {

  const usuarios =
    cargarUsuarios();

  // =====================================
  // 🆕 CREAR SI NO EXISTE
  // =====================================

  if (!usuarios[jid]) {

    usuarios[jid] =
      crearUsuario();

    guardarUsuarios(
      usuarios
    );

  }

  const usuario =
    usuarios[jid];

  // =====================================
  // ⭐ NIVEL
  // =====================================

  if (
    typeof usuario.nivel !== "number"
  ) {

    usuario.nivel = 1;

  }

  // =====================================
  // ⭐ XP
  // =====================================

  if (
    typeof usuario.xp !== "number"
  ) {

    usuario.xp = 0;

  }

  // =====================================
  // 🏆 LOGROS
  // =====================================

  if (
    typeof usuario.logros !== "number"
  ) {

    usuario.logros = 0;

  }

  // =====================================
  // ⚔️ AVENTURAS
  // =====================================

  if (
    typeof usuario.aventuras !== "number"
  ) {

    usuario.aventuras = 0;

  }

  // =====================================
  // 📖 CAPÍTULOS
  // =====================================

  if (
    typeof usuario.capitulos !== "number"
  ) {

    usuario.capitulos = 0;

  }

  // =====================================
  // 🎯 FECHA DE MISIONES
  // =====================================

  if (
    typeof usuario.misionesFecha !== "string"
  ) {

    usuario.misionesFecha = "";

  }

  // =====================================
  // 🎯 MISIONES
  // =====================================

  if (
    !usuario.misiones ||
    typeof usuario.misiones !== "object"
  ) {

    usuario.misiones = {};

  }

  // =====================================
  // 🐾 RACHA ACTUAL
  // =====================================

  if (
    typeof usuario.rachaActual !== "number"
  ) {

    usuario.rachaActual = 0;

  }

  // =====================================
  // 🏆 RÉCORD DE RACHA
  // =====================================

  if (
    typeof usuario.rachaMaxima !== "number"
  ) {

    usuario.rachaMaxima = 0;

  }

  // =====================================
  // 🐾 NIVEL DEL ANIMAL
  // =====================================

  if (
    typeof usuario.nivelAnimal !== "number"
  ) {

    usuario.nivelAnimal = 1;

  }

  // =====================================
  // 📅 ÚLTIMO DÍA DE RACHA
  // =====================================

  if (
    typeof usuario.rachaUltimoDia !== "string"
  ) {

    usuario.rachaUltimoDia = "";

  }

  // =====================================
  // 🐾 MASCOTA
  // =====================================

  if (
    !usuario.mascota ||
    typeof usuario.mascota !== "object"
  ) {

    usuario.mascota = {

      adoptada: false,

      nombre: "",

      tipo: "",

      nivel: 1,

      experiencia: 0,

      felicidad: 100,

      energia: 100,

      hambre: 0,

      fechaAdopcion: ""

    };

  }

  // =====================================
  // 🐾 DATOS DE MASCOTA
  // =====================================

  if (
    typeof usuario.mascota.adoptada !== "boolean"
  ) {

    usuario.mascota.adoptada = false;

  }

  if (
    typeof usuario.mascota.nombre !== "string"
  ) {

    usuario.mascota.nombre = "";

  }

  if (
    typeof usuario.mascota.tipo !== "string"
  ) {

    usuario.mascota.tipo = "";

  }

  if (
    typeof usuario.mascota.nivel !== "number"
  ) {

    usuario.mascota.nivel = 1;

  }

  if (
    typeof usuario.mascota.experiencia !== "number"
  ) {

    usuario.mascota.experiencia = 0;

  }

  if (
    typeof usuario.mascota.felicidad !== "number"
  ) {

    usuario.mascota.felicidad = 100;

  }

  if (
    typeof usuario.mascota.energia !== "number"
  ) {

    usuario.mascota.energia = 100;

  }

  if (
    typeof usuario.mascota.hambre !== "number"
  ) {

    usuario.mascota.hambre = 0;

  }

  if (
    typeof usuario.mascota.fechaAdopcion !== "string"
  ) {

    usuario.mascota.fechaAdopcion = "";

  }

  // =====================================
  // 💾 GUARDAR CAMBIOS
  // =====================================

  guardarUsuarios(
    usuarios
  );

  return usuario;

}

// =========================================
// 💾 GUARDAR UN USUARIO
// =========================================

function guardarUsuario(
  jid,
  usuario
) {

  const usuarios =
    cargarUsuarios();

  usuarios[jid] =
    usuario;

  guardarUsuarios(
    usuarios
  );

  return usuario;

}

// =========================================
// ⭐ AGREGAR XP
// =========================================

function agregarXP(
  jid,
  cantidad
) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {

    usuarios[jid] =
      crearUsuario();

  }

  const usuario =
    usuarios[jid];

  const xpGanado =
    Number(cantidad) || 0;

  usuario.xp +=
    xpGanado;

  let subioNivel =
    false;

  // =====================================
  // ⬆️ SUBIR DE NIVEL
  // =====================================

  while (
    usuario.xp >=
    usuario.nivel * 100
  ) {

    usuario.xp -=
      usuario.nivel * 100;

    usuario.nivel++;

    subioNivel = true;

  }

  // =====================================
  // 💾 GUARDAR
  // =====================================

  guardarUsuarios(
    usuarios
  );

  return {

    usuario,

    subioNivel,

    xpGanado

  };

}

// =========================================
// 🏆 AGREGAR LOGRO
// =========================================

function agregarLogro(
  jid,
  cantidad = 1
) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {

    usuarios[jid] =
      crearUsuario();

  }

  usuarios[jid].logros +=
    Number(cantidad) || 0;

  guardarUsuarios(
    usuarios
  );

  return usuarios[jid];

}

// =========================================
// ⚔️ AGREGAR AVENTURA
// =========================================

function agregarAventura(
  jid,
  cantidad = 1
) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {

    usuarios[jid] =
      crearUsuario();

  }

  usuarios[jid].aventuras +=
    Number(cantidad) || 0;

  guardarUsuarios(
    usuarios
  );

  return usuarios[jid];

}

// =========================================
// 📖 AGREGAR CAPÍTULO
// =========================================

function agregarCapitulo(
  jid,
  cantidad = 1
) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {

    usuarios[jid] =
      crearUsuario();

  }

  usuarios[jid].capitulos +=
    Number(cantidad) || 0;

  guardarUsuarios(
    usuarios
  );

  return usuarios[jid];

}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = {

  cargarUsuarios,

  guardarUsuarios,

  obtenerUsuario,

  guardarUsuario,

  agregarXP,

  agregarLogro,

  agregarAventura,

  agregarCapitulo

};
