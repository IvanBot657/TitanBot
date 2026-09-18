// =========================================
// 🎖️ TÍTULOS - TITANBOT
// =========================================

const {
  obtenerUsuario
} = require("./datosUsuarios");

// =========================================
// 🎖️ LISTA DE TÍTULOS
// =========================================

const titulos = [

  {
    nivel: 1,
    emoji: "🌱",
    nombre: "Novato",
    requisito: "Nivel 1"
  },

  {
    nivel: 2,
    emoji: "🥉",
    nombre: "Principiante",
    requisito: "Nivel 2"
  },

  {
    nivel: 3,
    emoji: "⚔️",
    nombre: "Guerrero",
    requisito: "Nivel 3"
  },

  {
    nivel: 4,
    emoji: "🛡️",
    nombre: "Defensor",
    requisito: "Nivel 4"
  },

  {
    nivel: 5,
    emoji: "🏹",
    nombre: "Cazador",
    requisito: "Nivel 5"
  },

  {
    nivel: 6,
    emoji: "🔥",
    nombre: "Combatiente",
    requisito: "Nivel 6"
  },

  {
    nivel: 7,
    emoji: "🧙",
    nombre: "Hechicero",
    requisito: "Nivel 7"
  },

  {
    nivel: 8,
    emoji: "🗡️",
    nombre: "Espadachín",
    requisito: "Nivel 8"
  },

  {
    nivel: 9,
    emoji: "👑",
    nombre: "Campeón",
    requisito: "Nivel 9"
  },

  {
    nivel: 10,
    emoji: "💎",
    nombre: "Élite",
    requisito: "Nivel 10"
  },

  {
    nivel: 11,
    emoji: "🌟",
    nombre: "Maestro",
    requisito: "Nivel 11"
  },

  {
    nivel: 12,
    emoji: "⚡",
    nombre: "Imparable",
    requisito: "Nivel 12"
  },

  {
    nivel: 13,
    emoji: "🌌",
    nombre: "Mítico",
    requisito: "Nivel 13"
  },

  {
    nivel: 14,
    emoji: "👹",
    nombre: "Destructor",
    requisito: "Nivel 14"
  },

  {
    nivel: 15,
    emoji: "🐲",
    nombre: "Cazador de Dragones",
    requisito: "Nivel 15"
  },

  {
    nivel: 16,
    emoji: "🔱",
    nombre: "Señor Supremo",
    requisito: "Nivel 16"
  },

  {
    nivel: 17,
    emoji: "💀",
    nombre: "Inmortal",
    requisito: "Nivel 17"
  },

  {
    nivel: 18,
    emoji: "🌠",
    nombre: "Celestial",
    requisito: "Nivel 18"
  },

  {
    nivel: 19,
    emoji: "👑",
    nombre: "Leyenda",
    requisito: "Nivel 19"
  },

  {
    nivel: 20,
    emoji: "🔥",
    nombre: "TITÁN",
    requisito: "Nivel 20"
  }

];

// =========================================
// 🧮 OBTENER TÍTULO
// =========================================

function obtenerTitulo(
  nivel
) {

  let titulo =
    titulos[0];

  for (
    const item of titulos
  ) {

    if (
      nivel >= item.nivel
    ) {

      titulo = item;

    }

  }

  return titulo;

}

// =========================================
// 📋 TÍTULOS DESBLOQUEADOS
// =========================================

function contarDesbloqueados(
  nivel
) {

  return titulos.filter(
    item =>
      nivel >= item.nivel
  ).length;

}

// =========================================
// 🎖️ COMANDO PRINCIPAL
// =========================================

async function titulosComando(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const usuario =
    obtenerUsuario(id);

  const nivel =
    Number(usuario.nivel) || 1;

  // =========================================
  // 🎖️ TÍTULO ACTUAL
  // =========================================

  if (
    comando === "titulo"
  ) {

    const titulo =
      obtenerTitulo(nivel);

    await sock.sendMessage(
      chat,
      {
        text:

          `🎖️ *TU TÍTULO*\n\n` +

          `${titulo.emoji} *${titulo.nombre}*\n\n` +

          `⭐ Nivel: *${nivel}*\n` +

          `🏆 Títulos desbloqueados: *${contarDesbloqueados(nivel)}/${titulos.length}*\n\n` +

          `🔥 Sigue subiendo de nivel para desbloquear nuevos títulos.`
      },
      {
        quoted: msg
      }
    );

    return true;

  }

  // =========================================
  // 📜 LISTA DE TÍTULOS
  // =========================================

  if (
    comando === "titulos"
  ) {

    let texto =
      "🎖️ *TÍTULOS DE TITANBOT*\n\n";

    titulos.forEach(
      (item) => {

        const desbloqueado =
          nivel >= item.nivel;

        texto +=
          `${desbloqueado ? "✅" : "🔒"} ` +
          `${item.nivel}. ` +
          `${item.emoji} ` +
          `${item.nombre}`;

        if (!desbloqueado) {

          texto +=
            ` — Nivel ${item.nivel}`;

        }

        texto += "\n";

      }
    );

    texto +=
      `\n🏆 Desbloqueados: *${contarDesbloqueados(nivel)}/${titulos.length}*`;

    await sock.sendMessage(
      chat,
      {
        text: texto
      },
      {
        quoted: msg
      }
    );

    return true;

  }

  // =========================================
  // 📊 ESTADO DEL TÍTULO
  // =========================================

  if (
    comando === "tituloestado"
  ) {

    const actual =
      obtenerTitulo(nivel);

    const siguiente =
      titulos.find(
        item =>
          item.nivel > nivel
      );

    let texto =

      `📊 *ESTADO DE TÍTULOS*\n\n` +

      `🎖️ Actual: *${actual.emoji} ${actual.nombre}*\n` +

      `⭐ Nivel actual: *${nivel}*\n`;

    if (siguiente) {

      const faltan =
        siguiente.nivel - nivel;

      texto +=

        `\n🔒 Siguiente:\n` +

        `${siguiente.emoji} *${siguiente.nombre}*\n` +

        `⭐ Nivel requerido: *${siguiente.nivel}*\n` +

        `📈 Faltan: *${faltan} nivel${faltan === 1 ? "" : "es"}*`;

    } else {

      texto +=

        `\n👑 *¡HAS DESBLOQUEADO TODOS LOS TÍTULOS!*\n\n` +

        `🔥 Título máximo: *${actual.emoji} ${actual.nombre}*`;

    }

    await sock.sendMessage(
      chat,
      {
        text: texto
      },
      {
        quoted: msg
      }
    );

    return true;

  }

  // =========================================
  // ❌ NO ES UN COMANDO
  // =========================================

  return false;

}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = titulosComando;
