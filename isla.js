const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'islas.json');
const WEB_URL = process.env.ISLAS_WEB_URL || 'http://localhost:3000';

function cargarIslas() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function buscarIsla(islas, termino) {
  const q = String(termino || '').toLowerCase().trim();
  return islas.find(i => i.id.toLowerCase() === q || i.nombre.toLowerCase() === q);
}

async function ejecutarIsla(sock, chat, comando, args = []) {
  const islas = cargarIslas();
  const sub = String(args[0] || '').toLowerCase();

  if (!sub || sub === 'lista' || sub === 'listar') {
    const texto = ['🏝️ *ISLAS DISPONIBLES*', ''];
    for (const isla of islas) {
      texto.push(`🏝️ *${isla.nombre}*`);
      texto.push(`📝 ${isla.descripcion}`);
      texto.push(`🌐 ${WEB_URL}/islas/${isla.id}`);
      texto.push('');
    }
    texto.push('Usa: *.isla <nombre>*.');
    return sock.sendMessage(chat, { text: texto.join('\n') });
  }

  if (sub === 'ayuda' || sub === 'help') {
    return sock.sendMessage(chat, {
      text: '🏝️ *COMANDO ISLA*\n\n• .isla — lista las islas\n• .isla <nombre> — muestra una isla\n• .isla lista — lista las islas\n\nCada isla tiene su propia página web.'
    });
  }

  const isla = buscarIsla(islas, args.join(' '));
  if (!isla) {
    return sock.sendMessage(chat, { text: `❌ No encontré esa isla. Usa *.isla* para ver la lista.` });
  }

  const texto = [
    `🏝️ *${isla.nombre}*`,
    '',
    `📝 ${isla.descripcion}`,
    `🌤️ Clima: ${isla.clima}`,
    `🌊 Ambiente: ${isla.ambiente}`,
    `✨ Actividades: ${isla.actividades.join(', ')}`,
    '',
    `🌐 Página: ${WEB_URL}/islas/${isla.id}`
  ].join('\n');

  return sock.sendMessage(chat, { text: texto });
}

module.exports = ejecutarIsla;
module.exports.ejecutarIsla = ejecutarIsla;
