async function anime(sock, chat, comando, args) {

  if (comando === "anime") {
    return sock.sendMessage(chat, {
      text:
`🎌 ANIME TITANBOT

📺 Comandos disponibles:

.anime
.animeinfo
.personaje
`
    });
  }

  if (comando === "animeinfo") {

    const animes = [
      {
        nombre: "Naruto",
        genero: "Acción • Aventura",
        estado: "Finalizado"
      },
      {
        nombre: "One Piece",
        genero: "Aventura • Acción",
        estado: "En emisión"
      },
      {
        nombre: "Dragon Ball",
        genero: "Acción • Artes marciales",
        estado: "Finalizado"
      },
      {
        nombre: "Demon Slayer",
        genero: "Acción • Fantasía",
        estado: "Finalizado"
      }
    ];

    const anime =
      animes[
        Math.floor(Math.random() * animes.length)
      ];

    return sock.sendMessage(chat, {
      text:
`🎌 ANIME

📺 ${anime.nombre}

🎭 Género:
${anime.genero}

📌 Estado:
${anime.estado}`
    });
  }

  if (comando === "personaje") {

    const personajes = [
      "Naruto Uzumaki 🍥",
      "Goku 🐉",
      "Luffy ☠️",
      "Tanjiro Kamado ⚔️",
      "Saitama 👊",
      "Gojo Satoru 👓"
    ];

    const personaje =
      personajes[
        Math.floor(
          Math.random() * personajes.length
        )
      ];

    return sock.sendMessage(chat, {
      text:
`🎭 PERSONAJE ALEATORIO

${personaje}`
    });
  }

  return false;
}

module.exports = anime;
