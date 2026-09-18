// =========================================
// 🔮 PREDICCIÓN - TITANBOT
// =========================================

const tipos = [
  {
    nombre: "❤️ AMOR",
    frases: [
      "💌 Alguien podría sorprenderte hoy. 👀",
      "❤️ Se viene un momento bonito e inesperado.",
      "💘 Puede llegar un mensaje que no esperabas."
    ]
  },

  {
    nombre: "🍀 SUERTE",
    frases: [
      "🍀 Hoy podrías tener una pequeña dosis de suerte.",
      "🎯 Algo podría salir mejor de lo esperado.",
      "✨ La suerte podría aparecer cuando menos lo imagines."
    ]
  },

  {
    nombre: "😂 RANDOM",
    frases: [
      "🗿 Vas a entrar a una app y olvidarás para qué entraste.",
      "💀 Hoy probablemente buscarás algo que tienes en la mano.",
      "😂 Alguien dirá algo que te hará reír cuando menos lo esperes."
    ]
  },

  {
    nombre: "💰 DINERO",
    frases: [
      "💸 Hoy tu dinero podría desaparecer misteriosamente. 😂",
      "🤑 Una pequeña oportunidad podría aparecer.",
      "💰 Cuida tus monedas... podrían hacerte falta."
    ]
  },

  {
    nombre: "🎮 GAMER",
    frases: [
      "🏆 Una partida podría terminar de forma inesperada.",
      "🎮 Hoy podrías conseguir una victoria épica.",
      "🔥 Prepárate para una jugada inesperada."
    ]
  },

  {
    nombre: "📱 SOCIAL",
    frases: [
      "👀 Alguien podría escribirte cuando menos lo esperes.",
      "📱 Hoy podrías recibir un mensaje interesante.",
      "😂 Una conversación podría terminar siendo muy divertida."
    ]
  },

  {
    nombre: "🌙 NOCTURNA",
    frases: [
      "😴 Tu cama intentará convencerte de dormir temprano.",
      "🌙 Esta noche podrías quedarte pensando en algo random.",
      "👀 Algo curioso podría pasar antes de dormir."
    ]
  },

  {
    nombre: "🔥 ÉPICA",
    frases: [
      "⚡ Hoy podría aparecer una oportunidad inesperada.",
      "🔥 Se aproxima un momento digno de recordar.",
      "🏆 El destino podría darte una pequeña victoria."
    ]
  },

  {
    nombre: "🤡 TROLL",
    frases: [
      "💀 El destino tiene una pequeña broma preparada para ti.",
      "🗿 Hoy podrías hacer el ridículo sin darte cuenta. 😂",
      "🤡 Alguien podría trolearte de la forma más inesperada."
    ]
  }
];

async function prediccion(sock, chat, comando, args = [], id, msg) {

  const cmd = String(comando || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (cmd !== "prediccion") {
    return false;
  }

  const tipo =
    tipos[Math.floor(Math.random() * tipos.length)];

  const frase =
    tipo.frases[Math.floor(Math.random() * tipo.frases.length)];

  await sock.sendMessage(chat, {
    text:
`🔮 *PREDICCIÓN*

${tipo.nombre}

${frase}

✨ _Predicción generada por TITANBOT_`
  });

  return true;
}

module.exports = prediccion;
module.exports.prediccion = prediccion;
