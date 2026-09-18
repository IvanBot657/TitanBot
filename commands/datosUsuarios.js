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

function guardarUsuarios(
  usuarios
) {

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

    rachaUltimoDia: ""

  };

}

// =========================================
// 👤 OBTENER USUARIO
// =========================================

function obtenerUsuario(
  jid
) {

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

  // =====================================
  // 👤 CREAR USUARIO SI NO EXISTE
  // =====================================

  if (!usuarios[jid]) {

    usuarios[jid] =
      crearUsuario();

  }

  const usuario =
    usuarios[jid];

  // =====================================
  // ⭐ XP GANADO
  // =====================================

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
