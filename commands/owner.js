const OWNER = "573237210190";

async function owner(
  sock,
  chat,
  comando,
  args,
  id
) {

  const numero =
    id.split("@")[0];

  const esOwner =
    numero === OWNER;

  // ========================================
  // SOLO OWNER
  // ========================================

  const comandosOwner = [

    "botstatus",
    "broadcast",
    "shutdown"

  ];

  if (
    comandosOwner.includes(comando) &&
    !esOwner
  ) {

    return sock.sendMessage(chat, {

      text:
        "❌ Solo el Owner puede usar este comando."

    });

  }

  // ========================================
  // BOTSTATUS
  // ========================================

  if (comando === "botstatus") {

    const memoria =
      (
        process.memoryUsage().rss /
        1024 /
        1024
      ).toFixed(2);

    const uptime =
      Math.floor(
        process.uptime()
      );

    return sock.sendMessage(chat, {

      text:
`🤖 TITANBOT V3.0

🟢 Estado:
Online

⏱️ Uptime:
${uptime}s

💾 RAM:
${memoria} MB

🚀 Sistema:
Operativo`

    });

  }

  // ========================================
  // BROADCAST
  // ========================================

  if (comando === "broadcast") {

    const mensaje =
      args.join(" ");

    if (!mensaje) {

      return sock.sendMessage(chat, {

        text:
`📢 Usa:

.broadcast mensaje`

      });

    }

    return sock.sendMessage(chat, {

      text:
`📢 BROADCAST

Mensaje preparado:

${mensaje}

(En v3.0 básica solo se muestra al owner.)`

    });

  }

  // ========================================
  // SHUTDOWN
  // ========================================

  if (comando === "shutdown") {

    await sock.sendMessage(chat, {

      text:
`🛑 TitanBot apagándose...`

    });

    process.exit(0);

  }

  return false;

}

module.exports = owner;
