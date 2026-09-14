const fs = require("fs");

const DB = "./database/users.json";

// ==========================================
// CARGAR USUARIOS
// ==========================================

function cargarUsuarios() {

  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  try {

    return JSON.parse(
      fs.readFileSync(DB, "utf8")
    );

  } catch (error) {

    console.log(
      "❌ Error leyendo users.json:",
      error.message
    );

    return {};
  }
}


// ==========================================
// GUARDAR USUARIOS
// ==========================================

function guardarUsuarios(db) {

  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}


// ==========================================
// CREAR / OBTENER USUARIO
// ==========================================

function obtenerUsuario(id) {

  const db = cargarUsuarios();

  if (!db[id]) {

    db[id] = {

      dinero: 0,

      banco: 0,

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


// ==========================================
// GANAR XP
// ==========================================

function ganarXP(id) {

  const db = cargarUsuarios();

  // Crear usuario dentro del MISMO objeto db
  if (!db[id]) {

    db[id] = {

      dinero: 0,

      banco: 0,

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
  }

  const user = db[id];

  const ahora = Date.now();

  // ========================================
  // COOLDOWN XP
  // ========================================

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


  // ========================================
  // XP ALEATORIA
  // ========================================

  const xpGanada =
    Math.floor(
      Math.random() * 11
    ) + 5;


  user.xp += xpGanada;

  user.mensajes += 1;

  user.ultimaXP = ahora;


  let subioNivel = false;

  let recompensa = 0;


  // ========================================
  // SUBIR DE NIVEL
  // ========================================

  while (
    user.xp >=
    user.nivel * 100
  ) {

    user.xp -=
      user.nivel * 100;

    user.nivel += 1;

    user.dinero += 250;

    recompensa += 250;

    subioNivel = true;
  }


  // ========================================
  // GUARDAR
  // ========================================

  guardarUsuarios(db);


  return {

    xpGanada,

    subioNivel,

    nivel: user.nivel,

    recompensa

  };
}


// ==========================================
// COMANDOS DE USUARIO
// ==========================================

async function usuario(
  sock,
  chat,
  comando,
  id
) {

  const db = cargarUsuarios();

  if (!db[id]) {

    db[id] = {

      dinero: 0,

      banco: 0,

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

  const user = db[id];


  // ========================================
  // PERFIL
  // ========================================

  if (comando === "perfil") {

    return sock.sendMessage(chat, {

      text:
`👤 PERFIL TITANBOT

🆔 ID:
${id}

⭐ Nivel:
${user.nivel}

✨ XP:
${user.xp}/${user.nivel * 100}

💰 Dinero:
${user.dinero}

🏦 Banco:
${user.banco}

💬 Mensajes:
${user.mensajes}`

    });
  }


  // ========================================
  // REGISTRAR
  // ========================================

  if (comando === "registrar") {

    return sock.sendMessage(chat, {

      text:
`✅ REGISTRO

Tu cuenta está registrada en TitanBot.

⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}
💰 Dinero: ${user.dinero}`

    });
  }


  // ========================================
  // NIVEL
  // ========================================

  if (comando === "nivel") {

    const necesaria =
      user.nivel * 100;

    return sock.sendMessage(chat, {

      text:
`⭐ NIVEL

🏆 Nivel actual:
${user.nivel}

✨ XP:
${user.xp}/${necesaria}

🎁 Recompensa:
💰 +250 monedas por nivel`

    });
  }


  // ========================================
  // XP
  // ========================================

  if (comando === "xp") {

    return sock.sendMessage(chat, {

      text:
`✨ EXPERIENCIA

⭐ Nivel:
${user.nivel}

✨ XP:
${user.xp}/${user.nivel * 100}

💬 Mensajes:
${user.mensajes}`

    });
  }


  // ========================================
  // TOP / RANK
  // ========================================

  if (
    comando === "top" ||
    comando === "rank"
  ) {

    const usuarios =
      Object.entries(db)
        .filter(
          ([, u]) =>
            u &&
            typeof u.nivel === "number" &&
            typeof u.xp === "number"
        );


    usuarios.sort(
      ([, a], [, b]) =>

        b.nivel - a.nivel ||

        b.xp - a.xp ||

        b.mensajes - a.mensajes

    );


    if (usuarios.length === 0) {

      return sock.sendMessage(chat, {

        text:
          "🏆 Todavía no hay usuarios registrados."

      });
    }


    const lista =
      usuarios
        .slice(0, 10)
        .map(
          ([id, u], i) =>

            `${i + 1}. 🏆 Nivel ${u.nivel} — ${u.xp} XP`

        )
        .join("\n");


    return sock.sendMessage(chat, {

      text:
`🏆 TOP TITANBOT

${lista}`

    });
  }


  return false;
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = {

  usuario,

  obtenerUsuario,

  cargarUsuarios,

  guardarUsuarios,

  ganarXP

};
