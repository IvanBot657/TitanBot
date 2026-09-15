// ==========================================
// TITANBOT v3.1
// OWNER.JS
// ==========================================

const config = require("../config");

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

async function owner(
  sock,
  chat,
  comando,
  args,
  id
) {
  const cmd = comando.toLowerCase();

  // ========================================
  // COMPROBAR OWNER
  // ========================================

  const numeroUsuario = id.split("@")[0];
  const numeroOwner = String(config.creador).replace(/\D/g, "");

  const esOwner =
    numeroUsuario === numeroOwner ||
    numeroUsuario.endsWith(numeroOwner);

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

  // Si no es un comando de este módulo
  if (!comandosOwner.includes(cmd)) {
    return false;
  }

  // ========================================
  // SEGURIDAD
  // ========================================

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

    if (!args.length) {
      await sock.sendMessage(chat, {
        text:
`📢 *BROADCAST*

Uso:

.broadcast Tu mensaje

⚠️ Envía el mensaje a los chats que el bot tenga disponibles.`
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

      console.log("❌ Error en broadcast:", error);

      await sock.sendMessage(chat, {
        text: "❌ No se pudo realizar el broadcast."
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
