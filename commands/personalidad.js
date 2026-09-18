// =========================================
// 🎭 PERSONALIDAD - TITANBOT
// =========================================

const personalidades = {
  personalidad: {
    nombre: "🎭 PERSONALIDAD",
    descripcion: "Tu personalidad será elegida al azar.",
    energia: 85,
    suerte: 80,
    creatividad: 90
  },

  aventurero: {
    nombre: "😎 AVENTURERO",
    descripcion: "Te gusta explorar, probar cosas nuevas y vivir aventuras.",
    energia: 92,
    suerte: 78,
    creatividad: 85
  },

  intelectual: {
    nombre: "🧠 INTELECTUAL",
    descripcion: "Te encanta aprender, analizar y descubrir cómo funcionan las cosas.",
    energia: 75,
    suerte: 64,
    creatividad: 91
  },

  gracioso: {
    nombre: "😂 GRACIOSO",
    descripcion: "Siempre encuentras una forma de hacer reír a los demás.",
    energia: 88,
    suerte: 73,
    creatividad: 94
  },

  travieso: {
    nombre: "😈 TRAVIESO",
    descripcion: "Te encanta hacer bromas y sorprender a los demás.",
    energia: 95,
    suerte: 81,
    creatividad: 89
  },

  heroe: {
    nombre: "🦸 HÉROE",
    descripcion: "Te gusta ayudar a los demás y enfrentarte a los problemas.",
    energia: 97,
    suerte: 84,
    creatividad: 79
  },

  misterioso: {
    nombre: "🕵️ MISTERIOSO",
    descripcion: "No revelas todo sobre ti y siempre tienes algo inesperado.",
    energia: 70,
    suerte: 90,
    creatividad: 96
  },

  energetico: {
    nombre: "🔥 ENERGÉTICO",
    descripcion: "Tienes mucha energía y siempre estás listo para hacer algo.",
    energia: 100,
    suerte: 76,
    creatividad: 82
  },

  tranquilo: {
    nombre: "🌙 TRANQUILO",
    descripcion: "Prefieres mantener la calma y disfrutar las cosas a tu ritmo.",
    energia: 62,
    suerte: 88,
    creatividad: 90
  },

  lider: {
    nombre: "👑 LÍDER",
    descripcion: "Sueles tomar la iniciativa y organizar al grupo.",
    energia: 94,
    suerte: 86,
    creatividad: 87
  },

  creativo: {
    nombre: "🎨 CREATIVO",
    descripcion: "Tu imaginación está llena de ideas originales.",
    energia: 83,
    suerte: 79,
    creatividad: 100
  }
};


// =========================================
// 🔧 NORMALIZAR
// =========================================

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


// =========================================
// 🎭 COMANDO
// =========================================

async function personalidad(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {

  const cmd = normalizar(comando);

  if (!personalidades[cmd]) {
    return false;
  }

  const resultado = personalidades[cmd];

  await sock.sendMessage(chat, {
    text:
`🎭 *PERSONALIDAD*

━━━━━━━━━━━━━━━━━━━━

${resultado.nombre}

💬 ${resultado.descripcion}

⚡ Energía: ${resultado.energia}%
🍀 Suerte: ${resultado.suerte}%
🎨 Creatividad: ${resultado.creatividad}%

━━━━━━━━━━━━━━━━━━━━

✨ _TITANBOT_`
  });

  return true;
}


module.exports = personalidad;
module.exports.personalidad = personalidad;
