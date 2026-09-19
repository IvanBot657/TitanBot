// =========================================
// 👑 TITANBOT - EJÉRCITO DORADO PREMIUM
// ⚔️ SISTEMA COMPLETO DE EJÉRCITO
// =========================================
//
// COMANDOS:
//
// .ejercito
// .tarjetaejercito
// .atacar @usuario
// .defender
// .fortaleza
// .fortaleza mejorar
// .recolectar
// .reclutar
//
// =========================================

const fs = require("fs");
const path = require("path");

// =========================================
// 📁 ARCHIVO DE DATOS
// =========================================

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "ejercitos.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "{}", "utf8");
}

// =========================================
// 💾 CARGAR EJÉRCITOS
// =========================================

function cargarEjercitos() {
  try {
    const contenido =
      fs.readFileSync(DATA_FILE, "utf8");

    if (!contenido.trim()) {
      return {};
    }

    return JSON.parse(contenido);

  } catch (error) {
    console.error(
      "❌ Error cargando ejércitos:",
      error
    );

    return {};
  }
}

// =========================================
// 💾 GUARDAR EJÉRCITOS
// =========================================

function guardarEjercitos(datos) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(datos, null, 2),
      "utf8"
    );

    return true;

  } catch (error) {
    console.error(
      "❌ Error guardando ejércitos:",
      error
    );

    return false;
  }
}

// =========================================
// 👤 OBTENER USUARIO
// =========================================

function obtenerUsuario(msg, id) {
  return (
    msg?.key?.participant ||
    msg?.participant ||
    id ||
    null
  );
}

// =========================================
// 🏷️ MENCIÓN
// =========================================

function mencionar(id) {
  if (!id) {
    return "@usuario";
  }

  return `@${id
    .split("@")[0]
    .split(":")[0]}`;
}

// =========================================
// 💰 FORMATO DE NÚMEROS
// =========================================

function numero(valor) {
  return Number(
    valor || 0
  ).toLocaleString("es-CO");
}

// =========================================
// 👑 CREAR EJÉRCITO
// =========================================

function crearEjercito(
  datos,
  id,
  nombre
) {

  if (!datos[id]) {

    datos[id] = {

      nombre:
        nombre ||
        "Comandante",

      nivel: 1,

      xp: 0,

      oro: 1000,

      unidades: {

        soldados: 20,

        arqueros: 5,

        guardianes: 2,

        caballeria: 0
      },

      generales: 0,

      territorios: 0,

      fortaleza: {

        nivel: 1,

        defensa: 100
      },

      victorias: 0,

      derrotas: 0,

      racha: 0,

      protegido: false,

      proteccionHasta: 0,

      ultimoRecolecta: 0,

      ultimaActividad: null
    };
  }

  const ejercito =
    datos[id];

  // =========================================
  // 🔧 ASEGURAR ESTRUCTURA
  // =========================================

  if (!ejercito.unidades) {

    ejercito.unidades = {
      soldados: 0,
      arqueros: 0,
      guardianes: 0,
      caballeria: 0
    };
  }

  ejercito.unidades.soldados =
    Number(
      ejercito.unidades.soldados || 0
    );

  ejercito.unidades.arqueros =
    Number(
      ejercito.unidades.arqueros || 0
    );

  ejercito.unidades.guardianes =
    Number(
      ejercito.unidades.guardianes || 0
    );

  ejercito.unidades.caballeria =
    Number(
      ejercito.unidades.caballeria || 0
    );

  if (!ejercito.fortaleza) {

    ejercito.fortaleza = {
      nivel: 1,
      defensa: 100
    };
  }

  ejercito.fortaleza.nivel =
    Number(
      ejercito.fortaleza.nivel || 1
    );

  ejercito.fortaleza.defensa =
    Number(
      ejercito.fortaleza.defensa || 100
    );

  ejercito.nombre =
    ejercito.nombre ||
    nombre ||
    "Comandante";

  ejercito.nivel =
    Number(
      ejercito.nivel || 1
    );

  ejercito.xp =
    Number(
      ejercito.xp || 0
    );

  ejercito.oro =
    Number(
      ejercito.oro || 0
    );

  ejercito.generales =
    Number(
      ejercito.generales || 0
    );

  ejercito.territorios =
    Number(
      ejercito.territorios || 0
    );

  ejercito.victorias =
    Number(
      ejercito.victorias || 0
    );

  ejercito.derrotas =
    Number(
      ejercito.derrotas || 0
    );

  ejercito.racha =
    Number(
      ejercito.racha || 0
    );

  ejercito.protegido =
    ejercito.protegido === true;

  ejercito.proteccionHasta =
    Number(
      ejercito.proteccionHasta || 0
    );

  ejercito.ultimoRecolecta =
    Number(
      ejercito.ultimoRecolecta || 0
    );

  return ejercito;
}

// =========================================
// ⚔️ CALCULAR PODER
// =========================================

function calcularPoder(ejercito) {

  const soldados =
    ejercito.unidades.soldados * 2;

  const arqueros =
    ejercito.unidades.arqueros * 4;

  const guardianes =
    ejercito.unidades.guardianes * 8;

  const caballeria =
    ejercito.unidades.caballeria * 12;

  const generales =
    ejercito.generales * 50;

  const fortaleza =
    ejercito.fortaleza.nivel * 100;

  const nivel =
    ejercito.nivel * 25;

  return (
    soldados +
    arqueros +
    guardianes +
    caballeria +
    generales +
    fortaleza +
    nivel
  );
}

// =========================================
// 🪖 TOTAL DE UNIDADES
// =========================================

function totalUnidades(ejercito) {

  return (
    ejercito.unidades.soldados +
    ejercito.unidades.arqueros +
    ejercito.unidades.guardianes +
    ejercito.unidades.caballeria
  );
}

// =========================================
// 🛡️ ACTUALIZAR PROTECCIÓN
// =========================================

function actualizarProteccion(ejercito) {

  if (
    ejercito.protegido &&
    ejercito.proteccionHasta &&
    Date.now() >=
      ejercito.proteccionHasta
  ) {

    ejercito.protegido = false;

    ejercito.proteccionHasta = 0;

    return true;
  }

  return false;
}

// =========================================
// ⚔️ TIPOS DE UNIDADES
// =========================================

const unidades = {

  "1": {

    nombre: "Soldado",

    emoji: "🗡️",

    propiedad: "soldados",

    precio: 50,

    poder: 2
  },

  "2": {

    nombre: "Arquero",

    emoji: "🏹",

    propiedad: "arqueros",

    precio: 100,

    poder: 4
  },

  "3": {

    nombre: "Guardián",

    emoji: "🛡️",

    propiedad: "guardianes",

    precio: 250,

    poder: 8
  },

  "4": {

    nombre: "Caballería",

    emoji: "🐎",

    propiedad: "caballeria",

    precio: 400,

    poder: 12
  }
};

// =========================================
// 🏆 FUNCIÓN PRINCIPAL
// =========================================

async function ejercito(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const comandosValidos = [

    "ejercito",

    "tarjetaejercito",

    "atacar",

    "defender",

    "fortaleza",

    "recolectar",

    "reclutar"
  ];

  if (
    !comandosValidos.includes(comando)
  ) {

    return false;
  }

  // =========================================
  // 👥 SOLO GRUPOS
  // =========================================

  if (
    !chat.endsWith("@g.us")
  ) {

    await sock.sendMessage(chat, {

      text:
        "❌ *Ejército Dorado* solo funciona en grupos."
    });

    return true;
  }

  try {

    // =========================================
    // 👤 USUARIO
    // =========================================

    const usuarioId =
      obtenerUsuario(
        msg,
        id
      );

    if (!usuarioId) {

      await sock.sendMessage(chat, {

        text:
          "❌ No pude identificar al comandante."
      });

      return true;
    }

    // =========================================
    // 💾 DATOS
    // =========================================

    const datos =
      cargarEjercitos();

    const nombre =
      msg?.pushName ||
      "Comandante";

    // =========================================
    // 👑 COMANDANTE
    // =========================================

    const jugador =
      crearEjercito(
        datos,
        usuarioId,
        nombre
      );

    actualizarProteccion(
      jugador
    );

    // =========================================
    // 🏆 .EJERCITO
    // =========================================

    if (
      comando === "ejercito"
    ) {

      const poder =
        calcularPoder(
          jugador
        );

      const total =
        totalUnidades(
          jugador
        );

      guardarEjercitos(
        datos
      );

      await sock.sendMessage(chat, {

        text:
`╔════════════════════════════╗
      🏆 *EJÉRCITO DORADO*
╚════════════════════════════╝

👑 *COMANDANTE*
${jugador.nombre}

━━━━━━━━━━━━━━━━━━━━

⭐ Nivel: *${jugador.nivel}*
✨ XP: *${numero(jugador.xp)}*

⚔️ Poder militar:
*${numero(poder)}*

🪖 Unidades:
*${numero(total)}*

━━━━━━━━━━━━━━━━━━━━

🗡️ Soldados: ${numero(jugador.unidades.soldados)}
🏹 Arqueros: ${numero(jugador.unidades.arqueros)}
🛡️ Guardianes: ${numero(jugador.unidades.guardianes)}
🐎 Caballería: ${numero(jugador.unidades.caballeria)}

━━━━━━━━━━━━━━━━━━━━

💰 Oro:
*${numero(jugador.oro)}*

🏰 Fortaleza:
*Nivel ${jugador.fortaleza.nivel}*

🛡️ Defensa:
*${numero(jugador.fortaleza.defensa)}*

🌎 Territorios:
*${numero(jugador.territorios)}*

━━━━━━━━━━━━━━━━━━━━

🏆 Victorias: ${jugador.victorias}
❌ Derrotas: ${jugador.derrotas}
🔥 Racha: ${jugador.racha}

🛡️ Protección:
${
  jugador.protegido
    ? "🟢 ACTIVA"
    : "🔴 INACTIVA"
}

━━━━━━━━━━━━━━━━━━━━

🃏 Usa:
*.tarjetaejercito*

⚔️ ¡Construye tu imperio!`,

        mentions: [
          usuarioId
        ]
      });

      return true;
    }

    // =========================================
    // 🃏 .TARJETAEJERCITO
    // =========================================

    if (
      comando === "tarjetaejercito"
    ) {

      const poder =
        calcularPoder(
          jugador
        );

      guardarEjercitos(
        datos
      );

      await sock.sendMessage(chat, {

        text:
`━━━〔 🏆 EJÉRCITO DORADO 〕━━━╮
┃
┃ 👑 .ejercito
┃ 🃏 .tarjetaejercito
┃ ⚔️ .atacar @usuario
┃ 🛡️ .defender
┃ 🏰 .fortaleza
┃ 💰 .recolectar
┃ 🪖 .reclutar
┃
╰━━━━━━━━━━━━━━━━━━━━╯

👑 *COMANDANTE*
${jugador.nombre}

⭐ Nivel: ${jugador.nivel}

⚔️ Poder:
*${numero(poder)}*

💰 Oro:
*${numero(jugador.oro)}*

🏰 Fortaleza:
*Nivel ${jugador.fortaleza.nivel}*

🏆 Victorias:
*${jugador.victorias}*

❌ Derrotas:
*${jugador.derrotas}*

━━━━━━━━━━━━━━━━━━━━

🏆 *EJÉRCITO DORADO*

⚔️ Construye
🛡️ Defiende
💰 Recolecta
🏰 Mejora tu fortaleza`,

        mentions: [
          usuarioId
        ]
      });

      return true;
    }

    // =========================================
    // 🛡️ .DEFENDER
    // =========================================

    if (
      comando === "defender"
    ) {

      if (
        jugador.protegido &&
        jugador.proteccionHasta >
          Date.now()
      ) {

        const restante =
          Math.ceil(
            (
              jugador.proteccionHasta -
              Date.now()
            ) / 60000
          );

        await sock.sendMessage(
          chat,
          {

            text:
`🛡️ *DEFENSA ACTIVA*

👑 ${jugador.nombre}

🏰 Tu ejército ya está protegido.

⏳ Tiempo restante:
*${restante} minutos*

⚔️ Los ataques están bloqueados.`
          }
        );

        return true;
      }

      const duracion =
        10 * 60 * 1000;

      jugador.protegido =
        true;

      jugador.proteccionHasta =
        Date.now() +
        duracion;

      guardarEjercitos(
        datos
      );

      await sock.sendMessage(
        chat,
        {

          text:
`🛡️ *DEFENSA ACTIVADA*

👑 ${jugador.nombre}

━━━━━━━━━━━━━━━━━━━━

🏰 Fortaleza protegida.

⏳ Duración:
*10 minutos*

⚔️ Durante este tiempo
no podrán atacarte.

🛡️ ¡Tu ejército está protegido!`,

          mentions: [
            usuarioId
          ]
        }
      );

      return true;
    }

    // =========================================
    // 🏰 .FORTALEZA
    // =========================================

    if (
      comando === "fortaleza"
    ) {

      const accion =
        String(
          args?.[0] || ""
        ).toLowerCase();

      // =========================================
      // 🔧 MEJORAR
      // =========================================

      if (
        accion === "mejorar"
      ) {

        const nivelActual =
          jugador.fortaleza.nivel;

        const costo =
          nivelActual * 500;

        if (
          jugador.oro <
          costo
        ) {

          await sock.sendMessage(
            chat,
            {

              text:
`❌ *ORO INSUFICIENTE*

🏰 Mejora:

Nivel ${nivelActual}
➡️ Nivel ${nivelActual + 1}

💰 Costo:
*${numero(costo)}*

💰 Tu oro:
*${numero(jugador.oro)}*

💡 Usa *.recolectar* para conseguir más oro.`
            }
          );

          return true;
        }

        jugador.oro -=
          costo;

        jugador.fortaleza.nivel++;

        jugador.fortaleza.defensa +=
          50;

        jugador.xp +=
          100;

        jugador.ultimaActividad =
          new Date().toISOString();

        guardarEjercitos(
          datos
        );

        await sock.sendMessage(
          chat,
          {

            text:
`🏰 *¡FORTALEZA MEJORADA!*

👑 ${jugador.nombre}

━━━━━━━━━━━━━━━━━━━━

🏰 Nivel:
${nivelActual} ➡️ *${jugador.fortaleza.nivel}*

🛡️ Defensa:
*${numero(jugador.fortaleza.defensa)}*

✨ XP:
*+100*

💰 Costo:
*${numero(costo)}*

💰 Oro restante:
*${numero(jugador.oro)}*

━━━━━━━━━━━━━━━━━━━━

🏰 ¡Tu fortaleza ha mejorado!`
          }
        );

        return true;
      }

      // =========================================
      // 🏰 MOSTRAR FORTALEZA
      // =========================================

      guardarEjercitos(
        datos
      );

      await sock.sendMessage(
        chat,
        {

          text:
`╔════════════════════════════╗
       🏰 *FORTALEZA*
╚════════════════════════════╝

👑 Comandante:
*${jugador.nombre}*

━━━━━━━━━━━━━━━━━━━━

🏰 Nivel:
*${jugador.fortaleza.nivel}*

🛡️ Defensa:
*${numero(jugador.fortaleza.defensa)}*

💰 Oro:
*${numero(jugador.oro)}*

━━━━━━━━━━━━━━━━━━━━

🔧 *MEJORAR*

Usa:

*.fortaleza mejorar*

💰 Costo:
*${numero(
  jugador.fortaleza.nivel * 500
)} oro*`
        }
      );

      return true;
    }

    // =========================================
    // 💰 .RECOLECTAR
    // =========================================

    if (
      comando === "recolectar"
    ) {

      const ahora =
        Date.now();

      const espera =
        30 * 60 * 1000;

      if (
        jugador.ultimoRecolecta &&
        ahora -
          jugador.ultimoRecolecta <
          espera
      ) {

        const restante =
          espera -
          (
            ahora -
            jugador.ultimoRecolecta
          );

        const minutos =
          Math.ceil(
            restante /
            60000
          );

        await sock.sendMessage(
          chat,
          {

            text:
`⏳ *RECOLECCIÓN EN ESPERA*

👑 ${jugador.nombre}

Ya recolectaste oro.

🕐 Podrás volver a recolectar en:

*${minutos} minutos*

💰 ¡Espera para volver a recoger oro!`
          }
        );

        return true;
      }

      const cantidad =
        300 +
        Math.floor(
          Math.random() * 301
        );

      jugador.oro +=
        cantidad;

      jugador.xp +=
        50;

      jugador.ultimoRecolecta =
        ahora;

      jugador.ultimaActividad =
        new Date().toISOString();

      guardarEjercitos(
        datos
      );

      await sock.sendMessage(
        chat,
        {

          text:
`╔════════════════════════════╗
      💰 *RECOLECCIÓN*
╚════════════════════════════╝

👑 ${jugador.nombre}

━━━━━━━━━━━━━━━━━━━━

💰 Oro obtenido:

*+${numero(cantidad)} 🪙*

💰 Oro total:

*${numero(jugador.oro)} 🪙*

✨ XP obtenida:

*+50 XP*

━━━━━━━━━━━━━━━━━━━━

⏳ Próxima recolección:

*30 minutos*

🏆 ¡Tu tesoro sigue creciendo!`
        }
      );

      return true;
    }

    // =========================================
    // ⚔️ .ATACAR
    // =========================================

    if (
      comando === "atacar"
    ) {

      const menciones =
        msg?.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.mentionedJid || [];

      if (
        !menciones.length
      ) {

        await sock.sendMessage(
          chat,
          {

            text:
`⚔️ *ATAQUE*

Debes mencionar al comandante
que quieres atacar.

📌 Ejemplo:

*.atacar @usuario*`
          }
        );

        return true;
      }

      const enemigoId =
        menciones[0];

      if (
        enemigoId ===
        usuarioId
      ) {

        await sock.sendMessage(
          chat,
          {

            text:
              "❌ No puedes atacar a tu propio ejército."
          }
        );

        return true;
      }

      const enemigo =
        crearEjercito(
          datos,
          enemigoId,
          "Comandante"
        );

      actualizarProteccion(
        enemigo
      );

      // =========================================
      // 🛡️ PROTECCIÓN
      // =========================================

      if (
        enemigo.protegido
      ) {

        const restante =
          Math.max(
            1,
            Math.ceil(
              (
                enemigo.proteccionHasta -
                Date.now()
              ) / 60000
            )
          );

        guardarEjercitos(
          datos
        );

        await sock.sendMessage(
          chat,
          {

            text:
`🛡️ *ATAQUE BLOQUEADO*

👑 @${enemigoId.split("@")[0]}

Este ejército está protegido.

⏳ Protección restante:
*${restante} minutos*

⚔️ No puedes atacar mientras
la defensa esté activa.`,

            mentions: [
              enemigoId
            ]
          }
        );

        return true;
      }

      // =========================================
      // ⚔️ PODERES
      // =========================================

      const poderJugador =
        calcularPoder(
          jugador
        );

      const poderEnemigo =
        calcularPoder(
          enemigo
        );

      // =========================================
      // 🎲 RESULTADO
      // =========================================

      let victoria;

      if (
        poderJugador >
        poderEnemigo
      ) {

        victoria = true;

      } else if (
        poderJugador <
        poderEnemigo
      ) {

        victoria = false;

      } else {

        victoria =
          Math.random() >=
          0.5;
      }
      
      // =========================================
    // 🏆 VICTORIA
    // =========================================

if (victoria) {

  jugador.victorias++;
  jugador.racha++;

  enemigo.derrotas++;
  enemigo.racha = 0;

  const recompensa =
    Math.min(
      300,
      Math.max(
        100,
        Math.floor(
          enemigo.oro * 0.15
        )
      )
    );

  enemigo.oro =
    Math.max(
      0,
      enemigo.oro - recompensa
    );

  jugador.oro += recompensa;
  jugador.xp += 150;

  jugador.ultimaActividad =
    new Date().toISOString();

  guardarEjercitos(datos);

  await sock.sendMessage(chat, {

    text:
`🏆 *¡VICTORIA!*

⚔️ *BATALLA FINALIZADA*

👑 ${jugador.nombre}
⚔️ Poder: *${numero(poderJugador)}*

🆚

👑 @${enemigoId.split("@")[0]}
⚔️ Poder: *${numero(poderEnemigo)}*

━━━━━━━━━━━━━━━━━━━━

🏆 *VICTORIA*

💰 Recompensa:
*+${numero(recompensa)} oro*

✨ XP:
*+150*

🔥 Racha:
*${jugador.racha}*

━━━━━━━━━━━━━━━━━━━━

⚔️ ¡Tu ejército ha vencido!`,

    mentions: [
      enemigoId
    ]
  });

  return true;
}

// =========================================
// 🛡️ DERROTA
// =========================================

jugador.derrotas++;
jugador.racha = 0;

enemigo.victorias++;
enemigo.racha++;

jugador.xp += 50;

jugador.ultimaActividad =
  new Date().toISOString();

guardarEjercitos(datos);

await sock.sendMessage(chat, {

  text:
`🛡️ *¡ATAQUE RECHAZADO!*

⚔️ *BATALLA FINALIZADA*

👑 ${jugador.nombre}
⚔️ Poder: *${numero(poderJugador)}*

🆚

👑 @${enemigoId.split("@")[0]}
⚔️ Poder: *${numero(poderEnemigo)}*

━━━━━━━━━━━━━━━━━━━━

🛡️ *DEFENSOR*

${enemigo.nombre}

❌ El ataque fue rechazado.

✨ XP:
*+50*

━━━━━━━━━━━━━━━━━━━━

⚔️ ¡Entrena más a tu ejército!`,

  mentions: [
    enemigoId
  ]
});

return true;


// =========================================
// 🪖 .RECLUTAR
// =========================================

if (comando === "reclutar") {

  if (!args || args.length === 0) {

    await sock.sendMessage(chat, {

      text:
`╔════════════════════════════╗
      ⚔️ *RECLUTAMIENTO*
         💎 *PREMIUM*
╚════════════════════════════╝

👑 Comandante:
${mencionar(usuarioId)}

🪙 Oro disponible:
*${numero(jugador.oro)}*

━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 🗡️ *SOLDADO*
💰 Precio: *50 🪙*
⚔️ Poder: *+2*

2️⃣ 🏹 *ARQUERO*
💰 Precio: *100 🪙*
⚔️ Poder: *+4*

3️⃣ 🛡️ *GUARDIÁN*
💰 Precio: *250 🪙*
⚔️ Poder: *+8*

4️⃣ 🐎 *CABALLERÍA*
💰 Precio: *400 🪙*
⚔️ Poder: *+12*

━━━━━━━━━━━━━━━━━━━━━━

📌 *FORMA DE USO*

*.reclutar 1 10*
➡️ 10 soldados

*.reclutar 2 5*
➡️ 5 arqueros

*.reclutar 3 2*
➡️ 2 guardianes

*.reclutar 4 1*
➡️ 1 caballería

━━━━━━━━━━━━━━━━━━━━━━

🔥 ¡Construye tu Ejército Dorado!`,

      mentions: [
        usuarioId
      ]
    });

    return true;
  }

  const tipo =
    String(args[0]);

  if (!unidades[tipo]) {

    await sock.sendMessage(chat, {

      text:
`❌ *TIPO DE UNIDAD INVÁLIDO*

Usa:

1️⃣ Soldado
2️⃣ Arquero
3️⃣ Guardián
4️⃣ Caballería

Ejemplo:

*.reclutar 1 10*`
    });

    return true;
  }

  const cantidad =
    Number(args[1]);

  if (
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {

    await sock.sendMessage(chat, {

      text:
`❌ *CANTIDAD INVÁLIDA*

Debes indicar una cantidad
entera mayor que 0.

Ejemplo:

*.reclutar 1 10*`
    });

    return true;
  }

  if (cantidad > 1000) {

    await sock.sendMessage(chat, {

      text:
`❌ *CANTIDAD DEMASIADO ALTA*

El máximo por reclutamiento
es de *1,000 unidades*.`
    });

    return true;
  }

  const unidad =
    unidades[tipo];

  const costo =
    unidad.precio * cantidad;

  if (jugador.oro < costo) {

    const falta =
      costo - jugador.oro;

    await sock.sendMessage(chat, {

      text:
`❌ *ORO INSUFICIENTE*

👑 Comandante:
${mencionar(usuarioId)}

🪙 Oro disponible:
*${numero(jugador.oro)}*

💰 Necesitas:
*${numero(costo)}*

📉 Te faltan:
*${numero(falta)}*

💡 Usa *.recolectar* para conseguir más oro.`,

      mentions: [
        usuarioId
      ]
    });

    return true;
  }

  const poderAntes =
    calcularPoder(jugador);

  jugador.oro -= costo;

  jugador.unidades[
    unidad.propiedad
  ] += cantidad;

  jugador.poder =
    calcularPoder(jugador);

  const poderDespues =
    jugador.poder;

  const aumentoPoder =
    poderDespues - poderAntes;

  jugador.ultimaActividad =
    new Date().toISOString();

  guardarEjercitos(datos);

  const totalUnidad =
    jugador.unidades[
      unidad.propiedad
    ];

  await sock.sendMessage(chat, {

    text:
`╔════════════════════════════╗
       ⚔️ *RECLUTAMIENTO*
          COMPLETADO
╚════════════════════════════╝

👑 *COMANDANTE*

${mencionar(usuarioId)}

━━━━━━━━━━━━━━━━━━━━━━

${unidad.emoji} *¡NUEVAS TROPAS!*

🎖️ Unidad:
*${unidad.nombre}*

👥 Cantidad:
*${numero(cantidad)}*

💰 Costo:
*${numero(costo)} 🪙*

━━━━━━━━━━━━━━━━━━━━━━

📊 *ACTUALIZACIÓN*

${unidad.emoji} ${unidad.nombre}s:
*${numero(totalUnidad)}*

⚔️ Poder anterior:
*${numero(poderAntes)}*

🔥 Poder actual:
*${numero(poderDespues)}*

📈 Aumento:
*+${numero(aumentoPoder)}*

🪙 Oro restante:
*${numero(jugador.oro)}*

━━━━━━━━━━━━━━━━━━━━━━

👑 *¡Tus tropas están listas!*`,

    mentions: [
      usuarioId
    ]
  });

  return true;
}

return false;

} catch (error) {

  console.error(
    "❌ Error en Ejército Dorado:",
    error
  );

  await sock.sendMessage(chat, {

    text:
      "❌ Ocurrió un error en el sistema de Ejército Dorado."
  });

  return true;
  }

}

// =========================================
// 📤 EXPORTAR
// =========================================

}

module.exports = ejercito;
