'use strict';

function ejecutar(core, chat) {
  const stats = core.moderation.stats(chat);
  const pendientes = core.moderation.list(chat).filter(x => x.status === 'review');
  const acciones = core.actions.list();

  return [
    '🛡️ *REVISIÓN DE SEGURIDAD*',
    '',
    `Alertas pendientes: ${pendientes.length}`,
    `Alertas registradas: ${stats.total || 0}`,
    `Acciones disponibles: ${acciones.length}`,
    'Revisión de spam: manual',
    'Sanciones automáticas: desactivadas',
    'Cambios de permisos del grupo: no realizados',
    '',
    'Usa .vidapropia revisar para ver alertas pendientes.'
  ].join('\n');
}

module.exports = { ejecutar };
