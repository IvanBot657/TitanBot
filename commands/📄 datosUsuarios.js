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
// 👤 OBTENER USUARIO
// =========================================

function obtenerUsuario(jid) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {

    usuarios[jid] = {
      nivel: 1,
      xp: 0,
      logros: 0,
      aventuras: 0,
      capitulos: 0
    };

    guardarUsuarios(usuarios);
  }

  return usuarios[jid];
}

// =========================================
// ⭐ AGREGAR XP
// =========================================

function agregarXP(jid, cantidad) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {

    usuarios[jid] = {
      nivel: 1,
      xp: 0,
      logros: 0,
      aventuras: 0,
      capitulos: 0
    };
  }

  const usuario =
    usuarios[jid];

  usuario.xp += cantidad;

  // =======================================
  // 📈 SUBIR DE NIVEL
  // Cada nivel requiere 100 XP
  // =======================================

  let subioNivel = false;

  while (
    usuario.xp >= usuario.nivel * 100
  ) {

    usuario.xp -=
      usuario.nivel * 100;

    usuario.nivel++;

    subioNivel = true;
  }

  guardarUsuarios(usuarios);

  return {
    usuario,
    subioNivel
  };
}

// =========================================
// 🏆 AGREGAR LOGRO
// =========================================

function agregarLogro(jid) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {
    obtenerUsuario(jid);
  }

  usuarios[jid].logros++;

  guardarUsuarios(usuarios);

  return usuarios[jid];
}

// =========================================
// ⚔️ AGREGAR AVENTURA
// =========================================

function agregarAventura(jid) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {
    obtenerUsuario(jid);
  }

  usuarios[jid].aventuras++;

  guardarUsuarios(usuarios);

  return usuarios[jid];
}

// =========================================
// 📖 AGREGAR CAPÍTULO
// =========================================

function agregarCapitulo(jid) {

  const usuarios =
    cargarUsuarios();

  if (!usuarios[jid]) {
    obtenerUsuario(jid);
  }

  usuarios[jid].capitulos++;

  guardarUsuarios(usuarios);

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
