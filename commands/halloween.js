const path = require("path");
const fs = require("fs");

// =====================================================
// 🎃 TITANBOT - COMANDOS DE HALLOWEEN
// Comandos: dulce, susto, maldicion
// Multimedia: ../media/dulce.mp4
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

module.exports = async function halloween(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {
  const comandos = ["dulce", "susto", "maldicion"];

  if (!comandos.includes(comando)) {
    return false;
  }

  const ahora = Date.now();
  const key = obtenerCooldownKey(chat, id, comando);
  const ultimoUso = cooldowns.get(key) || 0;
  const restante = COOLDOWN_MS - (ahora - ultimoUso);

  if (restante > 0) {
    const segundos = Math.ceil(restante / 1000);

    await sock.sendMessage(
      chat,
      {
        text: `🎃 Espera ${segundos} segundo(s) antes de volver a usar este comando.`
      },
      { quoted: msg }
    );

    return true;
  }

  let texto = "";

  // 🍬 COMANDO .dulce
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

  // 👻 COMANDO .susto
  if (comando === "susto") {
    texto =
      "🌑👻 *MODO SUSTO ACTIVADO* 👻🌑\n\n" +
      elegir(sustos) +
      "\n\n🕯️ La noche aún guarda secretos…";
  }

  // 🔮 COMANDO .maldicion
  if (comando === "maldicion") {
    texto =
      "🔮💀 *EL ORÁCULO DE HALLOWEEN* 💀🔮\n\n" +
      elegir(maldiciones) +
      "\n\n🎃 ¡La maldición es ficticia y solo por diversión!";
  }

  // 🎞️ ENVIAR ANIMACIÓN EN .dulce
  if (comando === "dulce") {
    const archivo = path.join(
      __dirname,
      "../media/dulce.mp4"
    );

    try {
      if (!fs.existsSync(archivo)) {
        throw new Error("No existe el archivo media/dulce.mp4");
      }

      const video = fs.readFileSync(archivo);

      if (video.length === 0) {
        throw new Error("El archivo dulce.mp4 está vacío");
      }

      await sock.sendMessage(
        chat,
        {
          video: video,
          mimetype: "video/mp4",
          gifPlayback: true,
          caption: texto
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error(
        "[HALLOWEEN] Error al enviar la animación:",
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
            texto +
            "\n\n⚠️ No se pudo enviar la animación de Halloween."
        },
        { quoted: msg }
      );
    }
  } else {
    // Enviar texto para .susto y .maldicion
    await sock.sendMessage(
      chat,
      { text: texto },
      { quoted: msg }
    );
  }

  // Registrar el uso después de procesar el comando.
  cooldowns.set(key, Date.now());

  return true;
};
  
