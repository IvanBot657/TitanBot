
const path = require("path");
const fs = require("fs");

// =====================================================
// 🎃 TITANBOT - COMANDOS DE HALLOWEEN
// Comandos: dulce, susto, maldicion, asustar,
// bailar, comer, invocar, suspiro, lunaroja,
// morder, elegancia
// =====================================================

const cooldowns = new Map();
const COOLDOWN_MS = 10_000;

// 🎞️ Archivos multimedia
const animaciones = {
  dulce: "dulce.mp4",
  asustar: "asustar.mp4",
  baila: "bailar.mp4",
  comer: "comer.mp4",
  invoca: "invocar.mp4",

  // 🩸 Nuevos videos
  suspiro: "suspiro.mp4",
  lunaroja: "luna-roja.mp4",
  morder: "morder.mp4",
  elegancia: "elegancia.mp4"
};

// 🍬 Mensajes de dulces
const dulces = [
  "🍬 Encontraste una bolsa de caramelos mágicos.",
  "🍫 ¡Un vampiro te regaló chocolates!",
  "🍭 ¡Una bruja te obsequió una piruleta encantada!",
  "🧁 ¡Encontraste una cesta llena de dulces!",
  "🍪 Un murciélago dejó galletas frente a tu puerta."
];

// 👻 Mensajes de sustos
const sustos = [
  "👻 ¡Un fantasma apareció detrás de ti!",
  "🧟 ¡Escuchas pasos de un zombi en el cementerio!",
  "🕷️ ¡Una araña gigante cayó sobre tu calabaza!",
  "🌫️ Una niebla misteriosa te rodea…",
  "🎃 ¡La calabaza acaba de girar la cabeza!"
];

// 🔮 Maldiciones
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
  comando = String(comando || "")
    .toLowerCase()
    .trim()
    .replace(/^\./, "");

  const comandos = [
    "dulce",
    "susto",
    "maldicion",
    "asustar",
    "baila",
    "comer",
    "invoca",
    "suspiro",
    "lunaroja",
    "morder",
    "elegancia"
  ];

  if (!comandos.includes(comando)) {
    return false;
  }

  // ⏳ COOLDOWN POR COMANDO
  const key = obtenerCooldownKey(chat, id, comando);
  const ahora = Date.now();
  const ultimoUso = cooldowns.get(key) || 0;
  const restante = COOLDOWN_MS - (ahora - ultimoUso);

  if (restante > 0) {
    await sock.sendMessage(
      chat,
      {
        text: `🎃 Espera ${Math.ceil(restante / 1000)} segundo(s) antes de volver a usar este comando.`
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
  else if (comando === "susto") {
    texto =
      "🌑👻 *MODO SUSTO ACTIVADO* 👻🌑\n\n" +
      elegir(sustos) +
      "\n\n🕯️ La noche aún guarda secretos…";
  }

  // 🔮 COMANDO .maldicion
  else if (comando === "maldicion") {
    texto =
      "🔮💀 *EL ORÁCULO DE HALLOWEEN* 💀🔮\n\n" +
      elegir(maldiciones) +
      "\n\n🎃 ¡La maldición es ficticia y solo por diversión!";
  }

  // 😱 COMANDO .asustar
  else if (comando === "asustar") {
    texto =
      "😱🎃 *¡PREPÁRATE PARA EL SUSTO!* 🎃😱\n\n" +
      "👻 ¡Una presencia misteriosa ha aparecido!";
  }

  // 💃 COMANDO .bailar
  else if (comando === "bailar") {
    texto =
      "💀🕺 *¡BAILE DE LOS MUERTOS!* 🕺💀\n\n" +
      "🎶 ¡Que comience la fiesta de Halloween!";
  }

  // 🍬 COMANDO .comer
  else if (comando === "comer") {
    texto =
      "🍭🍫 *¡HORA DE LOS DULCES!* 🍫🍭\n\n" +
      "🎃 ¡Los monstruos también tienen hambre!";
  }

  // 🔮 COMANDO .invocar
  else if (comando === "invocar") {
    texto =
      "🔮🌑 *RITUAL DE HALLOWEEN* 🌑🔮\n\n" +
      "🦇 ¡Una misteriosa criatura responde a la invocación!";
  }

  // 🖤 COMANDO .suspiro
  else if (comando === "suspiro") {
    texto =
      "🖤 *SUSPIRO* 🖤\n\n" +
      "Un suspiro que dice más que mil palabras...";
  }

  // 🌕 COMANDO .lunaroja
  else if (comando === "lunaroja") {
    texto =
      "🌕🩸 *LUNA ROJA* 🩸🌕\n\n" +
      "La noche revela su lado más misterioso...";
  }

  // 🧛 COMANDO .morder
  else if (comando === "morder") {
    texto =
      "🧛🩸 *MORDER* 🩸🧛\n\n" +
      "Cuidado... alguien tiene sed esta noche.";
  }

  // 🥀 COMANDO .elegancia
  else if (comando === "elegancia") {
    texto =
      "🖤🥀 *ELEGANCIA* 🥀🖤\n\n" +
      "El estilo oscuro nunca pasa desapercibido.";
  }

  // 🎞️ ENVIAR ANIMACIÓN O MENSAJE
  const nombreArchivo = animaciones[comando];

  if (nombreArchivo) {
    const archivo = path.join(
      __dirname,
      "../media",
      nombreArchivo
    );

    try {
      if (!fs.existsSync(archivo)) {
        throw new Error(
          `No se encontró el archivo: ${archivo}`
        );
      }

      const video = fs.readFileSync(archivo);

      if (video.length === 0) {
        throw new Error(
          `El archivo ${nombreArchivo} está vacío`
        );
      }

      await sock.sendMessage(
        chat,
        {
          video,
          mimetype: "video/mp4",
          gifPlayback: true,
          caption: texto
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error(
        `[HALLOWEEN] Error con ${comando}:`,
        error
      );

      await sock.sendMessage(
        chat,
        {
          text:
            texto +
            `\n\n⚠️ No se pudo enviar la animación ${nombreArchivo}.`
        },
        { quoted: msg }
      );
    }
  } else {
    await sock.sendMessage(
      chat,
      { text: texto },
      { quoted: msg }
    );
  }

  cooldowns.set(key, Date.now());

  return true;
};
