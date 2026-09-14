const fs = require("fs");

const DB = "./database/groups.json";

function cargarGrupos() {

  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  return JSON.parse(
    fs.readFileSync(DB, "utf8")
  );
}

function guardarGrupos(db) {

  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}

function obtenerGrupo(id) {

  const db = cargarGrupos();

  if (!db[id]) {

    db[id] = {
      bienvenida: false,
      despedida: false,
      reglas: "No hay reglas configuradas."
    };

    guardarGrupos(db);
  }

  return db[id];
}


async function ajustes(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin
) {

  // =========================
  // SOLO GRUPOS
  // =========================

  if (
    [
      "ajustes",
      "estado",
      "configgrupo",
      "bienvenida",
      "despedida"
    ].includes(comando)
    && !esGrupo
  ) {

    return sock.sendMessage(chat, {
      text:
        "❌ Este comando solo funciona en grupos."
    });
  }


  if (!esGrupo) {
    return false;
  }


  const grupo = obtenerGrupo(chat);


  // =========================
  // AJUSTES
  // =========================

  if (comando === "ajustes") {

    return sock.sendMessage(chat, {
      text:
`⚙️ AJUSTES DEL GRUPO

🔔 Bienvenida:
${grupo.bienvenida ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}

👋 Despedida:
${grupo.despedida ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}

📜 Reglas:
${grupo.reglas}

Usa:

.bienvenida on
.bienvenida off

.despedida on
.despedida off`
    });
  }


  // =========================
  // ESTADO
  // =========================

  if (comando === "estado") {

    return sock.sendMessage(chat, {
      text:
`📊 ESTADO DEL GRUPO

🔔 Bienvenida:
${grupo.bienvenida ? "🟢 ON" : "🔴 OFF"}

👋 Despedida:
${grupo.despedida ? "🟢 ON" : "🔴 OFF"}

📜 Reglas:
${grupo.reglas}`
    });
  }


  // =========================
  // CONFIGGRUPO
  // =========================

  if (comando === "configgrupo") {

    return sock.sendMessage(chat, {
      text:
`⚙️ CONFIGURACIÓN

🔔 Bienvenida:
${grupo.bienvenida ? "🟢 ON" : "🔴 OFF"}

👋 Despedida:
${grupo.despedida ? "🟢 ON" : "🔴 OFF"}`
    });
  }


  // =========================
  // BIENVENIDA
  // =========================

  if (comando === "bienvenida") {

    if (!esAdmin) {

      return sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cambiar esta configuración."
      });
    }


    const opcion =
      (args[0] || "").toLowerCase();


    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {

      return sock.sendMessage(chat, {
        text:
`🔔 BIENVENIDA

Usa:

.bienvenida on
.bienvenida off`
      });
    }


    grupo.bienvenida =
      opcion === "on";


    const db = cargarGrupos();

    db[chat] = grupo;

    guardarGrupos(db);


    return sock.sendMessage(chat, {
      text:
`🔔 BIENVENIDA

${grupo.bienvenida
  ? "🟢 Bienvenida activada."
  : "🔴 Bienvenida desactivada."}`
    });
  }


  // =========================
  // DESPEDIDA
  // =========================

  if (comando === "despedida") {

    if (!esAdmin) {

      return sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cambiar esta configuración."
      });
    }


    const opcion =
      (args[0] || "").toLowerCase();


    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {

      return sock.sendMessage(chat, {
        text:
`👋 DESPEDIDA

Usa:

.despedida on
.despedida off`
      });
    }


    grupo.despedida =
      opcion === "on";


    const db = cargarGrupos();

    db[chat] = grupo;

    guardarGrupos(db);


    return sock.sendMessage(chat, {
      text:
`👋 DESPEDIDA

${grupo.despedida
  ? "🟢 Despedida activada."
  : "🔴 Despedida desactivada."}`
    });
  }


  return false;
}


module.exports = ajustes;
