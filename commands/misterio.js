// =========================================
// 🔎 TITANBOT - SISTEMA DE MISTERIO / DETECTIVE
// =========================================

const casos = [
  {
    titulo: "El misterio de la habitación cerrada",
    historia:
      "Una persona desapareció de una habitación que estaba cerrada. No había señales de entrada forzada.",
    sospechosos: [
      "El jardinero",
      "La encargada de limpieza",
      "El guardia",
      "El vecino"
    ],
    pistas: [
      "La puerta estaba cerrada desde dentro.",
      "Había huellas de barro cerca de una ventana.",
      "El jardinero había estado trabajando afuera.",
      "La ventana estaba ligeramente abierta."
    ],
    solucion: "El jardinero"
  },

  {
    titulo: "El misterio del reloj detenido",
    historia:
      "Un reloj de una casa dejó de funcionar exactamente cuando ocurrió el misterio.",
    sospechosos: [
      "El hermano",
      "La visitante",
      "El mayordomo",
      "El vecino"
    ],
    pistas: [
      "El reloj no tenía batería.",
      "Alguien había movido el reloj recientemente.",
      "La visitante fue la última persona en entrar.",
      "Había polvo alrededor del lugar donde estaba el reloj."
    ],
    solucion: "La visitante"
  },

  {
    titulo: "El misterio del laboratorio",
    historia:
      "Una caja importante desapareció de un laboratorio durante una breve interrupción de energía.",
    sospechosos: [
      "El científico",
      "El asistente",
      "El guardia",
      "El técnico"
    ],
    pistas: [
      "La interrupción duró menos de un minuto.",
      "La cámara dejó de funcionar durante la interrupción.",
      "El técnico conocía el sistema eléctrico.",
      "Se encontró una herramienta junto a la puerta."
    ],
    solucion: "El técnico"
  },

  {
    titulo: "El misterio de la biblioteca",
    historia:
      "Un libro desapareció de una biblioteca sin que nadie viera salir a nadie con él.",
    sospechosos: [
      "El estudiante",
      "El bibliotecario",
      "El profesor",
      "El visitante"
    ],
    pistas: [
      "La biblioteca tenía una puerta trasera.",
      "El bibliotecario tenía acceso a todas las llaves.",
      "El libro estaba registrado como prestado.",
      "El registro fue modificado poco antes de la desaparición."
    ],
    solucion: "El bibliotecario"
  }
];

// =========================================
// 🎯 CASOS ACTIVOS
// =========================================

const misteriosActivos = new Map();

// =========================================
// 🔧 UTILIDADES
// =========================================

function obtenerNumero(jid) {
  if (!jid) return "Usuario";

  return jid
    .split("@")[0]
    .replace(":0", "");
}

function obtenerMenciones(texto = "") {
  const encontrados = texto.match(/@\d{5,20}/g);

  if (!encontrados) return [];

  return encontrados.map(numero => {
    return numero.replace("@", "") + "@s.whatsapp.net";
  });
}

function elegirCaso() {
  return casos[Math.floor(Math.random() * casos.length)];
}

function crearEstado(caso) {
  return {
    activo: true,
    fase: "esperando",
    caso,
    detectives: [],
    indicePista: 0,
    iniciador: null
  };
}

function esAdministrador(participants, id) {
  const participante = participants.find(
    p =>
      p.id === id ||
      p.jid === id ||
      p.participant === id
  );

  return !!(
    participante &&
    (
      participante.admin === "admin" ||
      participante.admin === "superadmin" ||
      participante.isAdmin === true
    )
  );
}

async function obtenerMetadatosGrupo(sock, chat) {
  try {
    return await sock.groupMetadata(chat);
  } catch (error) {
    console.error("❌ Error obteniendo metadatos:", error);
    return null;
  }
}

async function enviar(sock, chat, texto, msg, mentions = []) {
  return await sock.sendMessage(
    chat,
    {
      text: texto,
      mentions
    },
    {
      quoted: msg
    }
  );
}

// =========================================
// 🔒 CERRAR GRUPO
// =========================================

async function cerrarGrupo(sock, chat) {
  try {
    await sock.groupSettingUpdate(chat, "announcement");
    return true;
  } catch (error) {
    console.error("❌ No se pudo cerrar el grupo:", error);
    return false;
  }
}

// =========================================
// 🔓 ABRIR GRUPO
// =========================================

async function abrirGrupo(sock, chat) {
  try {
    await sock.groupSettingUpdate(chat, "not_announcement");
    return true;
  } catch (error) {
    console.error("❌ No se pudo abrir el grupo:", error);
    return false;
  }
}

// =========================================
// 👑 PROMOVER DETECTIVES
// =========================================

async function promoverDetective(sock, chat, jid) {
  try {
    await sock.groupParticipantsUpdate(
      chat,
      [jid],
      "promote"
    );

    return true;
  } catch (error) {
    console.error(
      `❌ No se pudo promover a ${jid}:`,
      error
    );

    return false;
  }
}

// =========================================
// 🚫 EXPULSAR DETECTIVE / SOSPECHOSO
// =========================================

async function expulsarUsuario(sock, chat, jid) {
  try {
    await sock.groupParticipantsUpdate(
      chat,
      [jid],
      "remove"
    );

    return true;
  } catch (error) {
    console.error(
      `❌ No se pudo expulsar a ${jid}:`,
      error
    );

    return false;
  }
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
  msg
) {

  // =====================================
  // 🔎 .MISTERIO
  // =====================================

  if (comando === "misterio") {

    const estado = misteriosActivos.get(chat);

    if (estado?.activo) {
      await enviar(
        sock,
        chat,
        "⚠️ Ya hay un misterio activo en este grupo.\n\nUsa *.terminamos* cuando termine.",
        msg
      );

      return true;
    }

    const caso = elegirCaso();

    const nuevoEstado = crearEstado(caso);
    nuevoEstado.iniciador = id;

    misteriosActivos.set(chat, nuevoEstado);

    await enviar(
      sock,
      chat,
`🔎 *MISTERIO INICIADO*

🧩 *${caso.titulo}*

${caso.historia}

👑 Los administradores deben elegir a los detectives.

📌 Para comenzar:
*.detective*

⚠️ Solo los administradores podrán controlar el misterio.

Cuando termine la investigación:
*.terminamos*`,
      msg
    );

    return true;
  }

  // =====================================
  // 🕵️ .DETECTIVE
  // =====================================

  if (comando === "detective") {

    const metadata = await obtenerMetadatosGrupo(
      sock,
      chat
    );

    if (!metadata) {
      await enviar(
        sock,
        chat,
        "❌ No pude obtener la información del grupo.",
        msg
      );

      return true;
    }

    if (
      !esAdministrador(
        metadata.participants || [],
        id
      )
    ) {
      await enviar(
        sock,
        chat,
        "🚫 Este comando solamente puede utilizarlo un administrador.",
        msg
      );

      return true;
    }

    let estado = misteriosActivos.get(chat);

    if (!estado?.activo) {

      const caso = elegirCaso();

      estado = crearEstado(caso);
      estado.iniciador = id;

      misteriosActivos.set(chat, estado);
    }

    estado.fase = "seleccion";

    const cerrado = await cerrarGrupo(
      sock,
      chat
    );

    let texto =
`🔎 *MODO DETECTIVE ACTIVADO*

🧩 *${estado.caso.titulo}*

${estado.caso.historia}

👑 *ADMINISTRADORES*

Solo los administradores pueden enviar mensajes durante la selección.

👥 *¿QUIÉNES RESOLVERÁN EL MISTERIO?*

Menciona a los jugadores utilizando:

@usuario @usuario @usuario

Los usuarios mencionados serán registrados como detectives.`;

    if (!cerrado) {
      texto +=
        "\n\n⚠️ No pude cerrar el grupo. Verifica que TitanBot sea administrador.";
    }

    await enviar(
      sock,
      chat,
      texto,
      msg
    );

    return true;
  }

  // =====================================
  // 👤 REGISTRAR DETECTIVES
  // =====================================

  if (
    comando === "detective" &&
    args.length > 0
  ) {

    const estado = misteriosActivos.get(chat);

    if (!estado?.activo) {
      return true;
    }
  }

  // =====================================
  // 🔍 .INVESTIGAR
  // =====================================

  if (comando === "investigar") {

    const estado = misteriosActivos.get(chat);

    if (!estado?.activo) {
      await enviar(
        sock,
        chat,
        "❌ No hay ningún misterio activo.\n\nUsa *.misterio* para comenzar.",
        msg
      );

      return true;
    }

    if (estado.fase === "esperando") {
      await enviar(
        sock,
        chat,
        "⚠️ Primero inicia el modo detective con *.detective*.",
        msg
      );

      return true;
    }

    if (estado.indicePista >= estado.caso.pistas.length) {
      await enviar(
        sock,
        chat,
        "🔎 Ya se han descubierto todas las pistas.\n\nEs momento de decidir al sospechoso.",
        msg
      );

      return true;
    }

    const pista =
      estado.caso.pistas[
        estado.indicePista
      ];

    estado.indicePista++;

    await enviar(
      sock,
      chat,
`🔍 *INVESTIGACIÓN*

🧩 Caso:
*${estado.caso.titulo}*

💡 *Pista ${estado.indicePista}/${estado.caso.pistas.length}:*

${pista}

🔎 Continúa investigando con:
*.investigar*`,
      msg
    );

    return true;
  }

  // =====================================
  // 💡 .PISTA
  // =====================================

  if (comando === "pista") {

    const estado = misteriosActivos.get(chat);

    if (!estado?.activo) {
      await enviar(
        sock,
        chat,
        "❌ No hay un misterio activo.",
        msg
      );

      return true;
    }

    if (estado.indicePista === 0) {
      await enviar(
        sock,
        chat,
        "💡 Todavía no has descubierto ninguna pista.\n\nUsa *.investigar*.",
        msg
      );

      return true;
    }

    const ultimaPista =
      estado.caso.pistas[
        estado.indicePista - 1
      ];

    await enviar(
      sock,
      chat,
`💡 *ÚLTIMA PISTA*

${ultimaPista}

🧩 Pistas descubiertas:
*${estado.indicePista}/${estado.caso.pistas.length}*`,
      msg
    );

    return true;
  }

  // =====================================
  // 👤 .SOSPECHOSO
  // =====================================

  if (comando === "sospechoso") {

    const estado = misteriosActivos.get(chat);

    if (!estado?.activo) {
      await enviar(
        sock,
        chat,
        "❌ No hay un misterio activo.",
        msg
      );

      return true;
    }

    const lista =
      estado.caso.sospechosos
        .map(
          (nombre, index) =>
            `${index + 1}. 👤 ${nombre}`
        )
        .join("\n");

    await enviar(
      sock,
      chat,
`👤 *SOSPECHOSOS*

${lista}

🔎 Investiga las pistas antes de decidir.`,
      msg
    );

    return true;
  }

  // =====================================
  // 🧩 .CASO
  // =====================================

  if (comando === "caso") {

    const estado = misteriosActivos.get(chat);

    if (!estado?.activo) {
      await enviar(
        sock,
        chat,
        "❌ No hay un caso activo.\n\nUsa *.misterio*.",
        msg
      );

      return true;
    }

    await enviar(
      sock,
      chat,
`🧩 *CASO ACTUAL*

🔎 *${estado.caso.titulo}*

${estado.caso.historia}

👤 Usa *.sospechoso* para ver los sospechosos.

💡 Usa *.investigar* para descubrir pistas.`,
      msg
    );

    return true;
  }

  // =====================================
  // 🧠 .ACERTIJO
  // =====================================

  if (comando === "acertijo") {

    const acertijos = [
      {
        pregunta:
          "Tengo ciudades pero no casas, tengo montañas pero no árboles. ¿Qué soy?",
        respuesta: "Un mapa"
      },
      {
        pregunta:
          "Cuanto más quitas, más grande se vuelve. ¿Qué es?",
        respuesta: "Un agujero"
      },
      {
        pregunta:
          "Tiene agujas pero no puede coser. ¿Qué es?",
        respuesta: "Un reloj"
      },
      {
        pregunta:
          "Vuelo sin alas y lloro sin ojos. ¿Qué soy?",
        respuesta: "Una nube"
      },
      {
        pregunta:
          "Siempre está delante de ti, pero nunca puedes verlo. ¿Qué es?",
        respuesta: "El futuro"
      }
    ];

    const acertijo =
      acertijos[
        Math.floor(
          Math.random() * acertijos.length
        )
      ];

    await enviar(
      sock,
      chat,
`🧠 *ACERTIJO*

❓ ${acertijo.pregunta}

💭 Piensa tu respuesta...`,
      msg
    );

    return true;
  }

  // =====================================
  // 🧩 .ENIGMAS
  // =====================================

  if (comando === "enigmas") {

    await enviar(
      sock,
      chat,
`🧩 *ENIGMAS DE TITANBOT*

1️⃣ El misterio de la habitación cerrada
2️⃣ El reloj detenido
3️⃣ El laboratorio
4️⃣ La biblioteca

🔎 Para iniciar uno:
*.misterio*

🧠 Para un acertijo:
*.acertijo*`,
      msg
    );

    return true;
  }

  // =====================================
  // 🔚 .TERMINAMOS
  // =====================================

  if (comando === "terminamos") {

    const metadata =
      await obtenerMetadatosGrupo(
        sock,
        chat
      );

    if (!metadata) {
      await enviar(
        sock,
        chat,
        "❌ No pude obtener la información del grupo.",
        msg
      );

      return true;
    }

    if (
      !esAdministrador(
        metadata.participants || [],
        id
      )
    ) {
      await enviar(
        sock,
        chat,
        "🚫 Solo un administrador puede terminar el misterio.",
        msg
      );

      return true;
    }

    const estado =
      misteriosActivos.get(chat);

    if (!estado?.activo) {
      await enviar(
        sock,
        chat,
        "❌ No hay ningún misterio activo.",
        msg
      );

      return true;
    }

    const sospechoso =
      estado.caso.solucion;

    await enviar(
      sock,
      chat,
`🚨 *MISTERIO TERMINADO*

🧩 Caso:
*${estado.caso.titulo}*

👤 Sospechoso final:
*${sospechoso}*

🔎 Los detectives deben comprobar quién corresponde al sospechoso.

📌 Si el sospechoso es un participante del grupo, un administrador puede expulsarlo manualmente.

🔓 Después se volverá a abrir el grupo.

✨ *CASI RESULTÓ...*`,
      msg
    );

    await abrirGrupo(
      sock,
      chat
    );

    estado.activo = false;
    estado.fase = "terminado";

    misteriosActivos.delete(chat);

    await enviar(
      sock,
      chat,
`🔓 *MISTERIO FINALIZADO*

El grupo vuelve a estar abierto.

🕵️ Gracias, detectives.

🔎 *CASI RESULTÓ...*`,
      msg
    );

    return true;
  }

  // =====================================
  // ❌ NO ENCONTRADO
  // =====================================

  return false;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = ejecutarMisterio;
