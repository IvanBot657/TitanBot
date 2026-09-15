// ==========================================
// TITANBOT v3.1
// AJUSTES.JS
// ==========================================

const fs = require("fs");
const path = require("path");

const databasePath = path.join(__dirname, "../database/groups.json");

// ==========================================
// BASE DE DATOS
// ==========================================

function cargarGrupos() {
  try {
    if (!fs.existsSync(databasePath)) {
      fs.writeFileSync(databasePath, "{}");
    }

    const datos = fs.readFileSync(databasePath, "utf8");

    if (!datos.trim()) return {};

    return JSON.parse(datos);
  } catch (error) {
    console.log("❌ Error leyendo groups.json:", error);
    return {};
  }
}

function guardarGrupos(grupos) {
  try {
    fs.writeFileSync(
      databasePath,
      JSON.stringify(grupos, null, 2)
    );
  } catch (error) {
    console.log("❌ Error guardando groups.json:", error);
  }
}

// ==========================================
// OBTENER GRUPO
// ==========================================

function obtenerGrupo(chat) {
  const grupos = cargarGrupos();

  if (!grupos[chat]) {
    grupos[chat] = {
      reglas: "No hay reglas configuradas.",
      bienvenida: false,
      despedida: false,
      antilink: false,
      antispam: false
    };

    guardarGrupos(grupos);
  }

  return grupos[chat];
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

async function ajustes(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin
) {
  const cmd = comando.toLowerCase();

  // ========================================
  // MENÚ DE AJUSTES
  // ========================================

  if (cmd === "ajustes" || cmd === "ajuste") {
    await sock.sendMessage(chat, {
      text:
`╔══════════════════════════╗
       ⚙️ *AJUSTES*
╚══════════════════════════╝

👥 *GRUPO*
• .configgrupo
• .estadogrupo

👋 *BIENVENIDA*
• .bienvenidaestado

🚪 *DESPEDIDA*
• .despedidaestado

🔗 *ANTILINK*
• .antilinkestado

🚫 *ANTISPAM*
• .antispamestado

⚡ *TitanBot v3.1*`
    });

    return true;
  }

  // ========================================
  // COMANDOS DE GRUPO
  // ========================================

  const comandosGrupo = [
    "configgrupo",
    "estadogrupo",
    "bienvenidaestado",
    "despedidaestado",
    "antilinkestado",
    "antispamestado"
  ];

  if (comandosGrupo.includes(cmd) && !esGrupo) {
    await sock.sendMessage(chat, {
      text: "❌ Este comando solamente funciona en grupos."
    });

    return true;
  }

  // ========================================
  // CONFIGURACIÓN DEL GRUPO
  // ========================================

  if (cmd === "configgrupo") {
    const grupo = obtenerGrupo(chat);

    await sock.sendMessage(chat, {
      text:
`⚙️ *CONFIGURACIÓN DEL GRUPO*

👋 Bienvenida: ${
  grupo.bienvenida ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"
}

🚪 Despedida: ${
  grupo.despedida ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"
}

🔗 Antilink: ${
  grupo.antilink ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"
}

🚫 Antispam: ${
  grupo.antispam ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"
}

📜 Reglas:
${grupo.reglas || "No configuradas."}`
    });

    return true;
  }

  // ========================================
  // ESTADO DEL GRUPO
  // ========================================

  if (cmd === "estadogrupo") {
    try {
      const metadata = await sock.groupMetadata(chat);
      const grupo = obtenerGrupo(chat);

      await sock.sendMessage(chat, {
        text:
`📊 *ESTADO DEL GRUPO*

👥 Nombre:
${metadata.subject}

👤 Miembros:
${metadata.participants.length}

👋 Bienvenida:
${grupo.bienvenida ? "🟢 ON" : "🔴 OFF"}

🚪 Despedida:
${grupo.despedida ? "🟢 ON" : "🔴 OFF"}

🔗 Antilink:
${grupo.antilink ? "🟢 ON" : "🔴 OFF"}

🚫 Antispam:
${grupo.antispam ? "🟢 ON" : "🔴 OFF"}`
      });

    } catch (error) {
      await sock.sendMessage(chat, {
        text: "❌ No pude obtener el estado del grupo."
      });
    }

    return true;
  }

  // ========================================
  // BIENVENIDA
  // ========================================

  if (cmd === "bienvenidaestado") {
    const grupo = obtenerGrupo(chat);

    await sock.sendMessage(chat, {
      text:
`👋 *ESTADO DE BIENVENIDA*

Estado actual:
${grupo.bienvenida ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}

Para cambiarla usa:

.bienvenida on
.bienvenida off`
    });

    return true;
  }

  // ========================================
  // DESPEDIDA
  // ========================================

  if (cmd === "despedidaestado") {
    const grupo = obtenerGrupo(chat);

    await sock.sendMessage(chat, {
      text:
`🚪 *ESTADO DE DESPEDIDA*

Estado actual:
${grupo.despedida ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}

Para cambiarla usa:

.despedida on
.despedida off`
    });

    return true;
  }

  // ========================================
  // ANTILINK
  // ========================================

  if (cmd === "antilinkestado") {
    const grupo = obtenerGrupo(chat);

    await sock.sendMessage(chat, {
      text:
`🔗 *ESTADO DE ANTILINK*

Estado actual:
${grupo.antilink ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"}

Para cambiarlo usa:

.antilink on
.antilink off`
    });

    return true;
  }

  // ========================================
  // ANTISPAM
  // ========================================

  if (cmd === "antispamestado") {
    const grupo = obtenerGrupo(chat);

    await sock.sendMessage(chat, {
      text:
`🚫 *ESTADO DE ANTISPAM*

Estado actual:
${grupo.antispam ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"}

Para cambiarlo usa:

.antispam on
.antispam off`
    });

    return true;
  }

  // ========================================
  // NO ES DE ESTE MÓDULO
  // ========================================

  return false;
}

// ==========================================
// EXPORTACIÓN
// ==========================================

module.exports = ajustes;
module.exports.ajustes = ajustes;
module.exports.cargarGrupos = cargarGrupos;
module.exports.guardarGrupos = guardarGrupos;
module.exports.obtenerGrupo = obtenerGrupo;
