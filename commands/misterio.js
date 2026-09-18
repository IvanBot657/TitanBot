// =========================================
// 🔎 MISTERIO / DETECTIVE
// =========================================

async function ejecutarMisterio(
  sock,
  chat,
  comando,
  args,
  id,
  esGrupo,
  esAdmin,
  msg
) {

  // =========================================
  // COMANDOS DE MISTERIO
  // =========================================

  const comandos = [
    "misterio",
    "detective",
    "caso",
    "pista",
    "investigar"
  ];

  // Si no es un comando de misterio,
  // dejamos que los demás módulos continúen.
  if (!comandos.includes(comando)) {
    return false;
  }


  // =========================================
  // 🔎 MISTERIO
  // =========================================

  if (
    comando === "misterio" ||
    comando === "detective" ||
    comando === "caso"
  ) {

    const casos = [

      {
        titulo: "🏚️ La casa abandonada",
        historia:
          "Una casa lleva años abandonada. Esta noche alguien vio una luz encendida en una de sus ventanas.",
        pistas: [
          "🔎 No hay huellas recientes en la entrada.",
          "🕯️ La luz pertenece a una lámpara antigua.",
          "👣 Hay marcas de zapatos cerca de una ventana."
        ]
      },

      {
        titulo: "🚂 El tren de medianoche",
        historia:
          "Un objeto desapareció de un vagón mientras el tren estaba en movimiento.",
        pistas: [
          "🔎 Nadie abrió las puertas del vagón.",
          "🎫 Todos los pasajeros tenían boleto.",
          "🪟 Una ventana estaba ligeramente abierta."
        ]
      },

      {
        titulo: "💎 El misterio del diamante",
        historia:
          "Un diamante desapareció de una habitación cerrada. Nadie afirma haber entrado.",
        pistas: [
          "🔑 La puerta no fue forzada.",
          "🪟 La ventana estaba cerrada.",
          "🧤 Se encontró un guante cerca de la caja fuerte."
        ]
      }

    ];


    const caso =
      casos[Math.floor(Math.random() * casos.length)];


    await sock.sendMessage(
      chat,
      {
        text:
`🔎 *MISTERIO / DETECTIVE*

${caso.titulo}

📖 *Caso:*
${caso.historia}

🕵️ *Pistas:*

${caso.pistas.join("\n")}

💬 Analiza las pistas y descubre qué pudo haber ocurrido.

🔎 Usa:
.misterio

para recibir otro caso.`
      }
    );

    return true;
  }


  // =========================================
  // 🔍 PISTA
  // =========================================

  if (comando === "pista") {

    await sock.sendMessage(
      chat,
      {
        text:
`🔎 *PISTA DEL DETECTIVE*

🕵️ Observa todos los detalles antes de sacar una conclusión.

💡 Una pista puede parecer pequeña, pero podría ser importante.`
      }
    );

    return true;
  }


  // =========================================
  // 🕵️ INVESTIGAR
  // =========================================

  if (comando === "investigar") {

    await sock.sendMessage(
      chat,
      {
        text:
`🕵️ *INVESTIGACIÓN*

🔎 Has comenzado una investigación.

📋 Analiza las pistas.
👀 Observa los detalles.
🧠 Formula una teoría.

Escribe:
.pista

para recibir una pista del detective.`
      }
    );

    return true;
  }


  return false;
}


// =========================================
// EXPORTAR
// =========================================

module.exports = ejecutarMisterio;
