const fs = require("fs");

const DB = "./database/groups.json";

function cargarGrupos() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  try {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch {
    return {};
  }
}

function guardarGrupos(db) {
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

function obtenerGrupo(db, chat) {
  if (!db[chat]) {
    db[chat] = {
      bienvenida: false,
      despedida: false,
      reglas: "No hay reglas configuradas."
    };
  }

  if (typeof db[chat].bienvenida !== "boolean") {
    db[chat].bienvenida = false;
  }

  if (typeof db[chat].despedida !== "boolean") {
    db[chat].despedida = false;
  }

  if (typeof db[chat].reglas !== "string") {
    db[chat].reglas = "No hay reglas configuradas.";
  }

  return db[chat];
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

  // ========================================
  // COMPROBAR GRUPO
  // ========================================

  if (
    comando === "ajustes" ||
    comando === "estado" ||
    comando === "configgrupo" ||
    comando === "bienvenida" ||
    comando === "despedida"
  ) {

    if (!esGrupo) {
      return sock.sendMessage(chat, {
        text: "❌ Este comando solo funciona en grupos."
      });
    }
  }

  // ========================================
  // MENÚ AJUSTES
  // ========================================

  if (comando === "ajustes") {

    return sock.sendMessage(chat, {
      text:
`⚙️ AJUSTES TITANBOT

📋 CONFIGURACIÓN

📊 .estado
Ver configuración actual.

⚙️ .configgrupo
Ver configuración del grupo.

👋 .bienvenida on
Activar bienvenida.

👋 .bienvenida off
Desactivar bienvenida.

🚪 .despedida on
Activar despedida.

🚪 .despedida off
Desactivar despedida.

━━━━━━━━━━━━━━━━━━

🔐 Los cambios requieren
ser administrador.`
    });
  }

  // ========================================
  // ESTADO
  // ========================================

  if (comando === "estado") {

    const db = cargarGrupos();
    const grupo = obtenerGrupo(db, chat);

    guardarGrupos(db);

    return sock.sendMessage(chat, {
      text:
`📊 ESTADO DEL GRUPO

👋 Bienvenida:
${grupo.bienvenida ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}

🚪 Despedida:
${grupo.despedida ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}

📜 Reglas:
${grupo.reglas}

━━━━━━━━━━━━━━━━━━

🤖 TitanBot v2.5.0`
    });
  }

  // ========================================
  // CONFIGGRUPO
  // ========================================

  if (comando === "configgrupo") {

    const db = cargarGrupos();
    const grupo = obtenerGrupo(db, chat);

    guardarGrupos(db);

    let metadata;

    try {
      metadata = await sock.groupMetadata(chat);
    } catch {
      metadata = {
        subject: "Grupo"
      };
    }

    return sock.sendMessage(chat, {
      text:
`⚙️ CONFIGURACIÓN DEL GRUPO

👥 Grupo:
${metadata.subject}

👋 Bienvenida:
${grupo.bienvenida ? "🟢 ON" : "🔴 OFF"}

🚪 Despedida:
${grupo.despedida ? "🟢 ON" : "🔴 OFF"}

📜 Reglas:
${grupo.reglas}

━━━━━━━━━━━━━━━━━━

Para cambiar:

.bienvenida on
.bienvenida off

.despedida on
.despedida off`
    });
  }

  // ========================================
  // BIENVENIDA
  // ========================================

  if (comando === "bienvenida") {

    if (!esAdmin) {
      return sock.sendMessage(chat, {
        text:
`❌ SOLO ADMINISTRADORES

Solo un administrador puede
cambiar esta configuración.`
      });
    }

    const opcion =
      String(args[0] || "").toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {
      return sock.sendMessage(chat, {
        text:
`👋 BIENVENIDA

Usa:

.bienvenida on

o:

.bienvenida off`
      });
    }

    const db = cargarGrupos();
    const grupo = obtenerGrupo(db, chat);

    grupo.bienvenida =
      opcion === "on";

    guardarGrupos(db);

    return sock.sendMessage(chat, {
      text:
`👋 BIENVENIDA

Estado:

${grupo.bienvenida
  ? "🟢 ACTIVADA"
  : "🔴 DESACTIVADA"}`
    });
  }

  // ========================================
  // DESPEDIDA
  // ========================================

  if (comando === "despedida") {

    if (!esAdmin) {
      return sock.sendMessage(chat, {
        text:
`❌ SOLO ADMINISTRADORES

Solo un administrador puede
cambiar esta configuración.`
      });
    }

    const opcion =
      String(args[0] || "").toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {
      return sock.sendMessage(chat, {
        text:
`🚪 DESPEDIDA

Usa:

.despedida on

o:

.despedida off`
      });
    }

    const db = cargarGrupos();
    const grupo = obtenerGrupo(db, chat);

    grupo.despedida =
      opcion === "on";

    guardarGrupos(db);

    return sock.sendMessage(chat, {
      text:
`🚪 DESPEDIDA

Estado:

${grupo.despedida
  ? "🟢 ACTIVADA"
  : "🔴 DESACTIVADA"}`
    });
  }

  return false;
}

module.exports = ajustes;
