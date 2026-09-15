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

function obtenerUsuario(db, id) {

  if (!db[id]) {

    db[id] = {

      nombre: "Usuario",

      xp: 0,

      nivel: 1,

      dinero: 500,

      mensajes: 0,

      logros: [],

      fechaRegistro: Date.now()

    };

  }

  return db[id];

}

function xpNecesaria(nivel) {

  return nivel * 250;

}

function ganarXP(id, cantidad = 15) {

  const db = cargarUsuarios();

  const user =
    obtenerUsuario(db, id);

  if (user.nivel >= 100) {

    guardarUsuarios(db);

    return {
      subioNivel: false
    };

  }

  user.xp += cantidad;

  user.mensajes += 1;

  let subioNivel = false;

  let recompensaTotal = 0;

  while (
    user.nivel < 100 &&
    user.xp >= xpNecesaria(user.nivel)
  ) {

    user.xp -= xpNecesaria(
      user.nivel
    );

    user.nivel++;

    subioNivel = true;

    let recompensa = 250;

    if (user.nivel >= 5)
      recompensa = 500;

    if (user.nivel >= 10)
      recompensa = 1000;

    if (user.nivel >= 20)
      recompensa = 2000;

    if (user.nivel >= 50)
      recompensa = 5000;

    if (user.nivel >= 100)
      recompensa = 10000;

    user.dinero += recompensa;

    recompensaTotal += recompensa;

  }

  guardarUsuarios(db);

  return {

    subioNivel,

    nivel: user.nivel,

    recompensaTotal

  };

}

async function usuario(
  sock,
  chat,
  comando,
  args,
  id
) {

  const db = cargarUsuarios();

  const user =
    obtenerUsuario(db, id);


  // ==========================
  // REGISTRAR
  // ==========================

  if (comando === "registrar") {

    if (
      args.length === 0
    ) {

      return sock.sendMessage(
        chat,
        {
          text:
`👤 REGISTRO

Usa:

.registrar TuNombre`
        }
      );

    }

    const nombre =
      args.join(" ");

    user.nombre = nombre;

    guardarUsuarios(db);

    return sock.sendMessage(
      chat,
      {
        text:
`✅ REGISTRO COMPLETADO

Nombre:
${nombre}`
      }
    );

  }


  // ==========================
  // PERFIL
  // ==========================

  if (comando === "perfil") {

    const fecha =
      new Date(
        user.fechaRegistro
      ).toLocaleDateString();

    return sock.sendMessage(
      chat,
      {
        text:
`👤 PERFIL

📝 Nombre:
${user.nombre}

⭐ Nivel:
${user.nivel}/100

✨ XP:
${user.xp}/${xpNecesaria(user.nivel)}

💰 Dinero:
${user.dinero}

📨 Mensajes:
${user.mensajes}

🏅 Logros:
${user.logros.length}

📅 Registro:
${fecha}`
      }
    );

  }


  // ==========================
  // NIVEL
  // ==========================

  if (comando === "nivel") {

    return sock.sendMessage(
      chat,
      {
        text:
`⭐ NIVEL

Nivel:
${user.nivel}/100

XP:
${user.xp}/${xpNecesaria(user.nivel)}`
      }
    );

  }


  // ==========================
  // XP
  // ==========================

  if (comando === "xp") {

    return sock.sendMessage(
      chat,
      {
        text:
`✨ EXPERIENCIA

XP actual:
${user.xp}

XP necesaria:
${xpNecesaria(user.nivel)}`
      }
    );

  }


  // ==========================
  // LOGROS
  // ==========================

  if (comando === "logros") {

    if (
      user.logros.length === 0
    ) {

      return sock.sendMessage(
        chat,
        {
          text:
"🏅 No tienes logros todavía."
        }
      );

    }

    return sock.sendMessage(
      chat,
      {
        text:
`🏅 LOGROS

${user.logros.join("\n")}`
      }
    );

  }


  // ==========================
  // TOP
  // ==========================

  if (comando === "top") {

    const ranking =
      Object.entries(db)
        .sort(
          (a, b) =>
            b[1].nivel -
            a[1].nivel
        )
        .slice(0, 10);

    let texto =
      "🏆 TOP 10 NIVELES\n\n";

    ranking.forEach(
      (u, i) => {

        texto +=
          `${i + 1}. ${
            u[1].nombre
          } - Nivel ${
            u[1].nivel
          }\n`;

      }
    );

    return sock.sendMessage(
      chat,
      {
        text: texto
      }
    );

  }


  // ==========================
  // RANK
  // ==========================

  if (comando === "rank") {

    const ranking =
      Object.entries(db)
        .sort(
          (a, b) =>
            b[1].nivel -
            a[1].nivel
        );

    const posicion =
      ranking.findIndex(
        u => u[0] === id
      ) + 1;

    return sock.sendMessage(
      chat,
      {
        text:
`🏆 TU POSICIÓN

📊 Ranking:
#${posicion}

⭐ Nivel:
${user.nivel}`
      }
    );

  }


  // ==========================
  // MISIONES
  // ==========================

  if (comando === "misiones") {

    return sock.sendMessage(
      chat,
      {
        text:
`🎯 MISIONES

1️⃣ Enviar 50 mensajes
Recompensa: 500 monedas

2️⃣ Alcanzar nivel 10
Recompensa: 1000 monedas

3️⃣ Usar 20 comandos
Recompensa: 750 monedas`
      }
    );

  }

  return false;

}

usuario.ganarXP = ganarXP;

module.exports = usuario;
