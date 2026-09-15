async function anime(
  sock,
  chat,
  comando,
  args
) {

  // ==========================
  // ANIME
  // ==========================

  if (comando === "anime") {

    const animes = [

      "Naruto",
      "One Piece",
      "Dragon Ball",
      "Attack on Titan",
      "Demon Slayer",
      "Jujutsu Kaisen",
      "Bleach",
      "Death Note"

    ];

    const anime =
      animes[
        Math.floor(
          Math.random() *
          animes.length
        )
      ];

    return sock.sendMessage(chat, {

      text:
`🎌 ANIME

Recomendación:

${anime}`

    });

  }

  // ==========================
  // WAIFU
  // ==========================

  if (comando === "waifu") {

    const waifus = [

      "Hinata Hyuga",
      "Mikasa Ackerman",
      "Zero Two",
      "Asuna Yuuki",
      "Rem",
      "Nezuko Kamado"

    ];

    const waifu =
      waifus[
        Math.floor(
          Math.random() *
          waifus.length
        )
      ];

    return sock.sendMessage(chat, {

      text:
`👧 WAIFU

Tu waifu es:

${waifu}`

    });

  }

  // ==========================
  // HUSBANDO
  // ==========================

  if (comando === "husbando") {

    const husbandos = [

      "Levi Ackerman",
      "Gojo Satoru",
      "Naruto Uzumaki",
      "Sasuke Uchiha",
      "Ichigo Kurosaki",
      "L Lawliet"

    ];

    const husbando =
      husbandos[
        Math.floor(
          Math.random() *
          husbandos.length
        )
      ];

    return sock.sendMessage(chat, {

      text:
`👦 HUSBANDO

Tu husbando es:

${husbando}`

    });

  }

  // ==========================
  // PERSONAJE
  // ==========================

  if (comando === "personaje") {

    const personajes = [

      "Naruto Uzumaki",
      "Monkey D. Luffy",
      "Goku",
      "Levi Ackerman",
      "Tanjiro Kamado",
      "Gojo Satoru"

    ];

    const personaje =
      personajes[
        Math.floor(
          Math.random() *
          personajes.length
        )
      ];

    return sock.sendMessage(chat, {

      text:
`⚔️ PERSONAJE

Personaje aleatorio:

${personaje}`

    });

  }

  // ==========================
  // MANGA
  // ==========================

  if (comando === "manga") {

    const mangas = [

      "Berserk",
      "Tokyo Ghoul",
      "One Piece",
      "Kingdom",
      "Vagabond",
      "Monster"

    ];

    const manga =
      mangas[
        Math.floor(
          Math.random() *
          mangas.length
        )
      ];

    return sock.sendMessage(chat, {

      text:
`📖 MANGA

Recomendación:

${manga}`

    });

  }

  return false;

}

module.exports = anime;
