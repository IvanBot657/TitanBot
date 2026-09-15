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
      antispam: false,
      advertencias: {}
    };

    guardarGrupos(grupos);
  }

  // Compatibilidad con grupos antiguos
  if (!grupos[chat].advertencias) {
    grupos[chat].advertencias = {};
    guardarGrupos(grupos);
  }

  return grupos[chat];
}

// ==========================================
// COMPROBAR ADMIN DEL BOT
// ==========================================

async function botEsAdmin(sock, chat) {
  try {
    const metadata = await sock.groupMetadata(chat);

    const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    const bot = metadata.participants.find(
      participante =>
        participante.id.split(":")[0] === botId.split("@")[0]
    );

    return (
      bot &&
      (
        bot.admin === "admin" ||
        bot.admin === "superadmin"
      )
    );
  } catch (error) {
    return false;
  }
}

// ==========================================
// OBTENER MENCION
// ==========================================

function obtenerMencion(msg) {
  if (!msg) return null;

  const contexto =
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo ||
    msg.message?.documentMessage?.contextInfo;

  if (
    contexto?.mentionedJid &&
    contexto.mentionedJid.length > 0
  ) {
    return contexto.mentionedJid[0];
  }

  return null;
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
  esAdmin,
  msg
) {
  const cmd = comando.toLowerCase();

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
    "grupomenu",
    "grupo",
    "kick",
    "promote",
    "demote",
    "mute",
    "unmute",
    "warn"
  ];

  // ========================================
  // COMPROBAR GRUPO
  // ========================================

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

🛡️ *Moderación*
• .kick @usuario
• .promote @usuario
• .demote @usuario
• .mute
• .unmute
• .warn @usuario

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
        text: "❌ No pude obtener los administradores."
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
        text: "❌ No pude obtener la información."
      });
    }

    return true;
  }

  // ========================================
  // ID GRUPO
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
  // KICK
  // ========================================

  if (cmd === "kick") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden expulsar miembros."
      });

      return true;
    }

    const usuario = obtenerMencion(msg);

    if (!usuario) {
      await sock.sendMessage(chat, {
        text: "❌ Menciona al usuario que quieres expulsar.\n\nEjemplo: .kick @usuario"
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text: "❌ Necesito ser administrador del grupo."
      });

      return true;
    }

    try {
      await sock.groupParticipantsUpdate(
        chat,
        [usuario],
        "remove"
      );

      await sock.sendMessage(chat, {
        text: `✅ Usuario @${usuario.split("@")[0]} expulsado.`,
        mentions: [usuario]
      });
    } catch (error) {
      await sock.sendMessage(chat, {
        text: "❌ No pude expulsar al usuario. Puede que sea administrador o que no tenga permisos."
      });
    }

    return true;
  }

  // ========================================
  // PROMOTE
  // ========================================

  if (cmd === "promote") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden promover usuarios."
      });

      return true;
    }

    const usuario = obtenerMencion(msg);

    if (!usuario) {
      await sock.sendMessage(chat, {
        text: "❌ Menciona al usuario.\n\nEjemplo: .promote @usuario"
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text: "❌ Necesito ser administrador del grupo."
      });

      return true;
    }

    try {
      await sock.groupParticipantsUpdate(
        chat,
        [usuario],
        "promote"
      );

      await sock.sendMessage(chat, {
        text: `👑 @${usuario.split("@")[0]} ahora es administrador.`,
        mentions: [usuario]
      });
    } catch (error) {
      await sock.sendMessage(chat, {
        text: "❌ No pude promover al usuario."
      });
    }

    return true;
  }

  // ========================================
  // DEMOTE
  // ========================================

  if (cmd === "demote") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden quitar administradores."
      });

      return true;
    }

    const usuario = obtenerMencion(msg);

    if (!usuario) {
      await sock.sendMessage(chat, {
        text: "❌ Menciona al administrador.\n\nEjemplo: .demote @usuario"
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text: "❌ Necesito ser administrador del grupo."
      });

      return true;
    }

    try {
      await sock.groupParticipantsUpdate(
        chat,
        [usuario],
        "demote"
      );

      await sock.sendMessage(chat, {
        text: `🔻 @${usuario.split("@")[0]} ya no es administrador.`,
        mentions: [usuario]
      });
    } catch (error) {
      await sock.sendMessage(chat, {
        text: "❌ No pude quitarle el rango de administrador."
      });
    }

    return true;
  }

  // ========================================
  // MUTE GRUPO
  // ========================================

  if (cmd === "mute") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden silenciar el grupo."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text: "❌ Necesito ser administrador del grupo."
      });

      return true;
    }

    try {
      await sock.groupSettingUpdate(chat, "announcement");

      await sock.sendMessage(chat, {
        text: "🔇 *GRUPO SILENCIADO*\n\nSolo los administradores pueden enviar mensajes."
      });
    } catch (error) {
      await sock.sendMessage(chat, {
        text: "❌ No pude cambiar la configuración del grupo."
      });
    }

    return true;
  }

  // ========================================
  // UNMUTE GRUPO
  // ========================================

  if (cmd === "unmute") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden activar el chat."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text: "❌ Necesito ser administrador del grupo."
      });

      return true;
    }

    try {
      await sock.groupSettingUpdate(chat, "not_announcement");

      await sock.sendMessage(chat, {
        text: "🔊 *GRUPO ACTIVADO*\n\nTodos los miembros pueden enviar mensajes."
      });
    } catch (error) {
      await sock.sendMessage(chat, {
        text: "❌ No pude cambiar la configuración."
      });
    }

    return true;
  }

  // ========================================
  // WARN
  // ========================================

  if (cmd === "warn") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text: "❌ Solo los administradores pueden dar advertencias."
      });

      return true;
    }

    const usuario = obtenerMencion(msg);

    if (!usuario) {
      await sock.sendMessage(chat, {
        text: "❌ Menciona al usuario.\n\nEjemplo: .warn @usuario"
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) {
      grupos[chat] = {
        reglas: "No hay reglas configuradas.",
        bienvenida: false,
        despedida: false,
        antilink: false,
        antispam: false,
        advertencias: {}
      };
    }

    if (!grupos[chat].advertencias) {
      grupos[chat].advertencias = {};
    }

    const numero = usuario.split("@")[0];

    grupos[chat].advertencias[numero] =
      (grupos[chat].advertencias[numero] || 0) + 1;

    const advertencias =
      grupos[chat].advertencias[numero];

    guardarGrupos(grupos);

    await sock.sendMessage(chat, {
      text:
`⚠️ *ADVERTENCIA*

👤 Usuario: @${numero}
⚠️ Advertencias: *${advertencias}/3*

Por favor, respeta las reglas del grupo.`,
      mentions: [usuario]
    });

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
        text: ".bienvenida on\n.bienvenida off"
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) grupos[chat] = {};

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
        text: ".despedida on\n.despedida off"
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) grupos[chat] = {};

    grupos[chat].despedida = opcion === "on";

    guardarGrupos(grupos);

    await sock.sendMessage(chat, {
      text: `🚪 Despedida: ${opcion === "on" ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}`
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
        text: ".antilink on\n.antilink off"
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) grupos[chat] = {};

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
        text: ".antispam on\n.antispam off"
      });

      return true;
    }

    const grupos = cargarGrupos();

    if (!grupos[chat]) grupos[chat] = {};

    grupos[chat].antispam = opcion === "on";

    guardarGrupos(grupos);

    await sock.sendMessage(chat, {
      text: `🚫 Antispam: ${opcion === "on" ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"}`
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

module.exports = grupos;
module.exports.grupos = grupos;
module.exports.cargarGrupos = cargarGrupos;
module.exports.guardarGrupos = guardarGrupos;
module.exports.obtenerGrupo = obtenerGrupo;
