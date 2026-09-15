const express = require("express");

const app = express();

const PORT = process.env.PORT || 10000;

// =========================================
// 🎬 TITANGIF-API
// =========================================

const gifs = {

  abrazar: [
  "https://media.tenor.com/7I3H1QZ7zJAAAAAC/anime-hug.gif"
],
  saludo: [],
  felicitar: [],
  reir: [],
  llorar: [],
  enojado: [],
  bailar: [],
  golpear: [],
  patada: []

};

// =========================================
// 🏠 INICIO
// =========================================

app.get("/", (req, res) => {

  res.json({
    ok: true,
    name: "TitanGIF-API",
    status: "online"
  });

});

// =========================================
// 🎬 GIF GENERAL
// =========================================

app.get("/gif", (req, res) => {

  const todas = Object.values(gifs)
    .flat();

  if (todas.length === 0) {

    return res.status(404).json({
      ok: false,
      error: "Todavía no hay GIFs."
    });

  }

  const gif =
    todas[Math.floor(
      Math.random() * todas.length
    )];

  res.json({
    ok: true,
    gif
  });

});

// =========================================
// 🎭 GIF POR ACCIÓN
// =========================================

app.get("/gif/:accion", (req, res) => {

  const accion =
    String(req.params.accion || "")
      .toLowerCase()
      .trim();

  if (!gifs[accion]) {

    return res.status(404).json({
      ok: false,
      error: "Acción no encontrada."
    });

  }

  if (gifs[accion].length === 0) {

    return res.status(404).json({
      ok: false,
      error:
        `Todavía no hay GIFs para ${accion}.`
    });

  }

  const lista =
    gifs[accion];

  const gif =
    lista[Math.floor(
      Math.random() * lista.length
    )];

  res.json({
    ok: true,
    accion,
    gif
  });

});

// =========================================
// 🚀 SERVIDOR
// =========================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🎬 TitanGIF-API funcionando en puerto ${PORT}`
    );

  }
);
