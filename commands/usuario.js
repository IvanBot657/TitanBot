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
      inventario: []
    };

    guardarUsuarios(db);
  }

  return db[id];
}

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
`👤 PERFIL

⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}
💰 Dinero: ${user.dinero}
💬 Mensajes: ${user.mensajes}`
    });
  }

  // NIVEL
  if (comando === "nivel") {

    return sock.sendMessage(chat, {
      text:
`⭐ NIVEL

Nivel actual: ${user.nivel}

✨ XP:
${user.xp}/${user.nivel * 100}`
    });
  }

  // XP
  if (comando === "xp") {

    return sock.sendMessage(chat, {
      text:
`✨ EXPERIENCIA

XP: ${user.xp}
Nivel: ${user.nivel}`
    });
  }

  // REGISTRAR
  if (comando === "registrar") {

    return sock.sendMessage(chat, {
      text:
`✅ REGISTRADO

Tu cuenta ya está registrada en TitanBot.

⭐ Nivel: ${user.nivel}
💰 Dinero: ${user.dinero}`
    });
  }

  // TOP
  if (
    comando === "top" ||
    comando === "rank"
  ) {

    const usuarios =
      Object.values(db);

    usuarios.sort(
      (a, b) =>
        b.nivel - a.nivel ||
        b.xp - a.xp
    );

    const lista =
      usuarios
        .slice(0, 10)
        .map(
          (u, i) =>
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
  guardarUsuarios
};
