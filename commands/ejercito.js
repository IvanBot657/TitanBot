// =========================================
// 🏆 TITANBOT - EJÉRCITO DORADO
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
// 💾 CARGAR DATOS
// =========================================

function cargarEjercitos() {
  try {
    return JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );
  } catch (error) {
    console.error(
      "❌ Error cargando ejercitos.json:",
      error
    );

    return {};
  }
}

// =========================================
// 💾 GUARDAR DATOS
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
      "❌ Error guardando ejercitos.json:",
      error
    );

    return false;
  }
}

// =========================================
// 🔢 FORMATO DE NÚMEROS
// =========================================

function numero(valor) {
  return Number(valor || 0).toLocaleString("es-CO");
}

// =========================================
// 👤 MENCIÓN
// =========================================

function mencionar(jid) {
  return `@${String(jid).split("@")[0]}`;
}

// =========================================
// 👑 OBTENER / CREAR EJÉRCITO
// =========================================

function obtenerUsuario(datos, jid) {
  if (!datos[jid]) {
    datos[jid] = {
      nombre: "Comandante",
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

      ultimaActividad: null
    };
  }

  const jugador = datos[jid];

  jugador.nombre ||= "Comandante";
  jugador.nivel ||= 1;
  jugador.xp ||= 0;
  jugador.oro ||= 0;

  jugador.generales ||= 0;
  jugador.territorios ||= 0;

  jugador.victorias ||= 0;
  jugador.derrotas ||= 0;
  jugador.racha ||= 0;

  jugador.protegido ||= false;
  jugador.proteccionHasta ||= 0;

  jugador.unidades ||= {};

  jugador.unidades.soldados ||= 0;
  jugador.unidades.arqueros ||= 0;
  jugador.unidades.guardianes ||= 0;
  jugador.unidades.caballeria ||= 0;

  jugador.fortaleza ||= {};

  jugador.fortaleza.nivel ||= 1;
  jugador.fortaleza.defensa ||= 100;

  return jugador;
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
// ⚔️ CALCULAR PODER
// =========================================

function calcularPoder(jugador) {
  return (
    (jugador.unidades?.soldados || 0) * 2 +
    (jugador.unidades?.arqueros || 0) * 4 +
    (jugador.unidades?.guardianes || 0) * 8 +
    (jugador.unidades?.caballeria || 0) * 12 +
    (jugador.generales || 0) * 50 +
    (jugador.fortaleza?.nivel || 1) * 100 +
    (jugador.nivel || 1) * 25
  );
}

// =========================================
// ⭐ SUBIR NIVEL
// =========================================

function subirNivel(jugador) {
  while (
    jugador.xp >= jugador.nivel * 500
  ) {
    jugador.xp -= jugador.nivel * 500;
    jugador.nivel++;
  }
}

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
    "reclutar",
    "atacar",
    "defender",
    "fortaleza",
    "entrenar"
  ];

  if (!comandosValidos.includes(comando)) {
    return false;
  }

  try {
    const datos = cargarEjercitos();

    const usuarioId =
      id ||
      msg?.key?.participant ||
      msg?.participant ||
      msg?.key?.remoteJid;

    if (!usuarioId) {
      return false;
    }

    const jugador = obtenerUsuario(
      datos,
      usuarioId
    );

    // =========================================
    // 🏆 .EJERCITO
    // =========================================

    if (comando === "ejercito") {
      const poder = calcularPoder(jugador);

      await sock.sendMessage(chat, {
        text:
`╔════════════════════════════╗
       🏆 *EJÉRCITO DORADO*
╚════════════════════════════╝

👑 *COMANDANTE*

${mencionar(usuarioId)}

⭐ Nivel:
*${numero(jugador.nivel)}*

✨ XP:
*${numero(jugador.xp)}*

💰 Oro:
*${numero(jugador.oro)} 🪙*

━━━━━━━━━━━━━━━━━━━━

⚔️ *PODER MILITAR*

🔥 Poder:
*${numero(poder)}*

━━━━━━━━━━━━━━━━━━━━

🪖 *TROPAS*

🗡️ Soldados:
*${numero(jugador.unidades.soldados)}*

🏹 Arqueros:
*${numero(jugador.unidades.arqueros)}*

🛡️ Guardianes:
*${numero(jugador.unidades.guardianes)}*

🐎 Caballería:
*${numero(jugador.unidades.caballeria)}*

━━━━━━━━━━━━━━━━━━━━

👑 Generales:
*${numero(jugador.generales)}*

🌎 Territorios:
*${numero(jugador.territorios)}*

━━━━━━━━━━━━━━━━━━━━

🏰 *FORTALEZA*

🏰 Nivel:
*${numero(jugador.fortaleza.nivel)}*

🛡️ Defensa:
*${numero(jugador.fortaleza.defensa)}*

━━━━━━━━━━━━━━━━━━━━

⚔️ *HISTORIAL*

🏆 Victorias:
*${numero(jugador.victorias)}*

💢 Derrotas:
*${numero(jugador.derrotas)}*

🔥 Racha:
*${numero(jugador.racha)}*`,

        mentions: [usuarioId]
      });

      guardarEjercitos(datos);

      return true;
    }

    // =========================================
    // 🪖 .RECLUTAR
    // =========================================

    if (comando === "reclutar") {

      if (!args || args.length === 0) {
        await sock.sendMessage(chat, {
          text:
`╔════════════════════════════╗
       🪖 *RECLUTAMIENTO*
╚════════════════════════════╝

👑 Comandante:

${mencionar(usuarioId)}

🪙 Oro disponible:

*${numero(jugador.oro)}*

━━━━━━━━━━━━━━━━━━━━

1️⃣ 🗡️ *SOLDADO*
💰 50 🪙
⚔️ +2 poder

━━━━━━━━━━━━━━━━━━━━

2️⃣ 🏹 *ARQUERO*
💰 100 🪙
⚔️ +4 poder

━━━━━━━━━━━━━━━━━━━━

3️⃣ 🛡️ *GUARDIÁN*
💰 250 🪙
⚔️ +8 poder

━━━━━━━━━━━━━━━━━━━━

4️⃣ 🐎 *CABALLERÍA*
💰 400 🪙
⚔️ +12 poder

━━━━━━━━━━━━━━━━━━━━

📌 *USO*

.reclutar 1 10

.reclutar 2 5

.reclutar 3 2

.reclutar 4 1`,

          mentions: [usuarioId]
        });

        return true;
      }

      const tipo = String(args[0]);

      if (!unidades[tipo]) {
        await sock.sendMessage(chat, {
          text:
`❌ *UNIDAD INVÁLIDA*

Elige:

1️⃣ Soldado
2️⃣ Arquero
3️⃣ Guardián
4️⃣ Caballería

Ejemplo:

*.reclutar 1 10*`
        });

        return true;
      }

      const cantidad = Number(args[1]);

      if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        await sock.sendMessage(chat, {
          text:
`❌ *CANTIDAD INVÁLIDA*

Debes escribir una cantidad
mayor que 0.

Ejemplo:

*.reclutar 1 10*`
        });

        return true;
      }

      if (cantidad > 1000) {
        await sock.sendMessage(chat, {
          text:
`❌ *LÍMITE EXCEDIDO*

Máximo:

*1,000 unidades* por comando.`
        });

        return true;
      }

      const unidad = unidades[tipo];

      const costo =
        unidad.precio * cantidad;

      if (jugador.oro < costo) {
        const falta =
          costo - jugador.oro;

        await sock.sendMessage(chat, {
          text:
`❌ *ORO INSUFICIENTE*

🪙 Disponible:
*${numero(jugador.oro)}*

💰 Costo:
*${numero(costo)}*

📉 Falta:
*${numero(falta)} 🪙*`
        });

        return true;
      }

      const poderAntes =
        calcularPoder(jugador);

      jugador.oro -= costo;

      jugador.unidades[
        unidad.propiedad
      ] += cantidad;

      const poderDespues =
        calcularPoder(jugador);

      jugador.xp += cantidad * 2;

      subirNivel(jugador);

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
      🪖 *RECLUTAMIENTO*
         COMPLETADO
╚════════════════════════════╝

👑 ${mencionar(usuarioId)}

${unidad.emoji} *${unidad.nombre}*

👥 Reclutados:
*${numero(cantidad)}*

💰 Costo:
*${numero(costo)} 🪙*

━━━━━━━━━━━━━━━━━━━━

📊 *ACTUALIZACIÓN*

${unidad.emoji} Total:
*${numero(totalUnidad)}*

⚔️ Poder:
*${numero(poderAntes)} ➜ ${numero(poderDespues)}*

📈 Aumento:
*+${numero(
  poderDespues - poderAntes
)}*

✨ XP:
*+${numero(cantidad * 2)}*

━━━━━━━━━━━━━━━━━━━━

🪙 Oro restante:
*${numero(jugador.oro)}*

🏆 ¡Tus tropas están listas!`,

        mentions: [usuarioId]
      });

      return true;
    }

    // =========================================
    // ⚔️ .ATACAR
    // =========================================

    if (comando === "atacar") {

      const mencionados =
        msg
          ?.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.mentionedJid || [];

      if (mencionados.length === 0) {
        await sock.sendMessage(chat, {
          text:
`❌ *DEBES MENCIONAR A UN COMANDANTE*

Ejemplo:

*.atacar @usuario*`
        });

        return true;
      }

      const enemigoId =
        mencionados[0];

      if (enemigoId === usuarioId) {
        await sock.sendMessage(chat, {
          text:
            "❌ No puedes atacar a tu propio ejército."
        });

        return true;
      }

      const enemigo =
        obtenerUsuario(
          datos,
          enemigoId
        );

      // -----------------------------------------
      // 🛡️ PROTECCIÓN
      // -----------------------------------------

      if (
        enemigo.protegido &&
        Date.now() <
        enemigo.proteccionHasta
      ) {
        const minutos =
          Math.ceil(
            (
              enemigo.proteccionHasta -
              Date.now()
            ) / 60000
          );

        await sock.sendMessage(chat, {
          text:
`🛡️ *EJÉRCITO PROTEGIDO*

👑 ${mencionar(enemigoId)}

⏳ Protección restante:

*${minutos} minuto(s)*`,

          mentions: [enemigoId]
        });

        return true;
      }

      enemigo.protegido = false;
      enemigo.proteccionHasta = 0;

      const poderJugador =
        calcularPoder(jugador);

      const poderEnemigo =
        calcularPoder(enemigo);

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
          Math.random() < 0.5;
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
                (enemigo.oro || 0) * 0.15
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

        subirNivel(jugador);

        jugador.ultimaActividad =
          new Date().toISOString();

        guardarEjercitos(datos);

        await sock.sendMessage(chat, {
          text:
`🏆 *¡VICTORIA!*

⚔️ *BATALLA FINALIZADA*

👑 ${mencionar(usuarioId)}

⚔️ Poder:
*${numero(poderJugador)}*

🆚

👑 ${mencionar(enemigoId)}

⚔️ Poder:
*${numero(poderEnemigo)}*

━━━━━━━━━━━━━━━━━━━━

🏆 *VICTORIA*

💰 Recompensa:
*+${numero(recompensa)} 🪙*

✨ XP:
*+150*

🔥 Racha:
*${numero(jugador.racha)}*

━━━━━━━━━━━━━━━━━━━━

⚔️ ¡Tu ejército ha vencido!`,

          mentions: [
            usuarioId,
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

      subirNivel(jugador);

      jugador.ultimaActividad =
        new Date().toISOString();

      guardarEjercitos(datos);

      await sock.sendMessage(chat, {
        text:
`🛡️ *¡ATAQUE RECHAZADO!*

⚔️ *BATALLA FINALIZADA*

👑 ${mencionar(usuarioId)}

⚔️ Poder:
*${numero(poderJugador)}*

🆚

👑 ${mencionar(enemigoId)}

⚔️ Poder:
*${numero(poderEnemigo)}*

━━━━━━━━━━━━━━━━━━━━

🛡️ *DEFENSOR*

${mencionar(enemigoId)}

❌ El ataque fue rechazado.

✨ XP obtenido:

*+50*

🔥 Racha defensiva:
*${numero(enemigo.racha)}*`,

        mentions: [
          usuarioId,
          enemigoId
        ]
      });

      return true;
    }

    // =========================================
    // 🛡️ .DEFENDER
    // =========================================

    if (comando === "defender") {

      const duracion =
        10 * 60 * 1000;

      jugador.protegido = true;

      jugador.proteccionHasta =
        Date.now() + duracion;

      jugador.ultimaActividad =
        new Date().toISOString();

      guardarEjercitos(datos);

      await sock.sendMessage(chat, {
        text:
`╔════════════════════════════╗
        🛡️ *DEFENSA*
          ACTIVADA
╚════════════════════════════╝

👑 Comandante:

${mencionar(usuarioId)}

━━━━━━━━━━━━━━━━━━━━

🛡️ Protección:
*ACTIVA*

⏳ Duración:
*10 minutos*

━━━━━━━━━━━━━━━━━━━━

⚔️ Durante este tiempo
ningún comandante podrá
atacar a tu ejército.`,

        mentions: [usuarioId]
      });

      return true;
    }

    // =========================================
    // 🏰 .FORTALEZA
    // =========================================

    if (comando === "fortaleza") {

      // -----------------------------------------
      // 🏰 MEJORAR
      // -----------------------------------------

      if (
        args?.[0]?.toLowerCase() ===
        "mejorar"
      ) {

        const nivelActual =
          jugador.fortaleza.nivel;

        const costo =
          nivelActual * 500;

        if (jugador.oro < costo) {
          await sock.sendMessage(chat, {
            text:
`❌ *ORO INSUFICIENTE*

🏰 Próxima mejora:

Nivel ${nivelActual}
➜
Nivel ${nivelActual + 1}

💰 Costo:

*${numero(costo)} 🪙*

🪙 Disponible:

*${numero(jugador.oro)} 🪙*`
          });

          return true;
        }

        jugador.oro -= costo;

        jugador.fortaleza.nivel++;

        jugador.fortaleza.defensa += 50;

        jugador.xp += 100;

        subirNivel(jugador);

        jugador.ultimaActividad =
          new Date().toISOString();

        guardarEjercitos(datos);

        await sock.sendMessage(chat, {
          text:
`╔════════════════════════════╗
       🏰 *FORTALEZA*
          MEJORADA
╚════════════════════════════╝

📈 Nivel:

*${nivelActual} ➜ ${jugador.fortaleza.nivel}*

━━━━━━━━━━━━━━━━━━━━

🛡️ Defensa:

*${numero(
  jugador.fortaleza.defensa
)}*

💰 Costo:

*${numero(costo)} 🪙*

✨ XP:
*+100*

🪙 Oro restante:

*${numero(jugador.oro)}*`
        });

        return true;
      }

      // -----------------------------------------
      // 🏰 INFORMACIÓN
      // -----------------------------------------

      await sock.sendMessage(chat, {
        text:
`╔════════════════════════════╗
       🏰 *FORTALEZA*
╚════════════════════════════╝

👑 Comandante:

${mencionar(usuarioId)}

━━━━━━━━━━━━━━━━━━━━

🏰 Nivel:

*${numero(
  jugador.fortaleza.nivel
)}*

🛡️ Defensa:

*${numero(
  jugador.fortaleza.defensa
)}*

━━━━━━━━━━━━━━━━━━━━

💰 Próxima mejora:

*${numero(
  jugador.fortaleza.nivel * 500
)} 🪙*

📈 Para mejorar:

*.fortaleza mejorar*`,

        mentions: [usuarioId]
      });

      return true;
    }

    // =========================================
    // 🏋️ .ENTRENAR
    // =========================================

    if (comando === "entrenar") {

      // -----------------------------------------
      // 📋 MENÚ DE ENTRENAMIENTO
      // -----------------------------------------

      if (
        !args ||
        args.length === 0
      ) {

        await sock.sendMessage(chat, {
          text:
`╔════════════════════════════╗
       🏋️ *ENTRENAMIENTO*
╚════════════════════════════╝

👑 Comandante:

${mencionar(usuarioId)}

🪙 Oro disponible:

*${numero(jugador.oro)}*

⚔️ Poder actual:

*${numero(
  calcularPoder(jugador)
)}*

━━━━━━━━━━━━━━━━━━━━

1️⃣ 🪖 *ENTRENAMIENTO BÁSICO*

💰 Costo:
*200 🪙*

⚔️ Poder:
*+50*

✨ XP:
*+25*

━━━━━━━━━━━━━━━━━━━━

2️⃣ ⚔️ *ENTRENAMIENTO AVANZADO*

💰 Costo:
*500 🪙*

⚔️ Poder:
*+125*

✨ XP:
*+60*

━━━━━━━━━━━━━━━━━━━━

3️⃣ 👑 *ENTRENAMIENTO ÉLITE*

💰 Costo:
*1,000 🪙*

⚔️ Poder:
*+300*

✨ XP:
*+120*

━━━━━━━━━━━━━━━━━━━━

📌 *USO*

.entrenar 1

.entrenar 2

.entrenar 3`,

          mentions: [usuarioId]
        });

        return true;
      }

      // -----------------------------------------
      // ⚙️ OPCIÓN
      // -----------------------------------------

      const opcion =
        String(args[0]);

      const entrenamientos = {

        "1": {
          nombre: "Entrenamiento Básico",
          emoji: "🪖",
          costo: 200,
          poder: 50,
          xp: 25
        },

        "2": {
          nombre: "Entrenamiento Avanzado",
          emoji: "⚔️",
          costo: 500,
          poder: 125,
          xp: 60
        },

        "3": {
          nombre: "Entrenamiento Élite",
          emoji: "👑",
          costo: 1000,
          poder: 300,
          xp: 120
        }

      };

      if (!entrenamientos[opcion]) {

        await sock.sendMessage(chat, {
          text:
`❌ *ENTRENAMIENTO INVÁLIDO*

Elige:

1️⃣ Básico
2️⃣ Avanzado
3️⃣ Élite

Ejemplo:

*.entrenar 1*`
        });

        return true;
      }

      const entrenamiento =
        entrenamientos[opcion];

      // -----------------------------------------
      // 💰 COMPROBAR ORO
      // -----------------------------------------

      if (
        jugador.oro <
        entrenamiento.costo
      ) {

        const falta =
          entrenamiento.costo -
          jugador.oro;

        await sock.sendMessage(chat, {
          text:
`❌ *ORO INSUFICIENTE*

🪙 Oro disponible:

*${numero(jugador.oro)}*

💰 Costo:

*${numero(
  entrenamiento.costo
)}*

📉 Te faltan:

*${numero(falta)} 🪙*`
        });

        return true;
      }

      // -----------------------------------------
      // ⚔️ PODER ANTES
      // -----------------------------------------

      const poderAntes =
        calcularPoder(jugador);

      // -----------------------------------------
      // 🏋️ ENTRENAMIENTO
      // -----------------------------------------

      jugador.oro -=
        entrenamiento.costo;

      /*
       * El entrenamiento aumenta
       * el poder mediante XP.
       *
       * Para mantener el poder
       * permanente, añadimos el
       * entrenamiento como generales
       * equivalentes.
       */

      jugador.xp +=
        entrenamiento.xp;

        // -----------------------------------------
// ⚔️ GUARDAR PODER EXTRA DE ENTRENAMIENTO
// -----------------------------------------

jugador.poderEntrenamiento =
  Number(jugador.poderEntrenamiento || 0) +
  entrenamiento.poder;

// -----------------------------------------
// ✨ AGREGAR XP
// -----------------------------------------

jugador.xp +=
  entrenamiento.xp;

// -----------------------------------------
// ⭐ SUBIR NIVEL
// -----------------------------------------

subirNivel(jugador);

// -----------------------------------------
// ⚔️ PODER DESPUÉS
// -----------------------------------------

const poderDespues =
  calcularPoder(jugador);

// -----------------------------------------
// 🕒 ÚLTIMA ACTIVIDAD
// -----------------------------------------

jugador.ultimaActividad =
  new Date().toISOString();

// -----------------------------------------
// 💾 GUARDAR DATOS
// -----------------------------------------

guardarEjercitos(datos);

// -----------------------------------------
// ✅ RESULTADO
// -----------------------------------------

await sock.sendMessage(chat, {
  text:
`╔════════════════════════════╗
       🏋️ *ENTRENAMIENTO*
          COMPLETADO
╚════════════════════════════╝

👑 Comandante:

${mencionar(usuarioId)}

${entrenamiento.emoji}
*${entrenamiento.nombre}*

━━━━━━━━━━━━━━━━━━━━

⚔️ *PODER*

*${numero(poderAntes)}*
⬇️
*${numero(poderDespues)}*

📈 Aumento:

*+${numero(
  entrenamiento.poder
)} poder*

━━━━━━━━━━━━━━━━━━━━

✨ XP obtenido:

*+${numero(
  entrenamiento.xp
)}*

💰 Costo:

*${numero(
  entrenamiento.costo
)} 🪙*

🪙 Oro restante:

*${numero(jugador.oro)}*

━━━━━━━━━━━━━━━━━━━━

🔥 *PODER ENTRENADO ACUMULADO*

*+${numero(
  jugador.poderEntrenamiento
)}*

━━━━━━━━━━━━━━━━━━━━

🏆 ¡Tu ejército está
cada vez mejor preparado!`,

  mentions: [
    usuarioId
  ]
});

return true;

}

// =========================================
// ❌ NO PROCESADO
// =========================================

return false;

} catch (error) {

  console.error(
    "❌ ERROR EN EJÉRCITO DORADO:",
    error
  );

  try {

    await sock.sendMessage(chat, {
      text:
        "❌ Ocurrió un error en el sistema de Ejército Dorado."
    });

  } catch (errorEnvio) {

    console.error(
      "❌ Error enviando mensaje:",
      errorEnvio
    );

  }

  return true;
}

}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = ejercito;
