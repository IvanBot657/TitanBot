const fs = require("fs");

const DB = "./database/users.json";

// ========================================
// CARGAR BASE DE DATOS
// ========================================

function cargarUsuarios() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  try {
    return JSON.parse(
      fs.readFileSync(DB, "utf8")
    );
  } catch (error) {
    console.log("❌ Error leyendo users.json:", error);
    return {};
  }
}

// ========================================
// GUARDAR BASE DE DATOS
// ========================================

function guardarUsuarios(db) {
  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}

// ========================================
// CREAR / OBTENER USUARIO
// ========================================

function obtenerUsuario(id) {

  const db = cargarUsuarios();

  if (!db[id]) {

    db[id] = {
      nombre: "Usuario",
      registrado: false,
      xp: 0,
      nivel: 1,
      dinero: 500,
      banco: 0,
      inventario: {}
    };

    guardarUsuarios(db);
  }

  return db[id];
}

// ========================================
// GANAR XP
// ========================================

function ganarXP(id) {

  const db = cargarUsuarios();

  if (!db[id]) {

    db[id] = {
      nombre: "Usuario",
      registrado: false,
      xp: 0,
      nivel: 1,
      dinero: 500,
      banco: 0,
      inventario: {}
    };
  }

  const user = db[id];

  const xpGanada =
    Math.floor(
      Math.random() * 11
    ) + 5;

  user.xp += xpGanada;

  let nivelesSubidos = 0;
  let recompensaTotal = 0;

  while (
    user.xp >= user.nivel * 100
  ) {

    user.xp -=
      user.nivel * 100;

    user.nivel++;

    nivelesSubidos++;

    const recompensa =
      user.nivel * 250;

    user.dinero += recompensa;

    recompensaTotal += recompensa;
  }

  guardarUsuarios(db);

  return {
    xpGanada,
    subioNivel: nivelesSubidos > 0,
    nivelesSubidos,
    recompensaTotal,
    nivel: user.nivel,
    xp: user.xp
  };
}

// ========================================
// FUNCIÓN PRINCIPAL
// COMPATIBLE CON TU INDEX.JS
// ========================================

async function usuario(
  sock,
  chat,
  comando,
  args,
  id
) {

  const db = cargarUsuarios();

  // Crear usuario si no existe
  if (!db[id]) {

    db[id] = {
      nombre: "Usuario",
      registrado: false,
      xp: 0,
      nivel: 1,
      dinero: 500,
      banco: 0,
      inventario: {}
    };

    guardarUsuarios(db);
  }

  const user = db[id];

  // ========================================
  // REGISTRAR
  // ========================================

  if (comando === "registrar") {

    if (user.registrado) {

      await sock.sendMessage(chat, {
        text:
`✅ Ya estás registrado.

👤 Nombre: ${user.nombre}
⭐ Nivel: ${user.nivel}`
      });

      return true;
    }

    user.registrado = true;

    if (args && args.length > 0) {
      user.nombre = args.join(" ");
    }

    user.dinero += 500;

    guardarUsuarios(db);

    await sock.sendMessage(chat, {
      text:
`🎉 REGISTRO COMPLETADO

👤 Nombre: ${user.nombre}

🎁 Recompensa:
+500 TitanCoins

⭐ Nivel: 1

¡Bienvenido a TitanBot!`
    });

    return true;
  }

  // ========================================
  // PERFIL
  // ========================================

  if (comando === "perfil") {

    await sock.sendMessage(chat, {
      text:
`👤 PERFIL

📛 Nombre: ${user.nombre}

⭐ Nivel: ${user.nivel}

✨ XP:
${user.xp}/${user.nivel * 100}

💰 TitanCoins:
${user.dinero}

🏦 Banco:
${user.banco}`
    });

    return true;
  }

  // ========================================
  // NIVEL
  // ========================================

  if (comando === "nivel") {

    const necesario =
      user.nivel * 100;

    const falta =
      Math.max(
        0,
        necesario - user.xp
      );

    await sock.sendMessage(chat, {
      text:
`⭐ NIVEL

👤 ${user.nombre}

🏆 Nivel actual:
${user.nivel}

✨ XP:
${user.xp}/${necesario}

📈 Falta:
${falta} XP`
    });

    return true;
  }

  // ========================================
  // XP
  // ========================================

  if (comando === "xp") {

    await sock.sendMessage(chat, {
      text:
`✨ EXPERIENCIA

👤 ${user.nombre}

⭐ Nivel: ${user.nivel}

✨ XP:
${user.xp}/${user.nivel * 100}`
    });

    return true;
  }

  // ========================================
  // RANK
  // ========================================

  if (comando === "rank") {

    const usuarios =
      Object.entries(db);

    usuarios.sort(
      (a, b) =>
        b[1].nivel - a[1].nivel ||
        b[1].xp - a[1].xp
    );

    const posicion =
      usuarios.findIndex(
        ([usuarioId]) =>
          usuarioId === id
      ) + 1;

    await sock.sendMessage(chat, {
      text:
`🏆 TU RANK

👤 ${user.nombre}

📊 Posición:
#${posicion}

⭐ Nivel:
${user.nivel}

✨ XP:
${user.xp}`
    });

    return true;
  }

  // ========================================
  // TOP
  // ========================================

  if (comando === "top") {

    const usuarios =
      Object.entries(db);

    usuarios.sort(
      (a, b) =>
        b[1].nivel - a[1].nivel ||
        b[1].xp - a[1].xp
    );

    let texto =
`🏆 TOP TITANBOT

`;

    usuarios
      .slice(0, 10)
      .forEach(
        ([usuarioId, datos], index) => {

          texto +=
`#${index + 1} 👤 ${datos.nombre}
⭐ Nivel: ${datos.nivel}
✨ XP: ${datos.xp}

`;
        }
      );

    await sock.sendMessage(chat, {
      text: texto
    });

    return true;
  }

  // ========================================
  // NO ES COMANDO DE USUARIO
  // ========================================

  return false;
}

// ========================================
// EXPORTACIONES
// ========================================

// IMPORTANTE:
// Exportamos usuario directamente porque
// tu index.js hace:
//
// await usuario(...)

module.exports = usuario;

// Funciones adicionales
module.exports.usuario = usuario;
module.exports.obtenerUsuario = obtenerUsuario;
module.exports.cargarUsuarios = cargarUsuarios;
module.exports.guardarUsuarios = guardarUsuarios;
module.exports.ganarXP = ganarXP;
