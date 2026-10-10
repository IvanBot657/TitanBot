const path = require("path");

// =====================================================
// 🎃 TITANBOT - COMANDOS DE HALLOWEEN
// Comandos: dulce, susto, maldicion
// =====================================================

const cooldowns = new Map();
const COOLDOWN_MS = 10_000;

const dulces = [
  "🍬 Encontraste una bolsa de caramelos mágicos.",
  "🍫 ¡Un vampiro te regaló chocolates!",
  "🍭 ¡Una bruja te obsequió una piruleta encantada!",
  "🧁 ¡Encontraste una cesta llena de dulces!",
  "🍪 Un murciélago dejó galletas frente a tu puerta."
];

const sustos = [
  "👻 ¡Un fantasma apareció detrás de ti!",
  "🧟 ¡Escuchas pasos de un zombi en el cementerio!",
  "🕷️ ¡Una araña gigante cayó sobre tu calabaza!",
  "🌫️ Una niebla misteriosa te rodea…",
  "🎃 ¡La calabaza acaba de girar la cabeza!"
];

const maldiciones = [
  "🦇 Maldición del murciélago: durante un minuto, todo te parece sospechoso.",
  "🌙 Maldición lunar: hoy los gatos te miran como si supieran tu secreto.",
  "🕸️ Maldición de la telaraña: ¡has quedado atrapado en una historia de terror!",
  "🧙 Maldición de la bruja: tu próxima risa sonará como la de un villano.",
  "💀 Maldición del esqueleto: ¡tus huesos imaginarios hacen música al caminar!"
];

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function obtenerCooldownKey(chat, id, comando) {
  return `${chat}:${id}:${comando}`;
}

module.exports = async function halloween(sock, chat, comando, args, id, msg) {
  const comandos = ["dulce", "susto", "maldicion"];

  if (!comandos.includes(comando)) return false;

  const ahora = Date.now();
  const key = obtenerCooldownKey(chat, id, comando);
  const ultimoUso = cooldowns.get(key) || 0;
  const restante = COOLDOWN_MS - (ahora - ultimoUso);

  if (restante > 0) {
    const segundos = Math.ceil(restante / 1000);
    await sock.sendMessage(
      chat,
      { text: `🎃 Espera ${segundos} segundo(s) antes de volver a usar este comando.` },
      { quoted: msg }
    );
    return true;
  }

  cooldowns.set(key, ahora);

  let texto = "";

  if (comando === "dulce") {
    const suerte = Math.random() * 100;

    if (suerte < 60) {
      texto =
        "🍬🎃 *¡DULCE O TRAVESURA!* 🎃🍬\n\n" +
        elegir(dulces) +
        "\n\n✨ ¡Qué buena suerte tienes!";
    } else if (suerte < 90) {
      texto =
        "👻 *¡TRAVESURA!* 👻\n\n" +
        elegir(sustos) +
        "\n\n🎃 ¡Corre antes de que vuelva!";
    } else {
      texto =
        "🌟🎃 *¡PREMIO LEGENDARIO!* 🎃🌟\n\n" +
        "👑 ¡Encontraste la CALABAZA DORADA!\n\n" +
        "💎 Eres una leyenda de Halloween.\n" +
        "🍬 ¡La suerte está de tu lado!";
    }
  }

  if (comando === "susto") {
    texto =
      "🌑👻 *MODO SUSTO ACTIVADO* 👻🌑\n\n" +
      elegir(sustos) +
      "\n\n🕯️ La noche aún guarda secretos…";
  }

  if (comando === "maldicion") {
    texto =
      "🔮💀 *EL ORÁCULO DE HALLOWEEN* 💀🔮\n\n" +
      elegir(maldiciones) +
      "\n\n🎃 ¡La maldición es ficticia y solo por diversión!";
  }

  if (comando === "dulce") {
    // Envía el GIF que viene dentro de commands/dulce.gif como animación.
    const gifDulce = path.join(__dirname, "dulce.gif");
    try {
      await sock.sendMessage(
        chat,
        { video: { url: gifDulce }, gifPlayback: true, caption: texto },
        { quoted: msg }
      );
    } catch (error) {
      // Si no se puede enviar el GIF, el comando sigue funcionando como texto.
      await sock.sendMessage(chat, { text: texto }, { quoted: msg });
    }
  } else {
    await sock.sendMessage(chat, { text: texto }, { quoted: msg });
  }
  return true;
};
