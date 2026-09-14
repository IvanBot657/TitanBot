const fs = require("fs");

const DB = "./database/users.json";

// ==========================================
// BASE DE DATOS
// ==========================================

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


// ==========================================
// OBTENER USUARIO
// ==========================================

function obtenerUsuario(db, id) {

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

  // Compatibilidad con usuarios antiguos

  if (typeof db[id].dinero !== "number") {
    db[id].dinero = 0;
  }

  if (typeof db[id].banco !== "number") {
    db[id].banco = 0;
  }

  if (typeof db[id].xp !== "number") {
    db[id].xp = 0;
  }

  if (typeof db[id].nivel !== "number") {
    db[id].nivel = 1;
  }

  if (typeof db[id].mensajes !== "number") {
    db[id].mensajes = 0;
  }

  if (!Array.isArray(db[id].inventario)) {
    db[id].inventario = [];
  }

  if (typeof db[id].ultimaXP !== "number") {
    db[id].ultimaXP = 0;
  }

  return db[id];
}


// ==========================================
// GANAR XP
// ==========================================

function ganarXP(id) {

  const db =
    cargarUsuarios();

  const user =
    obtenerUsuario(
      db,
      id
    );

  const ahora =
    Date.now();

  // Máximo una recompensa de XP por minuto

  if (
    user.ultimaXP &&
    ahora - user.ultimaXP < 60000
  ) {

    return null;
  }

  const xpGanada =
    Math.floor(
      Math.random() * 11
    ) + 5;

  user.xp +=
    xpGanada;

  user.mensajes++;

  user.ultimaXP =
    ahora;

  let subioNivel = false;

  let nivelesSubidos = 0;

  let recompensaTotal = 0;


  // ========================================
  // SUBIR DE NIVEL
  // ========================================

  while (
    user.xp >=
    user.nivel * 100
  ) {

    user.xp -=
      user.nivel * 100;

    user.nivel++;

    subioNivel = true;

    nivelesSubidos++;

    const recompensa =
      user.nivel * 250;

    user.dinero +=
      recompensa;

    recompensaTotal +=
      recompensa;
  }


  guardarUsuarios(db);


  return {

    xpGanada,
    subioNivel,
    nivelesSubidos,
    recompensaTotal,
    nivel: user.nivel,
    xp: user.xp

  };
}


// ==========================================
// COMANDO USUARIO
// ==========================================

async function usuario(
  sock,
  chat,
  comando,
  args,
  id
) {

  const db =
    cargarUsuarios();

  const user =
    obtenerUsuario(
      db,
      id
    );


  // ========================================
  // PERFIL
  // ========================================

  if (comando === "perfil") {

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`👤 PERFIL TITANBOT

🆔 ID:
${id}

⭐ Nivel:
${user.nivel}

✨ XP:
${user.xp}/${user.nivel * 100}

💬 Mensajes:
${user.mensajes}

💰 Dinero:
${user.dinero}

🏦 Banco:
${user.banco}

💎 Patrimonio:
${user.dinero + user.banco}`

    });
  }


  // ========================================
  // REGISTRAR
  // ========================================

  if (comando === "registrar") {

    const existe =
      db[id] !== undefined;

    if (existe) {

      return sock.sendMessage(chat, {

        text:
`✅ YA ESTÁS REGISTRADO

👤 Nivel:
${user.nivel}

⭐ XP:
${user.xp}

💰 Dinero:
${user.dinero}`

      });
    }

    db[id] =
      obtenerUsuario(
        db,
        id
      );

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`✅ REGISTRO COMPLETADO

👤 Bienvenido a TitanBot.

⭐ Nivel: 1
✨ XP: 0
💰 Dinero: 0

¡Empieza a usar el bot!`

    });
  }


  // ========================================
  // NIVEL
  // ========================================

  if (comando === "nivel") {

    const necesario =
      user.nivel * 100;

    const porcentaje =
      Math.floor(
        (user.xp / necesario) * 100
      );

    return sock.sendMessage(chat, {

      text:
`📈 NIVEL

⭐ Nivel actual:
${user.nivel}

✨ XP:
${user.xp}/${necesario}

📊 Progreso:
${porcentaje}%

💬 Mensajes:
${user.mensajes}`

    });
  }


  // ========================================
  // XP
  // ========================================

  if (comando === "xp") {

    const necesario =
      user.nivel * 100;

    return sock.sendMessage(chat, {

      text:
`✨ EXPERIENCIA

⭐ Nivel:
${user.nivel}

✨ XP:
${user.xp}/${necesario}

🎯 Te faltan:
${Math.max(
  necesario - user.xp,
  0
)} XP para subir.`

    });
  }


  // ========================================
  // RANK
  // ========================================

  if (comando === "rank") {

    const usuarios =
      Object.entries(db)
        .filter(([_, u]) =>
          u &&
          typeof u.nivel === "number" &&
          typeof u.xp === "number"
        )
        .sort((a, b) => {

          if (
            b[1].nivel !==
            a[1].nivel
          ) {

            return (
              b[1].nivel -
              a[1].nivel
            );
          }

          return (
            b[1].xp -
            a[1].xp
          );

        });

    const posicion =
      usuarios.findIndex(
        ([usuarioId]) =>
          usuarioId === id
      ) + 1;

    return sock.sendMessage(chat, {

      text:
`🏆 TU RANK

🥇 Posición:
#${posicion}

⭐ Nivel:
${user.nivel}

✨ XP:
${user.xp}

💰 Dinero:
${user.dinero}`

    });
  }


  // ========================================
  // TOP
  // ========================================

  if (comando === "top") {

    const usuarios =
      Object.entries(db)
        .filter(([_, u]) =>
          u &&
          typeof u.nivel === "number" &&
          typeof u.xp === "number"
        )
        .sort((a, b) => {

          if (
            b[1].nivel !==
            a[1].nivel
          ) {

            return (
              b[1].nivel -
              a[1].nivel
            );
          }

          return (
            b[1].xp -
            a[1].xp
          );

        })
        .slice(0, 10);


    if (usuarios.length === 0) {

      return sock.sendMessage(chat, {

        text:
          "🏆 Todavía no hay usuarios en el ranking."

      });

    }


    const lista =
      usuarios
        .map(
          ([usuarioId, u], index) => {

            return `${index + 1}. @${usuarioId
              .split("@")[0]
            }

⭐ Nivel: ${u.nivel}
✨ XP: ${u.xp}`;

          }
        )
        .join("\n\n");


    const mentions =
      usuarios.map(
        ([usuarioId]) =>
          usuarioId
      );


    return sock.sendMessage(chat, {

      text:
`🏆 TOP 10 TITANBOT

${lista}`,

      mentions

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
