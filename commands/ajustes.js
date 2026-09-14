const fs = require("fs");

const DB = "./database/users.json";

function cargarDB() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  return JSON.parse(
    fs.readFileSync(DB, "utf8")
  );
}

function guardarDB(db) {
  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}

async function ajustes(
  sock,
  chat,
  comando,
  args,
  id,
  isGroup,
  isAdmin
) {

  const db = cargarDB();

  // ==============================
  // AJUSTES
  // ==============================

  if (comando === "ajustes") {

    return sock.sendMessage(chat, {
      text:
`⚙️ AJUSTES TITANBOT

📋 Comandos:

.ajustes
.prefijo
.estado

👥 En grupos, algunas opciones
requieren permisos de administrador.`
    });

  }

  // ==============================
  // ESTADO
  // ==============================

  if (comando === "estado") {

    return sock.sendMessage(chat, {
      text:
`⚙️ ESTADO

🤖 TitanBot: 🟢 Online
📦 Versión: 2.5.0
💬 Prefijo actual: .
💾 Base de datos: 🟢 Activa`
    });

  }

  // ==============================
  // PREFIJO
  // ==============================

  if (comando === "prefijo") {

    return sock.sendMessage(chat, {
      text:
`🔧 PREFIJO

El prefijo actual de TitanBot es:

.

Ejemplo:

.menu
.ping
.perfil`
    });

  }

  // ==============================
  // CONFIGURACIÓN DEL GRUPO
  // ==============================

  if (comando === "configgrupo") {

    if (!isGroup) {

      return sock.sendMessage(chat, {
        text:
          "❌ Este comando solo funciona en grupos."
      });

    }

    if (!isAdmin) {

      return sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden usar este comando."
      });

    }

    if (!db[chat]) {

      db[chat] = {
        bienvenida: true,
        despedida: true
      };

      guardarDB(db);

    }

    return sock.sendMessage(chat, {
      text:
`⚙️ CONFIGURACIÓN DEL GRUPO

👋 Bienvenida:
${db[chat].bienvenida ? "🟢 Activada" : "🔴 Desactivada"}

🚪 Despedida:
${db[chat].despedida ? "🟢 Activada" : "🔴 Desactivada"}`
    });

  }

  // ==============================
  // BIENVENIDA
  // ==============================

  if (comando === "bienvenida") {

    if (!isGroup) {

      return sock.sendMessage(chat, {
        text:
          "❌ Este comando solo funciona en grupos."
      });

    }

    if (!isAdmin) {

      return sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cambiar esta opción."
      });

    }

    if (!db[chat]) {

      db[chat] = {
        bienvenida: true,
        despedida: true
      };

    }

    const opcion =
      (args[0] || "")
        .toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {

      return sock.sendMessage(chat, {
        text:
`👋 BIENVENIDA

Usa:

.bienvenida on
.bienvenida off`
      });

    }

    db[chat].bienvenida =
      opcion === "on";

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`👋 BIENVENIDA

Estado:
${db[chat].bienvenida ? "🟢 Activada" : "🔴 Desactivada"}`
    });

  }

  // ==============================
  // DESPEDIDA
  // ==============================

  if (comando === "despedida") {

    if (!isGroup) {

      return sock.sendMessage(chat, {
        text:
          "❌ Este comando solo funciona en grupos."
      });

    }

    if (!isAdmin) {

      return sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cambiar esta opción."
      });

    }

    if (!db[chat]) {

      db[chat] = {
        bienvenida: true,
        despedida: true
      };

    }

    const opcion =
      (args[0] || "")
        .toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {

      return sock.sendMessage(chat, {
        text:
`🚪 DESPEDIDA

Usa:

.despedida on
.despedida off`
      });

    }

    db[chat].despedida =
      opcion === "on";

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🚪 DESPEDIDA

Estado:
${db[chat].despedida ? "🟢 Activada" : "🔴 Desactivada"}`
    });

  }

  return false;
}

module.exports = ajustes;
