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
// 🖼️ IMAGEN DE LA CARTA #20
// =========================================

function obtenerImagen(id) {

  if (id === 20) {
    return "https://raw.githubusercontent.com/IvanBot657/TitanBot/main/Cartas/mago_hielo_20.png";
  }

  return null;
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
