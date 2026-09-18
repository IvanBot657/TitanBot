// =========================================
// 🔎 MISTERIO / DETECTIVE
// TITANBOT
// =========================================

const partidas = new Map();

// Tiempo del caso: 3 minutos
const TIEMPO_CASO = 3 * 60 * 1000;


// =========================================
// 🕵️ CASOS
// =========================================

const casos = [

  {
    titulo: "🏚️ EL MISTERIO DE LA MANSIÓN",
    historia:
      "Durante una reunión en una antigua mansión, desapareció un valioso objeto de una habitación cerrada. Solo tres personas estuvieron cerca del lugar.",

    sospechosos: [
      "👨‍💼 Alejandro — estaba en la biblioteca.",
      "👩‍🎨 Valentina — estaba en el salón.",
      "🧑‍🔧 Bruno — estaba reparando una lámpara."
    ],

    pistas: [
      "🔎 La puerta de la habitación no fue forzada.",
      "👣 Se encontraron pequeñas marcas cerca de la ventana.",
      "💡 Bruno aseguró que estuvo reparando la lámpara, pero la lámpara funcionaba perfectamente."
    ],

    culpable: "bruno",

    explicacion:
      "Bruno dijo que estaba reparando una lámpara que realmente funcionaba. Además, las marcas encontradas cerca de la ventana coinciden con su recorrido."
  },

  {
    titulo: "🚂 EL MISTERIO DEL TREN",
    historia:
      "Un objeto desapareció durante un viaje en tren. Nadie vio al responsable y todas las puertas permanecieron cerradas.",

    sospechosos: [
      "👨 Carlos — viajaba en el vagón delantero.",
      "👩 Laura — estaba leyendo.",
      "👨‍🍳 Mateo — trabajaba en el vagón comedor."
    ],

    pistas: [
      "🔎 El objeto estaba cerca de una ventana.",
      "📖 Laura no abandonó su asiento.",
      "🍽️ Mateo fue visto entrando al vagón poco antes de la desaparición."
    ],

    culpable: "mateo",

    explicacion:
      "Mateo fue visto entrando al vagón poco antes de que desapareciera el objeto y tuvo oportunidad de acercarse al lugar."
  },

  {
    titulo: "💎 EL DIAMANTE DESAPARECIDO",
    historia:
      "Un diamante desapareció de una caja fuerte. La habitación estaba cerrada y aparentemente nadie podía entrar.",

    sospechosos: [
      "👨 Andrés — conocía la combinación.",
      "👩 Sofía — trabajaba en la casa.",
      "👨 Diego — estaba limpiando el pasillo."
    ],

    pistas: [
      "🔐 La caja fuerte fue abierta con la combinación correcta.",
      "🧤 Se encontró un guante junto a la caja.",
      "👨 Andrés afirmó que nunca había tocado la caja ese día."
    ],

    culpable: "andres",

    explicacion:
      "La caja fue abierta con la combinación correcta y Andrés conocía esa combinación. Su declaración también contradice la evidencia."
  }

];


// =========================================
// 🧹 NORMALIZAR TEXTO
// =========================================

function normalizar(texto = "") {

  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}


// =========================================
// 👤 NOMBRE DEL USUARIO
// =========================================

function numeroUsuario(id) {

  return id
    ? id.split("@")[0]
    : "jugador";

}


// =========================================
// 🔒 CERRAR GRUPO
// =========================================

async function cerrarGrupo(sock, chat) {

  try {

    await sock.groupSettingUpdate(
      chat,
      "announcement"
    );

    return true;

  } catch (error) {

    console.log(
      "❌ No se pudo cerrar el grupo:",
      error.message
    );

    return false;
  }

}


// =========================================
// 🔓 ABRIR GRUPO
// =========================================

async function abrirGrupo(sock, chat) {

  try {

    await sock.groupSettingUpdate(
      chat,
      "not_announcement"
    );

    return true;

  } catch (error) {

    console.log(
      "❌ No se pudo abrir el grupo:",
      error.message
    );

    return false;
  }

}


// =========================================
// 📢 MOSTRAR PISTAS
// =========================================

async function enviarPistas(sock, chat, partida) {

  if (!partida || partida.terminada) {
    return;
  }

  const caso = partida.caso;

  let texto =
`🔎 *PISTAS DEL CASO*

🕵️ *${caso.titulo}*

`;

  caso.pistas.forEach(
    (pista, index) => {

      texto +=
        `${index + 1}. ${pista}\n`;

    }
  );

  texto +=
`
💡 Analiza las pistas cuidadosamente.

Para investigar:
*.investigar*

Para intentar resolver:
*.culpable nombre*

⏱️ Tiempo restante: 3 minutos.
`;

  await sock.sendMessage(
    chat,
    {
      text: texto
    }
  );

}


// =========================================
// 🏆 FINALIZAR PARTIDA
// =========================================

async function finalizarPartida(
  sock,
  chat,
  partida,
  motivo = "tiempo"
) {

  if (!partida || partida.terminada) {
    return;
  }

  partida.terminada = true;

  clearTimeout(partida.timer);

  const caso = partida.caso;

  let texto = "";

  // =======================================
  // GANADOR
  // =======================================

  if (partida.ganador) {

    texto =
`🏆 *CASO RESUELTO*

🕵️ Detective:
@${numeroUsuario(partida.ganador)}

🔎 Caso:
${caso.titulo}

✅ ¡Encontraste al culpable!

💰 Recompensa:
+100 monedas

⭐ XP:
+50

📖 *Solución:*
${caso.explicacion}

🔓 El grupo volverá a abrirse.`;

  } else {

    texto =
`⏰ *TIEMPO AGOTADO*

🔎 Caso:
${caso.titulo}

❌ Nadie consiguió resolver el misterio.

🕵️ El culpable era:
*${caso.culpable.toUpperCase()}*

📖 *Solución:*
${caso.explicacion}

🔓 El grupo volverá a abrirse.`;

  }


  try {

    await sock.sendMessage(
      chat,
      {
        text: texto,
        mentions:
          partida.ganador
            ? [partida.ganador]
            : []
      }
    );

  } catch (error) {

    console.log(
      "❌ Error enviando resultado:",
      error.message
    );

  }


  // =======================================
  // ABRIR GRUPO
  // =======================================

  if (partida.cerradoPorBot) {

    await abrirGrupo(
      sock,
      chat
    );

  }


  partidas.delete(chat);

}


// =========================================
// 🔎 EJECUTAR MISTERIO
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

  // =======================================
  // COMANDOS RECONOCIDOS
  // =======================================

  const comandos = [
    "detective",
    "misterio",
    "caso",
    "pista",
    "pistas",
    "investigar",
    "culpable"
  ];


  if (!comandos.includes(comando)) {
    return false;
  }


  // =======================================
  // 🔎 SOLO GRUPOS
  // =======================================

  if (!esGrupo) {

    await sock.sendMessage(
      chat,
      {
        text:
`🔎 *MISTERIO / DETECTIVE*

Este juego solo puede jugarse dentro de un grupo.

👥 Usa:
*.detective*`
      }
    );

    return true;
  }


  // =======================================
  // 🕵️ INICIAR DETECTIVE
  // =======================================

  if (
    comando === "detective" ||
    comando === "misterio" ||
    comando === "caso"
  ) {

    // Ya existe una partida
    if (partidas.has(chat)) {

      await sock.sendMessage(
        chat,
        {
          text:
`⚠️ *YA HAY UN CASO EN CURSO*

🔎 Primero deben resolver el misterio actual.

Usa:
*.pistas*

para ver las pistas.`
        }
      );

      return true;
    }


    // =====================================
    // EL BOT DEBE SER ADMIN
    // =====================================

    if (!esAdmin) {

      // Aquí no exigimos que quien escribe
      // sea admin. El bot sí debe ser admin
      // para poder cerrar el grupo.

      try {

        const metadata =
          await sock.groupMetadata(chat);

        const botJid =
          sock.user?.id?.split(":")[0] +
          "@s.whatsapp.net";

        const botParticipante =
          metadata.participants.find(
            p =>
              p.id?.split(":")[0] ===
              botJid.split("@")[0]
          );

        const botEsAdmin =
          botParticipante?.admin === "admin" ||
          botParticipante?.admin === "superadmin";

        if (!botEsAdmin) {

          await sock.sendMessage(
            chat,
            {
              text:
`❌ *NO PUEDO INICIAR EL DETECTIVE*

Necesito ser administrador del grupo para poder cerrar el chat durante el caso.

👑 Haz administrador a TitanBot e inténtalo nuevamente.`
            }
          );

          return true;
        }

      } catch (error) {

        console.log(
          "❌ Error comprobando administrador:",
          error.message
        );

        return true;
      }

    }


    // =====================================
    // ELEGIR CASO
    // =====================================

    const caso =
      casos[
        Math.floor(
          Math.random() * casos.length
        )
      ];


    // =====================================
    // CERRAR GRUPO
    // =====================================

    const cerrado =
      await cerrarGrupo(
        sock,
        chat
      );

    if (!cerrado) {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ No pude cerrar el grupo.

Asegúrate de que TitanBot sea administrador.`
        }
      );

      return true;
    }


    // =====================================
    // CREAR PARTIDA
    // =====================================

    const partida = {

      caso,

      creador: id,

      jugadores: new Set(),

      ganador: null,

      terminada: false,

      cerradoPorBot: true,

      inicio: Date.now(),

      timer: null

    };


    partida.jugadores.add(id);

    partidas.set(
      chat,
      partida
    );


    // =====================================
    // TIMER
    // =====================================

    partida.timer =
      setTimeout(
        async () => {

          const actual =
            partidas.get(chat);

          if (actual) {

            await finalizarPartida(
              sock,
              chat,
              actual,
              "tiempo"
            );

          }

        },
        TIEMPO_CASO
      );


    // =====================================
    // PRESENTAR CASO
    // =====================================

    await sock.sendMessage(
      chat,
      {
        text:
`🔎 *MODO DETECTIVE ACTIVADO*

━━━━━━━━━━━━━━━━━━

${caso.titulo}

📖 *CASO*

${caso.historia}

━━━━━━━━━━━━━━━━━━

👥 *SOSPECHOSOS*

${caso.sospechosos.join("\n")}

━━━━━━━━━━━━━━━━━━

🔒 *EL GRUPO HA SIDO CERRADO*

Ahora comienza la investigación.

🕵️ Analicen el caso.

🔎 Para ver las pistas:
*.pistas*

🔍 Para investigar:
*.investigar*

🎯 Para acusar a alguien:
*.culpable nombre*

⏱️ *Tienen 3 minutos.*

━━━━━━━━━━━━━━━━━━`
      }
    );


    // =====================================
    // PISTAS AUTOMÁTICAS
    // =====================================

    setTimeout(
      async () => {

        const actual =
          partidas.get(chat);

        if (
          actual &&
          !actual.terminada
        ) {

          await enviarPistas(
            sock,
            chat,
            actual
          );

        }

      },
      5000
    );


    return true;
  }


  // =======================================
  // 🔎 PISTAS
  // =======================================

  if (
    comando === "pista" ||
    comando === "pistas"
  ) {

    const partida =
      partidas.get(chat);

    if (!partida) {

      await sock.sendMessage(
        chat,
        {
          text:
`🔎 *NO HAY NINGÚN CASO ACTIVO*

Usa:

*.detective*

para iniciar un nuevo misterio.`
        }
      );

      return true;
    }


    await enviarPistas(
      sock,
      chat,
      partida
    );

    return true;
  }


  // =======================================
  // 🔍 INVESTIGAR
  // =======================================

  if (
    comando === "investigar"
  ) {

    const partida =
      partidas.get(chat);

    if (!partida) {

      await sock.sendMessage(
        chat,
        {
          text:
`🔎 No hay ninguna investigación activa.

Usa:
*.detective*`
        }
      );

      return true;
    }


    const caso =
      partida.caso;


    await sock.sendMessage(
      chat,
      {
        text:
`🕵️ *INVESTIGACIÓN*

🔎 Estás investigando el caso:

*${caso.titulo}*

👀 Observa:

${caso.sospechosos.join("\n")}

💡 Consejo:
Compara las declaraciones de los sospechosos con las pistas.

🎯 Cuando tengas una teoría, utiliza:

*.culpable nombre*`
      }
    );

    return true;
  }


  // =======================================
  // 🎯 ACUSAR
  // =======================================

  if (
    comando === "culpable"
  ) {

    const partida =
      partidas.get(chat);

    if (!partida) {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ No hay ningún caso activo.

Usa:
*.detective*`
        }
      );

      return true;
    }


    if (partida.terminada) {
      return true;
    }


    const respuesta =
      normalizar(
        args.join(" ")
      );


    if (!respuesta) {

      await sock.sendMessage(
        chat,
        {
          text:
`🎯 *ACUSACIÓN*

Debes indicar el nombre del sospechoso.

Ejemplo:

*.culpable Bruno*`
        }
      );

      return true;
    }


    // =====================================
    // COMPROBAR RESPUESTA
    // =====================================

    const culpable =
      normalizar(
        partida.caso.culpable
      );


    if (
      respuesta.includes(culpable)
    ) {

      partida.ganador = id;

      await sock.sendMessage(
        chat,
        {
          text:
`🎯 *ACUSACIÓN RECIBIDA*

🕵️ Detective:
@${numeroUsuario(id)}

🔎 Acusación:
*${args.join(" ")}*

✅ ¡La acusación es correcta!

🏆 Has resuelto el misterio.`,
          mentions: [id]
        }
      );


      await finalizarPartida(
        sock,
        chat,
        partida,
        "resuelto"
      );


    } else {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *ACUSACIÓN INCORRECTA*

@${numeroUsuario(id)}, esa persona no es el culpable.

🔎 El caso continúa.

⚠️ No tendrás otra oportunidad con esta acusación.

Revisa las pistas y vuelve a investigar.`,
          mentions: [id]
        }
      );

    }


    return true;
  }


  return false;

}


// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = ejecutarMisterio;
