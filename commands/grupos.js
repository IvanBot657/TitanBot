// ==========================================
// TITANBOT v3.1
// GRUPOS.JS
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
// OBTENER / CREAR GRUPO
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

async function grupos(
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
  // COMPROBAR SI ES GRUPO
  // ========================================

  const comandosGrupo = [
    "admins",
    "tagall",
    "todos",
    "miembros",
    "idgrupo",
    "reglas",
    "bienvenida",
    "despedida",
    "antilink",
    "antispam",
    "grupomenu"
  ];

  if (comandosGrupo.includes(cmd) && !esGrupo) {
    await sock.sendMessage(chat, {
      text: "❌ Este comando solamente funciona en grupos."
    });

    return true;
  }

  // ========================================
  // MENÚ DE GRUPO
  // ========================================

  if (cmd === "grupomenu" || cmd === "grupo") {

    await sock.sendMessage(chat, {
      text:
`╔══════════════════════════╗
       👥 *MENÚ DE GRUPO*
╚══════════════════════════╝

👑 *Administración*
• .admins
• .tagall
• .miembros
• .idgrupo

📜 *Información*
• .reglas

⚙️ *Configuración*
• .bienvenida on/off
• .despedida on/off
• .antilink on/off
• .antispam on/off

⚡ *TitanBot v3.1*`
    });

    return true;
  }

  // ========================================
  // ADMINS
  // ========================================

  if (cmd === "admins") {

    if (!esGrupo) {
      await sock.sendMessage(chat, {
        text: "❌ Este comando solamente funciona en grupos."
      });

      return true;
    }

    try {

      const metadata = await sock.groupMetadata(chat);

      const admins = metadata.participants.filter(
        participante =>
          participante.admin === "admin" ||
          participante.admin === "superadmin"
      );

      let texto = "👑 *ADMINISTRADORES*\n\n";

      admins.forEach((admin, index) => {
        texto += `${index + 1}. @${admin.id.split("@")[0]}\n`;
      });

      await sock.sendMessage(chat, {
        text: texto,
        mentions: admins.map(admin => admin.id)
      });

    } catch (error) {

      await sock.sendMessage(chat, {
        text: "❌ No pude obtener la lista de administradores."
      });

    }

    return true;
  }

  // ========================================
  // MIEMBROS
  // ========================================

  if (cmd === "miembros") {

    try {

      const metadata = await sock.groupMetadata(chat);

      await sock.sendMessage(chat, {
        text:
`👥 *MIEMBROS DEL GRUPO*

📌 Nombre: ${metadata.subject}
👤 Miembros: ${metadata.participants.length}`
      });

    } catch (error) {

      await sock.sendMessage(chat, {
        text: "❌ No pude obtener la información del grupo."
      });

    }

    return true;
  }

  // ========================================
  // ID DEL GRUPO
  // ========================================

  if (cmd === "idgrupo") {

    await sock.sendMessage(chat, {
      text: `🆔 *ID DEL GRUPO*\n\n${chat}`
    });

    return true;
  }

  // ========================================
  // REGLAS
  // ========================================

  if (cmd === "reglas") {

    const grupo = obtenerGrupo(chat);

    await sock.sendMessage(chat, {
      text:
`📜 *REGLAS DEL GRUPO*

${grupo.reglas}

⚡ TitanBot v3.1`
    });

    return true;
  }

  // ========================================
  // TAGALL
  // ========================================

  if (cmd === "tagall" || cmd === "todos") {

    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden usar este comando."
      });

      return true;
    }

    try {

      const metadata = await sock.groupMetadata(chat);

      const participantes = metadata.participants;

      let texto = "📢 *ATENCIÓN GRUPO*\n\n";

      participantes.forEach(usuario => {
        texto += `@${usuario.id.split("@")[0]} `;
      });

      await sock.sendMessage(chat, {
        text,
        mentions: participantes.map(usuario => usuario.id)
      });

    } catch (error) {

      await sock.sendMessage(chat, {
        text: "❌ No pude mencionar a los miembros."
      });

    }

    return true;
  }

  // ========================================
  // BIENVENIDA
  // ========================================

  if (cmd === "bienvenida") {

    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden cambiar esta configuración."
      });

      return true;
    }

    const opcion = args[0]?.toLowerCase();

    if (!["on", "off"].includes(opcion)) {

      await sock.sendMessage(chat, {
        text:
`⚙️ Uso:

.bienvenida on
.bienvenida off`
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) {
      grupos[chat] = {};
    }

    grupos[chat].bienvenida = opcion === "on";

    guardarGrupos(grupos);

    await sock.sendMessage(chat, {
      text: `👋 Bienvenida: ${opcion === "on" ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}`
    });

    return true;
  }

  // ========================================
  // DESPEDIDA
  // ========================================

  if (cmd === "despedida") {

    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden cambiar esta configuración."
      });

      return true;
    }

    const opcion = args[0]?.toLowerCase();

    if (!["on", "off"].includes(opcion)) {

      await sock.sendMessage(chat, {
        text:
`⚙️ Uso:

.despedida on
.despedida off`
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) {
      grupos[chat] = {};
    }

    grupos[chat].despedida = opcion === "on";

    guardarGrupos(grupos);

    await sock.sendMessage(chat, {
      text: `👋 Despedida: ${opcion === "on" ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}`
    });

    return true;
  }

  // ========================================
  // ANTILINK
  // ========================================

  if (cmd === "antilink") {

    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden cambiar esta configuración."
      });

      return true;
    }

    const opcion = args[0]?.toLowerCase();

    if (!["on", "off"].includes(opcion)) {

      await sock.sendMessage(chat, {
        text:
`🔗 Uso:

.antilink on
.antilink off`
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) {
      grupos[chat] = {};
    }

    grupos[chat].antilink = opcion === "on";

    guardarGrupos(grupos);

    await sock.sendMessage(chat, {
      text: `🔗 Antilink: ${opcion === "on" ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"}`
    });

    return true;
  }

  // ========================================
  // ANTISPAM
  // ========================================

  if (cmd === "antispam") {

    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden cambiar esta configuración."
      });

      return true;
    }

    const opcion = args[0]?.toLowerCase();

    if (!["on", "off"].includes(opcion)) {

      await sock.sendMessage(chat, {
        text:
`🚫 Uso:

.antispam on
.antispam off`
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) {
      grupos[chat] = {};
    }

    grupos[chat].antispam = opcion === "on";

    guardarGrupos(grupos);

    await sock.sendMessage(chat, {
      text: `🚫 Antispam: ${opcion === "on" ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"}`
    });

    return true;
  }

  // ========================================
  // NO ES COMANDO DE ESTE MÓDULO
  // ========================================

  return false;
}

// ==========================================
// EXPORTACIÓN
// ==========================================

module.exports = grupos;
module.exports.grupos = grupos;
module.exports.cargarGrupos = cargarGrupos;
module.exports.guardarGrupos = guardarGrupos;
module.exports.obtenerGrupo = obtenerGrupo;
