// =========================================
// 👑 RANKING PREMIUM - TITANBOT
// =========================================

const {
  obtenerUsuario
} = require("./datosUsuarios");

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function rankingpremium(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {

  const cmd = normalizar(comando);

  if (cmd !== "rankingpremium") {
    return false;
  }

  // Solo funciona en grupos
  if (!chat.endsWith("@g.us")) {
    await sock.sendMessage(chat, {
      text: "❌ Este comando solo funciona en grupos."
    });

    return true;
  }

  // ==============================
  // 📊 CANTIDAD DEL TOP
  // ==============================

  let cantidad = parseInt(args[0], 10);

  if (![10, 20, 50, 100].includes(cantidad)) {
    cantidad = 10;
  }

  try {

    const metadata = await sock.groupMetadata(chat);
    const participantes = metadata.participants || [];

    if (!participantes.length) {
      await sock.sendMessage(chat, {
        text: "❌ No encontré participantes."
      });

      return true;
    }

    // ==============================
    // 👤 CREAR / OBTENER USUARIOS
    // ==============================

    const ranking = participantes
      .map((participante) => {

        const jid = participante.id;
        const datos = obtenerUsuario(jid);

        return {
          jid,
          nivel: datos.nivel,
          xp: datos.xp,
          logros: datos.logros,
          aventuras: datos.aventuras
        };

      })
      .sort((a, b) => {

        if (b.nivel !== a.nivel) {
          return b.nivel - a.nivel;
        }

        if (b.xp !== a.xp) {
          return b.xp - a.xp;
        }

        if (b.logros !== a.logros) {
          return b.logros - a.logros;
        }

        return b.aventuras - a.aventuras;

      })
      .slice(0, cantidad);

    // ==============================
    // 🏆 CREAR MENSAJE
    // ==============================

    let texto =
`👑 *RANKING PREMIUM*

━━━━━━━━━━━━━━━━━━━━
🏆 *TOP ${cantidad}*
━━━━━━━━━━━━━━━━━━━━

`;

    const menciones = [];

    ranking.forEach((usuario, index) => {

      let posicion;

      if (index === 0) {
        posicion = "🥇";
      } else if (index === 1) {
        posicion = "🥈";
      } else if (index === 2) {
        posicion = "🥉";
      } else {
        posicion = `${index + 1}.`;
      }

      texto +=
`${posicion} @${usuario.jid.split("@")[0]}
⭐ Nivel: ${usuario.nivel} | ✨ XP: ${usuario.xp}
🏅 Logros: ${usuario.logros} | ⚔️ Aventuras: ${usuario.aventuras}

`;

      menciones.push(usuario.jid);
    });

    texto +=
`━━━━━━━━━━━━━━━━━━━━
✨ *TITANBOT PREMIUM*`;

    await sock.sendMessage(chat, {
      text: texto,
      mentions: menciones
    });

  } catch (error) {

    console.log("❌ ERROR RANKING PREMIUM:");
    console.log(error);

    await sock.sendMessage(chat, {
      text:
`❌ No pude generar el ranking.

${error.message}`
    });
  }

  return true;
}

module.exports = rankingpremium;
module.exports.rankingpremium = rankingpremium;
