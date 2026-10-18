'use strict';

function ejecutar(core, chat, config) {
  const a = core.analytics.report(chat);
  const diaria = core.analytics.daily(chat);
  const m = core.memory.stats(chat);
  const mod = core.moderation.stats(chat);
  const eventos = core.events.list(chat);
  const ideas = core.events.ideas(chat);

  return [
    '📋 *INFORME GENERAL DE VIDA PROPIA*',
    '',
    `Estado: ${config.enabled ? '🟢 Activa' : '🔴 Desactivada'}`,
    `Mensajes atendidos: ${a.messages || 0}`,
    `Respuestas en 24 h: ${diaria.speeches || 0}`,
    `Errores registrados: ${a.errors || 0}`,
    `Recuerdos guardados: ${m.facts || 0}`,
    `Mensajes en memoria: ${m.turns || 0}`,
    `Eventos guardados: ${eventos.length}`,
    `Ideas guardadas: ${ideas.length}`,
    `Alertas pendientes: ${mod.pending || 0}`,
    `Acciones disponibles: ${core.actions.list().length}`,
    `Última respuesta: ${a.lastSpoke || 'ninguna'}`
  ].join('\n');
}

module.exports = { ejecutar };
