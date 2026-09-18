// commands/anime.js
// TitanBot - Sistema de personajes Anime

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ========================================
// CONFIGURACIÓN JIKAN API
// ========================================

const JIKAN_API = "https://api.jikan.moe/v4";

// ========================================
// ARCHIVO DE PERSONAJES RECLAMADOS
// ========================================

const DATA_DIR = path.join(__dirname, "..", "database");
const DATA_FILE = path.join(DATA_DIR, "anime_reclamados.json");

// ========================================
// CARGAR PERSONAJES RECLAMADOS
// ========================================

function cargarReclamados() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "{}", "utf8");
      return {};
    }

    const contenido = fs.readFileSync(DATA_FILE, "utf8").trim();

    if (!contenido) {
      return {};
    }

    return JSON.parse(contenido);

  } catch (error) {
    console.error("❌ Error cargando personajes:", error);
    return {};
  }
}

// ========================================
// GUARDAR PERSONAJES RECLAMADOS
// ========================================

function guardarReclamados(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return true;

  } catch (error) {
    console.error("❌ Error guardando personajes:", error);
    return false;
  }
}

// ========================================
// OBTENER ID DEL USUARIO
// ========================================

function obtenerId(msg, id) {
  return (
    id ||
    msg?.key?.participant ||
    msg?.participant ||
    msg?.sender ||
    msg?.key?.remoteJid ||
    "desconocido"
  );
}

// ========================================
// LIMPIAR ID
// ========================================

function limpiarId(id) {
  return String(id || "")
    .replace("@s.whatsapp.net", "")
    .replace("@lid", "")
    .replace("@g.us", "");
}

// ========================================
// PERSONAJES
// ========================================

const personajesAnime = [
  {
    id: 1,
    nombre: "Goku",
    anime: "Dragon Ball",
    frase: "¡Superaré mis límites!"
  },
  {
    id: 2,
    nombre: "Naruto Uzumaki",
    anime: "Naruto",
    frase: "¡Nunca me rindo!"
  },
  {
    id: 3,
    nombre: "Monkey D. Luffy",
    anime: "One Piece",
    frase: "¡Seré el Rey de los Piratas!"
  },
  {
    id: 4,
    nombre: "Ichigo Kurosaki",
    anime: "Bleach",
    frase: "¡Protegeré a todos!"
  },
  {
    id: 5,
    nombre: "Satoru Gojo",
    anime: "Jujutsu Kaisen",
    frase: "A lo largo del cielo y la tierra, solo yo soy el honrado."
  },
  {
    id: 6,
    nombre: "Levi Ackerman",
    anime: "Shingeki no Kyojin",
    frase: "Decide. Confía en ti mismo."
  },
  {
    id: 7,
    nombre: "Tanjiro Kamado",
    anime: "Demon Slayer",
    frase: "Nunca te rindas."
  },
  {
    id: 8,
    nombre: "Eren Yeager",
    anime: "Shingeki no Kyojin",
    frase: "¡Lucharé hasta el final!"
  },
  {
    id: 9,
    nombre: "Light Yagami",
    anime: "Death Note",
    frase: "Yo seré el dios de este nuevo mundo."
  },
  {
    id: 10,
    nombre: "Edward Elric",
    anime: "Fullmetal Alchemist",
    frase: "¡Un intercambio equivalente!"
  },
  {
    id: 11,
    nombre: "Killua Zoldyck",
    anime: "Hunter x Hunter",
    frase: "No quiero perder a mis amigos."
  },
  {
    id: 12,
    nombre: "Izuku Midoriya",
    anime: "My Hero Academia",
    frase: "¡Yo también puedo ser un héroe!"
  }
];

// ========================================
// OBTENER PERSONAJE DISPONIBLE
// ========================================

function obtenerPersonajeDisponible(reclamados) {
  const disponibles = personajesAnime.filter(
    personaje => !reclamados[personaje.id]
  );

  if (disponibles.length === 0) {
    return null;
  }

  const indice = Math.floor(
    Math.random() * disponibles.length
  );

  return disponibles[indice];
}

// ========================================
// NORMALIZAR NOMBRE
// ========================================

function normalizarNombre(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// ========================================
// BUSCAR IMAGEN DEL PERSONAJE EN JIKAN
// ========================================

async function buscarImagenPersonaje(nombre) {
  try {
    console.log(`🔎 Buscando ${nombre} en Jikan...`);

    const url =
      `${JIKAN_API}/characters?q=${encodeURIComponent(nombre)}&limit=10`;

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error(
        `Jikan respondió HTTP ${respuesta.status}`
      );
    }

    const datos = await respuesta.json();

    if (
      !datos ||
      !Array.isArray(datos.data) ||
      datos.data.length === 0
    ) {
      console.log(
        `❌ No se encontraron resultados para ${nombre}`
      );

      return null;
    }

    const nombreBuscado = normalizarNombre(nombre);

    // ========================================
    // BUSCAR COINCIDENCIA EXACTA
    // ========================================

    let personajeEncontrado = datos.data.find(
      personaje =>
        normalizarNombre(personaje?.name) === nombreBuscado
    );

    // Si no hay coincidencia exacta,
    // usamos el primer resultado disponible.
    if (!personajeEncontrado) {
      personajeEncontrado = datos.data[0];
    }

    if (!personajeEncontrado?.mal_id) {
      console.log(
        `❌ Jikan no devolvió MAL ID para ${nombre}`
      );

      return null;
    }

    console.log(
      `👤 Personaje encontrado: ${personajeEncontrado.name}`
    );

    console.log(
      `🆔 MAL ID: ${personajeEncontrado.mal_id}`
    );

    // ========================================
    // CONSULTAR PERSONAJE COMPLETO
    // ========================================

    const detalleUrl =
      `${JIKAN_API}/characters/${personajeEncontrado.mal_id}/full`;

    const detalleRespuesta = await fetch(detalleUrl);

    if (!detalleRespuesta.ok) {
      throw new Error(
        `Jikan detalle respondió HTTP ${detalleRespuesta.status}`
      );
    }

    const detalle = await detalleRespuesta.json();

    const personajeCompleto = detalle?.data;

    if (!personajeCompleto) {
      console.log(
        `❌ No se obtuvieron datos completos de ${nombre}`
      );

      return null;
    }

    // ========================================
    // OBTENER URL DE IMAGEN
    // ========================================

    const imagen =
      personajeCompleto?.images?.jpg?.image_url ||
      personajeCompleto?.images?.jpg?.small_image_url ||
      personajeCompleto?.images?.webp?.image_url ||
      personajeCompleto?.images?.webp?.small_image_url ||
      null;

    if (!imagen) {
      console.log(
        `❌ Jikan no tiene imagen para ${nombre}`
      );

      return null;
    }

    console.log(
      `🖼️ Imagen encontrada: ${imagen}`
    );

    // ========================================
    // COMPROBAR QUE LA IMAGEN SE PUEDA DESCARGAR
    // ========================================

    const imagenBuffer = await descargarImagen(imagen);

    if (!imagenBuffer) {
      console.log(
        `❌ La imagen de ${nombre} no se pudo descargar`
      );

      return null;
    }

    console.log(
      `✅ Imagen válida para ${nombre}`
    );

    return imagen;

  } catch (error) {
    console.error(
      `❌ Error buscando imagen de ${nombre}:`,
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

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      console.error(
        `❌ Error HTTP descargando imagen: ${respuesta.status}`
      );

      return null;
    }

    const arrayBuffer = await respuesta.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    if (!buffer || buffer.length === 0) {
      return null;
    }

    return buffer;

  } catch (error) {
    console.error(
      "❌ Error descargando imagen:",
      error
    );

    return null;
  }
}

// ========================================
// ESCAPAR TEXTO PARA SVG
// ========================================

function escapar(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ========================================
// CREAR TARJETA
// ========================================

async function crearTarjeta({
  personaje,
  nombreUsuario,
  idUsuario,
  estado = "RECLAMADO"
}) {
  const ancho = 1000;
  const alto = 1350;

  const imagenBuffer = personaje.image
    ? await descargarImagen(personaje.image)
    : null;

  let imagenBase64 = "";

  if (imagenBuffer) {
    try {
      const imagenProcesada = await sharp(imagenBuffer)
        .resize(700, 650, {
          fit: "cover",
          position: "center"
        })
        .jpeg({
          quality: 90
        })
        .toBuffer();

      imagenBase64 = imagenProcesada.toString("base64");

    } catch (error) {
      console.error(
        "❌ Error procesando imagen:",
        error
      );
    }
  }

  const nombre = escapar(personaje.nombre);
  const anime = escapar(personaje.anime);
  const frase = escapar(personaje.frase);
  const usuario = escapar(nombreUsuario);
  const id = escapar(idUsuario);
  const estadoEscapado = escapar(estado);

  let contenidoImagen = `
    <rect
      x="150"
      y="120"
      width="700"
      height="650"
      rx="35"
      fill="#222"
    />

    <text
      x="500"
      y="450"
      text-anchor="middle"
      font-size="38"
      fill="white"
      font-family="Arial"
    >
      SIN IMAGEN
    </text>
  `;

  if (imagenBase64) {
    contenidoImagen = `
      <image
        href="data:image/jpeg;base64,${imagenBase64}"
        x="150"
        y="120"
        width="700"
        height="650"
        preserveAspectRatio="xMidYMid slice"
      />
    `;
  }

  const svg = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="${ancho}"
    height="${alto}"
  >

    <defs>
      <linearGradient
        id="fondo"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop offset="0%" stop-color="#111111"/>
        <stop offset="50%" stop-color="#202020"/>
        <stop offset="100%" stop-color="#050505"/>
      </linearGradient>

      <filter id="sombra">
        <feDropShadow
          dx="0"
          dy="8"
          stdDeviation="12"
          flood-opacity="0.7"
        />
      </filter>
    </defs>

    <rect
      width="${ancho}"
      height="${alto}"
      fill="url(#fondo)"
    />

    <rect
      x="50"
      y="50"
      width="900"
      height="1250"
      rx="50"
      fill="none"
      stroke="#ffffff"
      stroke-width="4"
      opacity="0.3"
    />

    <text
      x="500"
      y="95"
      text-anchor="middle"
      font-size="42"
      font-weight="bold"
      fill="white"
      font-family="Arial"
    >
      TITANBOT
    </text>

    <text
      x="500"
      y="145"
      text-anchor="middle"
      font-size="28"
      fill="#cccccc"
      font-family="Arial"
    >
      PERSONAJE ANIME
    </text>

    <g filter="url(#sombra)">
      ${contenidoImagen}
    </g>

    <text
      x="500"
      y="850"
      text-anchor="middle"
      font-size="52"
      font-weight="bold"
      fill="white"
      font-family="Arial"
    >
      ${nombre}
    </text>

    <text
      x="500"
      y="900"
      text-anchor="middle"
      font-size="32"
      fill="#cccccc"
      font-family="Arial"
    >
      ${anime}
    </text>

    <line
      x1="200"
      y1="945"
      x2="800"
      y2="945"
      stroke="white"
      opacity="0.3"
    />

    <text
      x="500"
      y="1005"
      text-anchor="middle"
      font-size="27"
      fill="white"
      font-family="Arial"
    >
      "${frase}"
    </text>

    <text
      x="500"
      y="1090"
      text-anchor="middle"
      font-size="32"
      font-weight="bold"
      fill="white"
      font-family="Arial"
    >
      ${estadoEscapado}
    </text>

    <text
      x="500"
      y="1150"
      text-anchor="middle"
      font-size="27"
      fill="#cccccc"
      font-family="Arial"
    >
      👤 ${usuario}
    </text>

    <text
      x="500"
      y="1200"
      text-anchor="middle"
      font-size="22"
      fill="#999999"
      font-family="Arial"
    >
      ID: ${id}
    </text>

    <text
      x="500"
      y="1250"
      text-anchor="middle"
      font-size="20"
      fill="#777777"
      font-family="Arial"
    >
      Imagen obtenida mediante Jikan API
    </text>

  </svg>
  `;

  return sharp(Buffer.from(svg))
    .jpeg({
      quality: 90
    })
    .toBuffer();
}

// ========================================
// COMANDO PRINCIPAL
// ========================================

async function anime(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {
  try {
    comando = String(comando || "")
      .toLowerCase()
      .replace(/^\./, "")
      .trim();

    const usuarioId = limpiarId(
      obtenerId(msg, id)
    );

    // ======================================
    // MENÚ ANIME
    // ======================================

    if (
      comando === "anime" &&
      args.length === 0
    ) {
      await sock.sendMessage(
        chat,
        {
          text:
            "🎴 *MENÚ ANIME - TITANBOT*\n\n" +
            "🎲 *.s* → Reclamar personaje\n" +
            "📋 *.mispersonajes* → Tus personajes\n" +
            "👥 *.personajes* → Disponibles\n" +
            "♻️ *.liberar* → Liberar personaje\n" +
            "🔎 *.animebuscar nombre* → Buscar anime\n" +
            "🎬 *.anime nombre* → Información del anime\n" +
            "ℹ️ *.animeinfo ID* → Información completa\n" +
            "👤 *.personaje nombre* → Buscar personaje\n" +
            "📚 *.manga nombre* → Buscar manga\n" +
            "🌸 *.waifu* → Waifu aleatoria\n" +
            "🔥 *.husbando* → Imagen aleatoria\n\n" +
            "━━━━━━━━━━━━━━━━━━\n" +
            "🤖 *TITANBOT*"
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // ANIMEMENU
    // ======================================

    if (comando === "animemenu") {
      await sock.sendMessage(
        chat,
        {
          text:
            "🎴 *MENÚ DE ANIME*\n\n" +
            "🎲 *.s*\n" +
            "📋 *.mispersonajes*\n" +
            "👥 *.personajes*\n" +
            "♻️ *.liberar*\n" +
            "🔎 *.animebuscar nombre*\n" +
            "🎬 *.anime nombre*\n" +
            "ℹ️ *.animeinfo ID*\n" +
            "👤 *.personaje nombre*\n" +
            "📚 *.manga nombre*\n" +
            "🌸 *.waifu*\n" +
            "🔥 *.husbando*"
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // S - RECLAMAR PERSONAJE
    // ======================================

    if (comando === "s") {
      const reclamados = cargarReclamados();

      const personaje =
        obtenerPersonajeDisponible(reclamados);

      if (!personaje) {
        await sock.sendMessage(
          chat,
          {
            text:
              "❌ *NO HAY PERSONAJES DISPONIBLES*\n\n" +
              "Todos los personajes ya fueron reclamados."
          },
          { quoted: msg }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text:
            `🔎 Consultando Jikan API para encontrar la imagen de *${personaje.nombre}*...`
        },
        { quoted: msg }
      );

      // ======================================
      // BUSCAR IMAGEN EN JIKAN
      // ======================================

      const imagenAPI =
        await buscarImagenPersonaje(
          personaje.nombre
        );

      // ======================================
      // SI NO HAY IMAGEN, NO RECLAMAR
      // ======================================

      if (!imagenAPI) {
        await sock.sendMessage(
          chat,
          {
            text:
              "❌ *NO SE ENCONTRÓ LA IMAGEN*\n\n" +
              `No pude obtener una imagen válida de:\n\n` +
              `⭐ *${personaje.nombre}*\n\n` +
              "El personaje *NO fue reclamado*.\n\n" +
              "🔄 Intenta nuevamente con:\n" +
              "*.s*"
          },
          { quoted: msg }
        );

        return true;
      }

      // ======================================
      // CREAR PERSONAJE FINAL
      // ======================================

      const personajeFinal = {
        ...personaje,
        image: imagenAPI
      };

      // ======================================
      // CREAR TARJETA
      // ======================================

      const tarjeta =
        await crearTarjeta({
          personaje: personajeFinal,
          nombreUsuario: usuarioId,
          idUsuario: usuarioId,
          estado: "RECLAMADO"
        });

      // ======================================
      // GUARDAR RECLAMACIÓN
      // ======================================

      reclamados[personaje.id] = {
        ...personajeFinal,
        usuarioId,
        fecha: new Date().toISOString()
      };

      guardarReclamados(reclamados);

      // ======================================
      // ENVIAR TARJETA
      // ======================================

      await sock.sendMessage(
        chat,
        {
          image: tarjeta,
          caption:
            `🎉 *¡PERSONAJE RECLAMADO!*\n\n` +
            `⭐ *${personaje.nombre}*\n` +
            `🎬 ${personaje.anime}\n\n` +
            `👤 Usuario: ${usuarioId}\n\n` +
            `💬 "${personaje.frase}"`
        },
        { quoted: msg }
      );

      return true;
      }   
          
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

        usuarioId:
          idUsuario,

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
      // CREAR Y ENVIAR TARJETA
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
          },
          { quoted: msg }
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
`🎌✨ ¡RECLAMASTE ESTE PERSONAJE! ✨🎌

⭐ ${personajeFinal.nombre}

🎌 ${personajeFinal.anime}

👤 ${nombreUsuario}

🆔 ${idUsuario}

🟢 ESTADO:
RECLAMADO

💬 "${personajeFinal.frase}"`
          },
          { quoted: msg }
        );
      }

      return true;
    }

    // ======================================
    // MIS PERSONAJES
    // ======================================

    if (
      comando === "mispersonajes" ||
      comando === "mispersonaje"
    ) {

      const reclamados =
        cargarReclamados();

      const personajesUsuario =
        Object.values(reclamados).filter(
          personaje =>
            personaje.usuarioId ===
            idUsuario
        );

      if (
        personajesUsuario.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
`📭 NO TIENES PERSONAJES RECLAMADOS

Usa:

.s

para reclamar uno.`
          },
          { quoted: msg }
        );

        return true;
      }

      let texto =
`🎴 TUS PERSONAJES

`;

      personajesUsuario.forEach(
        (personaje, index) => {

          texto +=
`${index + 1}. ⭐ *${escapar(personaje.nombre)}*
   🎬 Anime: ${escapar(personaje.anime)}
   📅 Reclamado: ${personaje.fecha || "Sin fecha"}

`;
        }
      );

      await sock.sendMessage(
        chat,
        {
          text: texto
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // PERSONAJES DISPONIBLES
    // ======================================

    if (comando === "personajes") {

      const reclamados =
        cargarReclamados();

      const disponibles =
        personajesAnime.filter(
          personaje =>
            !Object.values(reclamados).some(
              p =>
                p.personajeId ===
                personaje.id
            )
        );

      if (
        disponibles.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
`😢 NO QUEDAN PERSONAJES DISPONIBLES

Todos los personajes fueron reclamados.`
          },
          { quoted: msg }
        );

        return true;
      }

      let texto =
`🎴 PERSONAJES DISPONIBLES

`;

      disponibles.forEach(
        (personaje, index) => {

          texto +=
`${index + 1}. ⭐ *${escapar(personaje.nombre)}*
   🎬 ${escapar(personaje.anime)}

`;
        }
      );

      texto +=
`━━━━━━━━━━━━━━━━━━

💡 Usa *.s* para reclamar un personaje.`;

      await sock.sendMessage(
        chat,
        {
          text: texto
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // LIBERAR PERSONAJE
    // ======================================

    if (comando === "liberar") {

      const reclamados =
        cargarReclamados();

      const personajesUsuario =
        Object.entries(reclamados).filter(
          ([, personaje]) =>
            personaje.usuarioId ===
            idUsuario
        );

      if (
        personajesUsuario.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              "📭 No tienes ningún personaje reclamado."
          },
          { quoted: msg }
        );

        return true;
      }

      const numero =
        parseInt(args[0]);

      if (
        !numero ||
        numero < 1 ||
        numero > personajesUsuario.length
      ) {

        let texto =
`♻️ LIBERAR PERSONAJE

`;

        personajesUsuario.forEach(
          ([idPersonaje, personaje], index) => {

            texto +=
`${index + 1}. *${escapar(personaje.nombre)}*
   ID: ${idPersonaje}

`;
          }
        );

        texto +=
`Para liberar uno escribe:

.liberar número

Ejemplo:

.liberar 1`;

        await sock.sendMessage(
          chat,
          {
            text: texto
          },
          { quoted: msg }
        );

        return true;
      }

      const [
        idPersonaje,
        personaje
      ] =
        personajesUsuario[
          numero - 1
        ];

      delete reclamados[
        idPersonaje
      ];

      guardarReclamados(
        reclamados
      );

      await sock.sendMessage(
        chat,
        {
          text:
`♻️ PERSONAJE LIBERADO

⭐ ${personaje.nombre}

🎬 ${personaje.anime}

Ahora puede ser reclamado nuevamente con:

.s`
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // ANIMEBUSCAR
    // ======================================

    if (comando === "animebuscar") {

      const nombre =
        args.join(" ").trim();

      if (!nombre) {

        await sock.sendMessage(
          chat,
          {
            text:
              "🔎 Usa *.animebuscar nombre del anime*"
          },
          { quoted: msg }
        );

        return true;
      }

      const url =
        `${JIKAN_API}/anime?q=${encodeURIComponent(nombre)}&limit=5`;

      const respuesta =
        await fetch(url);

      if (!respuesta.ok) {
        throw new Error(
          `Jikan HTTP ${respuesta.status}`
        );
      }

      const datos =
        await respuesta.json();

      if (
        !datos?.data ||
        datos.data.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              `❌ No encontré el anime *${nombre}*.`
          },
          { quoted: msg }
        );

        return true;
      }

      let texto =
`🔎 RESULTADOS DE ANIME

`;

      datos.data.forEach(
        (animeItem, index) => {

          texto +=
`${index + 1}. 🎬 *${escapar(animeItem.title)}*
   🆔 MAL ID: ${animeItem.mal_id}
   ⭐ Score: ${animeItem.score || "N/A"}

`;
        }
      );

      await sock.sendMessage(
        chat,
        {
          text: texto
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // ANIME CON NOMBRE
    // ======================================

    if (
      comando === "anime" &&
      args.length > 0
    ) {

      const nombre =
        args.join(" ").trim();

      const url =
        `${JIKAN_API}/anime?q=${encodeURIComponent(nombre)}&limit=1`;

      const respuesta =
        await fetch(url);

      if (!respuesta.ok) {
        throw new Error(
          `Jikan HTTP ${respuesta.status}`
        );
      }

      const datos =
        await respuesta.json();

      if (
        !datos?.data ||
        datos.data.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              `❌ No encontré información sobre *${nombre}*.`
          },
          { quoted: msg }
        );

        return true;
      }

      const item =
        datos.data[0];

      await sock.sendMessage(
        chat,
        {
          text:
`🎬 *${item.title}*

🇯🇵 Título japonés:
${item.title_japanese || "N/A"}

⭐ Score:
${item.score || "N/A"}

📺 Episodios:
${item.episodes || "N/A"}

📡 Estado:
${item.status || "N/A"}

📅 Emitido:
${item.aired?.string || "N/A"}

🎭 Tipo:
${item.type || "N/A"}

📝 Sinopsis:
${item.synopsis || "Sin sinopsis disponible."}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // ANIMEINFO
    // ======================================

    if (comando === "animeinfo") {

      const consulta =
        args.join(" ").trim();

      if (!consulta) {

        await sock.sendMessage(
          chat,
          {
            text:
              "ℹ️ Usa *.animeinfo nombre del anime*"
          },
          { quoted: msg }
        );

        return true;
      }

      const url =
        `${JIKAN_API}/anime?q=${encodeURIComponent(consulta)}&limit=1`;

      const respuesta =
        await fetch(url);

      if (!respuesta.ok) {
        throw new Error(
          `Jikan HTTP ${respuesta.status}`
        );
      }

      const datos =
        await respuesta.json();

      if (
        !datos?.data ||
        datos.data.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              `❌ No encontré el anime *${consulta}*.`
          },
          { quoted: msg }
        );

        return true;
      }

      const item =
        datos.data[0];

      await sock.sendMessage(
        chat,
        {
          text:
`📖 INFORMACIÓN DEL ANIME

🎬 ${item.title}

⭐ Score: ${item.score || "N/A"}

📺 Episodios: ${item.episodes || "N/A"}

🎭 Tipo: ${item.type || "N/A"}

📡 Estado: ${item.status || "N/A"}

📅 ${item.aired?.string || "N/A"}

🎌 Géneros:
${
  item.genres?.length
    ? item.genres
        .map(g => g.name)
        .join(", ")
    : "N/A"
}

📝 Sinopsis:
${item.synopsis || "No disponible."}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // PERSONAJE
    // ======================================

    if (comando === "personaje") {

      const nombre =
        args.join(" ").trim();

      if (!nombre) {

        await sock.sendMessage(
          chat,
          {
            text:
              "👤 Usa *.personaje nombre*"
          },
          { quoted: msg }
        );

        return true;
      }

      const imagen =
        await buscarImagenPersonaje(
          nombre
        );

      if (!imagen) {

        await sock.sendMessage(
          chat,
          {
            text:
              `❌ No encontré el personaje *${nombre}* en Jikan.`
          },
          { quoted: msg }
        );

        return true;
      }

      const buffer =
        await descargarImagen(
          imagen
        );

      if (!buffer) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ Encontré el personaje, pero no pude descargar su imagen."
          },
          { quoted: msg }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          image: buffer,
          caption:
`👤 *${nombre}*

🖼️ Imagen obtenida automáticamente mediante Jikan API.`
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // MANGA
    // ======================================

    if (comando === "manga") {

      const nombre =
        args.join(" ").trim();

      if (!nombre) {

        await sock.sendMessage(
          chat,
          {
            text:
              "📚 Usa *.manga nombre del manga*"
          },
          { quoted: msg }
        );

        return true;
      }

      const url =
        `${JIKAN_API}/manga?q=${encodeURIComponent(nombre)}&limit=1`;

      const respuesta =
        await fetch(url);

      if (!respuesta.ok) {
        throw new Error(
          `Jikan HTTP ${respuesta.status}`
        );
      }

      const datos =
        await respuesta.json();

      if (
        !datos?.data ||
        datos.data.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              `❌ No encontré el manga *${nombre}*.`
          },
          { quoted: msg }
        );

        return true;
      }

      const manga =
        datos.data[0];

      await sock.sendMessage(
        chat,
        {
          text:
`📚 *${manga.title}*

⭐ Score:
${manga.score || "N/A"}

📖 Capítulos:
${manga.chapters || "N/A"}

📕 Volúmenes:
${manga.volumes || "N/A"}

📡 Estado:
${manga.status || "N/A"}

📝 Sinopsis:
${manga.synopsis || "No disponible."}`
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // WAIFU
    // ======================================

    if (comando === "waifu") {

      const url =
        `${JIKAN_API}/characters?q=waifu&limit=1`;

      const respuesta =
        await fetch(url);

      if (!respuesta.ok) {
        throw new Error(
          `Jikan HTTP ${respuesta.status}`
        );
      }

      const datos =
        await respuesta.json();

      if (
        !datos?.data ||
        datos.data.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No se pudo obtener una imagen."
          },
          { quoted: msg }
        );

        return true;
      }

      const personaje =
        datos.data[0];

      const imagen =
        personaje?.images?.jpg?.image_url ||
        personaje?.images?.webp?.image_url;

      if (!imagen) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ Jikan no devolvió una imagen."
          },
          { quoted: msg }
        );

        return true;
      }

      const buffer =
        await descargarImagen(
          imagen
        );

      if (!buffer) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No se pudo descargar la imagen."
          },
          { quoted: msg }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          image: buffer,
          caption:
            "🌸 WAIFU"
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // HUSBANDO
    // ======================================

    if (comando === "husbando") {

      const url =
        `${JIKAN_API}/characters?q=husbando&limit=1`;

      const respuesta =
        await fetch(url);

      if (!respuesta.ok) {
        throw new Error(
          `Jikan HTTP ${respuesta.status}`
        );
      }

      const datos =
        await respuesta.json();

      if (
        !datos?.data ||
        datos.data.length === 0
      ) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No se pudo obtener un personaje."
          },
          { quoted: msg }
        );

        return true;
      }

      const personaje =
        datos.data[0];

      const imagen =
        personaje?.images?.jpg?.image_url ||
        personaje?.images?.webp?.image_url;

      if (!imagen) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ Jikan no devolvió una imagen."
          },
          { quoted: msg }
        );

        return true;
      }

      const buffer =
        await descargarImagen(
          imagen
        );

      if (!buffer) {

        await sock.sendMessage(
          chat,
          {
            text:
              "❌ No se pudo descargar la imagen."
          },
          { quoted: msg }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          image: buffer,
          caption:
            "⚔️ HUSBANDO"
        },
        { quoted: msg }
      );

      return true;
    }

    // ======================================
    // COMANDO NO ENCONTRADO
    // ======================================

    return false;

  } catch (error) {

    console.error(
      "❌ Error en comando anime:",
      error
    );

    try {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ Ocurrió un error ejecutando el comando.

${error.message || "Error desconocido"}`
        },
        { quoted: msg }
      );

    } catch (errorEnvio) {

      console.error(
        "❌ No se pudo enviar el mensaje de error:",
        errorEnvio
      );
    }

    return true;
  }
}

// ========================================
// EXPORTAR
// ========================================

module.exports = anime;
