// =========================================
// ⚔️ TITANBOT - SISTEMA DE DUELOS 4.0
// =========================================

const duelos = new Map();

// =========================================
// ⚙️ CONFIGURACIÓN
// =========================================

const MAX_TURNOS = 20;
const HP_MAX = 125;
const ENERGIA_MAX = 100;

const COSTO_HABILIDAD = 25;
const COSTO_ESPECIAL = 50;

const TIEMPO_RETO = 60 * 1000;

// =========================================
// 🧰 UTILIDADES
// =========================================

function numeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function porcentaje(probabilidad) {
  return Math.random() * 100 < probabilidad;
}

function obtenerNombre(msg, id) {
  return (
    msg?.pushName ||
    msg?.name ||
    id?.split("@")[0] ||
    "Jugador"
  );
}

function obtenerMencion(msg) {
  if (!msg) return null;

  const contexto =
    msg.message?.extendedTextMessage?.contextInfo;

  if (contexto?.mentionedJid?.length) {
    return contexto.mentionedJid[0];
  }

  return null;
}

function jugadorPorId(duelo, id) {
  if (duelo.jugador1.id === id) {
    return duelo.jugador1;
  }

  if (duelo.jugador2.id === id) {
    return duelo.jugador2;
  }

  return null;
}

function oponenteDe(duelo, id) {
  if (duelo.jugador1.id === id) {
    return duelo.jugador2;
  }

  if (duelo.jugador2.id === id) {
    return duelo.jugador1;
  }

  return null;
}

// =========================================
// 🧬 CREAR JUGADOR
// =========================================

function crearJugador(id, nombre) {
  return {
    id,
    nombre,
    hp: HP_MAX,
    energia: ENERGIA_MAX,
    defendiendo: false,
    especialDisponible: true,
    curaciones: 2
  };
}

// =========================================
// 🏟️ ARENAS
// =========================================

const arenas = [
  {
    nombre: "Coliseo TITAN",
    icono: "🏟️"
  },
  {
    nombre: "Volcán",
    icono: "🌋"
  },
  {
    nombre: "Reino Helado",
    icono: "❄️"
  },
  {
    nombre: "Bosque Oscuro",
    icono: "🌲"
  },
  {
    nombre: "Desierto",
    icono: "🏜️"
  },
  {
    nombre: "Dimensión TITAN",
    icono: "🌌"
  },
  {
    nombre: "Isla Aurora",
    icono: "🏝️"
  }
];

function elegirArena() {
  return arenas[
    numeroAleatorio(0, arenas.length - 1)
  ];
}

// =========================================
// ❤️ BARRAS
// =========================================

function barraVida(hp) {
  const total = 10;

  const llenas = Math.max(
    0,
    Math.min(
      total,
      Math.round((hp / HP_MAX) * total)
    )
  );

  return (
    "❤️".repeat(llenas) +
    "🖤".repeat(total - llenas)
  );
}

function barraEnergia(energia) {
  const total = 10;

  const llenas = Math.max(
    0,
    Math.min(
      total,
      Math.round(
        (energia / ENERGIA_MAX) * total
      )
    )
  );

  return (
    "⚡".repeat(llenas) +
    "▫️".repeat(total - llenas)
  );
}

// =========================================
// ⚔️ MENSAJE DEL TURNO
// =========================================

function mensajeTurno(duelo) {
  const jugador = jugadorPorId(
    duelo,
    duelo.turno
  );

  const rival = oponenteDe(
    duelo,
    duelo.turno
  );

  return (
    `⚔️ ━━ TURNO ${duelo.turnos} ━━ ⚔️\n\n` +

    `👤 ${jugador.nombre}\n` +
    `${barraVida(jugador.hp)}\n` +
    `❤️ ${jugador.hp}/${HP_MAX}\n` +
    `${barraEnergia(jugador.energia)}\n` +
    `⚡ ${jugador.energia}/${ENERGIA_MAX}\n\n` +

    `🆚\n\n` +

    `👤 ${rival.nombre}\n` +
    `❤️ ${rival.hp}/${HP_MAX}\n` +
    `⚡ ${rival.energia}/${ENERGIA_MAX}\n\n` +

    `🎯 Turno de ${jugador.nombre}\n\n` +

    `⚔️ .atacar\n` +
    `🛡️ .defender\n` +
    `✨ .habilidad\n` +
    `🔥 .especial\n` +
    `💚 .curar\n` +
    `⚡ .cargar\n` +
    `🎯 .riesgo`
  );
}

// =========================================
// 🏆 FINALIZAR DUELO
// =========================================

async function finalizarDuelo(
  sock,
  chat,
  duelo,
  ganador,
  perdedor
) {
  duelos.delete(chat);

  const recompensaXP =
    numeroAleatorio(40, 80);

  const recompensaMonedas =
    numeroAleatorio(75, 150);

  await sock.sendMessage(chat, {
    text:
      `🏆 ━━━ DUELO TERMINADO ━━━ 🏆\n\n` +

      `👑 GANADOR\n` +
      `⚔️ ${ganador.nombre}\n` +
      `❤️ ${Math.max(
        0,
        ganador.hp
      )}/${HP_MAX} HP\n\n` +

      `💀 DERROTADO\n` +
      `${perdedor.nombre}\n\n` +

      `${duelo.arena.icono} ${duelo.arena.nombre}\n` +
      `🔢 Turnos: ${duelo.turnos}/${MAX_TURNOS}\n\n` +

      `🎁 RECOMPENSAS\n` +
      `⭐ +${recompensaXP} XP\n` +
      `💰 +${recompensaMonedas} monedas`,

    mentions: [
      ganador.id,
      perdedor.id
    ]
  });
}

// =========================================
// 🏆 COMPROBAR FIN
// =========================================

async function comprobarFin(
  sock,
  chat,
  duelo
) {
  const j1 = duelo.jugador1;
  const j2 = duelo.jugador2;

  if (j1.hp <= 0 && j2.hp <= 0) {
    duelos.delete(chat);

    await sock.sendMessage(chat, {
      text:
        `🤝 ━━━ EMPATE ━━━ 🤝\n\n` +
        `⚔️ Ambos jugadores quedaron fuera.\n\n` +
        `👤 ${j1.nombre}\n` +
        `👤 ${j2.nombre}`
    });

    return true;
  }

  if (j1.hp <= 0) {
    await finalizarDuelo(
      sock,
      chat,
      duelo,
      j2,
      j1
    );

    return true;
  }

  if (j2.hp <= 0) {
    await finalizarDuelo(
      sock,
      chat,
      duelo,
      j1,
      j2
    );

    return true;
  }

  return false;
}

// =========================================
// 🔄 SIGUIENTE TURNO
// =========================================

async function siguienteTurno(
  sock,
  chat,
  duelo
) {
  const actual = duelo.turno;

  duelo.turno =
    actual === duelo.jugador1.id
      ? duelo.jugador2.id
      : duelo.jugador1.id;

  duelo.turnos++;

  // Restaurar especial después de un turno
  if (duelo.turnos % 3 === 0) {
    duelo.jugador1.especialDisponible = true;
    duelo.jugador2.especialDisponible = true;
  }

  // =====================================
  // ⏱️ LÍMITE DE TURNOS
  // =====================================

  if (duelo.turnos > MAX_TURNOS) {
    const j1 = duelo.jugador1;
    const j2 = duelo.jugador2;

    let ganador;
    let perdedor;

    if (j1.hp > j2.hp) {
      ganador = j1;
      perdedor = j2;
    } else if (j2.hp > j1.hp) {
      ganador = j2;
      perdedor = j1;
    } else {
      duelos.delete(chat);

      await sock.sendMessage(chat, {
        text:
          `🤝 ━━━ EMPATE ━━━ 🤝\n\n` +
          `⏱️ Se alcanzaron los ${MAX_TURNOS} turnos.\n` +
          `❤️ Ambos terminaron con la misma vida.`
      });

      return;
    }

    await finalizarDuelo(
      sock,
      chat,
      duelo,
      ganador,
      perdedor
    );

    return;
  }

  await sock.sendMessage(chat, {
    text: mensajeTurno(duelo),
    mentions: [
      duelo.jugador1.id,
      duelo.jugador2.id
    ]
  });
}

// =========================================
// ⚔️ PROCESAR ACCIONES
// =========================================

async function procesarAccion(
  sock,
  chat,
  comando,
  id
) {
  const duelo = duelos.get(chat);

  if (!duelo) {
    return false;
  }

  const jugador =
    jugadorPorId(duelo, id);

  if (!jugador) {
    return false;
  }

  // =====================================
  // 🎯 TURNO
  // =====================================

  if (duelo.turno !== id) {
    const turnoActual =
      jugadorPorId(
        duelo,
        duelo.turno
      );

    await sock.sendMessage(chat, {
      text:
        `⏳ No es tu turno.\n\n` +
        `🎯 Le toca a ${turnoActual.nombre}.`
    });

    return true;
  }

  const rival =
    oponenteDe(duelo, id);

  let mensaje = "";

  // =====================================
  // ⚔️ ATAQUE
  // =====================================

  if (comando === "atacar") {
    let dano =
      numeroAleatorio(15, 28);

    if (porcentaje(15)) {
      dano *= 2;

      mensaje =
        `💥 ¡GOLPE CRÍTICO!\n\n`;
    }

    if (rival.defendiendo) {
      dano = Math.floor(dano * 0.4);

      rival.defendiendo = false;

      mensaje +=
        `🛡️ ${rival.nombre} bloqueó parte del ataque.\n\n`;
    }

    rival.hp -= dano;

    mensaje +=
      `⚔️ ${jugador.nombre} atacó a ${rival.nombre}\n\n` +
      `💥 Daño: ${dano}\n` +
      `❤️ ${rival.nombre}: ${Math.max(
        0,
        rival.hp
      )}/${HP_MAX}`;
  }

  // =====================================
  // 🛡️ DEFENDER
  // =====================================

  else if (comando === "defender") {
    jugador.defendiendo = true;

    jugador.energia = Math.min(
      ENERGIA_MAX,
      jugador.energia + 10
    );

    mensaje =
      `🛡️ ${jugador.nombre} se puso en defensa.\n\n` +
      `🛡️ El próximo ataque recibido hará menos daño.\n` +
      `⚡ +10 energía`;
  }

  // =====================================
  // ✨ HABILIDAD
  // =====================================

  else if (comando === "habilidad") {
    if (jugador.energia < COSTO_HABILIDAD) {
      await sock.sendMessage(chat, {
        text:
          `❌ No tienes suficiente energía.\n\n` +
          `Necesitas ⚡ ${COSTO_HABILIDAD}.\n` +
          `Tienes ⚡ ${jugador.energia}.`
      });

      return true;
    }

    jugador.energia -= COSTO_HABILIDAD;

    let dano =
      numeroAleatorio(25, 40);

    if (rival.defendiendo) {
      dano = Math.floor(dano * 0.4);

      rival.defendiendo = false;

      mensaje =
        `🛡️ La defensa de ${rival.nombre} redujo el daño.\n\n`;
    }

    rival.hp -= dano;

    mensaje +=
      `✨ ${jugador.nombre} utilizó su HABILIDAD.\n\n` +
      `💥 Daño: ${dano}\n` +
      `⚡ Energía restante: ${jugador.energia}`;
  }

  // =====================================
  // 🔥 ESPECIAL
  // =====================================

  else if (comando === "especial") {
    if (!jugador.especialDisponible) {
      await sock.sendMessage(chat, {
        text:
          `⏳ Tu especial está en enfriamiento.`
      });

      return true;
    }

    if (jugador.energia < COSTO_ESPECIAL) {
      await sock.sendMessage(chat, {
        text:
          `❌ No tienes suficiente energía.\n\n` +
          `Necesitas ⚡ ${COSTO_ESPECIAL}.\n` +
          `Tienes ⚡ ${jugador.energia}.`
      });

      return true;
    }

    jugador.energia -= COSTO_ESPECIAL;
    jugador.especialDisponible = false;

    let dano =
      numeroAleatorio(40, 60);

    if (rival.defendiendo) {
      dano = Math.floor(dano * 0.4);

      rival.defendiendo = false;

      mensaje =
        `🛡️ ${rival.nombre} resistió parte del especial.\n\n`;
    }

    rival.hp -= dano;

    mensaje +=
      `🔥 ¡ATAQUE ESPECIAL!\n\n` +
      `⚔️ ${jugador.nombre} utilizó su especial.\n` +
      `💥 Daño: ${dano}\n\n` +
      `⚡ Energía restante: ${jugador.energia}\n` +
      `⏳ Especial en enfriamiento.`;
  }

  // =====================================
  // 💚 CURAR
  // =====================================

  else if (comando === "curar") {
    if (jugador.curaciones <= 0) {
      await sock.sendMessage(chat, {
        text:
          `❌ Ya utilizaste tus curaciones en este duelo.`
      });

      return true;
    }

    if (jugador.hp >= HP_MAX) {
      await sock.sendMessage(chat, {
        text:
          `❤️ Ya tienes la vida al máximo.`
      });

      return true;
    }

    const antes = jugador.hp;

    const cantidad =
      numeroAleatorio(18, 30);

    jugador.hp = Math.min(
      HP_MAX,
      jugador.hp + cantidad
    );

    jugador.curaciones--;

    const recuperado =
      jugador.hp - antes;

    mensaje =
      `💚 ${jugador.nombre} se curó.\n\n` +
      `❤️ +${recuperado} HP\n` +
      `❤️ Vida: ${jugador.hp}/${HP_MAX}\n` +
      `💚 Curaciones restantes: ${jugador.curaciones}`;
  }

  // =====================================
  // ⚡ CARGAR
  // =====================================

  else if (comando === "cargar") {
    const cantidad =
      numeroAleatorio(20, 30);

    jugador.energia = Math.min(
      ENERGIA_MAX,
      jugador.energia + cantidad
    );

    mensaje =
      `⚡ ${jugador.nombre} concentró energía.\n\n` +
      `⚡ +${cantidad} energía\n` +
      `⚡ Energía: ${jugador.energia}/${ENERGIA_MAX}\n\n` +
      `⚠️ Quedaste vulnerable durante este turno.`;
  }

  // =====================================
  // 🎯 RIESGO
  // =====================================

  else if (comando === "riesgo") {
    const acierto = porcentaje(55);

    if (acierto) {
      let dano =
        numeroAleatorio(35, 50);

      if (porcentaje(25)) {
        dano *= 2;

        mensaje =
          `🎯💥 ¡GOLPE PERFECTO!\n\n`;
      }

      if (rival.defendiendo) {
        dano = Math.floor(dano * 0.4);

        rival.defendiendo = false;

        mensaje +=
          `🛡️ ${rival.nombre} redujo el daño.\n\n`;
      }

      rival.hp -= dano;

      mensaje +=
        `🎯 ${jugador.nombre} se arriesgó.\n\n` +
        `💥 Daño: ${dano}`;
    } else {
      const retroceso =
        numeroAleatorio(8, 18);

      jugador.hp -= retroceso;

      mensaje =
        `🎯 ¡FALLASTE!\n\n` +
        `💀 El riesgo salió mal.\n` +
        `❤️ Perdiste ${retroceso} HP.`;
    }
  }

  else {
    return false;
  }

  // =====================================
  // 📤 RESULTADO
  // =====================================

  await sock.sendMessage(chat, {
    text: mensaje,
    mentions: [
      jugador.id,
      rival.id
    ]
  });

  // =====================================
  // 🏆 COMPROBAR GANADOR
  // =====================================

  if (
    await comprobarFin(
      sock,
      chat,
      duelo
    )
  ) {
    return true;
  }

  // =====================================
  // 🔄 SIGUIENTE TURNO
  // =====================================

  await siguienteTurno(
    sock,
    chat,
    duelo
  );

  return true;
}

// =========================================
// 🚀 FUNCIÓN PRINCIPAL
// =========================================

async function duelo(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  // =====================================
  // ⚔️ RETAR
  // =====================================

  if (comando === "duelo") {

    if (
      !msg?.key?.remoteJid ||
      !msg.key.remoteJid.endsWith("@g.us")
    ) {
      await sock.sendMessage(chat, {
        text:
          `❌ Los duelos solamente funcionan en grupos.`
      });

      return true;
    }

    if (duelos.has(chat)) {
      await sock.sendMessage(chat, {
        text:
          `⚔️ Ya existe un duelo o reto activo en este grupo.`
      });

      return true;
    }

    const objetivo =
      obtenerMencion(msg);

    if (!objetivo) {
      await sock.sendMessage(chat, {
        text:
          `⚔️ USO DEL DUELO\n\n` +
          `Debes mencionar al usuario que quieres retar.\n\n` +
          `Ejemplo:\n` +
          `.duelo @usuario`
      });

      return true;
    }

    if (objetivo === id) {
      await sock.sendMessage(chat, {
        text:
          `😂 No puedes retarte a ti mismo.`
      });

      return true;
    }

    const nombreRetador =
      obtenerNombre(msg, id);

    const reto = {
      tipo: "reto",
      chat,

      jugador1: crearJugador(
        id,
        nombreRetador
      ),

      jugador2: crearJugador(
        objetivo,
        "Rival"
      ),

      creado: Date.now()
    };

    duelos.set(chat, reto);

    await sock.sendMessage(chat, {
      text:
        `⚔️ ━━━ DESAFÍO TITAN ━━━ ⚔️\n\n` +

        `👤 ${nombreRetador}\n` +
        `🆚\n` +
        `👤 @${objetivo.split("@")[0]}\n\n` +

        `🔥 ¡Has sido retado a un duelo!\n\n` +

        `⏳ Tienes 60 segundos para responder.\n\n` +

        `✅ .aceptarduelo\n` +
        `❌ .rechazar`,

      mentions: [
        id,
        objetivo
      ]
    });

    setTimeout(() => {

      const actual =
        duelos.get(chat);

      if (
        actual &&
        actual.tipo === "reto" &&
        actual.creado === reto.creado
      ) {
        duelos.delete(chat);

        sock.sendMessage(chat, {
          text:
            `⏰ El reto de ${nombreRetador} expiró.\n\n` +
            `Nadie aceptó el duelo a tiempo.`,
          mentions: [id]
        }).catch(() => {});
      }

    }, TIEMPO_RETO);

    return true;
  }

  // =====================================
  // ✅ ACEPTAR
  // =====================================

  if (comando === "aceptarduelo") {

    const duelo =
      duelos.get(chat);

    if (
      !duelo ||
      duelo.tipo !== "reto"
    ) {
      await sock.sendMessage(chat, {
        text:
          `❌ No hay ningún reto pendiente.`
      });

      return true;
    }

    if (
      duelo.jugador2.id !== id
    ) {
      await sock.sendMessage(chat, {
        text:
          `❌ Solo el usuario retado puede aceptar.`
      });

      return true;
    }

    duelo.tipo = "combate";
    duelo.arena = elegirArena();
    duelo.turnos = 1;

    duelo.turno =
      Math.random() < 0.5
        ? duelo.jugador1.id
        : duelo.jugador2.id;

    await sock.sendMessage(chat, {
      text:
        `⚔️ ━━━ DUELO INICIADO ━━━ ⚔️\n\n` +

        `👤 ${duelo.jugador1.nombre}\n` +
        `❤️ ${HP_MAX} HP\n\n` +

        `🆚\n\n` +

        `👤 ${duelo.jugador2.nombre}\n` +
        `❤️ ${HP_MAX} HP\n\n` +

        `${duelo.arena.icono} Arena: ${duelo.arena.nombre}\n\n` +

        `🎲 ¡El primer turno será para ` +
        `${jugadorPorId(
          duelo,
          duelo.turno
        ).nombre}!`
    });

    await sock.sendMessage(chat, {
      text: mensajeTurno(duelo),
      mentions: [
        duelo.jugador1.id,
        duelo.jugador2.id
      ]
    });

    return true;
  }

  // =====================================
  // ❌ RECHAZAR
  // =====================================

  if (comando === "rechazar") {

    const duelo =
      duelos.get(chat);

    if (
      !duelo ||
      duelo.tipo !== "reto"
    ) {
      await sock.sendMessage(chat, {
        text:
          `❌ No hay ningún reto pendiente.`
      });

      return true;
    }

    if (
      duelo.jugador2.id !== id
    ) {
      await sock.sendMessage(chat, {
        text:
          `❌ Solo el usuario retado puede rechazar.`
      });

      return true;
    }

    duelos.delete(chat);

    await sock.sendMessage(chat, {
      text:
        `❌ ${duelo.jugador2.nombre} rechazó el desafío.\n\n` +
        `⚔️ El duelo ha sido cancelado.`
    });

    return true;
  }

  // =====================================
  // ⚔️ ACCIONES
  // =====================================

  const acciones = [
    "atacar",
    "defender",
    "habilidad",
    "especial",
    "curar",
    "cargar",
    "riesgo"
  ];

  if (acciones.includes(comando)) {
    return await procesarAccion(
      sock,
      chat,
      comando,
      id
    );
  }

  return false;
}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = duelo;
