// =========================================
// 👤 DATOS DE USUARIOS - TITANBOT
// =========================================

const fs = require("fs");
const path = require("path");

const archivoUsuarios =
  path.join(
    __dirname,
    "usuarios.json"
  );

// =========================================
// 📂 CARGAR USUARIOS
// =========================================

function cargarUsuarios() {

  try {

    if (
      !fs.existsSync(
        archivoUsuarios
      )
    ) {

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
// 👤 USUARIO NUEVO
// =========================================

function crearUsuario() {

  return {
    nivel: 1,
    xp: 0,
    logros: 0,
    aventuras: 0,
    capitulos: 0,

    misionesFecha: "",
    misiones: {}
  };
}

// =========================================
// 👤 OBTENER USUARIO
// =========================================

function obtenerUsuario(jid) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {

    usuarios[jid] =
      crearUsuario();

    guardarUsuarios(
      usuarios
    );
  }

  // Compatibilidad con usuarios
  // creados anteriormente

  const usuario =
    usuarios[jid];

  if (
    typeof usuario.nivel !==
    "number"
  ) {
    usuario.nivel = 1;
  }

  if (
    typeof usuario.xp !==
    "number"
  ) {
    usuario.xp = 0;
  }

  if (
    typeof usuario.logros !==
    "number"
  ) {
    usuario.logros = 0;
  }

  if (
    typeof usuario.aventuras !==
    "number"
  ) {
    usuario.aventuras = 0;
  }

  if (
    typeof usuario.capitulos !==
    "number"
  ) {
    usuario.capitulos = 0;
  }

  if (
    !usuario.misiones
  ) {
    usuario.misiones = {};
  }

  if (
    typeof usuario.misionesFecha !==
    "string"
  ) {
    usuario.misionesFecha = "";
  }

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

  usuario.xp +=
    Number(cantidad) || 0;

  let subioNivel = false;

  while (
    usuario.xp >=
    usuario.nivel * 100
  ) {

    usuario.xp -=
      usuario.nivel * 100;

    usuario.nivel++;

    subioNivel = true;
  }

  guardarUsuarios(
    usuarios
  );

  return {
    usuario,
    subioNivel
  };
}

// =========================================
// 🏆 LOGRO
// =========================================

function agregarLogro(jid) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {
    usuarios[jid] =
      crearUsuario();
  }

  usuarios[jid].logros++;

  guardarUsuarios(
    usuarios
  );

  return usuarios[jid];
}

// =========================================
// ⚔️ AVENTURA
// =========================================

function agregarAventura(jid) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {
    usuarios[jid] =
      crearUsuario();
  }

  usuarios[jid].aventuras++;

  guardarUsuarios(
    usuarios
  );

  return usuarios[jid];
}

// =========================================
// 📖 CAPÍTULO
// =========================================

function agregarCapitulo(jid) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {
    usuarios[jid] =
      crearUsuario();
  }

  usuarios[jid].capitulos++;

  guardarUsuarios(
    usuarios
  );

  return usuarios[jid];
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = {
  obtenerUsuario,
  agregarXP,
  agregarLogro,
  agregarAventura,
  agregarCapitulo
};
