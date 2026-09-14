const fs = require("fs");

const DB = "./database/users.json";

function cargarUsuarios() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  return JSON.parse(
    fs.readFileSync(DB, "utf8")
  );
}

function guardarUsuarios(db) {
  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}

function obtenerUsuario(id) {

  const db = cargarUsuarios();

  if (!db[id]) {

    db[id] = {
      dinero: 0,
      xp: 0,
      nivel: 1,
      mensajes: 0,
      inventario: [],
      ultimoDaily: 0,
      ultimoTrabajo: 0,
      ultimoMineria: 0,
      ultimaPesca: 0,
      ultimaXP: 0
    };

    guardarUsuarios(db);
  }

  return db[id];
}

// ==============================
// GANAR XP
// ==============================

function ganarXP(id) {

  const db = cargarUsuarios();
  const user = obtenerUsuario(id);

  const ahora = Date.now();

  // Evita ganar XP demasiadas veces seguidas
  if (
    user.ultimaXP &&
    ahora - user.ultimaXP < 60000
  ) {
    return {
      xpGanada: 0,
      subioNivel: false,
      nivel: user.nivel
    };
  }

  const xpGanada =
    Math.floor(Math.random() * 11) + 5;

  user.xp += xpGanada;
  user.mensajes += 1;
  user.ultimaXP = ahora;

  let subioNivel = false;

  const xpNecesaria =
    user.nivel * 100;

  if (user.xp >= xpNecesaria) {

    user.xp -= xpNecesaria;
    user.nivel += 1;

    // Recompensa por subir de nivel
    user.dinero += 250;

    subioNivel = true;
  }

  guardarUsuarios(db);

  return {
    xpGanada,
    subioNivel,
    nivel: user.nivel,
    recompensa: subioNivel ? 250 : 0
  };
}

// ==============================
// COMANDOS
// ==============================

async function usuario(
  sock,
  chat,
  comando,
  id
) {

  const db = cargarUsuarios();
  const user = obtenerUsuario(id);

  // PERFIL
  if (comando === "perfil") {

    return sock.sendMessage(chat, {
      text:
`👤 PERFIL TITANBOT

⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}/${user.nivel * 100}
💰 Dinero: ${user.dinero}
💬 Mensajes: ${user.mensajes}`
    });
  }

  // NIVEL
  if (comando === "nivel") {

    const necesaria =
      user.nivel * 100;

    return sock.sendMessage(chat, {
      text:
`⭐ TU NIVEL

🏆 Nivel actual: ${user.nivel}

✨ XP:
${user.xp}/${necesaria}

🎁 Recompensa al subir:
💰 +250 monedas`
    });
  }

  // XP
  if (comando === "xp") {

    return sock.sendMessage(chat, {
      text:
`✨ EXPERIENCIA

⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}/${user.nivel * 100}
💬 Mensajes: ${user.mensajes}`
    });
  }

  // REGISTRAR
  if (comando === "registrar") {

    return sock.sendMessage(chat, {
      text:
`✅ REGISTRADO

Tu cuenta ya está registrada en TitanBot.

⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}
💰 Dinero: ${user.dinero}`
    });
  }

  // TOP
  if (
    comando === "top" ||
    comando === "rank"
  ) {

    const usuarios =
      Object.entries(db);

    usuarios.sort(
      ([, a], [, b]) =>
        b.nivel - a.nivel ||
        b.xp - a.xp
    );

    const lista =
      usuarios
        .slice(0, 10)
        .map(
          ([id, u], i) =>
            `${i + 1}. ⭐ Nivel ${u.nivel} — ${u.xp} XP`
        )
        .join("\n");

    return sock.sendMessage(chat, {
      text:
`🏆 TOP TITANBOT

${lista || "Todavía no hay usuarios."}`
    });
  }

  return false;
}

module.exports = {
  usuario,
  obtenerUsuario,
  cargarUsuarios,
  guardarUsuarios,
  ganarXP
};
