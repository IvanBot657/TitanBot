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
      reglas: "No hay reglas configuradas."
    };

    guardarGrupos(db);
  }

  return db[id];
}

async function grupos(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin
) {

  // =========================
  // COMANDOS SOLO PARA GRUPOS
  // =========================

  if (
    [
      "grupo",
      "admins",
      "tagall",
      "miembros",
      "idgrupo",
      "reglas",
      "grupomenu"
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

  // =========================
  // INFORMACIÓN DEL GRUPO
  // =========================

  if (comando === "grupo") {

    try {

      const metadata =
        await sock.groupMetadata(chat);

      return sock.sendMessage(chat, {
        text:
`👥 INFORMACIÓN DEL GRUPO

📛 Nombre:
${metadata.subject}

👤 Miembros:
${metadata.participants.length}

🆔 ID:
${chat}`
      });

    } catch {
      return sock.sendMessage(chat, {
        text:
          "❌ No pude obtener la información del grupo."
      });
    }
  }

  // =========================
  // ADMINISTRADORES
  // =========================

  if (comando === "admins") {

    try {

      const metadata =
        await sock.groupMetadata(chat);

      const admins =
        metadata.participants.filter(
          participante =>
            participante.admin === "admin" ||
            participante.admin === "superadmin"
        );

      if (!admins.length) {
        return sock.sendMessage(chat, {
          text:
            "❌ No se encontraron administradores."
        });
      }

      const lista =
        admins
          .map(
            (admin, index) =>
              `${index + 1}. @${admin.id.split("@")[0]}`
          )
          .join("\n");

      return sock.sendMessage(
        chat,
        {
          text:
`👑 ADMINISTRADORES

${lista}`,
          mentions:
            admins.map(admin => admin.id)
        }
      );

    } catch {
      return sock.sendMessage(chat, {
        text:
          "❌ No pude obtener los administradores."
      });
    }
  }

  // =========================
  // MENCIONAR A TODOS
  // =========================

  if (comando === "tagall") {

    if (!esAdmin) {
      return sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden usar este comando."
      });
    }

    try {

      const metadata =
        await sock.groupMetadata(chat);

      const participantes =
        metadata.participants;

      const mensaje =
        args.length
          ? args.join(" ")
          : "📢 Atención grupo";

      const menciones =
        participantes.map(
          participante => participante.id
        );

      const lista =
        participantes
          .map(
            participante =>
              `@${participante.id.split("@")[0]}`
          )
          .join(" ");

      return sock.sendMessage(
        chat,
        {
          text:
`${mensaje}

${lista}`,
          mentions: menciones
        }
      );

    } catch {
      return sock.sendMessage(chat, {
        text:
          "❌ No pude mencionar a los miembros."
      });
    }
  }

  // =========================
  // LISTA DE MIEMBROS
  // =========================

  if (comando === "miembros") {

    try {

      const metadata =
        await sock.groupMetadata(chat);

      const participantes =
        metadata.participants;

      const lista =
        participantes
          .map(
            (participante, index) =>
              `${index + 1}. @${participante.id.split("@")[0]}`
          )
          .join("\n");

      return sock.sendMessage(
        chat,
        {
          text:
`👥 MIEMBROS

Total: ${participantes.length}

${lista}`,
          mentions:
            participantes.map(
              participante => participante.id
            )
        }
      );

    } catch {
      return sock.sendMessage(chat, {
        text:
          "❌ No pude obtener los miembros."
      });
    }
  }

  // =========================
  // ID DEL GRUPO
  // =========================

  if (comando === "idgrupo") {

    return sock.sendMessage(chat, {
      text:
`🆔 ID DEL GRUPO

${chat}`
    });
  }

  // =========================
  // REGLAS
  // =========================

  if (comando === "reglas") {

    const grupo =
      obtenerGrupo(chat);

    // Mostrar reglas
    if (!args.length) {

      return sock.sendMessage(chat, {
        text:
`📜 REGLAS DEL GRUPO

${grupo.reglas}

👑 Un administrador puede cambiarlas usando:

.reglas [nuevas reglas]`
      });
    }

    // Cambiar reglas
    if (!esAdmin) {
      return sock.sendMessage(chat, {
        text:
          "❌ Solo los administradores pueden cambiar las reglas."
      });
    }

    const nuevasReglas =
      args.join(" ");

    const db =
      cargarGrupos();

    db[chat] = {
      ...obtenerGrupo(chat),
      reglas: nuevasReglas
    };

    guardarGrupos(db);

    return sock.sendMessage(chat, {
      text:
`📜 REGLAS ACTUALIZADAS

${nuevasReglas}

✅ Las reglas fueron guardadas.`
    });
  }

  // =========================
  // MENÚ DE GRUPO
  // =========================

  if (comando === "grupomenu") {

    return sock.sendMessage(chat, {
      text:
`👥 MENÚ DE GRUPO

📋 INFORMACIÓN

.grupo
.admins
.miembros
.idgrupo
.reglas

🛠️ ADMINISTRACIÓN

.tagall

⚙️ CONFIGURACIÓN

.ajustes
.estado
.configgrupo
.bienvenida on/off
.despedida on/off

🤖 TITANBOT V2.5.0`
    });
  }

  return false;
}

module.exports = grupos;
