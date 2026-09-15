const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Inicio de la API
app.get("/", (req, res) => {
  res.json({
    ok: true,
    nombre: "TitanGIF-API",
    version: "1.0.0",
    mensaje: "TitanGIF-API funcionando correctamente 🚀"
  });
});

// Estado de la API
app.get("/status", (req, res) => {
  res.json({
    online: true,
    servicio: "TitanGIF-API",
    estado: "activo"
  });
});

// Endpoint para GIF
app.get("/gif", (req, res) => {
  res.json({
    ok: true,
    gif: null,
    mensaje: "Endpoint GIF funcionando correctamente"
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`TitanGIF-API funcionando en el puerto ${PORT}`);
});
