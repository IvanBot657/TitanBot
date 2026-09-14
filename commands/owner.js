const config = require("../config");

function obtenerNumero(id) {
  return String(id || "")
    .split("@")[0]
    .split(":")[0]
    .replace(/\D/g, "");
}

function esOwner(id) {
  const usuario = obtenerNumero(id);
  const creador = obtenerNumero(config.creador);

  return usuario !== "" && usuario === creador;
}

async function owner(sock, chat, comando, args, id) {

  // ========================================
  // OWNER PÚBLICO
  // ========================================

  if (comando === "owner") {

    return sock.sendMessage(chat, {
      text:
`👑 CREADOR DE TITANBOT

🤖 ${config.nombre}

📦 Versión:
${config.version}

👑 Número:
${config.creador}

━━━━━━━━━━━━━━━━━━

⚡ TitanBot`
    });
  }


  // ========================================
  // COMPROBAR OWNER
  // ========================================

  if (
    comando === "ownermenu" ||
    comando === "botstatus" ||
    comando === "reiniciar"
  ) {

    if (!esOwner(id)) {

      return sock.sendMessage(chat, {
        text:
`❌ ACCESO DENEGADO

Este comando es exclusivo
del creador de TitanBot.`
      });
    }
  }


  // ========================================
  // MENÚ OWNER
  // ========================================

  if (comando === "ownermenu") {

    return sock.sendMessage(chat, {
      text:
`👑 TITANBOT OWNER

🔐 COMANDOS PRIVADOS

📊 .botstatus
Ver estado del bot.

🔄 .reiniciar
Reiniciar el proceso.

━━━━━━━━━━━━━━━━━━

👑 Solo el creador puede
utilizar estos comandos.`
    });
  }


  // ========================================
  // ESTADO DEL BOT
  // ========================================

  if (comando === "botstatus") {

    const memoria =
      process.memoryUsage();

    const memoriaMB =
      (memoria.rss / 1024 / 1024)
        .toFixed(2);

    const uptime =
      Math.floor(
        process.uptime()
      );

    const horas =
      Math.floor(
        uptime / 3600
      );

    const minutos =
      Math.floor(
        (uptime % 3600) / 60
      );

    const segundos =
      uptime % 60;

    return sock.sendMessage(chat, {
      text:
`📊 ESTADO DEL TITANBOT

🟢 Estado:
ONLINE

🤖 Nombre:
${config.nombre}

📦 Versión:
${config.version}

⏱️ Tiempo activo:
${horas}h ${minutos}m ${segundos}s

💾 Memoria:
${memoriaMB} MB

🟢 Sistema:
Funcionando correctamente`
    });
  }


  // ========================================
  // REINICIAR
  // ========================================

  if (comando === "reiniciar") {

    await sock.sendMessage(chat, {
      text:
`🔄 REINICIANDO TITANBOT...

⏳ El bot volverá a conectarse
en unos segundos.`
    });

    setTimeout(() => {
      process.exit(0);
    }, 1500);

    return true;
  }


  return false;
}

module.exports = owner;
