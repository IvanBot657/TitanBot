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
// 💾 CARGAR EJÉRCITOS
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
  return Number(valor || 0)
    .toLocaleString("es-CO");
}

// =========================================
// 👤 MENCIONAR
// =========================================

function mencionar(jid) {
  return `@${String(jid).split("@")[0]}`;
}

// =========================================
// 👑 OBTENER / CREAR COMANDANTE
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

  // -----------------------------------------
  // Reparar datos antiguos si existen
  // -----------------------------------------

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

  jugador.ultimaActividad ||= null;

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
// ⚔️ CALCULAR PODER
// =========================================

function calcularPoder(jugador) {

  const soldados =
    jugador.unidades?.soldados || 0;

  const arqueros =
    jugador.unidades?.arqueros || 0;

  const guardianes =
    jugador.unidades?.guardianes || 0;

  const caballeria =
    jugador.unidades?.caballeria || 0;

  const generales =
    jugador.generales || 0;

  const nivelFortaleza =
    jugador.fortaleza?.nivel || 1;

  const nivel =
    jugador.nivel || 1;

  return (

    soldados * 2 +

    arqueros * 4 +

    guardianes * 8 +

    caballeria * 12 +

    generales * 50 +

    nivelFortaleza * 100 +

    nivel * 25

  );
}

// =========================================
// ⭐ SUBIR NIVEL
// =========================================

function subirNivel(jugador) {

  while (
    jugador.xp >=
    jugador.nivel * 500
  ) {

    jugador.xp -=
      jugador.nivel * 500;

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

    "tarjetaejercito",

    "atacar",

    "defender",

    "fortaleza"

  ];

  if (
    !comandosValidos.includes(comando)
  ) {

    return false;

  }

  try {

    // =========================================
    // 📂 CARGAR DATOS
    // =========================================

    const datos =
      cargarEjercitos();

    // =========================================
    // 👤 IDENTIFICAR USUARIO
    // =========================================

    const usuarioId =

      id ||

      msg?.key?.participant ||

      msg?.participant ||

      msg?.key?.remoteJid;

    if (!usuarioId) {

      return false;

    }

    // =========================================
    // 👑 OBTENER COMANDANTE
    // =========================================

    const jugador =
      obtenerUsuario(
        datos,
        usuarioId
      );

    // =========================================
    // 🏆 .EJERCITO
    // =========================================

    if (
      comando === "ejercito"
    ) {

      const poder =
        calcularPoder(jugador);

      await sock.sendMessage(
        chat,
        {

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

🔥 Poder total:
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

          mentions: [
            usuarioId
          ]

        }
      );

      guardarEjercitos(datos);

      return true;
    }

    // =========================================
    // 🪪 .TARJETAEJERCITO
    // =========================================

    if (
      comando === "tarjetaejercito"
    ) {

      const poder =
        calcularPoder(jugador);

      const totalTropas =

        (jugador.unidades.soldados || 0) +

        (jugador.unidades.arqueros || 0) +

        (jugador.unidades.guardianes || 0) +

        (jugador.unidades.caballeria || 0);

      await sock.sendMessage(
        chat,
        {

          text:
`╔════════════════════════════╗
       🏆 *EJÉRCITO DORADO*
          🪪 *TARJETA*
╚════════════════════════════╝

👑 *COMANDANTE*

${mencionar(usuarioId)}

━━━━━━━━━━━━━━━━━━━━

🎖️ Rango:
*${jugador.nombre}*

⭐ Nivel:
*${numero(jugador.nivel)}*

✨ XP:
*${numero(jugador.xp)}*

━━━━━━━━━━━━━━━━━━━━

⚔️ *PODER MILITAR*

🔥 Poder:
*${numero(poder)}*

━━━━━━━━━━━━━━━━━━━━

🪖 *EJÉRCITO*

🗡️ Soldados:
*${numero(jugador.unidades.soldados)}*

🏹 Arqueros:
*${numero(jugador.unidades.arqueros)}*

🛡️ Guardianes:
*${numero(jugador.unidades.guardianes)}*

🐎 Caballería:
*${numero(jugador.unidades.caballeria)}*

👥 Total tropas:
*${numero(totalTropas)}*

━━━━━━━━━━━━━━━━━━━━

👑 *MANDO*

🎖️ Generales:
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
*${numero(jugador.racha)}*

━━━━━━━━━━━━━━━━━━━━

💰 Oro:
*${numero(jugador.oro)} 🪙*`,

          mentions: [
            usuarioId
          ]

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

      const mencionados =

        msg
          ?.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.mentionedJid || [];

      if (
        mencionados.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {

            text:
`❌ *DEBES MENCIONAR A UN COMANDANTE*

Ejemplo:

*.atacar @usuario*`

          }
        );

        return true;
      }

      const enemigoId =
        mencionados[0];

      if (
        enemigoId === usuarioId
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
        obtenerUsuario(
          datos,
          enemigoId
        );

      // =========================================
      // 🛡️ PROTECCIÓN
      // =========================================

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

        await sock.sendMessage(
          chat,
          {

            text:
`🛡️ *EJÉRCITO PROTEGIDO*

👑 ${mencionar(enemigoId)}

Este comandante tiene
protección activa.

⏳ Tiempo restante:

*${minutos} minuto(s)*`,

            mentions: [
              enemigoId
            ]

          }
        );

        return true;
      }

      // Protección vencida
      enemigo.protegido = false;
      enemigo.proteccionHasta = 0;

      // =========================================
      // ⚔️ PODERES
      // =========================================

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

            (enemigo.oro || 0) -
            recompensa

          );

        jugador.oro +=
          recompensa;

        jugador.xp +=
          150;

        subirNivel(jugador);

        jugador.ultimaActividad =
          new Date().toISOString();

        guardarEjercitos(datos);

        await sock.sendMessage(
          chat,
          {

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

          }
        );

        return true;
      }

      // =========================================
      // 🛡️ DERROTA
      // =========================================

      jugador.derrotas++;

      jugador.racha = 0;

      enemigo.victorias++;

      enemigo.racha++;

      jugador.xp +=
        50;

      subirNivel(jugador);

      jugador.ultimaActividad =
        new Date().toISOString();

      guardarEjercitos(datos);

      await sock.sendMessage(
        chat,
        {

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

━━━━━━━━━━━━━━━━━━━━

⚔️ ¡Entrena más a tu ejército!`,

          mentions: [
            usuarioId,
            enemigoId
          ]

        }
      );

      return true;
    }

    // =========================================
    // 🛡️ .DEFENDER
    // =========================================

    if (
      comando === "defender"
    ) {

      const duracion =
        10 * 60 * 1000;

      jugador.protegido =
        true;

      jugador.proteccionHasta =
        Date.now() + duracion;

      jugador.ultimaActividad =
        new Date().toISOString();

      guardarEjercitos(datos);

      await sock.sendMessage(
        chat,
        {

          text:
`╔════════════════════════════╗
        🛡️ *DEFENSA*
          ACTIVADA
╚════════════════════════════╝

👑 Comandante:

${mencionar(usuarioId)}

🛡️ Tu ejército está protegido.

⏳ Duración:

*10 minutos*

━━━━━━━━━━━━━━━━━━━━

⚔️ Durante este tiempo
ningún comandante podrá
atacarte.`,

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

      // =========================================
      // 🏰 MEJORAR FORTALEZA
      // =========================================

      if (
        args?.[0]?.toLowerCase() ===
        "mejorar"
      ) {

        const nivelActual =
          jugador.fortaleza.nivel;

        const costo =
          nivelActual * 500;

        if (
          jugador.oro < costo
        ) {

          await sock.sendMessage(
            chat,
            {

              text:
`❌ *ORO INSUFICIENTE*

🏰 Mejora:

Nivel ${nivelActual}
➜
Nivel ${nivelActual + 1}

💰 Costo:

*${numero(costo)} 🪙*

🪙 Oro disponible:

*${numero(jugador.oro)} 🪙*`

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

        subirNivel(jugador);

        jugador.ultimaActividad =
          new Date().toISOString();

        guardarEjercitos(datos);

        await sock.sendMessage(
          chat,
          {

            text:
`╔════════════════════════════╗
       🏰 *FORTALEZA*
        *MEJORADA*
╚════════════════════════════╝

📈 Nivel:

*${nivelActual} ➜ ${jugador.fortaleza.nivel}*

🛡️ Defensa:

*${numero(jugador.fortaleza.defensa)}*

💰 Costo:

*${numero(costo)} 🪙*

✨ XP:

*+100*

🪙 Oro restante:

*${numero(jugador.oro)}*`

          }
        );

        return true;
      }

      // =========================================
      // 🏰 INFORMACIÓN DE FORTALEZA
      // =========================================

      await sock.sendMessage(
        chat,
        {

          text:
`╔════════════════════════════╗
       🏰 *FORTALEZA*
╚════════════════════════════╝

👑 Comandante:

${mencionar(usuarioId)}

━━━━━━━━━━━━━━━━━━━━

🏰 Nivel:

*${numero(jugador.fortaleza.nivel)}*

🛡️ Defensa:

*${numero(jugador.fortaleza.defensa)}*

━━━━━━━━━━━━━━━━━━━━

💰 Próxima mejora:

*${numero(
  jugador.fortaleza.nivel * 500
)} 🪙*

📈 Para mejorar:

*.fortaleza mejorar*`,

          mentions: [
            usuarioId
          ]

        }
      );

      return true;
    }

    // =========================================
    // ❌ COMANDO NO PROCESADO
    // =========================================

    return false;

  } catch (error) {

    console.error(
      "❌ ERROR EN EJÉRCITO DORADO:",
      error
    );

    try {

      await sock.sendMessage(
        chat,
        {

          text:
            "❌ Ocurrió un error en el sistema de Ejército Dorado."

        }
      );

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
