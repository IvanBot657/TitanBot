// =========================================
// 🃏 TITANBOT - SISTEMA DE CARTAS
// =========================================

const fs = require("fs");
const path = require("path");

// =========================================
// 👤 SISTEMA DE USUARIOS
// =========================================

const {
  obtenerUsuario,
  guardarUsuario
} = require("./datosUsuarios");

// =========================================
// 🖼️ IMÁGENES DE CARTAS
// =========================================

function obtenerImagen(id) {

  const base =
    "https://raw.githubusercontent.com/IvanBot657/TitanBot/main/Cartas/";

  const imagenes = {

    // ⚪ COMUNES
    1: "caballero_de_acero_carta_comun.png",
    2: "elfo_arquero_carta_comun.png",
    3: "arquero_arcano_carta_comun.png",

    // 🟢 POCO COMUNES
    4: "elfo_arquero_neon_carta_poco_comun.png",
    5: "caballero_del_agua_carta_poco_comun.png",
    6: "invocador_sombrio_carta_poco_comun.png",

    // 🔵 RARAS
    7: "mago_de_fuego_carta_rara.png",
    8: "cazador_nocturno_carta_rara.png",
    9: "caballero_de_las_sombras_carta_rara.png",
    10: "mago_sombrio_carta_rara.png",

    // 🟣 ÉPICAS
    11: "esqueleto_guerrero_carta_epica.png",
    12: "nigromante_neon_carta_epica.png",
    13: "invocador_de_sombras_carta_epica.png",
    14: "senor_del_fuego_eterno_carta_epica.png",

    // 🟠 LEGENDARIAS
    15: "guardian_del_bosque_carta_legendaria.png",
    16: "rey_de_la_muerte_carta_legendaria.png",
    17: "sacerdote_luminoso_carta_legendaria.png",
    18: "principe_de_la_noche_carta_legendaria.png",
    19: "principe_de_la_oscuridad_carta_legendaria.png",
    20: "rey_dragon_carta_legendaria.png",
    21: "guardian_de_la_luna_carta_legendaria.png",
    22: "dragon_dorado_carta_legendaria.png",

    // 🔴 MÍTICAS
    23: "el_elegido_oscuro_carta_mitica.png",
    24: "el_rey_caido_carta_mitica.png"

  };

  return imagenes[id]
    ? base + imagenes[id]
    : null;
}

// =========================================
// 🎴 LISTA DE 24 CARTAS
// =========================================

const cartas = [

  // =====================================
  // ⚪ COMUNES
  // =====================================

  {
    id: 1,
    nombre: "Caballero de Acero",
    rareza: "⚪ Común"
  },

  {
    id: 2,
    nombre: "Elfo Arquero",
    rareza: "⚪ Común"
  },

  {
    id: 3,
    nombre: "Arquero Arcano",
    rareza: "⚪ Común"
  },

  // =====================================
  // 🟢 POCO COMUNES
  // =====================================

  {
    id: 4,
    nombre: "Elfo Arquero Neón",
    rareza: "🟢 Poco común"
  },

  {
    id: 5,
    nombre: "Caballero del Agua",
    rareza: "🟢 Poco común"
  },

  {
    id: 6,
    nombre: "Invocador Sombrío",
    rareza: "🟢 Poco común"
  },

  // =====================================
  // 🔵 RARAS
  // =====================================

  {
    id: 7,
    nombre: "Mago de Fuego",
    rareza: "🔵 Rara"
  },

  {
    id: 8,
    nombre: "Cazador Nocturno",
    rareza: "🔵 Rara"
  },

  {
    id: 9,
    nombre: "Caballero de las Sombras",
    rareza: "🔵 Rara"
  },

  {
    id: 10,
    nombre: "Mago Sombrío",
    rareza: "🔵 Rara"
  },

  // =====================================
  // 🟣 ÉPICAS
  // =====================================

  {
    id: 11,
    nombre: "Esqueleto Guerrero",
    rareza: "🟣 Épica"
  },

  {
    id: 12,
    nombre: "Nigromante Neón",
    rareza: "🟣 Épica"
  },

  {
    id: 13,
    nombre: "Invocador de Sombras",
    rareza: "🟣 Épica"
  },

  {
    id: 14,
    nombre: "Señor del Fuego Eterno",
    rareza: "🟣 Épica"
  },

  // =====================================
  // 🟠 LEGENDARIAS
  // =====================================

  {
    id: 15,
    nombre: "Guardián del Bosque",
    rareza: "🟠 Legendaria"
  },

  {
    id: 16,
    nombre: "Rey de la Muerte",
    rareza: "🟠 Legendaria"
  },

  {
    id: 17,
    nombre: "Sacerdote Luminoso",
    rareza: "🟠 Legendaria"
  },

  {
    id: 18,
    nombre: "Príncipe de la Noche",
    rareza: "🟠 Legendaria"
  },

  {
    id: 19,
    nombre: "Príncipe de la Oscuridad",
    rareza: "🟠 Legendaria"
  },

  {
    id: 20,
    nombre: "Rey Dragón",
    rareza: "🟠 Legendaria"
  },

  {
    id: 21,
    nombre: "Guardián de la Luna",
    rareza: "🟠 Legendaria"
  },

  {
    id: 22,
    nombre: "Dragón Dorado",
    rareza: "🟠 Legendaria"
  },

  // =====================================
  // 🔴 MÍTICAS
  // =====================================

  {
    id: 23,
    nombre: "El Elegido Oscuro",
    rareza: "🔴 Mítica"
  },

  {
    id: 24,
    nombre: "El Rey Caído",
    rareza: "🔴 Mítica"
  }

];

// =========================================
// 🎲 PROBABILIDADES
// =========================================

function obtenerRareza() {

  const numero = Math.random() * 100;

  if (numero < 45) {
    return "⚪ Común";
  }

  if (numero < 70) {
    return "🟢 Poco común";
  }

  if (numero < 85) {
    return "🔵 Rara";
  }

  if (numero < 94) {
    return "🟣 Épica";
  }

  if (numero < 99) {
    return "🟠 Legendaria";
  }

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

  if (disponibles.length === 0) {

    return cartas[
      Math.floor(Math.random() * cartas.length)
    ];
  }

  return disponibles[
    Math.floor(Math.random() * disponibles.length)
  ];
}

// =========================================
// 📊 TOTAL DE CARTAS
// =========================================

function obtenerTotalCartas(usuario) {

  if (
    !usuario ||
    !Array.isArray(usuario.cartas)
  ) {
    return 0;
  }

  return usuario.cartas.reduce(
    (total, carta) => {

      return (
        total +
        (Number(carta.cantidad) || 0)
      );

    },
    0
  );
}

// =========================================
// 📚 CARTAS DIFERENTES
// =========================================

function obtenerCartasDiferentes(usuario) {

  if (
    !usuario ||
    !Array.isArray(usuario.cartas)
  ) {
    return 0;
  }

  return usuario.cartas.length;
}

// =========================================
// 🃏 EJECUTAR SISTEMA DE CARTAS
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

    const carta =
      obtenerCartaAleatoria();

    if (!carta) {

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No se pudo generar una carta."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    // ===================================
    // 👤 OBTENER USUARIO
    // ===================================

    let usuario;

    try {

      usuario =
        obtenerUsuario(id);

    } catch (error) {

      console.error(
        "❌ Error obteniendo usuario:",
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No se pudo acceder a los datos del usuario."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    if (!usuario) {
      usuario = {};
    }

    if (!Array.isArray(usuario.cartas)) {
      usuario.cartas = [];
    }

    // ===================================
    // 🔎 BUSCAR CARTA EXISTENTE
    // ===================================

    const existente =
      usuario.cartas.find(
        c =>
          Number(c.id) === carta.id
      );

    const nuevaCarta =
      !existente;

    // ===================================
    // ➕ AGREGAR CARTA
    // ===================================

    if (existente) {

      existente.cantidad =
        (Number(existente.cantidad) || 0) + 1;

    } else {

      usuario.cartas.push({
        id: carta.id,
        cantidad: 1
      });
    }

    // ===================================
    // 💾 GUARDAR USUARIO
    // ===================================

    try {

      guardarUsuario(
        id,
        usuario
      );

    } catch (error) {

      console.error(
        "❌ Error guardando usuario:",
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ La carta se generó, pero no se pudo guardar la colección."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    // ===================================
    // 🖼️ OBTENER IMAGEN
    // ===================================

    const imagen =
      obtenerImagen(carta.id);

    // ===================================
    // 📊 ESTADÍSTICAS
    // ===================================

    const diferentes =
      obtenerCartasDiferentes(
        usuario
      );

    const total =
      obtenerTotalCartas(
        usuario
      );

    // ===================================
    // 📝 MENSAJE
    // ===================================

    const caption =
`🃏 *¡CARTA OBTENIDA!*

🛡️ *${carta.nombre}*
✨ Rareza: *${carta.rareza}*
🔢 Carta: *#${carta.id}*

${
  nuevaCarta
    ? "🎉 ¡NUEVA CARTA PARA TU COLECCIÓN!"
    : "♻️ ¡HAS CONSEGUIDO OTRA COPIA!"
}

📚 Colección: *${diferentes}/24*
📦 Cartas totales: *${total}*`;

    // ===================================
    // 🖼️ ENVIAR IMAGEN
    // ===================================

    if (imagen) {

      try {

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

      } catch (error) {

        console.error(
          "❌ Error enviando imagen:",
          error
        );

        await sock.sendMessage(
          chat,
          {
            text:
              caption +
              "\n\n⚠️ No se pudo cargar la imagen."
          },
          {
            quoted: msg
          }
        );
      }

    } else {

      await sock.sendMessage(
        chat,
        {
          text:
            caption +
            "\n\n🖼️ Imagen no disponible."
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

    let usuario;

    try {

      usuario =
        obtenerUsuario(id);

    } catch (error) {

      console.error(
        "❌ Error obteniendo usuario:",
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No se pudo cargar tu colección."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    if (
      !usuario ||
      !Array.isArray(usuario.cartas) ||
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

    for (
      const coleccion
      of usuario.cartas
    ) {

      const carta =
        cartas.find(
          c =>
            c.id ===
            Number(coleccion.id)
        );

      if (!carta) {
        continue;
      }

      texto +=
`${carta.rareza} #${carta.id} ${carta.nombre} ×${Number(coleccion.cantidad) || 0}\n`;
    }

    const diferentes =
      obtenerCartasDiferentes(
        usuario
      );

    const total =
      obtenerTotalCartas(
        usuario
      );

    texto +=
`
━━━━━━━━━━━━━━━━━━
📚 Diferentes: *${diferentes}/24*
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

    const numero =
      parseInt(
        args[0],
        10
      );

    if (
      isNaN(numero) ||
      numero < 1 ||
      numero > 24
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *CARTA INVÁLIDA*

Debes indicar un número del *1 al 24*.

Ejemplo:

*.cartainfo 20*`
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    const carta =
      cartas.find(
        c =>
          c.id === numero
      );

    if (!carta) {

      await sock.sendMessage(
        chat,
        {
          text:
            "❌ No se encontró esa carta."
        },
        {
          quoted: msg
        }
      );

      return true;
    }

    const imagen =
      obtenerImagen(
        carta.id
      );

    const texto =
`🃏 *INFORMACIÓN DE CARTA*

🛡️ *${carta.nombre}*
✨ Rareza: *${carta.rareza}*
🔢 Carta: *#${carta.id}*`;

    // ===================================
    // 🖼️ ENVIAR IMAGEN
    // ===================================

    if (imagen) {

      try {

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

      } catch (error) {

        console.error(
          "❌ Error enviando imagen:",
          error
        );

        await sock.sendMessage(
          chat,
          {
            text:
              texto +
              "\n\n⚠️ No se pudo cargar la imagen."
          },
          {
            quoted: msg
          }
        );
      }

    } else {

      await sock.sendMessage(
        chat,
        {
          text:
            texto +
            "\n\n🖼️ Imagen no disponible."
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

    // ===================================
    // 📂 LEER USUARIOS
    // ===================================

    try {

      if (
        fs.existsSync(
          archivo
        )
      ) {

        const contenido =
          fs.readFileSync(
            archivo,
            "utf8"
          );

        if (
          contenido.trim()
        ) {

          usuarios =
            JSON.parse(
              contenido
            );
        }
      }

    } catch (error) {

      console.error(
        "❌ Error leyendo usuarios.json:",
        error
      );

      usuarios = {};
    }

    // ===================================
    // 🏆 CREAR RANKING
    // ===================================

    const ranking =
      Object.entries(
        usuarios
      )

      .map(
        ([jid, usuario]) => {

          const coleccion =
            Array.isArray(
              usuario.cartas
            )
              ? usuario.cartas
              : [];

          const diferentes =
            coleccion.length;

          const copias =
            coleccion.reduce(
              (
                suma,
                carta
              ) => {

                return (
                  suma +
                  (
                    Number(
                      carta.cantidad
                    ) || 0
                  )
                );

              },
              0
            );

          return {
            jid,
            diferentes,
            copias
          };
        }
      )

      .filter(
        jugador =>
          jugador.diferentes > 0
      )

      .sort(
        (a, b) => {

          if (
            b.diferentes !==
            a.diferentes
          ) {

            return (
              b.diferentes -
              a.diferentes
            );
          }

          return (
            b.copias -
            a.copias
          );
        }
      )

      .slice(
        0,
        10
      );

    // ===================================
    // 📝 MENSAJE DEL RANKING
    // ===================================

    let texto =
`🏆 *RANKING DE COLECCIONISTAS*

`;

    if (
      ranking.length === 0
    ) {

      texto +=
        "Todavía nadie tiene cartas.";

    } else {

      ranking.forEach(
        (
          jugador,
          index
        ) => {

          const numero =
            String(
              jugador.jid
                .split("@")[0]
            );

          texto +=
`${index + 1}. @${numero}
🃏 ${jugador.diferentes}/24 diferentes
📦 ${jugador.copias} copias

`;
        }
      );
    }

    // ===================================
    // 📤 ENVIAR RANKING
    // ===================================

    await sock.sendMessage(
      chat,
      {
        text: texto,
        mentions:
          ranking.map(
            jugador =>
              jugador.jid
          )
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  // =====================================
  // ❌ COMANDO NO ENCONTRADO
  // =====================================

  return false;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = ejecutarCartas;
