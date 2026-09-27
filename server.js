const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.ISLAS_PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data', 'islas.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

function getIslas() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

app.get('/api/islas', (req, res) => res.json(getIslas()));

app.get('/islas/:id', (req, res) => {
  const isla = getIslas().find(i => i.id === req.params.id.toLowerCase());
  if (!isla) return res.status(404).send('Isla no encontrada');

  const html = fs.readFileSync(path.join(PUBLIC_DIR, 'isla.html'), 'utf8')
    .replaceAll('{{NOMBRE}}', isla.nombre)
    .replaceAll('{{DESCRIPCION}}', isla.descripcion)
    .replaceAll('{{CLIMA}}', isla.clima)
    .replaceAll('{{AMBIENTE}}', isla.ambiente)
    .replaceAll('{{ICONO}}', isla.icono)
    .replaceAll('{{COLOR}}', isla.color)
    .replaceAll('{{ACTIVIDADES}}', isla.actividades.map(a => `<li>${a}</li>`).join(''));

  res.type('html').send(html);
});

app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.listen(PORT, () => console.log(`🏝️ Sistema de islas: http://localhost:${PORT}`));

module.exports = app;
