'use strict';

function ejecutar(core) {
  const pruebas = [];
  const comprobar = (nombre, fn) => {
    try {
      pruebas.push({ nombre, ok: true, detalle: fn() || 'Correcto' });
    } catch (e) {
      pruebas.push({ nombre, ok: false, detalle: String(e.message || e).slice(0, 140) });
    }
  };

  comprobar('Node.js', () => process.version);
  comprobar('Almacenamiento', () => {
    if (!core.storage || typeof core.storage.read !== 'function') throw new Error('Módulo no disponible');
    core.storage.read('config', {});
    return 'Lectura correcta';
  });

  for (const nombre of ['safety','memory','planner','actions','conversation','events','analytics','moderation','personality','scheduler']) {
    comprobar(`Módulo ${nombre}`, () => {
      if (!core[nombre]) throw new Error('No está cargado');
      return 'Cargado';
    });
  }

  comprobar('Configuración de IA', () => {
    if (!process.env.GROQ_API_KEY) throw new Error('Falta GROQ_API_KEY');
    return 'GROQ_API_KEY configurada; valor oculto';
  });

  const fallidas = pruebas.filter(p => !p.ok).length;
  return [
    '🩺 *DIAGNÓSTICO DE VIDA PROPIA*',
    '',
    `Resultado: ${fallidas ? 'HAY PROBLEMAS' : 'SIN ERRORES DETECTADOS'}`,
    `Pruebas: ${pruebas.length}`,
    `Fallidas: ${fallidas}`,
    '',
    ...pruebas.map(p => `${p.ok ? '✅' : '❌'} ${p.nombre}: ${p.detalle}`)
  ].join('\n');
}

module.exports = { ejecutar };
