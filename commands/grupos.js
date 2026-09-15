const fs = require("fs");

const DB = "./database/groups.json";

// ==========================================
// BASE DE DATOS
// ==========================================

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

function guardarGrupos(db) {

  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );

}

function obtenerGrupo(db, id) {

  if (!db[id]) {

    db[id] = {

      bienvenida: false,

      despedida: false,

      antilink: false,

      antispam: false,

      reglas:
        "Respeta a todos los miembros."

    };

  }

  return db[id];

}

// ==========================================
// MODULO
// ==========================================

async function grupos(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin
) {

  const db = cargarGrupos();

  const grupo =
    obtenerGrupo(db, chat);

  // ========================================
  // SOLO GRUPOS
  // ========================================

  const comandosGrupo = [

    "admins",
    "tagall",
    "reglas",
    "bienvenida",
    "despedida",
    "antilink",
    "antispam"

  ];

  if (
    comandosGrupo.includes(comando) &&
    !esGrupo
  ) {

    return sock.sendMessage(chat, {

      text:
        "❌ Este comando solo funciona en grupos."

    });

  }

  // ========================================
  // ADMINS
  // ========================================

  if (comando === "admins") {

    const metadata =
      await sock.groupMetadata(chat);

    const admins =
      metadata.participants.filter(
        p => p.admin
      );

    const menciones =
      admins.map(a => a.id);

    let texto =
      "👮 ADMINISTRADORES\n\n";

    admins.forEach((a, i) => {

      texto +=
        `${i + 1}. @${a.id.split("@")[0]}\n`;

    });

    return sock.sendMessage(chat, {

      text: texto,

      mentions: menciones

    });

  }

  // ========================================
  // TAGALL
  // ========================================

  if (comando === "tagall") {

    if (!esAdmin) {

      return sock.sendMessage(chat, {

        text:
          "❌ Solo administradores."

      });

    }

    const metadata =
      await sock.groupMetadata(chat);

    const miembros =
      metadata.participants.map(
        p => p.id
      );

    let texto =
      "📢 MENCIÓN GENERAL\n\n";

    miembros.forEach((m, i) => {

      texto +=
        `${i + 1}. @${m.split("@")[0]}\n`;

    });

    return sock.sendMessage(chat, {

      text: texto,

      mentions: miembros

    });

  }

  // ========================================
  // REGLAS
  // ========================================

  if (comando === "reglas") {

    return sock.sendMessage(chat, {

      text:
`📜 REGLAS

${grupo.reglas}`

    });

  }

  // ========================================
  // BIENVENIDA
  // ========================================

  if (comando === "bienvenida") {

    if (!esAdmin) {

      return sock.sendMessage(chat, {

        text:
          "❌ Solo administradores."

      });

    }

    const opcion =
      args[0]?.toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {

      return sock.sendMessage(chat, {

        text:
          "Usa:\n.bienvenida on\n.bienvenida off"

      });

    }

    grupo.bienvenida =
      opcion === "on";

    guardarGrupos(db);

    return sock.sendMessage(chat, {

      text:
`👋 Bienvenida ${
  grupo.bienvenida
    ? "activada"
    : "desactivada"
}`

    });

  }

  // ========================================
  // DESPEDIDA
  // ========================================

  if (comando === "despedida") {

    if (!esAdmin) {

      return sock.sendMessage(chat, {

        text:
          "❌ Solo administradores."

      });

    }

    const opcion =
      args[0]?.toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {

      return sock.sendMessage(chat, {

        text:
          "Usa:\n.despedida on\n.despedida off"

      });

    }

    grupo.despedida =
      opcion === "on";

    guardarGrupos(db);

    return sock.sendMessage(chat, {

      text:
`👋 Despedida ${
  grupo.despedida
    ? "activada"
    : "desactivada"
}`

    });

  }

  // ========================================
  // ANTILINK
  // ========================================

  if (comando === "antilink") {

    if (!esAdmin) {

      return sock.sendMessage(chat, {

        text:
          "❌ Solo administradores."

      });

    }

    const opcion =
      args[0]?.toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {

      return sock.sendMessage(chat, {

        text:
          "Usa:\n.antilink on\n.antilink off"

      });

    }

    grupo.antilink =
      opcion === "on";

    guardarGrupos(db);

    return sock.sendMessage(chat, {

      text:
`🔗 Antilink ${
  grupo.antilink
    ? "activado"
    : "desactivado"
}`

    });

  }

  // ========================================
  // ANTISPAM
  // ========================================

  if (comando === "antispam") {

    if (!esAdmin) {

      return sock.sendMessage(chat, {

        text:
          "❌ Solo administradores."

      });

    }

    const opcion =
      args[0]?.toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {

      return sock.sendMessage(chat, {

        text:
          "Usa:\n.antispam on\n.antispam off"

      });

    }

    grupo.antispam =
      opcion === "on";

    guardarGrupos(db);

    return sock.sendMessage(chat, {

      text:
`🚫 Antispam ${
  grupo.antispam
    ? "activado"
    : "desactivado"
}`

    });

  }

  return false;

}

module.exports = grupos;
