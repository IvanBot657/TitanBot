// ========================================
// TITANBOT v3.5
// SISTEMA ANIME + PERSONAJES RECLAMABLES
// IMÁGENES AUTOMÁTICAS CON JIKAN API
// ========================================

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ========================================
// API JIKAN
// ========================================

const JIKAN_API = "https://api.jikan.moe/v4";

// ========================================
// CARPETA DE DATOS
// ========================================

const DATA_DIR = path.join(
  __dirname,
  "..",
  "database"
);

const DATA_FILE = path.join(
  DATA_DIR,
  "anime_reclamados.json"
);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({}, null, 2)
  );
}

// ========================================
// DATOS
// ========================================

function cargarReclamados() {
  try {
    return JSON.parse(
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      )
    );
  } catch (error) {
    console.error(
      "❌ Error leyendo personajes:",
      error
    );

    return {};
  }
}

function guardarReclamados(data) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      data,
      null,
      2
    )
  );
}

// ========================================
// OBTENER ID
// ========================================

function obtenerId(msg, id) {
  if (id) {
    return id;
  }

  return (
    msg?.key?.participant ||
    msg?.key?.remoteJid ||
    msg?.participant ||
    "usuario"
  );
}

// ========================================
// LIMPIAR ID
// ========================================

function limpiarId(id) {
  return String(id)
    .replace("@s.whatsapp.net", "")
    .replace("@lid", "")
    .replace("@g.us", "");
}

// ========================================
// PERSONAJES ANIME
// ========================================
// Las imágenes NO se colocan manualmente.
// Jikan API devuelve la URL automáticamente.
// ========================================

const personajesAnime = [
  {
    id: 1,
    nombre: "Goku",
    anime: "Dragon Ball",
    frase:
      "Siempre hay una nueva forma de superar tus límites."
  },

  {
    id: 2,
    nombre: "Naruto Uzumaki",
    anime: "Naruto",
    frase:
      "Nunca abandones aquello por lo que decidiste luchar."
  },

  {
    id: 3,
    nombre: "Monkey D. Luffy",
    anime: "One Piece",
    frase:
      "Persigue tus sueños aunque el camino sea difícil."
  },

  {
    id: 4,
    nombre: "Ichigo Kurosaki",
    anime: "Bleach",
    frase:
      "Protege aquello que consideras importante."
  },

  {
    id: 5,
    nombre: "Satoru Gojo",
    anime: "Jujutsu Kaisen",
    frase:
      "La confianza también puede convertirse en poder."
  },

  {
    id: 6,
    nombre: "Levi Ackerman",
    anime: "Shingeki no Kyojin",
    frase:
      "Toma tus decisiones y acepta el camino que elegiste."
  },

  {
    id: 7,
    nombre: "Tanjiro Kamado",
    anime: "Demon Slayer",
    frase:
      "La bondad puede mantenerse incluso en los momentos difíciles."
  },

  {
    id: 8,
    nombre: "Eren Yeager",
    anime: "Shingeki no Kyojin",
    frase:
      "Avanza incluso cuando el camino parece imposible."
  },

  {
    id: 9,
    nombre: "Light Yagami",
    anime: "Death Note",
    frase:
      "El poder cambia las reglas cuando decides utilizarlo."
  },

  {
    id: 10,
    nombre: "Edward Elric",
    anime: "Fullmetal Alchemist",
    frase:
      "Todo esfuerzo tiene un precio y una consecuencia."
  },

  {
    id: 11,
    nombre: "Killua Zoldyck",
    anime: "Hunter x Hunter",
    frase:
      "Tu verdadero potencial aparece cuando confías en ti."
  },

  {
    id: 12,
    nombre: "Izuku Midoriya",
    anime: "My Hero Academia",
    frase:
      "Ser valiente también significa ayudar a los demás."
  }
];

// ========================================
// PERSONAJE DISPONIBLE
// ========================================

function obtenerPersonajeDisponible(reclamados) {
  const disponibles =
    personajesAnime.filter(
      personaje =>
        !Object.values(reclamados).some(
          p =>
            p.personajeId === personaje.id
        )
    );

  if (!disponibles.length) {
    return null;
  }

  return disponibles[
    Math.floor(
      Math.random() * disponibles.length
    )
  ];
}

// ========================================
// NORMALIZAR NOMBRE
// ========================================

function normalizarNombre(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ========================================
// BUSCAR IMAGEN CON JIKAN API
// ========================================

async function buscarImagenPersonaje(nombre) {
  try {
    console.log(
      `🔎 Buscando imagen de ${nombre} en Jikan...`
    );

    const url =
      `${JIKAN_API}/characters?q=${encodeURIComponent(nombre)}&limit=5`;

    const respuesta =
      await fetch(url);

    if (!respuesta.ok) {
      throw new Error(
        `Jikan respondió HTTP ${respuesta.status}`
      );
    }

    const datos =
      await respuesta.json();

    if (
      !datos ||
      !Array.isArray(datos.data) ||
      datos.data.length === 0
    ) {
      console.log(
        `⚠️ Jikan no encontró ${nombre}`
      );

      return null;
    }

    const nombreBuscado =
      normalizarNombre(nombre);

    // Primero buscamos coincidencia exacta
    const personajeExacto =
      datos.data.find(
        personaje =>
          normalizarNombre(
            personaje?.name
          ) === nombreBuscado
      );

    // Si no hay coincidencia exacta,
    // usamos el primer resultado
    const personajeEncontrado =
      personajeExacto ||
      datos.data[0];

    const imagen =
      personajeEncontrado?.images?.jpg?.image_url ||
      personajeEncontrado?.images?.webp?.image_url ||
      null;

    if (!imagen) {
      console.log(
        `⚠️ No hay imagen disponible para ${nombre}`
      );

      return null;
    }

    console.log(
      `✅ Imagen encontrada para ${nombre}`
    );

    console.log(
      `🖼️ URL obtenida por Jikan: ${imagen}`
    );

    return imagen;

  } catch (error) {
    console.error(
      "❌ Error buscando imagen en Jikan:",
      error
    );

    return null;
  }
}

// ========================================
// DESCARGAR IMAGEN
// ========================================

async function descargarImagen(url) {
  try {
    if (!url) {
      return null;
    }

    const respuesta =
      await fetch(url);

    if (!respuesta.ok) {
      throw new Error(
        `HTTP ${respuesta.status}`
      );
    }

    return Buffer.from(
      await respuesta.arrayBuffer()
    );

  } catch (error) {
    console.error(
      "❌ Error descargando imagen:",
      error
    );

    return null;
  }
}

// ========================================
// ESCAPAR TEXTO
// ========================================

function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ========================================
// CREAR TARJETA ANIME
// ========================================

async function crearTarjeta({
  personaje,
  nombreUsuario,
  idUsuario,
  estado = "RECLAMADO"
}) {

  const ancho = 1000;
  const alto = 1350;

  const imagen =
    await descargarImagen(
      personaje.image
    );

  // ======================================
  // FONDO
  // ======================================

  const fondo =
    Buffer.from(`
<svg
  width="${ancho}"
  height="${alto}"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>

    <linearGradient
      id="bg"
      x1="0"
      y1="0"
      x2="1"
      y2="1"
    >
      <stop
        offset="0%"
        stop-color="#09091c"
      />

      <stop
        offset="50%"
        stop-color="#17104a"
      />

      <stop
        offset="100%"
        stop-color="#05050d"
      />
    </linearGradient>

    <linearGradient
      id="linea"
      x1="0"
      y1="0"
      x2="1"
      y2="0"
    >
      <stop
        offset="0%"
        stop-color="#5b5cff"
      />

      <stop
        offset="100%"
        stop-color="#00e5ff"
      />
    </linearGradient>

  </defs>

  <rect
    width="100%"
    height="100%"
    fill="url(#bg)"
  />

  <circle
    cx="800"
    cy="180"
    r="180"
    fill="none"
    stroke="#5b5cff"
    stroke-width="3"
    opacity="0.25"
  />

  <circle
    cx="150"
    cy="1100"
    r="230"
    fill="none"
    stroke="#00e5ff"
    stroke-width="3"
    opacity="0.15"
  />

  <path
    d="M0 260 L1000 70"
    stroke="url(#linea)"
    stroke-width="3"
    opacity="0.35"
  />

  <path
    d="M0 1240 L1000 1040"
    stroke="url(#linea)"
    stroke-width="3"
    opacity="0.25"
  />

  <rect
    x="35"
    y="35"
    width="930"
    height="1280"
    rx="35"
    fill="none"
    stroke="#6b6dff"
    stroke-width="4"
  />

  <rect
    x="55"
    y="55"
    width="890"
    height="1240"
    rx="28"
    fill="none"
    stroke="#ffffff"
    stroke-width="1"
    opacity="0.25"
  />

</svg>
`);

  // ======================================
  // TEXTO
  // ======================================

  const texto =
    Buffer.from(`
<svg
  width="${ancho}"
  height="${alto}"
  xmlns="http://www.w3.org/2000/svg"
>

  <text
    x="500"
    y="115"
    text-anchor="middle"
    font-family="Arial"
    font-size="52"
    font-weight="bold"
    fill="white"
  >
    TITANBOT
  </text>

  <text
    x="500"
    y="160"
    text-anchor="middle"
    font-family="Arial"
    font-size="24"
    fill="#9ca3ff"
  >
    ANIME CHARACTER
  </text>

  <text
    x="500"
    y="930"
    text-anchor="middle"
    font-family="Arial"
    font-size="46"
    font-weight="bold"
    fill="white"
  >
    ${escapar(personaje.nombre)}
  </text>

  <text
    x="500"
    y="975"
    text-anchor="middle"
    font-family="Arial"
    font-size="27"
    fill="#b9c0ff"
  >
    ${escapar(personaje.anime)}
  </text>

  <rect
    x="280"
    y="1010"
    width="440"
    height="65"
    rx="32"
    fill="#153b29"
    stroke="#45ff9a"
    stroke-width="2"
  />

  <text
    x="500"
    y="1053"
    text-anchor="middle"
    font-family="Arial"
    font-size="30"
    font-weight="bold"
    fill="#45ff9a"
  >
    ● ${escapar(estado)}
  </text>

  <text
    x="90"
    y="1145"
    font-family="Arial"
    font-size="25"
    fill="#8f96ff"
  >
    NOMBRE
  </text>

  <text
    x="90"
    y="1180"
    font-family="Arial"
    font-size="30"
    fill="white"
  >
    ${escapar(nombreUsuario)}
  </text>

  <text
    x="90"
    y="1225"
    font-family="Arial"
    font-size="25"
    fill="#8f96ff"
  >
    ID
  </text>

  <text
    x="90"
    y="1260"
    font-family="Arial"
    font-size="27"
    fill="white"
  >
    ${escapar(idUsuario)}
  </text>

</svg>
`);

  // ======================================
  // FRASE
  // ======================================

  const frase =
    Buffer.from(`
<svg
  width="${ancho}"
  height="${alto}"
  xmlns="http://www.w3.org/2000/svg"
>

  <rect
    x="85"
    y="650"
    width="830"
    height="180"
    rx="25"
    fill="#05050d"
    opacity="0.82"
    stroke="#7778ff"
    stroke-width="2"
  />

  <text
    x="500"
    y="705"
    text-anchor="middle"
    font-family="Arial"
    font-size="25"
    fill="#8f96ff"
  >
    ✦ FRASE DEL PERSONAJE ✦
  </text>

  <text
    x="500"
    y="755"
    text-anchor="middle"
    font-family="Arial"
    font-size="25"
    fill="white"
  >
    ${escapar(personaje.frase)}
  </text>

</svg>
`);

  // ======================================
  // CONSTRUIR TARJETA
  // ======================================

  let base =
    sharp(fondo);

  if (imagen) {

    const personajeImagen =
      await sharp(imagen)
        .resize(700, 650, {
          fit: "cover",
          position: "centre"
        })
        .jpeg()
        .toBuffer();

    base =
      base.composite([
        {
          input: personajeImagen,
          left: 150,
          top: 190
        }
      ]);

  } else {

    const sinImagen =
      Buffer.from(`
<svg
  width="700"
  height="650"
  xmlns="http://www.w3.org/2000/svg"
>

  <rect
    width="700"
    height="650"
    rx="35"
    fill="#101020"
  />

  <text
    x="350"
    y="310"
    text-anchor="middle"
    font-family="Arial"
    font-size="42"
    fill="white"
  >
    ${escapar(personaje.nombre)}
  </text>

  <text
    x="350"
    y="370"
    text-anchor="middle"
    font-family="Arial"
    font-size="25"
    fill="#9ca3ff"
  >
    Imagen no disponible
  </text>

</svg>
`);

    base =
      base.composite([
        {
          input: sinImagen,
          left: 150,
          top: 190
        }
      ]);
  }

  return await base
    .composite([
      {
        input: frase,
        left: 0,
        top: 0
      },
      {
        input: texto,
        left: 0,
        top: 0
      }
    ])
    .jpeg({
      quality: 90
    })
    .toBuffer();
}

// ========================================
// FUNCIÓN PRINCIPAL
// ========================================

async function anime(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {

  comando =
    String(comando || "")
      .toLowerCase()
      .replace(/^\./, "");

  const idUsuario =
    limpiarId(
      obtenerId(msg, id)
    );

  try {

    // ======================================
    // MENÚ ANIME
    // ======================================

    if (
      (
        comando === "anime" &&
        args.length === 0
      ) ||
      comando === "animemenu"
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`🌸 TITANBOT — ANIME

🎌 COMANDOS

🎴 .s
📚 .mispersonajes
🔎 .personajes
🔓 .liberar

🔎 .anime Naruto
📖 .animeinfo Naruto
👤 .personaje Goku
📚 .manga One Piece

💖 .waifu
⚔️ .husbando

━━━━━━━━━━━━━━━━━━

🎴 SISTEMA DE PERSONAJES

Usa:

.s

para reclamar un personaje anime.`
        }
      );

      return true;
    }

    // ======================================
    // .S — RECLAMAR
    // ======================================

    if (comando === "s") {

      const reclamados =
        cargarReclamados();

      if (reclamados[idUsuario]) {

        const actual =
          personajesAnime.find(
            p =>
              p.id ===
              reclamados[
                idUsuario
              ].personajeId
          );

        if (actual) {

          await sock.sendMessage(
            chat,
            {
              text:
`🎴 YA TIENES UN PERSONAJE

⭐ ${actual.nombre}

🎌 ${actual.anime}

🔒 Este personaje ya está reclamado por ti.

Usa:

.mispersonajes`
            }
          );

          return true;
        }
      }

      // ====================================
      // ELEGIR PERSONAJE LIBRE
      // ====================================

      const personaje =
        obtenerPersonajeDisponible(
          reclamados
        );

      if (!personaje) {

        await sock.sendMessage(
          chat,
          {
            text:
`😔 NO HAY PERSONAJES DISPONIBLES

Todos los personajes de la colección están reclamados.

🎌 Próximamente habrá más personajes.`
          }
        );

        return true;
      }

      const nombreUsuario =
        msg?.pushName ||
        "Usuario";

      // ====================================
      // BUSCAR IMAGEN EN LA API
      // ====================================

      await sock.sendMessage(
        chat,
        {
          text:
`🔎 BUSCANDO PERSONAJE

⭐ ${personaje.nombre}

🌐 Consultando Jikan API...
⏳ Un momento...`
        }
      );

      const imagenAPI =
        await buscarImagenPersonaje(
          personaje.nombre
        );

      if (!imagenAPI) {

        await sock.sendMessage(
          chat,
          {
            text:
`❌ NO SE ENCONTRÓ LA IMAGEN

No pude obtener una imagen válida de:

⭐ ${personaje.nombre}

El personaje NO fue reclamado.

🔄 Intenta nuevamente con:

.s`
          }
        );

        return true;
      }

      // ====================================
      // PERSONAJE CON IMAGEN DE LA API
      // ====================================

      const personajeFinal = {
        ...personaje,
        image: imagenAPI
      };

      // ====================================
      // GUARDAR RECLAMACIÓN
      // ====================================

      reclamados[idUsuario] = {

        personajeId:
          personajeFinal.id,

        nombre:
          personajeFinal.nombre,

        anime:
          personajeFinal.anime,

        frase:
          personajeFinal.frase,

        image:
          personajeFinal.image,

        reclamadoPor:
          idUsuario,

        nombreUsuario:
          nombreUsuario,

        fecha:
          new Date().toISOString()
      };

      guardarReclamados(
        reclamados
      );

      // ====================================
      // CREAR TARJETA
      // ====================================

      try {

        const tarjeta =
          await crearTarjeta({
            personaje:
              personajeFinal,

            nombreUsuario:
              nombreUsuario,

            idUsuario:
              idUsuario,

            estado:
              "RECLAMADO"
          });

        await sock.sendMessage(
          chat,
          {
            image:
              tarjeta,

            caption:
`🎌✨ ¡RECLAMASTE ESTE PERSONAJE! ✨🎌

⭐ ${personajeFinal.nombre}

🎌 ${personajeFinal.anime}

👤 ${nombreUsuario}

🆔 ${idUsuario}

🟢 ESTADO:
RECLAMADO

💬 "${personajeFinal.frase}"

🖼️ Imagen obtenida automáticamente mediante Jikan API.

🎴 Usa .mispersonajes para verlo nuevamente.`
          }
        );

      } catch (error) {

        console.error(
          "❌ Error creando tarjeta:",
          error
        );

        await sock.sendMessage(
          chat,
          {
            text:
`🎌✨ ¡RECLAMASTE ESTE PERSONAJE!

⭐ ${personajeFinal.nombre}

🎌 ${personajeFinal.anime}

👤 ${nombreUsuario}

🆔 ${idUsuario}

🟢 ESTADO:
RECLAMADO

💬 "${personajeFinal.frase}"`
          }
        );
      }

      return true;
      }    
    
    // ======================================
    // MIS PERSONAJES
    // ======================================
    if (comando === "mispersonajes" || comando === "mispersonaje") {
      const reclamados = cargarReclamados();
      const personajesUsuario = Object.values(reclamados).filter(
        personaje => personaje.usuarioId === usuarioId
      );

      if (personajesUsuario.length === 0) {
        await sock.sendMessage(chat, {
          text:
            "📭 No tienes personajes reclamados todavía.\n\n" +
            "Usa *.s* para reclamar uno."
        }, { quoted: msg });

        return true;
      }

      let texto = "🎴 *TUS PERSONAJES*\n\n";

      personajesUsuario.forEach((personaje, index) => {
        texto +=
          `${index + 1}. ⭐ *${escapar(personaje.nombre)}*\n` +
          `   🎬 Anime: ${escapar(personaje.anime)}\n` +
          `   📅 Reclamado: ${personaje.fecha || "Sin fecha"}\n\n`;
      });

      await sock.sendMessage(chat, {
        text: texto
      }, { quoted: msg });

      return true;
    }


    // ======================================
    // PERSONAJES DISPONIBLES
    // ======================================
    if (comando === "personajes") {
      const reclamados = cargarReclamados();

      const disponibles = personajesAnime.filter(
        personaje => !reclamados[personaje.id]
      );

      if (disponibles.length === 0) {
        await sock.sendMessage(chat, {
          text:
            "😢 *No quedan personajes disponibles.*\n\n" +
            "Todos los personajes fueron reclamados."
        }, { quoted: msg });

        return true;
      }

      let texto = "🎴 *PERSONAJES DISPONIBLES*\n\n";

      disponibles.forEach((personaje, index) => {
        texto +=
          `${index + 1}. ⭐ *${escapar(personaje.nombre)}*\n` +
          `   🎬 ${escapar(personaje.anime)}\n\n`;
      });

      texto +=
        "━━━━━━━━━━━━━━━━━━\n" +
        "💡 Usa *.s* para reclamar un personaje.";

      await sock.sendMessage(chat, {
        text: texto
      }, { quoted: msg });

      return true;
    }


    // ======================================
    // LIBERAR PERSONAJE
    // ======================================
    if (comando === "liberar") {
      const reclamados = cargarReclamados();

      const personajesUsuario = Object.entries(reclamados).filter(
        ([, personaje]) => personaje.usuarioId === usuarioId
      );

      if (personajesUsuario.length === 0) {
        await sock.sendMessage(chat, {
          text: "📭 No tienes ningún personaje reclamado."
        }, { quoted: msg });

        return true;
      }

      const numero = parseInt(args[0]);

      if (!numero || numero < 1 || numero > personajesUsuario.length) {
        let texto = "♻️ *LIBERAR PERSONAJE*\n\n";

        personajesUsuario.forEach(([idPersonaje, personaje], index) => {
          texto +=
            `${index + 1}. *${escapar(personaje.nombre)}*\n` +
            `   ID: ${idPersonaje}\n\n`;
        });

        texto +=
          "Para liberar uno escribe:\n" +
          "*.liberar número*\n\n" +
          "Ejemplo: *.liberar 1*";

        await sock.sendMessage(chat, {
          text: texto
        }, { quoted: msg });

        return true;
      }

      const [idPersonaje, personaje] = personajesUsuario[numero - 1];

      delete reclamados[idPersonaje];
      guardarReclamados(reclamados);

      await sock.sendMessage(chat, {
        text:
          `♻️ *PERSONAJE LIBERADO*\n\n` +
          `🎴 ${escapar(personaje.nombre)}\n` +
          `🎬 ${escapar(personaje.anime)}\n\n` +
          `Ahora puede ser reclamado nuevamente.`
      }, { quoted: msg });

      return true;
    }


    // ======================================
    // ANIMEBUSCAR
    // ======================================
    if (comando === "animebuscar") {
      const nombre = args.join(" ").trim();

      if (!nombre) {
        await sock.sendMessage(chat, {
          text:
            "🔎 *ANIME BUSCAR*\n\n" +
            "Escribe el nombre de un anime.\n\n" +
            "Ejemplo:\n" +
            "*.animebuscar Naruto*"
        }, { quoted: msg });

        return true;
      }

      try {
        const url =
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(nombre)}&limit=5`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          throw new Error(`Jikan HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (!datos.data || datos.data.length === 0) {
          await sock.sendMessage(chat, {
            text: `❌ No encontré resultados para *${escapar(nombre)}*.`
          }, { quoted: msg });

          return true;
        }

        let texto = `🔎 *RESULTADOS PARA: ${escapar(nombre)}*\n\n`;

        datos.data.forEach((animeEncontrado, index) => {
          texto +=
            `*${index + 1}. ${escapar(animeEncontrado.title || "Sin título")}*\n` +
            `🆔 MAL ID: ${animeEncontrado.mal_id || "N/A"}\n` +
            `⭐ Score: ${animeEncontrado.score || "N/A"}\n` +
            `📺 Episodios: ${animeEncontrado.episodes || "N/A"}\n` +
            `📅 Estado: ${escapar(animeEncontrado.status || "N/A")}\n\n`;
        });

        await sock.sendMessage(chat, {
          text: texto
        }, { quoted: msg });

      } catch (error) {
        console.error("❌ Error en animebuscar:", error);

        await sock.sendMessage(chat, {
          text:
            "❌ No pude consultar Jikan en este momento.\n" +
            "Inténtalo nuevamente en unos segundos."
        }, { quoted: msg });
      }

      return true;
    }


    // ======================================
    // ANIME
    // ======================================
    if (comando === "anime") {
      const nombre = args.join(" ").trim();

      if (!nombre) {
        await sock.sendMessage(chat, {
          text:
            "🎬 *ANIME*\n\n" +
            "Escribe el nombre de un anime.\n\n" +
            "Ejemplo:\n" +
            "*.anime One Piece*"
        }, { quoted: msg });

        return true;
      }

      try {
        const url =
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(nombre)}&limit=1`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          throw new Error(`Jikan HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        const animeEncontrado = datos.data?.[0];

        if (!animeEncontrado) {
          await sock.sendMessage(chat, {
            text: `❌ No encontré el anime *${escapar(nombre)}*.`
          }, { quoted: msg });

          return true;
        }

        const texto =
          `🎬 *${escapar(animeEncontrado.title || "Sin título")}*\n\n` +
          `📝 ${escapar(animeEncontrado.synopsis || "Sin sinopsis disponible.")}\n\n` +
          `⭐ Score: ${animeEncontrado.score || "N/A"}\n` +
          `📺 Episodios: ${animeEncontrado.episodes || "N/A"}\n` +
          `📅 Estado: ${escapar(animeEncontrado.status || "N/A")}\n` +
          `🎭 Tipo: ${escapar(animeEncontrado.type || "N/A")}`;

        const imagen =
          animeEncontrado.images?.jpg?.large_image_url ||
          animeEncontrado.images?.jpg?.image_url ||
          animeEncontrado.images?.webp?.large_image_url ||
          animeEncontrado.images?.webp?.image_url;

        if (imagen) {
          const imagenBuffer = await descargarImagen(imagen);

          if (imagenBuffer) {
            await sock.sendMessage(chat, {
              image: imagenBuffer,
              caption: texto
            }, { quoted: msg });
          } else {
            await sock.sendMessage(chat, {
              text: texto
            }, { quoted: msg });
          }
        } else {
          await sock.sendMessage(chat, {
            text: texto
          }, { quoted: msg });
        }

      } catch (error) {
        console.error("❌ Error en anime:", error);

        await sock.sendMessage(chat, {
          text:
            "❌ Ocurrió un error consultando el anime.\n" +
            "Inténtalo nuevamente."
        }, { quoted: msg });
      }

      return true;
    }


    // ======================================
    // ANIMEINFO
    // ======================================
    if (comando === "animeinfo") {
      const numero = parseInt(args[0]);

      if (!numero) {
        await sock.sendMessage(chat, {
          text:
            "ℹ️ *ANIMEINFO*\n\n" +
            "Usa el número MAL ID de un anime.\n\n" +
            "Ejemplo:\n" +
            "*.animeinfo 20*"
        }, { quoted: msg });

        return true;
      }

      try {
        const url = `https://api.jikan.moe/v4/anime/${numero}/full`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          throw new Error(`Jikan HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        const animeEncontrado = datos.data;

        if (!animeEncontrado) {
          await sock.sendMessage(chat, {
            text: "❌ No encontré información para ese MAL ID."
          }, { quoted: msg });

          return true;
        }

        const generos = animeEncontrado.genres
          ?.map(g => g.name)
          .join(", ") || "N/A";

        const estudios = animeEncontrado.studios
          ?.map(s => s.name)
          .join(", ") || "N/A";

        const texto =
          `🎬 *${escapar(animeEncontrado.title || "Sin título")}*\n\n` +
          `📝 ${escapar(animeEncontrado.synopsis || "Sin sinopsis.")}\n\n` +
          `⭐ Score: ${animeEncontrado.score || "N/A"}\n` +
          `📺 Episodios: ${animeEncontrado.episodes || "N/A"}\n` +
          `🎞️ Tipo: ${escapar(animeEncontrado.type || "N/A")}\n` +
          `📅 Estado: ${escapar(animeEncontrado.status || "N/A")}\n` +
          `🎭 Géneros: ${escapar(generos)}\n` +
          `🏢 Estudio: ${escapar(estudios)}`;

        const imagen =
          animeEncontrado.images?.jpg?.large_image_url ||
          animeEncontrado.images?.jpg?.image_url;

        if (imagen) {
          const buffer = await descargarImagen(imagen);

          if (buffer) {
            await sock.sendMessage(chat, {
              image: buffer,
              caption: texto
            }, { quoted: msg });

            return true;
          }
        }

        await sock.sendMessage(chat, {
          text: texto
        }, { quoted: msg });

      } catch (error) {
        console.error("❌ Error en animeinfo:", error);

        await sock.sendMessage(chat, {
          text:
            "❌ No pude obtener la información del anime."
        }, { quoted: msg });
      }

      return true;
    }


    // ======================================
    // PERSONAJE
    // ======================================
    if (comando === "personaje") {
      const nombre = args.join(" ").trim();

      if (!nombre) {
        await sock.sendMessage(chat, {
          text:
            "👤 *PERSONAJE*\n\n" +
            "Escribe el nombre de un personaje.\n\n" +
            "Ejemplo:\n" +
            "*.personaje Goku*"
        }, { quoted: msg });

        return true;
      }

      try {
        const imagen = await buscarImagenPersonaje(nombre);

        const url =
          `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(nombre)}&limit=1`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          throw new Error(`Jikan HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        const personaje = datos.data?.[0];

        if (!personaje) {
          await sock.sendMessage(chat, {
            text: `❌ No encontré el personaje *${escapar(nombre)}*.`
          }, { quoted: msg });

          return true;
        }

        let animeRelacionado = "No disponible";

        if (personaje.animeography && personaje.animeography.length > 0) {
          animeRelacionado = personaje.animeography
            .slice(0, 5)
            .map(item => item.name)
            .join(", ");
        }

        const texto =
          `👤 *${escapar(personaje.name || nombre)}*\n\n` +
          `🎬 Anime: ${escapar(animeRelacionado)}\n` +
          `🆔 MAL ID: ${personaje.mal_id || "N/A"}\n\n` +
          `🔎 Información obtenida mediante Jikan API.`;

        if (imagen) {
          const buffer = await descargarImagen(imagen);

          if (buffer) {
            await sock.sendMessage(chat, {
              image: buffer,
              caption: texto
            }, { quoted: msg });

            return true;
          }
        }

        await sock.sendMessage(chat, {
          text: texto
        }, { quoted: msg });

      } catch (error) {
        console.error("❌ Error en personaje:", error);

        await sock.sendMessage(chat, {
          text:
            "❌ No pude consultar ese personaje.\n" +
            "Inténtalo nuevamente."
        }, { quoted: msg });
      }

      return true;
    }


    // ======================================
    // MANGA
    // ======================================
    if (comando === "manga") {
      const nombre = args.join(" ").trim();

      if (!nombre) {
        await sock.sendMessage(chat, {
          text:
            "📚 *MANGA*\n\n" +
            "Escribe el nombre de un manga.\n\n" +
            "Ejemplo:\n" +
            "*.manga Naruto*"
        }, { quoted: msg });

        return true;
      }

      try {
        const url =
          `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(nombre)}&limit=1`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          throw new Error(`Jikan HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        const manga = datos.data?.[0];

        if (!manga) {
          await sock.sendMessage(chat, {
            text: `❌ No encontré el manga *${escapar(nombre)}*.`
          }, { quoted: msg });

          return true;
        }

        const texto =
          `📚 *${escapar(manga.title || "Sin título")}*\n\n` +
          `📝 ${escapar(manga.synopsis || "Sin sinopsis disponible.")}\n\n` +
          `⭐ Score: ${manga.score || "N/A"}\n` +
          `📖 Capítulos: ${manga.chapters || "N/A"}\n` +
          `📕 Volúmenes: ${manga.volumes || "N/A"}\n` +
          `📅 Estado: ${escapar(manga.status || "N/A")}`;

        const imagen =
          manga.images?.jpg?.large_image_url ||
          manga.images?.jpg?.image_url;

        if (imagen) {
          const buffer = await descargarImagen(imagen);

          if (buffer) {
            await sock.sendMessage(chat, {
              image: buffer,
              caption: texto
            }, { quoted: msg });

            return true;
          }
        }

        await sock.sendMessage(chat, {
          text: texto
        }, { quoted: msg });

      } catch (error) {
        console.error("❌ Error en manga:", error);

        await sock.sendMessage(chat, {
          text: "❌ No pude consultar el manga."
        }, { quoted: msg });
      }

      return true;
    }


    // ======================================
    // WAIFU
    // ======================================
    if (comando === "waifu") {
      try {
        const url = "https://api.waifu.pics/sfw/waifu";

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          throw new Error(`Waifu API HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (!datos?.url) {
          throw new Error("La API no devolvió una imagen.");
        }

        const imagen = await descargarImagen(datos.url);

        if (!imagen) {
          throw new Error("No se pudo descargar la imagen.");
        }

        await sock.sendMessage(chat, {
          image: imagen,
          caption:
            "🌸 *WAIFU*\n\n" +
            "✨ Imagen obtenida automáticamente."
        }, { quoted: msg });

      } catch (error) {
        console.error("❌ Error en waifu:", error);

        await sock.sendMessage(chat, {
          text: "❌ No pude obtener una waifu en este momento."
        }, { quoted: msg });
      }

      return true;
    }


    // ======================================
    // HUSBANDO
    // ======================================
    if (comando === "husbando") {
      try {
        const url = "https://api.waifu.pics/sfw/waifu";

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          throw new Error(`API HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (!datos?.url) {
          throw new Error("No se recibió imagen.");
        }

        const imagen = await descargarImagen(datos.url);

        if (!imagen) {
          throw new Error("No se pudo descargar la imagen.");
        }

        await sock.sendMessage(chat, {
          image: imagen,
          caption:
            "🔥 *HUSBANDO*\n\n" +
            "✨ Imagen obtenida automáticamente."
        }, { quoted: msg });

      } catch (error) {
        console.error("❌ Error en husbando:", error);

        await sock.sendMessage(chat, {
          text: "❌ No pude obtener la imagen."
        }, { quoted: msg });
      }

      return true;
    }


    // ======================================
    // COMANDO NO ENCONTRADO
    // ======================================
    return false;

  } catch (error) {
    console.error("❌ Error general en anime.js:", error);

    try {
      await sock.sendMessage(chat, {
        text:
          "❌ Ocurrió un error ejecutando el comando de anime.\n" +
          "Revisa los logs de TitanBot."
      }, { quoted: msg });
    } catch (errorEnvio) {
      console.error("❌ No se pudo enviar el mensaje de error:", errorEnvio);
    }

    return true;
  }
}


// ========================================
// EXPORTAR
// ========================================

module.exports = anime;
