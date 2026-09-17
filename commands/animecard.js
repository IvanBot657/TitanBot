// ========================================
// TITANBOT
// ANIME CARD
// Generador de tarjetas anime con Sharp
// ========================================

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ========================================
// RUTAS
// ========================================

const ANIME_DIR =
  path.join(
    __dirname,
    "..",
    "assets",
    "anime"
  );

// ========================================
// CREAR CARPETA SI NO EXISTE
// ========================================

if (!fs.existsSync(ANIME_DIR)) {
  fs.mkdirSync(
    ANIME_DIR,
    { recursive: true }
  );
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
// AJUSTAR TEXTO
// ========================================

function limitarTexto(
  texto,
  maximo = 28
) {
  texto =
    String(texto || "");

  if (texto.length <= maximo) {
    return texto;
  }

  return (
    texto.substring(0, maximo - 3) +
    "..."
  );
}

// ========================================
// CREAR TARJETA
// ========================================

async function crearAnimeCard({
  personaje,
  anime,
  nombreUsuario,
  idUsuario,
  estado = "LIBRE",
  frase
}) {

  const width = 1000;
  const height = 1350;

  const imagenPath =
    path.join(
      ANIME_DIR,
      personaje
    );

  let imagen = null;

  // ======================================
  // BUSCAR IMAGEN
  // ======================================

  if (
    fs.existsSync(imagenPath)
  ) {

    try {

      imagen =
        await sharp(imagenPath)
          .resize(
            700,
            700,
            {
              fit: "cover",
              position: "centre"
            }
          )
          .png()
          .toBuffer();

    } catch (error) {

      console.error(
        "❌ Error cargando personaje:",
        error
      );

    }
  }

  // ======================================
  // FONDO
  // ======================================

  const fondo = Buffer.from(`
<svg
  width="${width}"
  height="${height}"
  xmlns="http://www.w3.org/2000/svg"
>

  <defs>

    <linearGradient
      id="background"
      x1="0"
      y1="0"
      x2="1"
      y2="1"
    >

      <stop
        offset="0%"
        stop-color="#090916"
      />

      <stop
        offset="55%"
        stop-color="#17134A"
      />

      <stop
        offset="100%"
        stop-color="#05050D"
      />

    </linearGradient>

    <linearGradient
      id="line"
      x1="0"
      y1="0"
      x2="1"
      y2="0"
    >

      <stop
        offset="0%"
        stop-color="#6366F1"
      />

      <stop
        offset="100%"
        stop-color="#22D3EE"
      />

    </linearGradient>

  </defs>

  <!-- Fondo -->

  <rect
    width="100%"
    height="100%"
    fill="url(#background)"
  />

  <!-- Detalles -->

  <circle
    cx="850"
    cy="170"
    r="190"
    fill="none"
    stroke="#6366F1"
    stroke-width="3"
    opacity="0.25"
  />

  <circle
    cx="120"
    cy="1180"
    r="230"
    fill="none"
    stroke="#22D3EE"
    stroke-width="3"
    opacity="0.15"
  />

  <path
    d="M0 280 L1000 80"
    stroke="url(#line)"
    stroke-width="3"
    opacity="0.35"
  />

  <path
    d="M0 1270 L1000 1080"
    stroke="url(#line)"
    stroke-width="3"
    opacity="0.3"
  />

  <!-- Marco -->

  <rect
    x="30"
    y="30"
    width="940"
    height="1290"
    rx="35"
    fill="none"
    stroke="#7777FF"
    stroke-width="4"
  />

  <rect
    x="48"
    y="48"
    width="904"
    height="1254"
    rx="28"
    fill="none"
    stroke="white"
    stroke-width="1"
    opacity="0.25"
  />

</svg>
`);

  // ======================================
  // ZONA DE IMAGEN
  // ======================================

  const zonaImagen =
    Buffer.from(`
<svg
  width="700"
  height="700"
  xmlns="http://www.w3.org/2000/svg"
>

  <rect
    width="700"
    height="700"
    rx="35"
    fill="#0B0B18"
    stroke="#7777FF"
    stroke-width="4"
  />

  <text
    x="350"
    y="350"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Arial"
    font-size="36"
    font-weight="bold"
    fill="#8F96FF"
  >
    PERSONAJE
  </text>

</svg>
`);

  // ======================================
  // INFORMACIÓN
  // ======================================

  const nombreSeguro =
    escapar(
      limitarTexto(
        nombreUsuario,
        24
      )
    );

  const idSeguro =
    escapar(
      limitarTexto(
        idUsuario,
        24
      )
    );

  const personajeSeguro =
    escapar(
      limitarTexto(
        personaje
          .replace(/\.[^/.]+$/, ""),
        24
      )
    );

  const animeSeguro =
    escapar(
      limitarTexto(
        anime,
        30
      )
    );

  const fraseSegura =
    escapar(
      limitarTexto(
        frase,
        65
      )
    );

  const estadoSeguro =
    escapar(
      estado
    );

  const info =
    Buffer.from(`
<svg
  width="${width}"
  height="${height}"
  xmlns="http://www.w3.org/2000/svg"
>

  <!-- TITANBOT -->

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
    y="155"
    text-anchor="middle"
    font-family="Arial"
    font-size="22"
    fill="#9CA3FF"
  >
    ANIME ID
  </text>

  <!-- Nombre personaje -->

  <text
    x="500"
    y="945"
    text-anchor="middle"
    font-family="Arial"
    font-size="44"
    font-weight="bold"
    fill="white"
  >
    ${personajeSeguro}
  </text>

  <!-- Anime -->

  <text
    x="500"
    y="985"
    text-anchor="middle"
    font-family="Arial"
    font-size="27"
    fill="#AEB5FF"
  >
    ${animeSeguro}
  </text>

  <!-- Estado -->

  <rect
    x="325"
    y="1015"
    width="350"
    height="60"
    rx="30"
    fill="${
      estado === "LIBRE"
        ? "#123B2A"
        : "#3B1717"
    }"
    stroke="${
      estado === "LIBRE"
        ? "#4ADE80"
        : "#F87171"
    }"
    stroke-width="2"
  />

  <text
    x="500"
    y="1055"
    text-anchor="middle"
    font-family="Arial"
    font-size="28"
    font-weight="bold"
    fill="${
      estado === "LIBRE"
        ? "#4ADE80"
        : "#F87171"
    }"
  >
    ● ${estadoSeguro}
  </text>

  <!-- Usuario -->

  <text
    x="95"
    y="1135"
    font-family="Arial"
    font-size="21"
    fill="#8F96FF"
  >
    USUARIO
  </text>

  <text
    x="95"
    y="1170"
    font-family="Arial"
    font-size="28"
    fill="white"
  >
    ${nombreSeguro}
  </text>

  <!-- ID -->

  <text
    x="95"
    y="1215"
    font-family="Arial"
    font-size="21"
    fill="#8F96FF"
  >
    ID
  </text>

  <text
    x="95"
    y="1248"
    font-family="Arial"
    font-size="25"
    fill="white"
  >
    ${idSeguro}
  </text>

  <!-- Frase -->

  <text
    x="500"
    y="1290"
    text-anchor="middle"
    font-family="Arial"
    font-size="19"
    fill="#AEB5FF"
  >
    "${fraseSegura}"
  </text>

</svg>
`);

  // ======================================
  // CONSTRUIR
  // ======================================

  let tarjeta =
    sharp(fondo);

  // ======================================
  // IMAGEN DEL PERSONAJE
  // ======================================

  if (imagen) {

    tarjeta =
      tarjeta.composite([
        {
          input: imagen,
          left: 150,
          top: 205
        }
      ]);

  } else {

    tarjeta =
      tarjeta.composite([
        {
          input: zonaImagen,
          left: 150,
          top: 205
        }
      ]);

  }

  // ======================================
  // TEXTOS
  // ======================================

  tarjeta =
    tarjeta.composite([
      {
        input: info,
        left: 0,
        top: 0
      }
    ]);

  // ======================================
  // RESULTADO
  // ======================================

  return await tarjeta
    .jpeg({
      quality: 92
    })
    .toBuffer();
}

// ========================================
// EXPORTAR
// ========================================

module.exports = {
  crearAnimeCard
};
