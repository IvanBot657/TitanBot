// =========================================
// 🔮 PREDICCIONES - TITANBOT
// =========================================

const tipos = {

  prediccion: {
    nombre: "🔮 PREDICCIÓN",
    frases: [
      "✨ Hoy podría pasar algo que no esperabas.",
      "👀 Alguien podría sorprenderte hoy.",
      "🍀 La suerte podría aparecer cuando menos lo imagines.",
      "⚡ Se aproxima algo interesante.",
      "🎯 Una oportunidad podría aparecer de repente."
    ]
  },

  amor: {
    nombre: "❤️ PREDICCIÓN DE AMOR",
    frases: [
      "💌 Alguien podría tener un mensaje inesperado para ti.",
      "❤️ Hoy podría ocurrir un momento bonito.",
      "👀 Una conversación podría ponerse interesante.",
      "💘 El destino podría sorprenderte."
    ]
  },

  suerte: {
    nombre: "🍀 PREDICCIÓN DE SUERTE",
    frases: [
      "🍀 Hoy podrías tener mucha suerte.",
      "🎯 Algo podría salir mejor de lo esperado.",
      "✨ Una buena oportunidad podría aparecer.",
      "🏆 Hoy podrías conseguir una pequeña victoria."
    ]
  },

  random: {
    nombre: "😂 PREDICCIÓN RANDOM",
    frases: [
      "🗿 Vas a abrir una app y olvidarás para qué la abriste.",
      "💀 Buscarás algo que probablemente tienes frente a ti.",
      "😂 Hoy algo completamente random podría pasar.",
      "🤡 El universo decidió trolearte un poquito."
    ]
  },

  dinero: {
    nombre: "💰 PREDICCIÓN DE DINERO",
    frases: [
      "💸 Hoy tendrás que cuidar bien tus monedas.",
      "🤑 Podría aparecer una pequeña oportunidad.",
      "💰 Guarda tu dinero... nunca sabes cuándo lo necesitarás.",
      "👀 Revisa bien tus bolsillos, nunca se sabe."
    ]
  },

  gamer: {
    nombre: "🎮 PREDICCIÓN GAMER",
    frases: [
      "🏆 Hoy podrías conseguir una victoria épica.",
      "🎮 Una partida podría terminar de forma inesperada.",
      "🔥 Prepárate para una jugada increíble.",
      "👾 Hoy el RNG podría estar de tu lado."
    ]
  },

  social: {
    nombre: "📱 PREDICCIÓN SOCIAL",
    frases: [
      "📱 Alguien podría escribirte cuando menos lo esperes.",
      "👀 Una conversación interesante podría aparecer.",
      "😂 Hoy podrías terminar riéndote con alguien.",
      "💬 Podrías recibir un mensaje inesperado."
    ]
  },

  nocturna: {
    nombre: "🌙 PREDICCIÓN NOCTURNA",
    frases: [
      "🌙 Esta noche podrías pensar en algo inesperado.",
      "😴 Tu cama intentará convencerte de dormir temprano.",
      "👀 Algo curioso podría pasar antes de dormir.",
      "✨ La noche podría traer una sorpresa."
    ]
  },

  epica: {
    nombre: "🔥 PREDICCIÓN ÉPICA",
    frases: [
      "⚡ Se aproxima un momento digno de recordar.",
      "🔥 Hoy podría comenzar algo interesante.",
      "🏆 Una pequeña victoria podría estar cerca.",
      "🚀 Prepárate para algo inesperado."
    ]
  },

  troll: {
    nombre: "🤡 PREDICCIÓN TROLL",
    frases: [
      "💀 El destino tiene una pequeña broma preparada para ti.",
      "🗿 Hoy podrías quedar como payaso sin darte cuenta. 😂",
      "🤡 Alguien podría trolearte de la forma más inesperada.",
      "😂 El universo decidió reírse un poquito de ti."
    ]
  }
};


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
// 🔮 COMANDO PRINCIPAL
// =========================================

async function prediccion(
  sock,
  chat,
  comando,
  args = [],
  id,
  msg
) {

  const cmd = normalizar(comando);

  // Si no es uno de nuestros comandos
  if (!tipos[cmd]) {
    return false;
  }

  // Elegir tipo
  const tipo = tipos[cmd];

  // Elegir frase aleatoria
  const frase =
    tipo.frases[
      Math.floor(Math.random() * tipo.frases.length)
    ];

  // Enviar resultado
  await sock.sendMessage(chat, {
    text:
`🔮 *${tipo.nombre}*

${frase}

✨ _TITANBOT_`
  });

  return true;
}


// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = prediccion;
module.exports.prediccion = prediccion;
