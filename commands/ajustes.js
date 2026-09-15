const fs = require("fs");

const DB = "./database/groups.json";

function cargarGrupos() {

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

async function ajustes(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin
) {

  const db = cargarGrupos();

  const grupo = db[chat] || {

    bienvenida: false,
    despedida: false,
    antilink: false,
    antispam: false

  };

  // ==========================
  // CONFIGGRUPO
  // ==========================

  if (comando === "configgrupo") {

    if (!esGrupo) {

      return sock.sendMessage(chat, {
        text: "❌ Solo funciona en grupos."
      });

    }

    return sock.sendMessage(chat, {

      text:
`⚙️ CONFIGURACIÓN

👋 Bienvenida:
${grupo.bienvenida ? "ON" : "OFF"}

👋 Despedida:
${grupo.despedida ? "ON" : "OFF"}

🔗 Antilink:
${grupo.antilink ? "ON" : "OFF"}

🚫 Antispam:
${grupo.antispam ? "ON" : "OFF"}`

    });

  }

  // ==========================
  // ESTADOGRUPO
  // ==========================

  if (comando === "estadogrupo") {

    if (!esGrupo) {

      return sock.sendMessage(chat, {
        text: "❌ Solo funciona en grupos."
      });

    }

    const activos = [

      grupo.bienvenida,
      grupo.despedida,
      grupo.antilink,
      grupo.antispam

    ].filter(Boolean).length;

    return sock.sendMessage(chat, {

      text:
`📊 ESTADO DEL GRUPO

Funciones activas:
${activos}/4`

    });

  }

  // ==========================
  // BIENVENIDAESTADO
  // ==========================

  if (comando === "bienvenidaestado") {

    return sock.sendMessage(chat, {

      text:
`👋 Bienvenida:
${grupo.bienvenida ? "ACTIVADA" : "DESACTIVADA"}`

    });

  }

  // ==========================
  // DESPEDIDAESTADO
  // ==========================

  if (comando === "despedidaestado") {

    return sock.sendMessage(chat, {

      text:
`👋 Despedida:
${grupo.despedida ? "ACTIVADA" : "DESACTIVADA"}`

    });

  }

  // ==========================
  // ANTILINKESTADO
  // ==========================

  if (comando === "antilinkestado") {

    return sock.sendMessage(chat, {

      text:
`🔗 Antilink:
${grupo.antilink ? "ACTIVADO" : "DESACTIVADO"}`

    });

  }

  // ==========================
  // ANTISPAMESTADO
  // ==========================

  if (comando === "antispamestado") {

    return sock.sendMessage(chat, {

      text:
`🚫 Antispam:
${grupo.antispam ? "ACTIVADO" : "DESACTIVADO"}`

    });

  }

  return false;

}

module.exports = ajustes;
