const fs = require("fs");

const DB = "./database/users.json";

function cargarUsuarios() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  try {
    return JSON.parse(
      fs.readFileSync(DB, "utf8")
    );
  } catch {
    return {};
  }
}

function guardarUsuarios(db) {
  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}

function usuario(id, db = cargarUsuarios()) {

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

function obtenerUsuario(id) {
  const db = cargarUsuarios();
  return usuario(id, db);
}

// ========================================
// GANAR XP
// ========================================

function ganarXP(id) {

  const db = cargarUsuarios();
  const user = usuario(id, db);

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
    subioNivel:
      nivelesSubidos > 0,
    nivelesSubidos,
    recompensaTotal,
    nivel: user.nivel,
    xp: user.xp
  };
}

// ========================================
// COMANDOS
// ========================================

async function ejecutarUsuario(
  sock,
  chat,
  comando,
  args,
  id
) {

  const db = cargarUsuarios();
  const user = usuario(id, db);

  // PERFIL
  if (comando === "perfil") {

    return sock.sendMessage(chat, {
      text:
`👤 PERFIL

📛 Nombre: ${user.nombre}
⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}
💰 TitanCoins: ${user.dinero}
🏦 Banco: ${user.banco}`
    });
  }

  // REGISTRAR
  if (comando === "registrar") {

    if (user.registrado) {

      return sock.sendMessage(chat, {
        text:
"✅ Ya estás registrado en TitanBot."
      });
    }

    user.registrado = true;

    if (
      args.length > 0
    ) {
      user.nombre =
        args.join(" ");
    }

    guardarUsuarios(db);

    return sock.sendMessage(chat, {
      text:
`🎉 REGISTRO COMPLETADO

👤 Nombre: ${user.nombre}

🎁 Recompensa:
500 TitanCoins

¡Bienvenido a TitanBot!`
    });
  }

  // NIVEL
  if (comando === "nivel") {

    const necesario =
      user.nivel * 100;

    return sock.sendMessage(chat, {
      text:
`⭐ NIVEL

👤 ${user.nombre}

🏆 Nivel actual:
${user.nivel}

✨ XP:
${user.xp}/${necesario}

📈 Te faltan:
${necesario - user.xp} XP`
    });
  }

  // XP
  if (comando === "xp") {

    return sock.sendMessage(chat, {
      text:
`✨ EXPERIENCIA

👤 ${user.nombre}

⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}/${user.nivel * 100}`
    });
  }

  // RANK
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

    return sock.sendMessage(chat, {
      text:
`🏆 RANKING

👤 ${user.nombre}

📊 Posición:
#${posicion}

⭐ Nivel:
${user.nivel}

✨ XP:
${user.xp}`
    });
  }

  // TOP
  if (comando === "top") {

    const usuarios =
      Object.entries(db);

    usuarios.sort(
      (a, b) =>
        b[1].nivel - a[1].nivel ||
        b[1].xp - a[1].xp
    );

    let texto =
      "🏆 TOP TITANBOT\n\n";

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

    return sock.sendMessage(chat, {
      text: texto
    });
  }

  return false;
}

module.exports = {
  usuario,
  obtenerUsuario,
  cargarUsuarios,
  guardarUsuarios,
  ganarXP,
  ejecutarUsuario
};
