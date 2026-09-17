// ========================================
// TITANBOT v3.4
// SISTEMA ANIME + PERSONAJES RECLAMABLES
// ========================================

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

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

const personajesAnime = [
  {
    id: 1,
    nombre: "Goku",
    anime: "Dragon Ball",
    frase:
      "Siempre hay una nueva forma de superar tus límites.",
    image:
      "https://cdn.myanimelist.net/images/characters/11/137581.jpg"
  },

  {
    id: 2,
    nombre: "Naruto Uzumaki",
    anime: "Naruto",
    frase:
      "Nunca abandones aquello por lo que decidiste luchar.",
    image:
      "https://cdn.myanimelist.net/images/characters/2/284303.jpg"
  },

  {
    id: 3,
    nombre: "Monkey D. Luffy",
    anime: "One Piece",
    frase:
      "Persigue tus sueños aunque el camino sea difícil.",
    image:
      "https://cdn.myanimelist.net/images/characters/9/310307.jpg"
  },

  {
    id: 4,
    nombre: "Ichigo Kurosaki",
    anime: "Bleach",
    frase:
      "Protege aquello que consideras importante.",
    image:
      "https://cdn.myanimelist.net/images/characters/9/131317.jpg"
  },

  {
    id: 5,
    nombre: "Satoru Gojo",
    anime: "Jujutsu Kaisen",
    frase:
      "La confianza también puede convertirse en poder.",
    image:
      "https://cdn.myanimelist.net/images/characters/7/357919.jpg"
  },

  {
    id: 6,
    nombre: "Levi Ackerman",
    anime: "Shingeki no Kyojin",
    frase:
      "Toma tus decisiones y acepta el camino que elegiste.",
    image:
      "https://cdn.myanimelist.net/images/characters/7/241413.jpg"
  },

  {
    id: 7,
    nombre: "Tanjiro Kamado",
    anime: "Demon Slayer",
    frase:
      "La bondad puede mantenerse incluso en los momentos difíciles.",
    image:
      "https://cdn.myanimelist.net/images/characters/3/363159.jpg"
  },

  {
    id: 8,
    nombre: "Eren Yeager",
    anime: "Shingeki no Kyojin",
    frase:
      "Avanza incluso cuando el camino parece imposible.",
    image:
      "https://cdn.myanimelist.net/images/characters/10/307586.jpg"
  },

  {
    id: 9,
    nombre: "Light Yagami",
    anime: "Death Note",
    frase:
      "El poder cambia las reglas cuando decides utilizarlo.",
    image:
      "https://cdn.myanimelist.net/images/characters/9/243955.jpg"
  },

  {
    id: 10,
    nombre: "Edward Elric",
    anime: "Fullmetal Alchemist",
    frase:
      "Todo esfuerzo tiene un precio y una consecuencia.",
    image:
      "https://cdn.myanimelist.net/images/characters/9/72533.jpg"
  },

  {
    id: 11,
    nombre: "Killua Zoldyck",
    anime: "Hunter x Hunter",
    frase:
      "Tu verdadero potencial aparece cuando confías en ti.",
    image:
      "https://cdn.myanimelist.net/images/characters/8/294712.jpg"
  },

  {
    id: 12,
    nombre: "Izuku Midoriya",
    anime: "My Hero Academia",
    frase:
      "Ser valiente también significa ayudar a los demás.",
    image:
      "https://cdn.myanimelist.net/images/characters/9/310307.jpg"
  }
];

// ========================================
// PERSONAJE DISPONIBLE
// ========================================

function obtenerPersonajeDisponible(
  reclamados
) {
  const disponibles =
    personajesAnime.filter(
      personaje =>
        !Object.values(
          reclamados
        ).some(
          p =>
            p.personajeId ===
            personaje.id
        )
    );

  if (!disponibles.length) {
    return null;
  }

  return disponibles[
    Math.floor(
      Math.random() *
      disponibles.length
    )
  ];
}

// ========================================
// DESCARGAR IMAGEN
// ========================================

async function descargarImagen(url) {
  try {
    const respuesta =
      await fetch(url);

    if (!respuesta.ok) {
      throw new Error(
        "No se pudo descargar la imagen"
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

  let base = sharp(fondo);

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
    y="330"
    text-anchor="middle"
    font-family="Arial"
    font-size="45"
    fill="white"
  >
    ${escapar(personaje.nombre)}
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

      reclamados[idUsuario] = {
        personajeId:
          personaje.id,

        nombre:
          personaje.nombre,

        anime:
          personaje.anime,

        frase:
          personaje.frase,

        image:
          personaje.image,

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

      try {

        const tarjeta =
          await crearTarjeta({
            personaje,
            nombreUsuario,
            idUsuario,
            estado:
              "RECLAMADO"
          });

        await sock.sendMessage(
          chat,
          {
            image: tarjeta,
            caption:
`🎌✨ ¡RECLAMASTE ESTE PERSONAJE! ✨🎌

⭐ ${personaje.nombre}

🎌 ${personaje.anime}

👤 ${nombreUsuario}

🆔 ${idUsuario}

🟢 ESTADO:
RECLAMADO

💬 "${personaje.frase}"

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

⭐ ${personaje.nombre}

🎌 ${personaje.anime}

👤 ${nombreUsuario}

🆔 ${idUsuario}

🟢 ESTADO:
RECLAMADO

💬 "${personaje.frase}"`
          }
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

      const personajeUsuario =
        reclamados[idUsuario];

      if (!personajeUsuario) {
        await sock.sendMessage(
          chat,
          {
            text:
`🎴 MIS PERSONAJES

Todavía no tienes ningún personaje.

Usa:

.s

para reclamar uno.`
          }
        );

        return true;
      }

      const personaje =
        personajesAnime.find(
          p =>
            p.id ===
            personajeUsuario.personajeId
        );

      if (!personaje) {
        await sock.sendMessage(
          chat,
          {
            text:
`❌ No pude encontrar los datos del personaje.`
          }
        );

        return true;
      }

      try {

        const tarjeta =
          await crearTarjeta({
            personaje,
            nombreUsuario:
              personajeUsuario.nombreUsuario ||
              "Usuario",
            idUsuario,
            estado:
              "RECLAMADO"
          });

        await sock.sendMessage(
          chat,
          {
            image: tarjeta,
            caption:
`🎴 MI PERSONAJE

⭐ ${personaje.nombre}

🎌 Anime:
${personaje.anime}

👤 Usuario:
${personajeUsuario.nombreUsuario}

🆔 ID:
${idUsuario}

🟢 ESTADO:
RECLAMADO

💬 "${personaje.frase}"

📅 Reclamado:
${new Date(
  personajeUsuario.fecha
).toLocaleDateString()}`
          }
        );

      } catch (error) {

        console.error(
          "❌ Error en mispersonajes:",
          error
        );

        await sock.sendMessage(
          chat,
          {
            text:
`🎴 MI PERSONAJE

⭐ ${personaje.nombre}

🎌 Anime:
${personaje.anime}

👤 Usuario:
${personajeUsuario.nombreUsuario}

🆔 ID:
${idUsuario}

🟢 ESTADO:
RECLAMADO

💬 "${personaje.frase}"`
          }
        );
      }

      return true;
    }

    // ======================================
    // PERSONAJES DISPONIBLES
    // ======================================

    if (comando === "personajes") {

      const reclamados =
        cargarReclamados();

      let texto =
`🎌 PERSONAJES TITANBOT

━━━━━━━━━━━━━━━━━━

`;

      for (
        const personaje
        of personajesAnime
      ) {

        const ocupado =
          Object.values(
            reclamados
          ).some(
            p =>
              p.personajeId ===
              personaje.id
          );

        texto +=
`${ocupado ? "🔴" : "🟢"} ${personaje.nombre}
🎌 ${personaje.anime}
Estado: ${ocupado ? "OCUPADO" : "LIBRE"}

`;
      }

      await sock.sendMessage(
        chat,
        {
          text: texto
        }
      );

      return true;
      }    
    
    // ======================================
    // LIBERAR PERSONAJE
    // ======================================

    if (comando === "liberar") {

      const reclamados =
        cargarReclamados();

      if (!reclamados[idUsuario]) {

        await sock.sendMessage(
          chat,
          {
            text:
`❌ No tienes ningún personaje reclamado.`
          }
        );

        return true;
      }

      const personaje =
        reclamados[idUsuario];

      delete reclamados[idUsuario];

      guardarReclamados(
        reclamados
      );

      await sock.sendMessage(
        chat,
        {
          text:
`🔓 PERSONAJE LIBERADO

⭐ ${personaje.nombre}

🎌 ${personaje.anime}

🟢 El personaje vuelve a estar LIBRE.`
        }
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
`❌ Escribe el nombre de un anime.

Ejemplo:

.animebuscar Naruto`
          }
        );

        return true;
      }

      const resultados = [
        "Naruto",
        "One Piece",
        "Bleach",
        "Dragon Ball",
        "Demon Slayer",
        "Jujutsu Kaisen"
      ];

      const encontrados =
        resultados.filter(
          anime =>
            anime
              .toLowerCase()
              .includes(
                nombre.toLowerCase()
              )
        );

      if (!encontrados.length) {

        await sock.sendMessage(
          chat,
          {
            text:
`🔎 BÚSQUEDA DE ANIME

🎌 Buscaste:
${nombre}

❌ No encontré coincidencias en la base local.

Prueba con:

Naruto
One Piece
Bleach
Dragon Ball
Demon Slayer
Jujutsu Kaisen`
          }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text:
`🔎 BÚSQUEDA DE ANIME

🎌 Resultado:

${encontrados
  .map(
    anime => `📺 ${anime}`
  )
  .join("\n")}

ℹ️ Base local de TitanBot.`
        }
      );

      return true;
    }

    // ======================================
    // ANIME
    // ======================================

    if (comando === "anime") {

      const nombre =
        args.join(" ").trim();

      if (!nombre) {

        await sock.sendMessage(
          chat,
          {
            text:
`❌ Escribe un anime.

Ejemplo:

.anime Naruto`
          }
        );

        return true;
      }

      const animes = {

        naruto: {
          titulo: "Naruto",
          genero: "Acción, aventura",
          estado: "Finalizado"
        },

        "one piece": {
          titulo: "One Piece",
          genero: "Aventura, acción",
          estado: "En emisión"
        },

        bleach: {
          titulo: "Bleach",
          genero: "Acción, sobrenatural",
          estado: "Finalizado / continuación"
        },

        "dragon ball": {
          titulo: "Dragon Ball",
          genero: "Acción, aventura",
          estado: "Franquicia en curso"
        },

        "demon slayer": {
          titulo: "Demon Slayer",
          genero: "Acción, fantasía",
          estado: "Finalizado"
        },

        "jujutsu kaisen": {
          titulo: "Jujutsu Kaisen",
          genero: "Acción, sobrenatural",
          estado: "En emisión"
        }

      };

      const clave =
        nombre
          .toLowerCase()
          .trim();

      const resultado =
        animes[clave];

      if (!resultado) {

        await sock.sendMessage(
          chat,
          {
            text:
`🔎 ANIME

🎌 Buscaste:
${nombre}

⚠️ No tengo información de ese anime en la base local.

Prueba con:

Naruto
One Piece
Bleach
Dragon Ball
Demon Slayer
Jujutsu Kaisen`
          }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text:
`🎌 INFORMACIÓN DEL ANIME

📺 ${resultado.titulo}

🎭 Género:
${resultado.genero}

📌 Estado:
${resultado.estado}`
        }
      );

      return true;
    }

    // ======================================
    // ANIMEINFO
    // ======================================

    if (comando === "animeinfo") {

      const nombre =
        args.join(" ").trim();

      if (!nombre) {

        await sock.sendMessage(
          chat,
          {
            text:
`❌ Escribe un anime.

Ejemplo:

.animeinfo Naruto`
          }
        );

        return true;
      }

      const animesInfo = {

        naruto: {
          titulo: "Naruto",
          genero: "Acción, aventura, artes marciales",
          estado: "Finalizado",
          descripcion:
            "Historia de un joven ninja que busca reconocimiento y sueña con convertirse en Hokage."
        },

        "one piece": {
          titulo: "One Piece",
          genero: "Aventura, acción, fantasía",
          estado: "En emisión",
          descripcion:
            "Monkey D. Luffy y su tripulación recorren el mundo buscando el legendario One Piece."
        },

        bleach: {
          titulo: "Bleach",
          genero: "Acción, sobrenatural",
          estado: "Finalizado / continuación",
          descripcion:
            "Ichigo Kurosaki obtiene poderes de Shinigami y comienza a proteger a los demás."
        },

        "dragon ball": {
          titulo: "Dragon Ball",
          genero: "Acción, aventura, artes marciales",
          estado: "Franquicia en curso",
          descripcion:
            "Goku y sus amigos viven aventuras mientras entrenan y enfrentan diferentes enemigos."
        },

        "demon slayer": {
          titulo: "Demon Slayer",
          genero: "Acción, fantasía, sobrenatural",
          estado: "Finalizado",
          descripcion:
            "Tanjiro Kamado emprende un viaje para proteger a su hermana y enfrentarse a demonios."
        },

        "jujutsu kaisen": {
          titulo: "Jujutsu Kaisen",
          genero: "Acción, sobrenatural",
          estado: "En emisión",
          descripcion:
            "Yuji Itadori se ve involucrado en el mundo de las maldiciones y los hechiceros."
        }

      };

      const clave =
        nombre
          .toLowerCase()
          .trim();

      const resultado =
        animesInfo[clave];

      if (!resultado) {

        await sock.sendMessage(
          chat,
          {
            text:
`📖 ANIME INFO

🎌 ${nombre}

⚠️ No tengo información detallada de ese anime en la base local.

Usa:

.anime ${nombre}`
          }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text:
`📖 ANIME INFO

🎌 ${resultado.titulo}

🎭 Género:
${resultado.genero}

📌 Estado:
${resultado.estado}

📚 Descripción:
${resultado.descripcion}`
        }
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
`❌ Escribe el nombre de un personaje.

Ejemplo:

.personaje Goku`
          }
        );

        return true;
      }

      const personajes = {

        goku: {
          nombre: "Goku",
          anime: "Dragon Ball"
        },

        naruto: {
          nombre: "Naruto Uzumaki",
          anime: "Naruto"
        },

        ichigo: {
          nombre: "Ichigo Kurosaki",
          anime: "Bleach"
        },

        luffy: {
          nombre: "Monkey D. Luffy",
          anime: "One Piece"
        },

        gojo: {
          nombre: "Satoru Gojo",
          anime: "Jujutsu Kaisen"
        },

        levi: {
          nombre: "Levi Ackerman",
          anime: "Shingeki no Kyojin"
        },

        tanjiro: {
          nombre: "Tanjiro Kamado",
          anime: "Demon Slayer"
        },

        eren: {
          nombre: "Eren Yeager",
          anime: "Shingeki no Kyojin"
        },

        light: {
          nombre: "Light Yagami",
          anime: "Death Note"
        },

        killua: {
          nombre: "Killua Zoldyck",
          anime: "Hunter x Hunter"
        }

      };

      const clave =
        nombre
          .toLowerCase()
          .trim();

      const personaje =
        personajes[clave];

      if (!personaje) {

        await sock.sendMessage(
          chat,
          {
            text:
`❌ Personaje no encontrado.

Prueba con:

Goku
Naruto
Ichigo
Luffy
Gojo
Levi
Tanjiro
Eren
Light
Killua`
          }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text:
`👤 PERSONAJE

⭐ ${personaje.nombre}

🎌 Anime:
${personaje.anime}`
        }
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
`❌ Escribe un manga.

Ejemplo:

.manga One Piece`
          }
        );

        return true;
      }

      await sock.sendMessage(
        chat,
        {
          text:
`📚 MANGA

📖 ${nombre}

🔎 Búsqueda realizada.

ℹ️ Esta versión utiliza información local de TitanBot.`
        }
      );

      return true;
    }

    // ======================================
    // WAIFU
    // ======================================

    if (comando === "waifu") {

      const waifus = [
        "🌸 Hinata",
        "💜 Rem",
        "🔥 Asuna",
        "🌺 Nezuko",
        "⭐ Mikasa"
      ];

      const resultado =
        waifus[
          Math.floor(
            Math.random() *
            waifus.length
          )
        ];

      await sock.sendMessage(
        chat,
        {
          text:
`🌸 WAIFU

${resultado}`
        }
      );

      return true;
    }

    // ======================================
    // HUSBANDO
    // ======================================

    if (comando === "husbando") {

      const personajesHusbando = [
        "🔥 Gojo",
        "⚔️ Levi",
        "🌟 Luffy",
        "💥 Goku",
        "🖤 Itachi"
      ];

      const resultado =
        personajesHusbando[
          Math.floor(
            Math.random() *
            personajesHusbando.length
          )
        ];

      await sock.sendMessage(
        chat,
        {
          text:
`⚔️ HUSBANDO

${resultado}`
        }
      );

      return true;
    }

    // ======================================
    // COMANDO NO ES DE ANIME
    // ======================================

    return false;

  } catch (error) {

    console.error(
      "❌ Error en commands/anime.js:",
      error
    );

    try {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ Ocurrió un error al ejecutar el comando de anime.

Revisa los logs de TitanBot.`
        }
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
