// =========================================
// 🃏 CARTAS COLECCIONABLES - TITANBOT
// 🎨 ESTILO LORELEI
// =========================================

const {
  obtenerUsuario,
  guardarUsuario,
  cargarUsuarios
} = require("./datosUsuarios");

// =========================================
// 🃏 50 CARTAS
// =========================================

const cartas = [

  // ⚪ COMUNES
  { id: 1, nombre: "Guerrero Novato", emoji: "🗡️", rareza: "⚪ Común" },
  { id: 2, nombre: "Arquero del Bosque", emoji: "🏹", rareza: "⚪ Común" },
  { id: 3, nombre: "Aprendiz de Magia", emoji: "🧙", rareza: "⚪ Común" },
  { id: 4, nombre: "Explorador", emoji: "🧭", rareza: "⚪ Común" },
  { id: 5, nombre: "Guardián del Pueblo", emoji: "🛡️", rareza: "⚪ Común" },
  { id: 6, nombre: "Cazador", emoji: "🏹", rareza: "⚪ Común" },
  { id: 7, nombre: "Pescador", emoji: "🎣", rareza: "⚪ Común" },
  { id: 8, nombre: "Campesino", emoji: "🌾", rareza: "⚪ Común" },
  { id: 9, nombre: "Viajero", emoji: "🎒", rareza: "⚪ Común" },
  { id: 10, nombre: "Aventurero", emoji: "🗺️", rareza: "⚪ Común" },

  // 🟢 POCO COMUNES
  { id: 11, nombre: "Guerrero Verde", emoji: "⚔️", rareza: "🟢 Poco común" },
  { id: 12, nombre: "Mago del Bosque", emoji: "🌳", rareza: "🟢 Poco común" },
  { id: 13, nombre: "Lobo Guardián", emoji: "🐺", rareza: "🟢 Poco común" },
  { id: 14, nombre: "Halcón Dorado", emoji: "🦅", rareza: "🟢 Poco común" },
  { id: 15, nombre: "Caballero Verde", emoji: "🛡️", rareza: "🟢 Poco común" },
  { id: 16, nombre: "Monje", emoji: "🥋", rareza: "🟢 Poco común" },
  { id: 17, nombre: "Alquimista", emoji: "⚗️", rareza: "🟢 Poco común" },
  { id: 18, nombre: "Pirata", emoji: "🏴‍☠️", rareza: "🟢 Poco común" },

  // 🔵 RARAS
  { id: 19, nombre: "Caballero Azul", emoji: "🔷", rareza: "🔵 Rara" },
  { id: 20, nombre: "Mago de Hielo", emoji: "❄️", rareza: "🔵 Rara" },
  { id: 21, nombre: "Dragón Marino", emoji: "🐲", rareza: "🔵 Rara" },
  { id: 22, nombre: "Guardián de Cristal", emoji: "💎", rareza: "🔵 Rara" },
  { id: 23, nombre: "Ninja de la Niebla", emoji: "🥷", rareza: "🔵 Rara" },
  { id: 24, nombre: "Fénix Azul", emoji: "🔥", rareza: "🔵 Rara" },
  { id: 25, nombre: "Cazador Nocturno", emoji: "🌙", rareza: "🔵 Rara" },
  { id: 26, nombre: "Rey de los Lobos", emoji: "🐺", rareza: "🔵 Rara" },

  // 🟣 ÉPICAS
  { id: 27, nombre: "Guerrero Oscuro", emoji: "⚔️", rareza: "🟣 Épica" },
  { id: 28, nombre: "Hechicera Carmesí", emoji: "🔮", rareza: "🟣 Épica" },
  { id: 29, nombre: "Dragón de Fuego", emoji: "🐉", rareza: "🟣 Épica" },
  { id: 30, nombre: "Caballero de la Luz", emoji: "✨", rareza: "🟣 Épica" },
  { id: 31, nombre: "Rey Demonio", emoji: "👹", rareza: "🟣 Épica" },
  { id: 32, nombre: "Titán de Piedra", emoji: "🗿", rareza: "🟣 Épica" },
  { id: 33, nombre: "Guardián Celestial", emoji: "👼", rareza: "🟣 Épica" },
  { id: 34, nombre: "Fénix Dorado", emoji: "🦅", rareza: "🟣 Épica" },

  // 🟠 LEGENDARIAS
  { id: 35, nombre: "Rey Dragón", emoji: "🐲", rareza: "🟠 Legendaria" },
  { id: 36, nombre: "Dios del Trueno", emoji: "⚡", rareza: "🟠 Legendaria" },
  { id: 37, nombre: "Señor de las Sombras", emoji: "🌑", rareza: "🟠 Legendaria" },
  { id: 38, nombre: "Ángel Supremo", emoji: "😇", rareza: "🟠 Legendaria" },
  { id: 39, nombre: "Bestia Ancestral", emoji: "🦁", rareza: "🟠 Legendaria" },
  { id: 40, nombre: "Guardián del Tiempo", emoji: "⏳", rareza: "🟠 Legendaria" },

  // 🔴 MÍTICAS
  { id: 41, nombre: "Dragón Ancestral", emoji: "🐉", rareza: "🔴 Mítica" },
  { id: 42, nombre: "Dios de los Cielos", emoji: "🌌", rareza: "🔴 Mítica" },
  { id: 43, nombre: "Titán Cósmico", emoji: "🌠", rareza: "🔴 Mítica" },
  { id: 44, nombre: "Rey del Universo", emoji: "👑", rareza: "🔴 Mítica" },
  { id: 45, nombre: "Guardián Absoluto", emoji: "🛡️", rareza: "🔴 Mítica" },
  { id: 46, nombre: "Fénix Inmortal", emoji: "🔥", rareza: "🔴 Mítica" },
  { id: 47, nombre: "Señor del Multiverso", emoji: "🌌", rareza: "🔴 Mítica" },
  { id: 48, nombre: "Entidad Eterna", emoji: "♾️", rareza: "🔴 Mítica" },
  { id: 49, nombre: "TITÁN SUPREMO", emoji: "👑", rareza: "🔴 Mítica" },
  { id: 50, nombre: "TITÁN LEGENDARIO", emoji: "🐉", rareza: "🔴 Mítica" }

];

// =========================================
// 🎨 GENERAR IMAGEN LORELEI
// =========================================

function obtenerImagen(carta) {

  const seed = encodeURIComponent(
    `titanbot-${carta.id}-${carta.nombre}`
  );

  return (
    `https://api.dicebear.com/10.x/lorelei/png` +
    `?seed=${seed}` +
    `&size=512`
  );

}

// =========================================
// 🎲 ELEGIR CARTA SEGÚN RAREZA
// =========================================

function obtenerCartaAleatoria() {

  const numero = Math.random() * 100;

  let disponibles;

  if (numero < 45) {

    disponibles = cartas.filter(
      c => c.rareza === "⚪ Común"
    );

  } else if (numero < 70) {

    disponibles = cartas.filter(
      c => c.rareza === "🟢 Poco común"
    );

  } else if (numero < 85) {

    disponibles = cartas.filter(
      c => c.rareza === "🔵 Rara"
    );

  } else if (numero < 94) {

    disponibles = cartas.filter(
      c => c.rareza === "🟣 Épica"
    );

  } else if (numero < 99) {

    disponibles = cartas.filter(
      c => c.rareza === "🟠 Legendaria"
    );

  } else {

    disponibles = cartas.filter(
      c => c.rareza === "🔴 Mítica"
    );

  }

  return disponibles[
    Math.floor(
      Math.random() * disponibles.length
    )
  ];

}

// =========================================
// 🃏 OBTENER CARTA
// =========================================

async function conseguirCarta(
  sock,
  chat,
  id,
  msg
) {

  const usuario =
    obtenerUsuario(id);

  if (!Array.isArray(usuario.cartas)) {
    usuario.cartas = [];
  }

  const carta =
    obtenerCartaAleatoria();

  let existente =
    usuario.cartas.find(
      c => c.id === carta.id
    );

  if (existente) {

    existente.cantidad =
      (existente.cantidad || 1) + 1;

  } else {

    existente = {
      id: carta.id,
      cantidad: 1
    };

    usuario.cartas.push(
      existente
    );

  }

  guardarUsuario(
    id,
    usuario
  );

  const imagen =
    obtenerImagen(carta);

  const caption =
    `🃏 *¡CARTA OBTENIDA!*\n\n` +
    `${carta.emoji} *${carta.nombre}*\n` +
    `✨ Rareza: *${carta.rareza}*\n` +
    `🔢 Carta: *#${carta.id}*\n\n` +
    `${
      existente.cantidad > 1
        ? `📦 Copias: *${existente.cantidad}*`
        : `🎉 ¡Nueva carta para tu colección!`
    }\n\n` +
    `📚 Colección: *${usuario.cartas.length}/50*`;

  await sock.sendMessage(
    chat,
    {
      image: {
        url: imagen
      },
      caption: caption
    },
    {
      quoted: msg
    }
  );

}

// =========================================
// 📚 MOSTRAR COLECCIÓN
// =========================================

async function mostrarCartas(
  sock,
  chat,
  id,
  msg
) {

  const usuario =
    obtenerUsuario(id);

  if (
    !Array.isArray(usuario.cartas) ||
    usuario.cartas.length === 0
  ) {

    await sock.sendMessage(
      chat,
      {
        text:
          `🃏 *TU COLECCIÓN*\n\n` +
          `📭 No tienes cartas todavía.\n\n` +
          `🎴 Usa *.carta* para conseguir una.`
      },
      {
        quoted: msg
      }
    );

    return;
  }

  let texto =
    `🃏 *TU COLECCIÓN*\n\n`;

  const ordenadas =
    [...usuario.cartas].sort(
      (a, b) => a.id - b.id
    );

  for (const guardada of ordenadas) {

    const carta =
      cartas.find(
        c => c.id === guardada.id
      );

    if (!carta) continue;

    texto +=
      `${carta.emoji} #${carta.id} ` +
      `*${carta.nombre}*\n` +
      `${carta.rareza} | ` +
      `x${guardada.cantidad || 1}\n\n`;

  }

  texto +=
    `📚 Total: *${usuario.cartas.length}/50*`;

  await sock.sendMessage(
    chat,
    {
      text: texto
    },
    {
      quoted: msg
    }
  );

}

// =========================================
// 🔎 INFO DE CARTA
// =========================================

async function infoCarta(
  sock,
  chat,
  args,
  id,
  msg
) {

  const numero =
    Number(args[0]);

  if (
    !numero ||
    numero < 1 ||
    numero > 50
  ) {

    await sock.sendMessage(
      chat,
      {
        text:
          `🔎 *INFO DE CARTA*\n\n` +
          `Usa: *.cartainfo 1*\n\n` +
          `📌 Disponibles: *1-50*`
      },
      {
        quoted: msg
      }
    );

    return;
  }

  const carta =
    cartas.find(
      c => c.id === numero
    );

  const usuario =
    obtenerUsuario(id);

  const guardada =
    Array.isArray(usuario.cartas)
      ? usuario.cartas.find(
          c => c.id === numero
        )
      : null;

  const imagen =
    obtenerImagen(carta);

  const caption =
    `🔎 *INFORMACIÓN DE CARTA*\n\n` +
    `${carta.emoji} *${carta.nombre}*\n` +
    `✨ Rareza: *${carta.rareza}*\n` +
    `🔢 Número: *#${carta.id}*\n` +
    `📦 Copias: *${guardada ? guardada.cantidad : 0}*`;

  await sock.sendMessage(
    chat,
    {
      image: {
        url: imagen
      },
      caption: caption
    },
    {
      quoted: msg
    }
  );

}

// =========================================
// 🏆 RANKING
// =========================================

async function rankingCartas(
  sock,
  chat,
  msg
) {

  const usuarios =
    cargarUsuarios();

  const ranking =
    Object.entries(usuarios)
      .map(([jid, usuario]) => {

        const coleccion =
          Array.isArray(usuario.cartas)
            ? usuario.cartas
            : [];

        const total =
          coleccion.length;

        const copias =
          coleccion.reduce(
            (suma, carta) =>
              suma +
              (Number(carta.cantidad) || 1),
            0
          );

        return {
          jid,
          total,
          copias
        };

      })
      .filter(
        usuario =>
          usuario.total > 0
      )
      .sort(
        (a, b) => {

          if (
            b.total !== a.total
          ) {
            return b.total - a.total;
          }

          return b.copias - a.copias;

        }
      )
      .slice(0, 10);

  if (ranking.length === 0) {

    await sock.sendMessage(
      chat,
      {
        text:
          `🏆 *RANKING DE CARTAS*\n\n` +
          `📭 Todavía nadie tiene cartas.`
      },
      {
        quoted: msg
      }
    );

    return;
  }

  let texto =
    `🏆 *RANKING DE COLECCIONISTAS*\n\n`;

  const mentions = [];

  ranking.forEach(
    (usuario, index) => {

      mentions.push(
        usuario.jid
      );

      texto +=
        `${index + 1}. @${usuario.jid.split("@")[0]}\n` +
        `🃏 Cartas: *${usuario.total}/50*\n` +
        `📦 Copias: *${usuario.copias}*\n\n`;

    }
  );

  await sock.sendMessage(
    chat,
    {
      text: texto,
      mentions: mentions
    },
    {
      quoted: msg
    }
  );

}

// =========================================
// 🎮 COMANDOS
// =========================================

async function cartasComando(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  if (comando === "carta") {

    await conseguirCarta(
      sock,
      chat,
      id,
      msg
    );

    return true;
  }

  if (comando === "cartas") {

    await mostrarCartas(
      sock,
      chat,
      id,
      msg
    );

    return true;
  }

  if (comando === "cartainfo") {

    await infoCarta(
      sock,
      chat,
      args,
      id,
      msg
    );

    return true;
  }

  if (comando === "cartasranking") {

    await rankingCartas(
      sock,
      chat,
      msg
    );

    return true;
  }

  return false;

}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = cartasComando;
