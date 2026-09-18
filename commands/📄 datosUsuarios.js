// =========================================
// 👤 DATOS DE USUARIOS - TITANBOT
// =========================================

const usuarios = {};

function obtenerUsuario(jid) {
  if (!usuarios[jid]) {
    usuarios[jid] = {
      nivel: 1,
      xp: 0,
      logros: 0,
      aventuras: 0,
      capitulos: 1
    };
  }

  return usuarios[jid];
}

function agregarXP(jid, cantidad = 10) {
  const usuario = obtenerUsuario(jid);

  usuario.xp += cantidad;

  while (usuario.xp >= 100) {
    usuario.xp -= 100;
    usuario.nivel++;
  }

  return usuario;
}

module.exports = {
  usuarios,
  obtenerUsuario,
  agregarXP
};
