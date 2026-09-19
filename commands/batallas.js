// =========================================
// ⚔️ TITANBOT - SISTEMA DE BATALLAS
// =========================================

const fs = require("fs");

const ARCHIVO = "./database/batallas.json";

// =========================================
// 📁 CREAR BASE DE DATOS
// =========================================

function asegurarBaseDatos() {
  if (!fs.existsSync("./database")) {
    fs.mkdirSync("./database", { recursive: true });
  }

  if (!fs.existsSync(ARCHIVO)) {
    fs.writeFileSync(ARCHIVO, "{}");
  }
}

// =========================================
// 📖 CARGAR BATALLAS
// =========================================

function cargarBatallas() {
  asegurarBaseDatos();

  try {
    return JSON.parse(
      fs.readFileSync(ARCHIVO, "utf8")
    );
  } catch {
    return {};
  }
}

// =========================================
// 💾 GUARDAR BATALLAS
// =========================================

function guardarBatallas(data) {
  asegurarBaseDatos();

  fs.writeFileSync(
    ARCHIVO,
    JSON.stringify(data, null, 2)
  );
}

// =========================================
// 🎲 ALEATORIO
// =========================================

function aleatorio(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

// =========================================
// ⚔️ COMANDO PRINCIPAL
// =========================================

async function batallas(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const batallasDB = cargarBatallas();

  // =========================================
  // ⚔️ BATALLA
  // =========================================

  if (comando === "batalla") {

    if (!chat.endsWith("@g.us")) {
      await sock.sendMessage(chat, {
        text:
          "⚔️ Este comando solo funciona en grupos."
      });

      return true;
    }

    const mencionado =
      msg?.message?.extendedTextMessage
        ?.contextInfo?.mentionedJid?.[0];

    if (!mencionado) {
      await sock.sendMessage(chat, {
        text:
          "⚔️ Debes mencionar al usuario que quieres desafiar.\n\n" +
          "Ejemplo:\n" +
          ".batalla @usuario"
      });

      return true;
    }

    if (mencionado === id) {
      await sock.sendMessage(chat, {
        text:
          "❌ No puedes desafiarte a ti mismo."
      });

      return true;
    }

    if (batallasDB[chat]) {

      await sock.sendMessage(chat, {
        text:
          "⚔️ Ya hay una batalla activa en este grupo.\n\n" +
          "🏆 Termina la batalla actual antes de comenzar otra."
      });

      return true;
    }

    batallasDB[chat] = {
      estado: "pendiente",
      creador: id,
      oponente: mencionado,
      jugadorActual: null,

      jugadores: {
        [id]: {
          hp: 100,
          energia: 100,
          victorias: 0,
          derrotas: 0
        },

        [mencionado]: {
          hp: 100,
          energia: 100,
          victorias: 0,
          derrotas: 0
        }
      }
    };

    guardarBatallas(batallasDB);

    await sock.sendMessage(chat, {
      text:
`⚔️ ═══ DESAFÍO DE BATALLA ═══ ⚔️

👤 DESAFIANTE
@${id.split("@")[0]}

🆚

👤 OPONENTE
@${mencionado.split("@")[0]}

❤️ HP: 100
⚡ Energía: 100

@${mencionado.split("@")[0]}, tienes que aceptar.

⚔️ Usa:
.aceptar

❌ O rechaza:
.rechazar`,
      mentions: [id, mencionado]
    });

    return true;
  }

  // =========================================
  // ✅ ACEPTAR
  // =========================================

  if (comando === "aceptar") {

    const batalla = batallasDB[chat];

    if (!batalla) {
      await sock.sendMessage(chat, {
        text:
          "❌ No hay ninguna batalla pendiente."
      });

      return true;
    }

    if (batalla.estado !== "pendiente") {
      await sock.sendMessage(chat, {
        text:
          "⚔️ La batalla ya comenzó."
      });

      return true;
    }

    if (id !== batalla.oponente) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo el usuario desafiado puede aceptar."
      });

      return true;
    }

    batalla.estado = "activa";

    const primero =
      Math.random() < 0.5
        ? batalla.creador
        : batalla.oponente;

    batalla.jugadorActual = primero;

    guardarBatallas(batallasDB);

    await sock.sendMessage(chat, {
      text:
`⚔️ ═══ ¡BATALLA INICIADA! ═══ ⚔️

🔥 ${batalla.creador === primero
  ? "El desafiante"
  : "El oponente"} comienza.

❤️ Ambos jugadores empiezan con 100 HP.
⚡ Ambos tienen 100 de energía.

🎯 Turno:
@${primero.split("@")[0]}

⚔️ .atacar
🛡️ .defender
✨ .habilidad
📊 .batallainfo
🏳️ .rendirse`,
      mentions: [
        batalla.creador,
        batalla.oponente,
        primero
      ]
    });

    return true;
  }

  // =========================================
  // ❌ RECHAZAR
  // =========================================

  if (comando === "rechazar") {

    const batalla = batallasDB[chat];

    if (!batalla) {
      await sock.sendMessage(chat, {
        text:
          "❌ No hay ninguna batalla pendiente."
      });

      return true;
    }

    if (id !== batalla.oponente) {
      await sock.sendMessage(chat, {
        text:
          "❌ Solo el usuario desafiado puede rechazar."
      });

      return true;
    }

    delete batallasDB[chat];

    guardarBatallas(batallasDB);

    await sock.sendMessage(chat, {
      text:
`❌ DESAFÍO RECHAZADO

@${id.split("@")[0]} rechazó la batalla.`,
      mentions: [id]
    });

    return true;
  }

  // =========================================
  // 📊 INFORMACIÓN
  // =========================================

  if (comando === "batallainfo") {

    const batalla = batallasDB[chat];

    if (!batalla) {
      await sock.sendMessage(chat, {
        text:
          "⚔️ No hay ninguna batalla activa."
      });

      return true;
    }

    const a = batalla.creador;
    const b = batalla.oponente;

    const jugadorA =
      batalla.jugadores[a];

    const jugadorB =
      batalla.jugadores[b];

    await sock.sendMessage(chat, {
      text:
`⚔️ ═══ ESTADO DE BATALLA ═══ ⚔️

👤 @${a.split("@")[0]}

❤️ HP: ${jugadorA.hp}
⚡ Energía: ${jugadorA.energia}

🆚

👤 @${b.split("@")[0]}

❤️ HP: ${jugadorB.hp}
⚡ Energía: ${jugadorB.energia}

🎯 Turno:
${batalla.jugadorActual
  ? "@" + batalla.jugadorActual.split("@")[0]
  : "Esperando aceptación"}`,
      mentions: [a, b]
    });

    return true;
  }

  // =========================================
  // ⚔️ ATACAR
  // =========================================

  if (comando === "atacar") {

    const batalla = batallasDB[chat];

    if (!batalla || batalla.estado !== "activa") {
      await sock.sendMessage(chat, {
        text:
          "⚔️ No hay una batalla activa."
      });

      return true;
    }

    if (batalla.jugadorActual !== id) {
      await sock.sendMessage(chat, {
        text:
          "⏳ No es tu turno."
      });

      return true;
    }

    const enemigo =
      id === batalla.creador
        ? batalla.oponente
        : batalla.creador;

    const atacante =
      batalla.jugadores[id];

    const defensor =
      batalla.jugadores[enemigo];

    const danio =
      aleatorio(10, 25);

    defensor.hp =
      Math.max(
        0,
        defensor.hp - danio
      );

    atacante.energia =
      Math.min(
        100,
        atacante.energia + 10
      );

    if (defensor.hp <= 0) {

      atacante.victorias++;

      defensor.derrotas++;

      guardarBatallas(batallasDB);

      await sock.sendMessage(chat, {
        text:
`🏆 ═══ ¡BATALLA TERMINADA! ═══ 🏆

⚔️ @${id.split("@")[0]} ha ganado.

💥 Daño final: ${danio}

❤️ HP restante:
${atacante.hp}

🎉 ¡VICTORIA!`,
        mentions: [id]
      });

      delete batallasDB[chat];

      guardarBatallas(batallasDB);

      return true;
    }

    batalla.jugadorActual = enemigo;

    guardarBatallas(batallasDB);

    await sock.sendMessage(chat, {
      text:
`⚔️ ¡ATAQUE!

👤 @${id.split("@")[0]}

💥 Daño:
-${danio} HP

❤️ HP enemigo:
${defensor.hp}

🎯 Ahora es el turno de:
@${enemigo.split("@")[0]}

⚔️ .atacar
🛡️ .defender
✨ .habilidad`,
      mentions: [id, enemigo]
    });

    return true;
  }

  // =========================================
  // 🛡️ DEFENDER
  // =========================================

  if (comando === "defender") {

    const batalla = batallasDB[chat];

    if (!batalla || batalla.estado !== "activa") {
      await sock.sendMessage(chat, {
        text:
          "⚔️ No hay una batalla activa."
      });

      return true;
    }

    if (batalla.jugadorActual !== id) {
      await sock.sendMessage(chat, {
        text:
          "⏳ No es tu turno."
      });

      return true;
    }

    const jugador =
      batalla.jugadores[id];

    jugador.energia =
      Math.min(
        100,
        jugador.energia + 25
      );

    const enemigo =
      id === batalla.creador
        ? batalla.oponente
        : batalla.creador;

    batalla.jugadorActual = enemigo;

    guardarBatallas(batallasDB);

    await sock.sendMessage(chat, {
      text:
`🛡️ ¡DEFENSA ACTIVADA!

👤 @${id.split("@")[0]}

🛡️ El jugador se prepara para resistir.

⚡ Energía recuperada: +25

⚡ Energía actual:
${jugador.energia}

🎯 Turno de:
@${enemigo.split("@")[0]}`,
      mentions: [id, enemigo]
    });

    return true;
  }

  // =========================================
  // ✨ HABILIDAD
  // =========================================

  if (comando === "habilidad") {

    const batalla = batallasDB[chat];

    if (!batalla || batalla.estado !== "activa") {
      await sock.sendMessage(chat, {
        text:
          "⚔️ No hay una batalla activa."
      });

      return true;
    }

    if (batalla.jugadorActual !== id) {
      await sock.sendMessage(chat, {
        text:
          "⏳ No es tu turno."
      });

      return true;
    }

    const atacante =
      batalla.jugadores[id];

    if (atacante.energia < 40) {

      await sock.sendMessage(chat, {
        text:
          `⚡ No tienes suficiente energía.\n\n` +
          `Necesitas: 40\n` +
          `Tienes: ${atacante.energia}`
      });

      return true;
    }

    const enemigo =
      id === batalla.creador
        ? batalla.oponente
        : batalla.creador;

    const defensor =
      batalla.jugadores[enemigo];

    const danio =
      aleatorio(25, 40);

    atacante.energia -= 40;

    defensor.hp =
      Math.max(
        0,
        defensor.hp - danio
      );

    if (defensor.hp <= 0) {

      atacante.victorias++;
      defensor.derrotas++;

      delete batallasDB[chat];

      guardarBatallas(batallasDB);

      await sock.sendMessage(chat, {
        text:
`✨ ═══ HABILIDAD ESPECIAL ═══ ✨

👤 @${id.split("@")[0]}

💥 DAÑO:
-${danio} HP

🏆 ¡VICTORIA!

🔥 La habilidad especial derrotó al oponente.`,
        mentions: [id]
      });

      return true;
    }

    batalla.jugadorActual = enemigo;

    guardarBatallas(batallasDB);

    await sock.sendMessage(chat, {
      text:
`✨ ¡HABILIDAD ESPECIAL!

👤 @${id.split("@")[0]}

💥 Daño:
-${danio} HP

❤️ HP enemigo:
${defensor.hp}

⚡ Energía restante:
${atacante.energia}

🎯 Turno de:
@${enemigo.split("@")[0]}`,
      mentions: [id, enemigo]
    });

    return true;
  }

  // =========================================
  // 🏳️ RENDIRSE
  // =========================================

  if (comando === "rendirse") {

    const batalla = batallasDB[chat];

    if (!batalla || batalla.estado !== "activa") {
      await sock.sendMessage(chat, {
        text:
          "⚔️ No hay una batalla activa."
      });

      return true;
    }

    if (
      id !== batalla.creador &&
      id !== batalla.oponente
    ) {
      await sock.sendMessage(chat, {
        text:
          "❌ No estás participando en esta batalla."
      });

      return true;
    }

    const enemigo =
      id === batalla.creador
        ? batalla.oponente
        : batalla.creador;

    batalla.jugadores[enemigo].victorias++;
    batalla.jugadores[id].derrotas++;

    delete batallasDB[chat];

    guardarBatallas(batallasDB);

    await sock.sendMessage(chat, {
      text:
`🏳️ BATALLA TERMINADA

👤 @${id.split("@")[0]} se ha rendido.

🏆 Ganador:
@${enemigo.split("@")[0]}

🎉 ¡Victoria!`,
      mentions: [id, enemigo]
    });

    return true;
  }

  return false;
}

module.exports = batallas;
