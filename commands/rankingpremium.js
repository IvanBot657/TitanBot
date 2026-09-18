// =========================================
// 👑 RANKING PREMIUM - TITANBOT
// =========================================

const {
  obtenerUsuario
} = require("./datosUsuarios");

// =========================================
// 🔤 NORMALIZAR
// =========================================

function normalizar(texto) {

  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

// =========================================
// 👑 RANKING PREMIUM
// =========================================

async function rankingpremium(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {

  const cmd =
    normalizar(comando);

  if (
    cmd !== "rankingpremium"
  ) {
    return false;
  }

  // =========================================
  // 👑 SOLO GRUPOS
  // =========================================

  if (
    !chat.endsWith("@g.us")
  ) {

    await sock.sendMessage(chat, {
      text:
        "❌ Este comando solo funciona en grupos."
    });

    return true;
  }

  // =========================================
  // 📊 ELEGIR TOP
  // =========================================

  let cantidad =
    parseInt(args[0], 10);

  if (
    ![10, 20, 50, 100]
      .includes(cantidad)
  ) {

    cantidad = 10;
  }

  try {

    // =========================================
    // 👥 PARTICIPANTES
    // =========================================

    const metadata =
      await sock.groupMetadata(chat);

    const participantes =
      metadata.participants || [];

    if (
      !participantes.length
    ) {

      await sock.sendMessage(chat, {
        text:
          "❌ No encontré participantes."
      });

      return true;
    }

    // =========================================
    // 🏆 CREAR RANKING
    // =========================================

    const ranking =
      participantes

        .map((participante) => {

          const jid =
            participante.id;

          const datos =
            obtenerUsuario(jid);

          return {
            jid,

            nivel:
              Number(datos.nivel) || 1,

            xp:
              Number(datos.xp) || 0,

            logros:
              Number(datos.logros) || 0,

            aventuras:
              Number(datos.aventuras) || 0,

            capitulos:
              Number(datos.capitulos) || 0
          };

        })

        .sort((a, b) => {

          if (
            b.nivel !== a.nivel
          ) {

            return (
              b.nivel -
              a.nivel
            );
          }

          if (
            b.xp !== a.xp
          ) {

            return (
              b.xp -
              a.xp
            );
          }

          if (
            b.logros !== a.logros
          ) {

            return (
              b.logros -
              a.logros
            );
          }

          return (
            b.aventuras -
            a.aventuras
          );

        })

        .slice(
          0,
          cantidad
        );

    // =========================================
    // 🏆 ENCABEZADO
    // =========================================

    let texto =
`👑 *RANKING PREMIUM*

━━━━━━━━━━━━━━━━━━━━
🏆 *TOP ${cantidad}*
━━━━━━━━━━━━━━━━━━━━

`;

    const menciones = [];

    // =========================================
    // 📋 LISTA
    // =========================================

    ranking.forEach(
      (usuario, index) => {

        let posicion;

        if (
          index === 0
        ) {

          posicion = "🥇";

        } else if (
          index === 1
        ) {

          posicion = "🥈";

        } else if (
          index === 2
        ) {

          posicion = "🥉";

        } else {

          posicion =
            `${String(
              index + 1
            ).padStart(2, "0")}.`;
        }

        texto +=
`${posicion} @${usuario.jid.split("@")[0]}
⭐ Nivel ${usuario.nivel} | ✨ ${usuario.xp} XP
🏆 ${usuario.logros} logros | ⚔️ ${usuario.aventuras} aventuras

`;

        menciones.push(
          usuario.jid
        );
      }
    );

    // =========================================
    // 👑 FINAL
    // =========================================

    texto +=
`━━━━━━━━━━━━━━━━━━━━
📖 Datos basados en tu progreso de TITANBOT
🎮 XP obtenida jugando
✨ *TITANBOT PREMIUM*`;

    await sock.sendMessage(chat, {
      text: texto,
      mentions: menciones
    });

  } catch (error) {

    console.log(
      "❌ ERROR RANKING PREMIUM:"
    );

    console.log(error);

    await sock.sendMessage(chat, {
      text:
`❌ No pude generar el ranking.

${error.message}`
    });
  }

  return true;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports =
  rankingpremium;

module.exports.rankingpremium =
  rankingpremium;
