const config = require("../config");
const fs = require("fs");
const path = require("path");

// ==============================
// BASE DE DATOS
// ==============================

const DB_PATH = path.join(__dirname, "../database/groups.json");

function cargarGrupos() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, "{}");
    }

    return JSON.parse(
      fs.readFileSync(DB_PATH, "utf8")
    );
  } catch (error) {
    console.error("Error cargando grupos:", error);
    return {};
  }
}

function guardarGrupos(grupos) {
  try {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(grupos, null, 2)
    );
  } catch (error) {
    console.error("Error guardando grupos:", error);
  }
}

function obtenerGrupo(chat) {
  const grupos = cargarGrupos();

  if (!grupos[chat]) {
    grupos[chat] = {
      bienvenida: false,
      despedida: false,
      antilink: false,
      antispam: false,
      reglas: "No hay reglas configuradas.",
      advertencias: {}
    };

    guardarGrupos(grupos);
  }

  return grupos[chat];
}

// ==============================
// COMPROBAR ADMIN DEL BOT
// ==============================

async function botEsAdmin(sock, chat) {
  try {
    const metadata = await sock.groupMetadata(chat);

    const botNumero = sock.user.id
      .split(":")[0]
      .split("@")[0];

    const bot = metadata.participants.find(
      participante =>
        participante.id.split("@")[0] === botNumero
    );

    return !!(
      bot &&
      (
        bot.admin === "admin" ||
        bot.admin === "superadmin"
      )
    );
  } catch (error) {
    console.error("Error comprobando admin del bot:", error);
    return false;
  }
}

// ==============================
// OBTENER MENCIÓN
// ==============================

function obtenerMencion(msg) {
  try {
    const mensaje =
      msg?.message?.extendedTextMessage ||
      msg?.message?.imageMessage ||
      msg?.message?.videoMessage ||
      msg?.message?.documentMessage;

    const contexto = mensaje?.contextInfo;

    if (
      contexto?.mentionedJid &&
      contexto.mentionedJid.length > 0
    ) {
      return contexto.mentionedJid[0];
    }

    return null;
  } catch {
    return null;
  }
}

// ==============================
// GRUPOS
// ==============================

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
  const cmd = String(comando || "").toLowerCase();

  const comandosGrupo = [
    "admins",
    "tagall",
    "hidetag",
    "reglas",
    "bienvenida",
    "despedida",
    "antilink",
    "antispam",
    "promote",
    "demote",
    "kick",
    "add",
    "mute",
    "unmute",
    "linkgrupo",
    "setnombre",
    "setdescripcion",
    "grupo",
    "cerrar",
    "abrir",
    "warn"
  ];

  // ==============================
  // SOLO GRUPOS
  // ==============================

  if (
    comandosGrupo.includes(cmd) &&
    !esGrupo
  ) {
    await sock.sendMessage(chat, {
      text:
        "❌ Este comando solo funciona dentro de un grupo."
    });

    return true;
  }

  const grupo = obtenerGrupo(chat);

  // ==============================
  // ADMINS
  // ==============================

  if (cmd === "admins") {
    const metadata =
      await sock.groupMetadata(chat);

    const admins =
      metadata.participants.filter(
        p =>
          p.admin === "admin" ||
          p.admin === "superadmin"
      );

    let texto =
      "👑 *ADMINISTRADORES DEL GRUPO*\n\n";

    admins.forEach((admin, index) => {
      texto +=
        `${index + 1}. @${admin.id.split("@")[0]}\n`;
    });

    await sock.sendMessage(chat, {
      text: texto,
      mentions: admins.map(a => a.id)
    });

    return true;
  }

  // ==============================
  // TAGALL
  // ==============================

  if (cmd === "tagall") {
    const metadata =
      await sock.groupMetadata(chat);

    const mentions =
      metadata.participants.map(p => p.id);

    let texto =
      "📢 *TODOS LOS MIEMBROS*\n\n";

    metadata.participants.forEach(
      (participante, index) => {
        texto +=
          `${index + 1}. @${participante.id.split("@")[0]}\n`;
      }
    );

    await sock.sendMessage(chat, {
      text: texto,
      mentions
    });

    return true;
  }

  // ==============================
  // HIDETAG
  // ==============================

  if (cmd === "hidetag") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden usar este comando."
      });

      return true;
    }

    const metadata =
      await sock.groupMetadata(chat);

    const mentions =
      metadata.participants.map(p => p.id);

    const texto =
      args.length > 0
        ? args.join(" ")
        : "📢 Mensaje para todos.";

    await sock.sendMessage(chat, {
      text: texto,
      mentions
    });

    return true;
  }

  // ==============================
  // REGLAS
  // ==============================

  if (cmd === "reglas") {
    await sock.sendMessage(chat, {
      text:
`📜 *REGLAS DEL GRUPO*

${grupo.reglas}`
    });

    return true;
  }

  // ==============================
  // BIENVENIDA
  // ==============================

  if (cmd === "bienvenida") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden configurar la bienvenida."
      });

      return true;
    }

    const opcion =
      String(args[0] || "").toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {
      await sock.sendMessage(chat, {
        text:
`⚙️ *BIENVENIDA*

.bienvenida on
.bienvenida off`
      });

      return true;
    }

    grupo.bienvenida =
      opcion === "on";

    const gruposDB = cargarGrupos();
    gruposDB[chat] = grupo;
    guardarGrupos(gruposDB);

    await sock.sendMessage(chat, {
      text: grupo.bienvenida
        ? "✅ Bienvenida activada."
        : "❌ Bienvenida desactivada."
    });

    return true;
  }

  // ==============================
  // DESPEDIDA
  // ==============================

  if (cmd === "despedida") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden configurar la despedida."
      });

      return true;
    }

    const opcion =
      String(args[0] || "").toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {
      await sock.sendMessage(chat, {
        text:
`⚙️ *DESPEDIDA*

.despedida on
.despedida off`
      });

      return true;
    }

    grupo.despedida =
      opcion === "on";

    const gruposDB = cargarGrupos();
    gruposDB[chat] = grupo;
    guardarGrupos(gruposDB);

    await sock.sendMessage(chat, {
      text: grupo.despedida
        ? "✅ Despedida activada."
        : "❌ Despedida desactivada."
    });

    return true;
  }

  // ==============================
  // ANTILINK
  // ==============================

  if (cmd === "antilink") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden configurar AntiLink."
      });

      return true;
    }

    const opcion =
      String(args[0] || "").toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {
      await sock.sendMessage(chat, {
        text:
`🔗 *ANTILINK*

.antilink on
.antilink off`
      });

      return true;
    }

    grupo.antilink =
      opcion === "on";

    const gruposDB = cargarGrupos();
    gruposDB[chat] = grupo;
    guardarGrupos(gruposDB);

    await sock.sendMessage(chat, {
      text: grupo.antilink
        ? "🔗 AntiLink activado."
        : "🔓 AntiLink desactivado."
    });

    return true;
  }

  // ==============================
  // ANTISPAM
  // ==============================

  if (cmd === "antispam") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden configurar AntiSpam."
      });

      return true;
    }

    const opcion =
      String(args[0] || "").toLowerCase();

    if (
      opcion !== "on" &&
      opcion !== "off"
    ) {
      await sock.sendMessage(chat, {
        text:
`🛡️ *ANTISPAM*

.antispam on
.antispam off`
      });

      return true;
    }

    grupo.antispam =
      opcion === "on";

    const gruposDB = cargarGrupos();
    gruposDB[chat] = grupo;
    guardarGrupos(gruposDB);

    await sock.sendMessage(chat, {
      text: grupo.antispam
        ? "🛡️ AntiSpam activado."
        : "🔓 AntiSpam desactivado."
    });

    return true;
  }

  // ==============================
  // PROMOTE
  // ==============================

  if (cmd === "promote") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden usar este comando."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador para hacer esto."
      });

      return true;
    }

    const usuario =
      obtenerMencion(msg);

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "⚠️ Menciona al usuario.\n\nEjemplo:\n.promote @usuario"
      });

      return true;
    }

    await sock.groupParticipantsUpdate(
      chat,
      [usuario],
      "promote"
    );

    await sock.sendMessage(chat, {
      text:
        `✅ @${usuario.split("@")[0]} ahora es administrador.`,
      mentions: [usuario]
    });

    return true;
  }

  // ==============================
  // DEMOTE
  // ==============================

  if (cmd === "demote") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden usar este comando."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador para hacer esto."
      });

      return true;
    }

    const usuario =
      obtenerMencion(msg);

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "⚠️ Menciona al administrador.\n\nEjemplo:\n.demote @usuario"
      });

      return true;
    }

    await sock.groupParticipantsUpdate(
      chat,
      [usuario],
      "demote"
    );

    await sock.sendMessage(chat, {
      text:
        `✅ @${usuario.split("@")[0]} dejó de ser administrador.`,
      mentions: [usuario]
    });

    return true;
  }

  // ==============================
  // KICK
  // ==============================

  if (cmd === "kick") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden usar este comando."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador para expulsar usuarios."
      });

      return true;
    }

    const usuario =
      obtenerMencion(msg);

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "⚠️ Menciona al usuario.\n\nEjemplo:\n.kick @usuario"
      });

      return true;
    }

    await sock.groupParticipantsUpdate(
      chat,
      [usuario],
      "remove"
    );

    await sock.sendMessage(chat, {
      text:
        `🚫 @${usuario.split("@")[0]} fue eliminado del grupo.`,
      mentions: [usuario]
    });

    return true;
  }

  // ==============================
  // ADD
  // ==============================

  if (cmd === "add") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden usar este comando."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador para agregar usuarios."
      });

      return true;
    }

    let numero =
      args.join("").replace(/\D/g, "");

    if (!numero) {
      await sock.sendMessage(chat, {
        text:
          "⚠️ Escribe un número.\n\nEjemplo:\n.add 573001234567"
      });

      return true;
    }

    if (!numero.startsWith("57")) {
      numero = "57" + numero;
    }

    const usuario =
      `${numero}@s.whatsapp.net`;

    await sock.groupParticipantsUpdate(
      chat,
      [usuario],
      "add"
    );

    await sock.sendMessage(chat, {
      text:
        `✅ Se intentó agregar a +${numero}.`
    });

    return true;
  }

  // ==============================
  // MUTE
  // ==============================

  if (cmd === "mute") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cerrar el grupo."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador."
      });

      return true;
    }

    await sock.groupSettingUpdate(
      chat,
      "announcement"
    );

    await sock.sendMessage(chat, {
      text:
        "🔇 *GRUPO SILENCIADO*\n\nSolo los administradores pueden escribir."
    });

    return true;
  }

  // ==============================
  // UNMUTE
  // ==============================

  if (cmd === "unmute") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden abrir el grupo."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador."
      });

      return true;
    }

    await sock.groupSettingUpdate(
      chat,
      "not_announcement"
    );

    await sock.sendMessage(chat, {
      text:
        "🔊 *GRUPO ACTIVADO*\n\nTodos pueden escribir nuevamente."
    });

    return true;
  }

  // ==============================
  // LINKGRUPO
  // ==============================

  if (cmd === "linkgrupo") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden obtener el enlace."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador."
      });

      return true;
    }

    const codigo =
      await sock.groupInviteCode(chat);

    await sock.sendMessage(chat, {
      text:
`🔗 *ENLACE DEL GRUPO*

https://chat.whatsapp.com/${codigo}`
    });

    return true;
  }

  // ==============================
  // SETNOMBRE
  // ==============================

  if (cmd === "setnombre") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cambiar el nombre."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador."
      });

      return true;
    }

    const nombre =
      args.join(" ").trim();

    if (!nombre) {
      await sock.sendMessage(chat, {
        text:
          "⚠️ Ejemplo:\n.setnombre Nuevo Nombre"
      });

      return true;
    }

    await sock.groupUpdateSubject(
      chat,
      nombre
    );

    await sock.sendMessage(chat, {
      text:
        `✅ Nombre cambiado a:\n*${nombre}*`
    });

    return true;
  }

  // ==============================
  // SETDESCRIPCION
  // ==============================

  if (cmd === "setdescripcion") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cambiar la descripción."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador."
      });

      return true;
    }

    const descripcion =
      args.join(" ").trim();

    if (!descripcion) {
      await sock.sendMessage(chat, {
        text:
          "⚠️ Ejemplo:\n.setdescripcion Descripción del grupo"
      });

      return true;
    }

    await sock.groupUpdateDescription(
      chat,
      descripcion
    );

    await sock.sendMessage(chat, {
      text:
        "✅ Descripción actualizada."
    });

    return true;
  }

  // ==============================
  // GRUPO
  // ==============================

  if (cmd === "grupo") {
    const metadata =
      await sock.groupMetadata(chat);

    const admins =
      metadata.participants.filter(
        p =>
          p.admin === "admin" ||
          p.admin === "superadmin"
      );

    await sock.sendMessage(chat, {
      text:
`👥 *INFORMACIÓN DEL GRUPO*

📛 Nombre: ${metadata.subject}
👤 Miembros: ${metadata.participants.length}
👑 Administradores: ${admins.length}

🆔 ID:
${chat}`
    });

    return true;
  }

  // ==============================
  // CERRAR
  // ==============================

  if (cmd === "cerrar") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cerrar el grupo."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador."
      });

      return true;
    }

    await sock.groupSettingUpdate(
      chat,
      "announcement"
    );

    await sock.sendMessage(chat, {
      text:
        "🔒 *GRUPO CERRADO*\n\nSolo los administradores pueden escribir."
    });

    return true;
  }

  // ==============================
  // ABRIR
  // ==============================

  if (cmd === "abrir") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden abrir el grupo."
      });

      return true;
    }

    if (!(await botEsAdmin(sock, chat))) {
      await sock.sendMessage(chat, {
        text:
          "❌ Necesito ser administrador."
      });

      return true;
    }

    await sock.groupSettingUpdate(
      chat,
      "not_announcement"
    );

    await sock.sendMessage(chat, {
      text:
        "🔓 *GRUPO ABIERTO*\n\nTodos pueden escribir nuevamente."
    });

    return true;
  }

  // ==============================
  // WARN
  // ==============================

  if (cmd === "warn") {
    if (!esAdmin) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden usar warn."
      });

      return true;
    }

    const usuario =
      obtenerMencion(msg);

    if (!usuario) {
      await sock.sendMessage(chat, {
        text:
          "⚠️ Menciona al usuario.\n\nEjemplo:\n.warn @usuario"
      });

      return true;
    }

    const numero =
      usuario.split("@")[0];

    if (!grupo.advertencias) {
      grupo.advertencias = {};
    }

    if (!grupo.advertencias[numero]) {
      grupo.advertencias[numero] = 0;
    }

    grupo.advertencias[numero]++;

    const gruposDB = cargarGrupos();
    gruposDB[chat] = grupo;
    guardarGrupos(gruposDB);

    const cantidad =
      grupo.advertencias[numero];

    await sock.sendMessage(chat, {
      text:
`⚠️ *ADVERTENCIA*

👤 Usuario: @${numero}
📊 Advertencias: ${cantidad}/3`,
      mentions: [usuario]
    });

    return true;
  }

  // ==============================
  // COMANDO NO ENCONTRADO
  // ==============================

  return false;
}

// ==============================
// EXPORTACIÓN
// ==============================

module.exports = grupos;
module.exports.grupos = grupos;
module.exports.cargarGrupos = cargarGrupos;
module.exports.guardarGrupos = guardarGrupos;
module.exports.obtenerGrupo = obtenerGrupo;
