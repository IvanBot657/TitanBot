// =========================================
// 🐾 SISTEMA DE MASCOTA - TITANBOT
// =========================================

const {
  obtenerUsuario,
  guardarUsuario
} = require("./datosUsuarios");

// =========================================
// 🐾 ADOPTAR MASCOTA
// =========================================

async function adoptar(sock, chat, args, id) {

  const usuario =
    obtenerUsuario(id);

  // =====================================
  // ❌ YA TIENE MASCOTA
  // =====================================

  if (
    usuario.mascota &&
    usuario.mascota.adoptada
  ) {

    await sock.sendMessage(
      chat,
      {
        text:
          "🐾 Ya tienes una mascota.\n\n" +
          "💗 Nombre: " +
          usuario.mascota.nombre +
          "\n" +
          "🐶 Tipo: " +
          usuario.mascota.tipo +
          "\n" +
          "⭐ Nivel: " +
          usuario.mascota.nivel
      }
    );

    return true;

  }

  // =====================================
  // 🐾 TIPOS DE MASCOTA
  // =====================================

  const tipos = [
    "Gato 🐱",
    "Perro 🐶",
    "Zorro 🦊",
    "Conejo 🐰",
    "Lobo 🐺"
  ];

  // =====================================
  // 👤 NOMBRE
  // =====================================

  let nombre =
    args.join(" ").trim();

  // =====================================
  // 🎲 NOMBRE AUTOMÁTICO
  // =====================================

  if (!nombre) {

    const nombres = [
      "Luna",
      "Kira",
      "Akira",
      "Michi",
      "Hachi",
      "Nala",
      "Yuki",
      "Moka"
    ];

    nombre =
      nombres[
        Math.floor(
          Math.random() *
          nombres.length
        )
      ];

  }

  // =====================================
  // 🎲 TIPO ALEATORIO
  // =====================================

  const tipo =
    tipos[
      Math.floor(
        Math.random() *
        tipos.length
      )
    ];

  // =====================================
  // 🐾 CREAR MASCOTA
  // =====================================

  usuario.mascota = {

    adoptada: true,

    nombre: nombre,

    tipo: tipo,

    nivel: 1,

    experiencia: 0,

    felicidad: 100,

    energia: 100,

    hambre: 0,

    fechaAdopcion:
      new Date().toISOString()

  };

  guardarUsuario(
    id,
    usuario
  );

  // =====================================
  // 💬 MENSAJE
  // =====================================

  await sock.sendMessage(
    chat,
    {
      text:
        "🎉 ¡ADOPCIÓN COMPLETADA!\n\n" +

        "🐾 Tu nueva mascota es:\n\n" +

        "💗 Nombre: " +
        usuario.mascota.nombre +
        "\n" +

        "🐾 Tipo: " +
        usuario.mascota.tipo +
        "\n" +

        "⭐ Nivel: 1\n" +

        "✨ Experiencia: 0 XP\n" +

        "❤️ Felicidad: 100%\n" +

        "⚡ Energía: 100%\n" +

        "🍖 Hambre: 0%\n\n" +

        "💡 Usa .mascota para ver su estado."
    }
  );

  return true;

}

// =========================================
// 🐾 VER MASCOTA
// =========================================

async function verMascota(
  sock,
  chat,
  id
) {

  const usuario =
    obtenerUsuario(id);

  // =====================================
  // ❌ NO TIENE MASCOTA
  // =====================================

  if (
    !usuario.mascota ||
    !usuario.mascota.adoptada
  ) {

    await sock.sendMessage(
      chat,
      {
        text:
          "🐾 No tienes una mascota todavía.\n\n" +
          "❤️ Usa .adoptar para adoptar una."
      }
    );

    return true;

  }

  const mascota =
    usuario.mascota;

  // =====================================
  // 📊 ESTADO
  // =====================================

  let estado =
    "😊 Feliz";

  if (
    mascota.felicidad <= 30
  ) {

    estado =
      "😢 Triste";

  } else if (
    mascota.felicidad <= 60
  ) {

    estado =
      "😐 Normal";

  }

  // =====================================
  // 💬 MENSAJE
  // =====================================

  await sock.sendMessage(
    chat,
    {
      text:
        "🐾 ━━━ MI MASCOTA ━━━ 🐾\n\n" +

        "💗 Nombre: " +
        mascota.nombre +
        "\n" +

        "🐾 Tipo: " +
        mascota.tipo +
        "\n\n" +

        "⭐ Nivel: " +
        mascota.nivel +
        "\n" +

        "✨ Experiencia: " +
        mascota.experiencia +
        " XP\n\n" +

        "❤️ Felicidad: " +
        mascota.felicidad +
        "%\n" +

        "⚡ Energía: " +
        mascota.energia +
        "%\n" +

        "🍖 Hambre: " +
        mascota.hambre +
        "%\n\n" +

        "😊 Estado: " +
        estado
    }
  );

  return true;

}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = {

  adoptar,

  verMascota

};
