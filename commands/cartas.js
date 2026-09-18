// =========================================
// 🃏 TITANBOT - SISTEMA DE CARTAS
// =========================================

const fs = require("fs");
const path = require("path");

const {
  obtenerUsuario,
  guardarUsuario
} = require("../datosUsuarios");

// =========================================
// 🎴 CARTAS
// =========================================

const cartas = [

  // ⚪ COMUNES
  { id: 1, nombre: "Guerrero Novato", rareza: "⚪ Común" },
  { id: 2, nombre: "Arquero del Bosque", rareza: "⚪ Común" },
  { id: 3, nombre: "Aprendiz de Magia", rareza: "⚪ Común" },
  { id: 4, nombre: "Explorador", rareza: "⚪ Común" },
  { id: 5, nombre: "Guardián del Pueblo", rareza: "⚪ Común" },
  { id: 6, nombre: "Cazador", rareza: "⚪ Común" },
  { id: 7, nombre: "Pescador", rareza: "⚪ Común" },
  { id: 8, nombre: "Campesino", rareza: "⚪ Común" },
  { id: 9, nombre: "Viajero", rareza: "⚪ Común" },
  { id: 10, nombre: "Aventurero", rareza: "⚪ Común" },

  // 🟢 POCO COMUNES
  { id: 11, nombre: "Guerrero Verde", rareza: "🟢 Poco común" },
  { id: 12, nombre: "Mago del Bosque", rareza: "🟢 Poco común" },
  { id: 13, nombre: "Lobo Guardián", rareza: "🟢 Poco común" },
  { id: 14, nombre: "Halcón Dorado", rareza: "🟢 Poco común" },
  { id: 15, nombre: "Caballero Verde", rareza: "🟢 Poco común" },
  { id: 16, nombre: "Monje", rareza: "🟢 Poco común" },
  { id: 17, nombre: "Alquimista", rareza: "🟢 Poco común" },
  { id: 18, nombre: "Pirata", rareza: "🟢 Poco común" },

  // 🔵 RARAS
  { id: 19, nombre: "Caballero Azul", rareza: "🔵 Rara" },
  { id: 20, nombre: "Mago de Hielo", rareza: "🔵 Rara" },
  { id: 21, nombre: "Dragón Marino", rareza: "🔵 Rara" },
  { id: 22, nombre: "Guardián de Cristal", rareza: "🔵 Rara" },
  { id: 23, nombre: "Ninja de la Niebla", rareza: "🔵 Rara" },
  { id: 24, nombre: "Fénix Azul", rareza: "🔵 Rara" },
  { id: 25, nombre: "Cazador Nocturno", rareza: "🔵 Rara" },
  { id: 26, nombre: "Rey de los Lobos", rareza: "🔵 Rara" },

  // 🟣 ÉPICAS
  { id: 27, nombre: "Guerrero Oscuro", rareza: "🟣 Épica" },
  { id: 28, nombre: "Hechicera Carmesí", rareza: "🟣 Épica" },
  { id: 29, nombre: "Dragón de Fuego", rareza: "🟣 Épica" },
  { id: 30, nombre: "Caballero de la Luz", rareza: "🟣 Épica" },
  { id: 31, nombre: "Rey Demonio", rareza: "🟣 Épica" },
  { id: 32, nombre: "Titán de Piedra", rareza: "🟣 Épica" },
  { id: 33, nombre: "Guardián Celestial", rareza: "🟣 Épica" },
  { id: 34, nombre: "Fénix Dorado", rareza: "🟣 Épica" },

  // 🟠 LEGENDARIAS
  { id: 35, nombre: "Rey Dragón", rareza: "🟠 Legendaria" },
  { id: 36, nombre: "Dios del Trueno", rareza: "🟠 Legendaria" },
  { id: 37, nombre: "Señor de las Sombras", rareza: "🟠 Legendaria" },
  { id: 38, nombre: "Ángel Supremo", rareza: "🟠 Legendaria" },
  { id: 39, nombre: "Bestia Ancestral", rareza: "🟠 Legendaria" },
  { id: 40, nombre: "Guardián del Tiempo", rareza: "🟠 Legendaria" },

  // 🔴 MÍTICAS
  { id: 41, nombre: "Dragón Ancestral", rareza: "🔴 Mítica" },
  { id: 42, nombre: "Dios de los Cielos", rareza: "🔴 Mítica" },
  { id: 43, nombre: "Titán Cósmico", rareza: "🔴 Mítica" },
  { id: 44, nombre: "Rey del Universo", rareza: "🔴 Mítica" },
  { id: 45, nombre: "Guardián Absoluto", rareza: "🔴 Mítica" },
  { id: 46, nombre: "Fénix Inmortal", rareza: "🔴 Mítica" },
  { id: 47, nombre: "Señor del Multiverso", rareza: "🔴 Mítica" },
  { id: 48, nombre: "Entidad Eterna", rareza: "🔴 Mítica" },
  { id: 49, nombre: "TITÁN SUPREMO", rareza: "🔴 Mítica" },
  { id: 50, nombre: "TITÁN LEGENDARIO", rareza: "🔴 Mítica" }

];

// =========================================
// 🎲 PROBABILIDADES
// =========================================

function obtenerRareza() {

  const numero = Math.random() * 100;

  if (numero < 45) return "⚪ Común";
  if (numero < 70) return "🟢 Poco común";
  if (numero < 85) return "🔵 Rara";
  if (numero < 94) return "🟣 Épica";
  if (numero < 99) return "🟠 Legendaria";

  return "🔴 Mítica";
}

// =========================================
// 🎴 CARTA ALEATORIA
// =========================================

function obtenerCartaAleatoria() {

  const rareza = obtenerRareza();

  const disponibles = cartas.filter(
    carta => carta.rareza === rareza
  );

  return disponibles[
    Math.floor(Math.random() * disponibles.length)
  ];
}

// =========================================
// 📊 COLECCIÓN
// =========================================

function obtenerTotalCartas(usuario) {

  if (!usuario.cartas) {
    return 0;
  }

  return usuario.cartas.reduce(
    (total, carta) =>
      total + (carta.cantidad || 0),
    0
  );
}

function obtenerCartasDiferentes(usuario) {

  if (!usuario.cartas) {
    return 0;
  }

  return usuario.cartas.length;
}

// =========================================
// 🎴 EJECUTAR CARTAS
// =========================================

async function ejecutarCartas(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  // =====================================
  // 🃏 .CARTA
  // =====================================

  if (comando === "carta") {

    const carta = obtenerCartaAleatoria();

    const usuario = obtenerUsuario(id);

    if (!usuario.cartas) {
      usuario.cartas = [];
    }

    const existente = usuario.cartas.find(
      c => c.id === carta.id
    );

    if (existente) {

      existente.cantidad =
        (existente.cantidad || 0) + 1;

    } else {

      usuario.cartas.push({
        id: carta.id,
        cantidad: 1
      });

    }

    guardarUsuario(id, usuario);

    const imagen = obtenerImagen(carta.id);

    const diferentes =
      obtenerCartasDiferentes(usuario);

    const caption =
`🃏 *¡CARTA OBTENIDA!*

🛡️ *${carta.nombre}*
✨ Rareza: *${carta.rareza}*
🔢 Carta: *#${carta.id}*

🎉 ¡Nueva carta para tu colección!

📚 Colección: *${diferentes}/50*`;

    if (imagen) {

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

    } else {

      await sock.sendMessage(
        chat,
        {
          text:
            caption +
            `\n\n⚠️ Imagen de esta carta pendiente.`
        },
        {
          quoted: msg
        }
      );
    }

    return true;
  }

  // =====================================
  // 📚 .CARTAS
  // =====================================

  if (comando === "cartas") {

    const usuario = obtenerUsuario(id);

    if (
      !usuario.cartas ||
      usuario.cartas.length === 0
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`🃏 *MI COLECCIÓN*

Todavía no tienes cartas.

🎴 Usa *.carta* para conseguir una.`
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    let texto =
`🃏 *MI COLECCIÓN*

`;

    for (const coleccion of usuario.cartas) {

      const carta = cartas.find(
        c => c.id === coleccion.id
      );

      if (!carta) continue;

      texto +=
`${carta.rareza} #${carta.id} ${carta.nombre} ×${coleccion.cantidad}\n`;
    }

    const diferentes =
      obtenerCartasDiferentes(usuario);

    const total =
      obtenerTotalCartas(usuario);

    texto +=
`
━━━━━━━━━━━━━━━━━━
📚 Diferentes: *${diferentes}/50*
📦 Cartas totales: *${total}*

🎴 Usa *.carta* para conseguir otra.`;

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

  // =====================================
  // 🔎 .CARTAINFO
  // =====================================

  if (comando === "cartainfo") {

    const numero = parseInt(args[0]);

    if (
      isNaN(numero) ||
      numero < 1 ||
      numero > 50
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *Carta inválida.*

Debes indicar un número del *1 al 50*.

Ejemplo:
*.cartainfo 20*`
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    const carta = cartas.find(
      c => c.id === numero
    );

    if (!carta) {
      return true;
    }

    const imagen =
      obtenerImagen(carta.id);

    const texto =
`🃏 *INFORMACIÓN DE CARTA*

🛡️ *${carta.nombre}*
✨ Rareza: *${carta.rareza}*
🔢 Carta: *#${carta.id}*`;

    if (imagen) {

      await sock.sendMessage(
        chat,
        {
          image: {
            url: imagen
          },
          caption: texto
        },
        {
          quoted: msg
        }
      );

    } else {

      await sock.sendMessage(
        chat,
        {
          text:
            texto +
            `\n\n⚠️ Imagen todavía no disponible.`
        },
        {
          quoted: msg
        }
      );
    }

    return true;
  }

  // =====================================
  // 🏆 .CARTASRANKING
  // =====================================

  if (comando === "cartasranking") {

    const archivo =
      path.join(
        __dirname,
        "../usuarios.json"
      );

    let usuarios = {};

    try {

      if (fs.existsSync(archivo)) {

        usuarios = JSON.parse(
          fs.readFileSync(
            archivo,
            "utf8"
          )
        );
      }

    } catch (error) {

      console.error(
        "Error leyendo usuarios.json:",
        error
      );

      usuarios = {};
    }

    const ranking =
      Object.entries(usuarios)

        .map(([jid, usuario]) => {

          const coleccion =
            usuario.cartas || [];

          const diferentes =
            coleccion.length;

          const copias =
            coleccion.reduce(
              (suma, carta) =>
                suma +
                (carta.cantidad || 0),
              0
            );

          return {
            jid,
            diferentes,
            copias
          };
        })

        .sort((a, b) => {

          if (
            b.diferentes !==
            a.diferentes
          ) {
            return (
              b.diferentes -
              a.diferentes
            );
          }

          return b.copias - a.copias;

        })

        .slice(0, 10);

    let texto =
`🏆 *RANKING DE COLECCIONISTAS*

`;

    if (ranking.length === 0) {

      texto +=
        `Todavía nadie tiene cartas.`;

    } else {

      ranking.forEach(
        (jugador, index) => {

          texto +=
`${index + 1}. @${jugador.jid.split("@")[0]}
🃏 ${jugador.diferentes}/50 diferentes
📦 ${jugador.copias} copias

`;
        }
      );
    }

    await sock.sendMessage(
      chat,
      {
        text: texto,
        mentions:
          ranking.map(
            jugador => jugador.jid
          )
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  return false;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = ejecutarCartas;
