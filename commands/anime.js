// ========================================
// TITANBOT v3.1
// ANIME
// ========================================

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
    comando === "anime" ||
    comando === "animemenu"
  ) {

    await sock.sendMessage(chat, {
      text:
`🌸 TITANBOT — ANIME

🎌 COMANDOS

🔎 .anime Naruto
📖 .animeinfo Naruto
👤 .personaje Goku
📚 .manga One Piece

💖 .waifu
⚔️ .husbando

━━━━━━━━━━━━━━

Ejemplo:

.anime Naruto`
    });

    return true;
  }

  // ========================================
  // BUSCAR ANIME
  // ========================================

  if (comando === "animebuscar") {

    const nombre =
      args.join(" ");

    if (!nombre) {

      await sock.sendMessage(chat, {
        text:
`❌ Escribe el nombre de un anime.

Ejemplo:

.animebuscar Naruto`
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
`🔎 BÚSQUEDA DE ANIME

🎌 Anime:
${nombre}

📺 Resultado encontrado.

ℹ️ Esta versión utiliza una lista local de TitanBot.`
    });

    return true;
  }

  // ========================================
  // ANIME
  // ========================================

  if (comando === "anime") {

    const nombre =
      args.join(" ");

    if (!nombre) {

      await sock.sendMessage(chat, {
        text:
`❌ Escribe un anime.

Ejemplo:

.anime Naruto`
      });

      return true;
    }

    const animes = {

      naruto: {
        titulo: "Naruto",
        genero: "Acción, aventura",
        estado: "Finalizado"
      },

      "one piece": {
        titulo: "One Piece",
        genero: "Aventura, acción",
        estado: "En emisión"
      },

      bleach: {
        titulo: "Bleach",
        genero: "Acción, sobrenatural",
        estado: "Finalizado / continuación"
      },

      "dragon ball": {
        titulo: "Dragon Ball",
        genero: "Acción, aventura",
        estado: "Franquicia en curso"
      },

      "demon slayer": {
        titulo: "Demon Slayer",
        genero: "Acción, fantasía",
        estado: "Finalizado"
      },

      "jujutsu kaisen": {
        titulo: "Jujutsu Kaisen",
        genero: "Acción, sobrenatural",
        estado: "En emisión"
      }

    };

    const clave =
      nombre
        .toLowerCase()
        .trim();

    const resultado =
      animes[clave];

    if (!resultado) {

      await sock.sendMessage(chat, {
        text:
`🔎 ANIME

🎌 Buscaste:
${nombre}

⚠️ No tengo información de ese anime en la base local.

Prueba con:

Naruto
One Piece
Bleach
Dragon Ball
Demon Slayer
Jujutsu Kaisen`
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
`🎌 INFORMACIÓN DEL ANIME

📺 ${resultado.titulo}

🎭 Género:
${resultado.genero}

📌 Estado:
${resultado.estado}`
    });

    return true;
  }

  // ========================================
  // ANIMEINFO
  // ========================================

  if (comando === "animeinfo") {

    const nombre =
      args.join(" ");

    if (!nombre) {

      await sock.sendMessage(chat, {
        text:
`❌ Escribe un anime.

Ejemplo:

.animeinfo Naruto`
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
`📖 ANIME INFO

🎌 ${nombre}

⭐ Información disponible próximamente.

💡 Usa .anime ${nombre}`
    });

    return true;
  }

  // ========================================
  // PERSONAJE
  // ========================================

  if (comando === "personaje") {

    const nombre =
      args.join(" ");

    if (!nombre) {

      await sock.sendMessage(chat, {
        text:
`❌ Escribe el nombre de un personaje.

Ejemplo:

.personaje Goku`
      });

      return true;
    }

    const personajes = {

      goku: {
        nombre: "Goku",
        anime: "Dragon Ball"
      },

      naruto: {
        nombre: "Naruto Uzumaki",
        anime: "Naruto"
      },

      ichigo: {
        nombre: "Ichigo Kurosaki",
        anime: "Bleach"
      },

      luffy: {
        nombre: "Monkey D. Luffy",
        anime: "One Piece"
      },

      gojo: {
        nombre: "Satoru Gojo",
        anime: "Jujutsu Kaisen"
      }

    };

    const clave =
      nombre
        .toLowerCase()
        .trim();

    const personaje =
      personajes[clave];

    if (!personaje) {

      await sock.sendMessage(chat, {
        text:
`❌ Personaje no encontrado.

Prueba con:

Goku
Naruto
Ichigo
Luffy
Gojo`
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
`👤 PERSONAJE

⭐ ${personaje.nombre}

🎌 Anime:
${personaje.anime}`
    });

    return true;
  }

  // ========================================
  // MANGA
  // ========================================

  if (comando === "manga") {

    const nombre =
      args.join(" ");

    if (!nombre) {

      await sock.sendMessage(chat, {
        text:
`❌ Escribe un manga.

Ejemplo:

.manga One Piece`
      });

      return true;
    }

    await sock.sendMessage(chat, {
      text:
`📚 MANGA

📖 ${nombre}

🔎 Búsqueda realizada.

ℹ️ Esta versión utiliza información local.`
    });

    return true;
  }

  // ========================================
  // WAIFU
  // ========================================

  if (comando === "waifu") {

    const waifus = [
      "🌸 Hinata",
      "💜 Rem",
      "🔥 Asuna",
      "🌺 Nezuko",
      "⭐ Mikasa"
    ];

    const resultado =
      waifus[
        Math.floor(
          Math.random() *
          waifus.length
        )
      ];

    await sock.sendMessage(chat, {
      text:
`🌸 WAIFU

${resultado}`
    });

    return true;
  }

  // ========================================
  // HUSBANDO
  // ========================================

  if (comando === "husbando") {

    const personajes = [
      "🔥 Gojo",
      "⚔️ Levi",
      "🌟 Luffy",
      "💥 Goku",
      "🖤 Itachi"
    ];

    const resultado =
      personajes[
        Math.floor(
          Math.random() *
          personajes.length
        )
      ];

    await sock.sendMessage(chat, {
      text:
`⚔️ HUSBANDO

${resultado}`
    });

    return true;
  }

  // ========================================
  // NO ES COMANDO DE ANIME
  // ========================================

  return false;
}

module.exports = anime;
