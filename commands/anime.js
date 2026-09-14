const animeData = {
  naruto: {
    nombre: "Naruto",
    descripcion: "Historia de un joven ninja que busca ser reconocido y convertirse en Hokage.",
    personajes: ["Naruto Uzumaki", "Sasuke Uchiha", "Sakura Haruno", "Kakashi Hatake"]
  },

  onepiece: {
    nombre: "One Piece",
    descripcion: "Monkey D. Luffy y su tripulación buscan el legendario One Piece.",
    personajes: ["Monkey D. Luffy", "Roronoa Zoro", "Nami", "Sanji"]
  },

  dragonball: {
    nombre: "Dragon Ball",
    descripcion: "Goku y sus amigos enfrentan poderosos enemigos y viven grandes aventuras.",
    personajes: ["Goku", "Vegeta", "Gohan", "Piccolo"]
  },

  demonslayer: {
    nombre: "Demon Slayer",
    descripcion: "Tanjiro Kamado busca una forma de ayudar a su hermana mientras lucha contra demonios.",
    personajes: ["Tanjiro Kamado", "Nezuko Kamado", "Zenitsu Agatsuma", "Inosuke Hashibira"]
  },

  bleach: {
    nombre: "Bleach",
    descripcion: "Ichigo Kurosaki obtiene poderes de Shinigami y comienza a enfrentarse a amenazas sobrenaturales.",
    personajes: ["Ichigo Kurosaki", "Rukia Kuchiki", "Orihime Inoue", "Uryu Ishida"]
  },

  jjk: {
    nombre: "Jujutsu Kaisen",
    descripcion: "Yuji Itadori entra al mundo de los hechiceros y las maldiciones.",
    personajes: ["Yuji Itadori", "Megumi Fushiguro", "Nobara Kugisaki", "Satoru Gojo"]
  },

  mha: {
    nombre: "My Hero Academia",
    descripcion: "Izuku Midoriya intenta convertirse en un héroe en un mundo donde la mayoría posee poderes.",
    personajes: ["Izuku Midoriya", "Katsuki Bakugo", "Shoto Todoroki", "All Might"]
  },

  aot: {
    nombre: "Attack on Titan",
    descripcion: "La humanidad lucha por sobrevivir frente a los titanes que amenazan sus ciudades.",
    personajes: ["Eren Yeager", "Mikasa Ackerman", "Armin Arlert", "Levi Ackerman"]
  }
};


// ==========================================
// BUSCAR ANIME
// ==========================================

function buscarAnime(nombre) {

  const texto =
    nombre
      .toLowerCase()
      .replace(/\s+/g, "");

  const equivalencias = {

    "naruto": "naruto",

    "onepiece": "onepiece",
    "onepieceanime": "onepiece",

    "dragonball": "dragonball",
    "dragonballz": "dragonball",

    "demonslayer": "demonslayer",
    "kimetsunoyaiba": "demonslayer",

    "bleach": "bleach",

    "jjk": "jjk",
    "jujutsukaisen": "jjk",

    "mha": "mha",
    "myheroacademia": "mha",

    "aot": "aot",
    "attackontitan": "aot"
  };

  const clave =
    equivalencias[texto];

  return clave
    ? animeData[clave]
    : null;
}


// ==========================================
// COMANDO ANIME
// ==========================================

async function anime(
  sock,
  chat,
  comando,
  args
) {

  // ========================================
  // .anime
  // ========================================

  if (comando === "anime") {

    const nombre =
      args.join(" ");

    if (!nombre) {

      return sock.sendMessage(chat, {

        text:
`🎌 ANIME TITANBOT

Puedes buscar:

• Naruto
• One Piece
• Dragon Ball
• Demon Slayer
• Bleach
• Jujutsu Kaisen
• My Hero Academia
• Attack on Titan

Ejemplo:

.anime Naruto`

      });
    }


    const resultado =
      buscarAnime(nombre);


    if (!resultado) {

      return sock.sendMessage(chat, {

        text:
`❌ Anime no encontrado.

Usa:

.anime

para ver la lista disponible.`

      });
    }


    return sock.sendMessage(chat, {

      text:
`🎌 ANIME

📺 ${resultado.nombre}

📝 ${resultado.descripcion}

👥 Personajes:

${resultado.personajes
  .map(
    personaje =>
      `• ${personaje}`
  )
  .join("\n")}`

    });
  }


  // ========================================
  // .animeinfo
  // ========================================

  if (comando === "animeinfo") {

    const nombre =
      args.join(" ");


    if (!nombre) {

      return sock.sendMessage(chat, {

        text:
`📚 ANIME INFO

Usa:

.animeinfo Naruto

Ejemplo:

.animeinfo One Piece`

      });
    }


    const resultado =
      buscarAnime(nombre);


    if (!resultado) {

      return sock.sendMessage(chat, {

        text:
          "❌ No encontré información sobre ese anime."
      });
    }


    return sock.sendMessage(chat, {

      text:
`📚 INFORMACIÓN DEL ANIME

🎌 Nombre:
${resultado.nombre}

📝 Descripción:
${resultado.descripcion}

👥 Personajes:
${resultado.personajes.join(", ")}`

    });
  }


  // ========================================
  // .personaje
  // ========================================

  if (comando === "personaje") {

    const nombre =
      args.join(" ").toLowerCase();


    if (!nombre) {

      return sock.sendMessage(chat, {

        text:
`👤 PERSONAJE

Escribe el nombre de un personaje.

Ejemplos:

.personaje Naruto
.personaje Goku
.personaje Gojo`

      });
    }


    const personajes = [

      {
        nombre: "Naruto Uzumaki",
        anime: "Naruto",
        descripcion: "Ninja de Konoha que sueña con convertirse en Hokage."
      },

      {
        nombre: "Goku",
        anime: "Dragon Ball",
        descripcion: "Guerrero Saiyajin conocido por su gran pasión por entrenar y luchar."
      },

      {
        nombre: "Monkey D. Luffy",
        anime: "One Piece",
        descripcion: "Capitán de los Sombrero de Paja y aspirante a convertirse en Rey de los Piratas."
      },

      {
        nombre: "Tanjiro Kamado",
        anime: "Demon Slayer",
        descripcion: "Cazador de demonios que busca proteger a su hermana Nezuko."
      },

      {
        nombre: "Satoru Gojo",
        anime: "Jujutsu Kaisen",
        descripcion: "Uno de los hechiceros más poderosos de Jujutsu Kaisen."
      },

      {
        nombre: "Ichigo Kurosaki",
        anime: "Bleach",
        descripcion: "Humano que obtiene poderes de Shinigami."
      },

      {
        nombre: "Izuku Midoriya",
        anime: "My Hero Academia",
        descripcion: "Joven que sueña con convertirse en un gran héroe."
      },

      {
        nombre: "Eren Yeager",
        anime: "Attack on Titan",
        descripcion: "Personaje central de la historia de Attack on Titan."
      }

    ];


    const encontrado =
      personajes.find(
        personaje =>
          personaje.nombre
            .toLowerCase()
            .includes(nombre)
      );


    if (!encontrado) {

      return sock.sendMessage(chat, {

        text:
`❌ Personaje no encontrado.

Prueba con:

Naruto
Goku
Luffy
Tanjiro
Gojo
Ichigo
Midoriya
Eren`

      });
    }


    return sock.sendMessage(chat, {

      text:
`👤 PERSONAJE

⭐ ${encontrado.nombre}

🎌 Anime:
${encontrado.anime}

📝 Descripción:
${encontrado.descripcion}`

    });
  }


  return false;
}


module.exports = anime;
