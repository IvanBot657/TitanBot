// =========================================
// 🎭 PERSONALIDAD - TITANBOT
// =========================================

const personalidades = [
  {
    nombre: "😎 AVENTURERO",
    descripcion: "Te gusta explorar, probar cosas nuevas y vivir aventuras.",
    energia: 92,
    suerte: 78,
    creatividad: 85
  },
  {
    nombre: "🧠 INTELECTUAL",
    descripcion: "Te encanta aprender, analizar y descubrir cómo funcionan las cosas.",
    energia: 75,
    suerte: 64,
    creatividad: 91
  },
  {
    nombre: "😂 GRACIOSO",
    descripcion: "Siempre encuentras una forma de hacer reír a los demás.",
    energia: 88,
    suerte: 73,
    creatividad: 94
  },
  {
    nombre: "😈 TRAVIESO",
    descripcion: "Te encanta hacer bromas y sorprender a los demás.",
    energia: 95,
    suerte: 81,
    creatividad: 89
  },
  {
    nombre: "🦸 HÉROE",
    descripcion: "Te gusta ayudar a los demás y enfrentarte a los problemas.",
    energia: 97,
    suerte: 84,
    creatividad: 79
  },
  {
    nombre: "🕵️ MISTERIOSO",
    descripcion: "No revelas todo sobre ti y siempre tienes algo inesperado.",
    energia: 70,
    suerte: 90,
    creatividad: 96
  },
  {
    nombre: "🔥 ENERGÉTICO",
    descripcion: "Tienes mucha energía y siempre estás listo para hacer algo.",
    energia: 100,
    suerte: 76,
    creatividad: 82
  },
  {
    nombre: "🌙 TRANQUILO",
    descripcion: "Prefieres mantener la calma y disfrutar las cosas a tu ritmo.",
    energia: 62,
    suerte: 88,
    creatividad: 90
  },
  {
    nombre: "👑 LÍDER",
    descripcion: "Sueles tomar la iniciativa y organizar al grupo.",
    energia: 94,
    suerte: 86,
    creatividad: 87
  },
  {
    nombre: "🎨 CREATIVO",
    descripcion: "Tu imaginación está llena de ideas originales.",
    energia: 83,
    suerte: 79,
    creatividad: 100
  }
];


// =========================================
// 🔧 NORMALIZAR COMANDO
// =========================================

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


// =========================================
// 🎭 COMANDO PERSONALIDAD
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

  if (cmd !== "personalidad") {
    return false;
  }

  const resultado =
    personalidades[
      Math.floor(Math.random() * personalidades.length)
    ];

  await sock.sendMessage(chat, {
    text:
`🎭 *TU PERSONALIDAD*

━━━━━━━━━━━━━━━━━━━━

${resultado.nombre}

💬 ${resultado.descripcion}

⚡ Energía: ${resultado.energia}%
🍀 Suerte: ${resultado.suerte}%
🎨 Creatividad: ${resultado.creatividad}%

━━━━━━━━━━━━━━━━━━━━

✨ _Personalidad generada por TITANBOT_`
  });

  return true;
}


// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = personalidad;
module.exports.personalidad = personalidad;
