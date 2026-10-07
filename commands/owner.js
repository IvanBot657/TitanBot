// ==========================================
// TITANBOT v3.1
// OWNER.JS
// ==========================================

const config = require("../config");

// ==========================================
// NORMALIZAR NÚMERO
// ==========================================

function limpiarNumero(valor) {
  if (!valor) return "";

  return String(valor)
    .split("@")[0]
    .split(":")[0]
    .replace(/\D/g, "");
}

// ==========================================
// COMPROBAR SI ES OWNER
// ==========================================

function comprobarOwner(id, msg) {

  const numeroOwner = limpiarNumero(config.creador);

  // Posibles identificadores del usuario
  const candidatos = [
    id,
    msg?.key?.participant,
    msg?.key?.participantAlt,
    msg?.key?.remoteJid,
    msg?.key?.remoteJidAlt
  ];

  for (const candidato of candidatos) {

    const numero = limpiarNumero(candidato);

    if (
      numero &&
      numeroOwner &&
      numero === numeroOwner
    ) {
      return true;
    }
  }

  return false;
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

async function owner(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const cmd = String(comando || "").toLowerCase();

  // ========================================
  // COMANDOS DEL OWNER
  // ========================================

  const comandosOwner = [
    "owner",
    "ownermenu",
    "botstatus",
    "broadcast",
    "shutdown"
  ];

  // Si no pertenece a este módulo
  if (!comandosOwner.includes(cmd)) {
    return false;
  }

  // ========================================
  // SEGURIDAD
  // ========================================

  const esOwner = comprobarOwner(id, msg);

  if (!esOwner) {

    await sock.sendMessage(chat, {
      text:
`❌ *ACCESO DENEGADO*

Este comando solamente puede utilizarlo el propietario del bot.`
    });

    return true;
  }

  // ========================================
  // MENÚ OWNER
  // ========================================

  if (cmd === "owner" || cmd === "ownermenu") {

    await sock.sendMessage(chat, {
      text:
`╔══════════════════════════╗
       👑 *OWNER MENU*
╚══════════════════════════╝

🤖 *${config.nombre}*

⚙️ Comandos disponibles:

• .botstatus
• .broadcast
• .shutdown

👑 Acceso: Propietario
⚡ Versión: ${config.version}`
    });

    return true;
  }

  // ========================================
  // BOT STATUS
  // ========================================

  if (cmd === "botstatus") {

    await sock.sendMessage(chat, {
      text:
`📊 *ESTADO DEL BOT*

🤖 Nombre: ${config.nombre}
⚡ Versión: ${config.version}
🟢 Estado: ONLINE
📡 Conexión: ACTIVA

👑 Owner: Verificado`
    });

    return true;
  }

  // ========================================
  // BROADCAST
  // ========================================

  if (cmd === "broadcast") {

    if (!args || !args.length) {

      await sock.sendMessage(chat, {
        text:
`📢 *BROADCAST*

Uso:

.broadcast Tu mensaje

⚠️ Envía el mensaje a los grupos donde está el bot.`
      });

      return true;
    }

    const mensaje = args.join(" ");

    try {

      const chats = await sock.groupFetchAllParticipating();
      const grupos = Object.keys(chats);

      let enviados = 0;

      for (const grupo of grupos) {

        try {

          await sock.sendMessage(grupo, {
            text:
`📢 *MENSAJE DEL BOT*

${mensaje}

🤖 ${config.nombre}`
          });

          enviados++;

        } catch (error) {

          console.log(
            `❌ No se pudo enviar a ${grupo}`
          );
        }
      }

      await sock.sendMessage(chat, {
        text:
`✅ *BROADCAST TERMINADO*

📨 Grupos encontrados: ${grupos.length}
📤 Enviados: ${enviados}`
      });

    } catch (error) {

      console.log(
        "❌ Error en broadcast:",
        error
      );

      await sock.sendMessage(chat, {
        text:
          "❌ No se pudo realizar el broadcast."
      });
    }

    return true;
  }

  // ========================================
  // SHUTDOWN
  // ========================================

  if (cmd === "shutdown") {

    await sock.sendMessage(chat, {
      text:
`⚠️ *APAGANDO ${config.nombre}*

🔴 El bot se está deteniendo...`
    });

    setTimeout(() => {

      console.log(
        "🔴 TITANBOT apagado por el propietario."
      );

      process.exit(0);

    }, 1500);

    return true;
  }

  return true;
}

// ==========================================
// EXPORTACIÓN
// ==========================================

module.exports = owner;
module.exports.owner = owner;
