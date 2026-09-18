// =========================================
// 🐾 RACHA DE ANIMALES - TITANBOT
// =========================================

const {
  obtenerUsuario,
  guardarUsuario,
  agregarXP
} = require("./datosUsuarios");

// =========================================
// 🐾 50 ANIMALES
// =========================================

const animales = [

  ["🐶", "Perro"],
  ["🐱", "Gato"],
  ["🐭", "Ratón"],
  ["🐹", "Hámster"],
  ["🐰", "Conejo"],
  ["🦊", "Zorro"],
  ["🐻", "Oso"],
  ["🐼", "Panda"],
  ["🐨", "Koala"],
  ["🐯", "Tigre"],

  ["🦁", "León"],
  ["🐮", "Vaca"],
  ["🐷", "Cerdo"],
  ["🐸", "Rana"],
  ["🐵", "Mono"],
  ["🐔", "Gallina"],
  ["🐧", "Pingüino"],
  ["🐦", "Pájaro"],
  ["🦆", "Pato"],
  ["🦅", "Águila"],

  ["🦉", "Búho"],
  ["🦇", "Murciélago"],
  ["🐺", "Lobo"],
  ["🐗", "Jabalí"],
  ["🐴", "Caballo"],
  ["🦄", "Unicornio"],
  ["🐝", "Abeja"],
  ["🦋", "Mariposa"],
  ["🐌", "Caracol"],
  ["🐞", "Mariquita"],

  ["🐢", "Tortuga"],
  ["🐍", "Serpiente"],
  ["🦎", "Lagarto"],
  ["🐙", "Pulpo"],
  ["🦀", "Cangrejo"],
  ["🐠", "Pez tropical"],
  ["🐬", "Delfín"],
  ["🐳", "Ballena"],
  ["🦈", "Tiburón"],
  ["🐊", "Cocodrilo"],

  ["🐘", "Elefante"],
  ["🦒", "Jirafa"],
  ["🦓", "Cebra"],
  ["🦏", "Rinoceronte"],
  ["🦛", "Hipopótamo"],
  ["🦘", "Canguro"],
  ["🦥", "Perezoso"],
  ["🦍", "Gorila"],
  ["🦖", "Dinosaurio"],
  ["🐉", "Dragón Legendario"]

];

// =========================================
// 📅 FECHA COLOMBIA
// =========================================

function fechaActual() {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());

}

// =========================================
// 📅 DIFERENCIA DE DÍAS
// =========================================

function diferenciaDias(
  anterior,
  actual
) {

  const fecha1 =
    new Date(`${anterior}T00:00:00Z`);

  const fecha2 =
    new Date(`${actual}T00:00:00Z`);

  return Math.round(
    (fecha2 - fecha1) /
    86400000
  );

}

// =========================================
// 🐾 OBTENER ANIMAL
// =========================================

function obtenerAnimal(nivel) {

  const indice =
    Math.max(
      1,
      Math.min(
        nivel,
        animales.length
      )
    ) - 1;

  return animales[indice];

}

// =========================================
// 🐾 COMANDO PRINCIPAL
// =========================================

async function racha(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  // =========================================
  // 📋 LISTA DE ANIMALES
  // =========================================

  if (
    comando === "rachalista"
  ) {

    let texto =
      "🐾 *RACHA DE ANIMALES*\n\n";

    animales.forEach(
      (animal, index) => {

        texto +=
          `${index + 1}. ${animal[0]} ${animal[1]}\n`;

      }
    );

    texto +=
      "\n🐉 *Nivel 50 = Animal Legendario*";

    await sock.sendMessage(
      chat,
      {
        text: texto
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  // =========================================
  // 📊 ESTADO
  // =========================================

  if (
    comando === "rachaestado"
  ) {

    const usuario =
      obtenerUsuario(id);

    const nivel =
      usuario.nivelAnimal || 1;

    const actual =
      usuario.rachaActual || 0;

    const maxima =
      usuario.rachaMaxima || 0;

    const animal =
      obtenerAnimal(nivel);

    let siguiente =
      "";

    if (nivel < 50) {

      const proximo =
        obtenerAnimal(nivel + 1);

      siguiente =
        `\n➡️ Siguiente: ${proximo[0]} ${proximo[1]}`;

    } else {

      siguiente =
        "\n👑 Has alcanzado el nivel máximo.";

    }

    const texto =

      `🐾 *ESTADO DE TU RACHA*\n\n` +

      `🔥 Racha actual: *${actual} días*\n` +

      `🏆 Récord máximo: *${maxima} días*\n` +

      `⭐ Nivel animal: *${nivel}/50*\n` +

      `🐾 Animal: *${animal[0]} ${animal[1]}*` +

      siguiente;

    await sock.sendMessage(
      chat,
      {
        text: texto
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  // =========================================
  // 🔥 RACHA
  // =========================================

  if (
    comando !== "racha"
  ) {
    return false;
  }

  const usuario =
    obtenerUsuario(id);

  const hoy =
    fechaActual();

  // =========================================
  // 🆕 PRIMER DÍA
  // =========================================

  if (
    !usuario.rachaUltimoDia
  ) {

    usuario.rachaActual = 1;

    usuario.rachaMaxima = 1;

    usuario.nivelAnimal = 1;

    usuario.rachaUltimoDia = hoy;

    guardarUsuario(
      id,
      usuario
    );

    agregarXP(
      id,
      10
    );

    const animal =
      obtenerAnimal(1);

    await sock.sendMessage(
      chat,
      {
        text:

          `🐾 *¡RACHA INICIADA!*\n\n` +

          `🔥 Día: *1*\n` +

          `⭐ Nivel: *1/50*\n` +

          `🐾 Animal: *${animal[0]} ${animal[1]}*\n\n` +

          `🎁 +10 XP\n\n` +

          `📅 Vuelve mañana para desbloquear el siguiente animal.`
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  // =========================================
  // 🔄 MISMO DÍA
  // =========================================

  if (
    usuario.rachaUltimoDia === hoy
  ) {

    const animal =
      obtenerAnimal(
        usuario.nivelAnimal || 1
      );

    await sock.sendMessage(
      chat,
      {
        text:

          `🐾 *RACHA YA REGISTRADA*\n\n` +

          `🔥 Racha actual: *${usuario.rachaActual || 0} días*\n` +

          `⭐ Nivel: *${usuario.nivelAnimal || 1}/50*\n` +

          `🐾 Animal: *${animal[0]} ${animal[1]}*\n\n` +

          `⏳ Ya registraste tu racha hoy.\n` +

          `📅 Vuelve mañana para avanzar.`
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  const dias =
    diferenciaDias(
      usuario.rachaUltimoDia,
      hoy
    );

  // =========================================
  // 🔥 DÍA CONSECUTIVO
  // =========================================

  if (dias === 1) {

    usuario.rachaActual =
      (usuario.rachaActual || 0) + 1;

    if (
      usuario.rachaActual >
      usuario.rachaMaxima
    ) {

      usuario.rachaMaxima =
        usuario.rachaActual;

    }

    if (
      usuario.nivelAnimal < 50
    ) {

      usuario.nivelAnimal++;

    }

    usuario.rachaUltimoDia =
      hoy;

    guardarUsuario(
      id,
      usuario
    );

    agregarXP(
      id,
      10
    );

    const animal =
      obtenerAnimal(
        usuario.nivelAnimal
      );

    let mensajeFinal =
      `📅 Vuelve mañana para continuar.`;

    if (
      usuario.nivelAnimal === 50
    ) {

      mensajeFinal =
        `👑 *¡HAS LLEGADO AL ANIMAL LEGENDARIO!*`;

    }

    await sock.sendMessage(
      chat,
      {
        text:

          `🔥 *¡RACHA CONTINUADA!*\n\n` +

          `🔥 Día: *${usuario.rachaActual}*\n` +

          `⭐ Nivel: *${usuario.nivelAnimal}/50*\n` +

          `🐾 Animal: *${animal[0]} ${animal[1]}*\n\n` +

          `🎁 +10 XP\n\n` +

          mensajeFinal
      },
      {
        quoted: msg
      }
    );

    return true;
  }

  // =========================================
  // 💔 RACHA PERDIDA
  // =========================================

  usuario.rachaActual = 1;

  usuario.nivelAnimal = 1;

  usuario.rachaUltimoDia = hoy;

  if (
    usuario.rachaMaxima < 1
  ) {

    usuario.rachaMaxima = 1;

  }

  guardarUsuario(
    id,
    usuario
  );

  agregarXP(
    id,
    10
  );

  const animal =
    obtenerAnimal(1);

  await sock.sendMessage(
    chat,
    {
      text:

        `💔 *RACHA PERDIDA*\n\n` +

        `Tu racha anterior se rompió.\n\n` +

        `🔥 Nueva racha: *1 día*\n` +

        `⭐ Nivel: *1/50*\n` +

        `🐾 Animal: *${animal[0]} ${animal[1]}*\n\n` +

        `🏆 Récord conservado: *${usuario.rachaMaxima} días*\n\n` +

        `🎁 +10 XP\n` +

        `💪 ¡Empieza una nueva racha!`
    },
    {
      quoted: msg
    }
  );

  return true;

}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = racha;
