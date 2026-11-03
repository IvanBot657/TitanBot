// ============================================
// TITANBOT - MODULO MULTIMEDIA
// Archivo de compatibilidad para index.js
// ============================================

// index.js llama a manejarMultimedia() antes de procesar
// los comandos generales. Al devolver false, dejamos que
// el enrutador principal continúe con los demás módulos.
//
// Este archivo evita el error:
// Cannot find module './multimedia'

async function manejarMultimedia({ sock, jid, texto, quoted } = {}) {
  // No intercepta comandos ni mensajes.
  // Los comandos de Halloween se procesan en halloween.js.
  return false;
}

module.exports = {
  manejarMultimedia
};
