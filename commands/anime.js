const ANIMES = {

  naruto: {
    nombre: "Naruto",
    genero: "Acción, aventura, ninjas",
    estado: "Finalizado",
    descripcion:
      "La historia de Naruto Uzumaki, un joven ninja que busca convertirse en Hokage y ser reconocido por su aldea."
  },

  "one piece": {
    nombre: "One Piece",
    genero: "Aventura, acción, piratas",
    estado: "En emisión",
    descripcion:
      "Monkey D. Luffy y su tripulación viajan por el Grand Line en busca del legendario tesoro One Piece."
  },

  dragonball: {
    nombre: "Dragon Ball",
    genero: "Acción, aventura, artes marciales",
    estado: "Continuación de la franquicia",
    descripcion:
      "Goku y sus amigos enfrentan poderosos rivales mientras protegen la Tierra y exploran nuevos desafíos."
  },

  "dragon ball": {
    nombre: "Dragon Ball",
    genero: "Acción, aventura, artes marciales",
    estado: "Continuación de la franquicia",
    descripcion:
      "Goku y sus amigos enfrentan poderosos rivales mientras protegen la Tierra y exploran nuevos desafíos."
  },

  "demon slayer": {
    nombre: "Demon Slayer",
    genero: "Acción, fantasía",
    estado: "Finalizado",
    descripcion:
      "Tanjiro Kamado se convierte en cazador de demonios mientras busca una forma de ayudar a su hermana."
  },

  bleach: {
    nombre: "Bleach",
    genero: "Acción, sobrenatural",
    estado: "Finalizado",
    descripcion:
      "Ichigo Kurosaki obtiene poderes de Shinigami y comienza a enfrentarse a diferentes amenazas sobrenaturales."
  },

  "jujutsu kaisen": {
    nombre: "Jujutsu Kaisen",
    genero: "Acción, sobrenatural",
    estado: "En emisión",
    descripcion:
      "Yuji Itadori entra en el mundo de los hechiceros después de verse involucrado con una poderosa maldición."
  },

  "my hero academia": {
    nombre: "My Hero Academia",
    genero: "Acción, superhéroes",
    estado: "Finalizado",
    descripcion:
      "Izuku Midoriya sueña con convertirse en héroe en un mundo donde la mayoría de las personas posee habilidades especiales."
  },

  "attack on titan": {
    nombre: "Attack on Titan",
    genero: "Acción, drama, fantasía",
    estado: "Finalizado",
    descripcion:
      "La humanidad lucha por sobrevivir mientras intenta descubrir los misterios relacionados con los titanes."
  },

  "spy x family": {
    nombre: "Spy x Family",
    genero: "Comedia, acción, espionaje",
    estado: "En emisión",
    descripcion:
      "Un espía debe formar una familia falsa para cumplir una misión, sin conocer los secretos de los demás miembros."
  },

  "solo leveling": {
    nombre: "Solo Leveling",
    genero: "Acción, fantasía",
    estado: "En emisión",
    descripcion:
      "Sung Jinwoo obtiene una habilidad especial que le permite mejorar sus capacidades y enfrentarse a nuevos desafíos."
  },

  "one punch man": {
    nombre: "One Punch Man",
    genero: "Acción, comedia, superhéroes",
    estado: "En emisión",
    descripcion:
      "Saitama busca enfrentarse a rivales que puedan darle un verdadero desafío."
  },

  "hunter x hunter": {
    nombre: "Hunter x Hunter",
    genero: "Aventura, acción, fantasía",
    estado: "En pausa",
    descripcion:
      "Gon Freecss comienza un viaje para convertirse en Hunter y encontrar a su padre."
  }

};


// ==========================================
// PERSONAJES
// ==========================================

const PERSONAJES = {

  naruto: {
    nombre: "Naruto Uzumaki",
    anime: "Naruto",
    descripcion:
      "Ninja de la Aldea Oculta de la Hoja que sueña con convertirse en Hokage."
  },

  sasuke: {
    nombre: "Sasuke Uchiha",
    anime: "Naruto",
    descripcion:
      "Miembro del clan Uchiha que busca aumentar su poder y resolver asuntos de su pasado."
  },

  luffy: {
    nombre: "Monkey D. Luffy",
    anime: "One Piece",
    descripcion:
      "Capitán de los Sombrero de Paja que sueña con convertirse en el Rey de los Piratas."
  },

  zoro: {
    nombre: "Roronoa Zoro",
    anime: "One Piece",
    descripcion:
      "Espadachín de la tripulación de Luffy que aspira a convertirse en el mejor espadachín."
  },

  goku: {
    nombre: "Goku",
    anime: "Dragon Ball",
    descripcion:
      "Guerrero Saiyajin conocido por su gran pasión por entrenar y enfrentarse a rivales fuertes."
  },

  tanjiro: {
    nombre: "Tanjiro Kamado",
    anime: "Demon Slayer",
    descripcion:
      "Joven cazador de demonios que busca ayudar a su hermana y proteger a otras personas."
  },

  ichigo: {
    nombre: "Ichigo Kurosaki",
    anime: "Bleach",
    descripcion:
      "Humano que obtiene poderes de Shinigami y termina involucrado en numerosas batallas."
  },

  yuji: {
    nombre: "Yuji Itadori",
    anime: "Jujutsu Kaisen",
    descripcion:
      "Estudiante que se ve involucrado en el mundo de las maldiciones y los hechiceros."
  },

  deku: {
    nombre: "Izuku Midoriya",
    anime: "My Hero Academia",
    descripcion:
      "Joven que sueña con convertirse en héroe y estudiar en la Academia U.A."
  },

  eren: {
    nombre: "Eren Yeager",
    anime: "Attack on Titan",
    descripcion:
      "Personaje central de la historia que está decidido a descubrir la verdad sobre el mundo."
  },

  anya: {
    nombre: "Anya Forger",
    anime: "Spy x Family",
    descripcion:
      "Niña con una habilidad especial que forma parte de la familia Forger."
  },

  sungjinwoo: {
    nombre: "Sung Jinwoo",
    anime: "Solo Leveling",
    descripcion:
      "Cazador que obtiene una habilidad especial que le permite aumentar progresivamente su poder."
  },

  saitama: {
    nombre: "Saitama",
    anime: "One Punch Man",
    descripcion:
      "Héroe conocido por derrotar a sus enemigos con una enorme facilidad."
  },

  gon: {
    nombre: "Gon Freecss",
    anime: "Hunter x Hunter",
    descripcion:
      "Joven aventurero que quiere convertirse en Hunter y encontrar a su padre."
  }

};


// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizar(texto) {

  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}


// ==========================================
// BUSCAR ANIME
// ==========================================

function buscarAnime(nombre) {

  const texto =
    normalizar(nombre);

  if (ANIMES[texto]) {
    return ANIMES[texto];
  }

  for (const [clave, anime] of Object.entries(ANIMES)) {

    if (
      clave.includes(texto) ||
      texto.includes(clave)
    ) {
      return anime;
    }

  }

  return null;
}


// ==========================================
// BUSCAR PERSONAJE
// ==========================================

function buscarPersonaje(nombre) {

  const texto =
    normalizar(nombre);

  if (PERSONAJES[texto]) {
    return PERSONAJES[texto];
  }

  for (
    const [clave, personaje]
    of Object.entries(PERSONAJES)
  ) {

    if (
      clave.includes(texto) ||
      texto.includes(clave)
    ) {

      return personaje;

    }

  }

  return null;
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
  // MENU ANIME
  // ========================================

  if (
    comando === "anime"
    && args.length === 0
  ) {

    return sock.sendMessage(chat, {

      text:
`🎌 TITANBOT ANIME

📺 ANIMES DISPONIBLES

1. Naruto
2. One Piece
3. Dragon Ball
4. Demon Slayer
5. Bleach
6. Jujutsu Kaisen
7. My Hero Academia
8. Attack on Titan
9. Spy x Family
10. Solo Leveling
11. One Punch Man
12. Hunter x Hunter

━━━━━━━━━━━━━━━━━━

🔎 INFORMACIÓN

.anime Naruto

.animeinfo One Piece

👤 PERSONAJES

.personaje Naruto
.personaje Luffy
.personaje Goku

━━━━━━━━━━━━━━━━━━

🤖 TitanBot Anime`

    });

  }


  // ========================================
  // INFORMACIÓN ANIME
  // ========================================

  if (
    comando === "anime" ||
    comando === "animeinfo"
  ) {

    if (
      args.length === 0
    ) {

      return sock.sendMessage(chat, {

        text:
`❌ Escribe el nombre de un anime.

Ejemplo:

.anime Naruto

.animeinfo One Piece`

      });

    }

    const nombre =
      args.join(" ");

    const resultado =
      buscarAnime(nombre);

    if (!resultado) {

      return sock.sendMessage(chat, {

        text:
`❌ ANIME NO ENCONTRADO

No encontré:

${nombre}

Usa:

.anime

para ver la lista.`

      });

    }

    return sock.sendMessage(chat, {

      text:
`🎌 ANIME

📺 ${resultado.nombre}

🎭 Género:
${resultado.genero}

📌 Estado:
${resultado.estado}

📖 Información:
${resultado.descripcion}`

    });

  }


  // ========================================
  // PERSONAJE
  // ========================================

  if (
    comando === "personaje"
  ) {

    if (
      args.length === 0
    ) {

      return sock.sendMessage(chat, {

        text:
`👤 PERSONAJE

Escribe un personaje.

Ejemplos:

.personaje Naruto

.personaje Luffy

.personaje Goku`

      });

    }

    const nombre =
      args.join(" ");

    const resultado =
      buscarPersonaje(nombre);

    if (!resultado) {

      return sock.sendMessage(chat, {

        text:
`❌ PERSONAJE NO ENCONTRADO

No encontré:

${nombre}

Prueba con:

Naruto
Sasuke
Luffy
Zoro
Goku
Tanjiro
Ichigo
Yuji
Deku
Eren
Anya
Sung Jinwoo
Saitama
Gon`

      });

    }

    return sock.sendMessage(chat, {

      text:
`👤 PERSONAJE

⭐ ${resultado.nombre}

🎌 Anime:
${resultado.anime}

📖 Información:
${resultado.descripcion}`

    });

  }


  return false;
}


module.exports = anime;
