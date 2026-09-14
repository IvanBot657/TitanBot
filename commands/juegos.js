// ==========================================
// TITANBOT - JUEGOS
// ==========================================

const fs = require("fs");

const DB = "./database/users.json";


// ==========================================
// BASE DE DATOS
// ==========================================

function cargarUsuarios() {

  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  try {

    return JSON.parse(
      fs.readFileSync(DB, "utf8")
    );

  } catch {

    return {};
  }
}


function guardarUsuarios(db) {

  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}


// ==========================================
// OBTENER USUARIO
// ==========================================

function obtenerUsuario(db, id) {

  if (!db[id]) {

    db[id] = {

      dinero: 0,
      banco: 0,
      xp: 0,
      nivel: 1,
      mensajes: 0,
      inventario: [],

      ultimoDaily: 0,
      ultimoTrabajo: 0,
      ultimoMineria: 0,
      ultimaPesca: 0,
      ultimaXP: 0

    };
  }

  return db[id];
}


// ==========================================
// JUEGOS
// ==========================================

async function juegos(
  sock,
  chat,
  comando,
  args,
  id
) {

  const db = cargarUsuarios();

  const user =
    obtenerUsuario(db, id);


  // ========================================
  // 🎲 DADO
  // ========================================

  if (comando === "dado") {

    const resultado =
      Math.floor(
        Math.random() * 6
      ) + 1;


    return sock.sendMessage(chat, {

      text:
`🎲 DADO

Resultado:
🎲 ${resultado}`

    });
  }


  // ========================================
  // 🪙 MONEDA
  // ========================================

  if (comando === "moneda") {

    const resultado =
      Math.random() < 0.5
        ? "🟡 CARA"
        : "⚪ SELLO";


    return sock.sendMessage(chat, {

      text:
`🪙 MONEDA

Resultado:
${resultado}`

    });
  }


  // ========================================
  // 🔮 8BALL
  // ========================================

  if (comando === "8ball") {

    const respuestas = [

      "🟢 Sí, definitivamente.",

      "🟢 Parece que sí.",

      "🟡 Probablemente.",

      "🟡 No estoy seguro.",

      "🔴 Probablemente no.",

      "🔴 No.",

      "🔴 Definitivamente no.",

      "🟣 El futuro es incierto."

    ];


    const respuesta =
      respuestas[
        Math.floor(
          Math.random() *
          respuestas.length
        )
      ];


    return sock.sendMessage(chat, {

      text:
`🔮 8BALL

${respuesta}`

    });
  }


  // ========================================
  // 🍀 SUERTE
  // ========================================

  if (comando === "suerte") {

    const numero =
      Math.floor(
        Math.random() * 101
      );


    return sock.sendMessage(chat, {

      text:
`🍀 SUERTE

Tu nivel de suerte es:

⭐ ${numero}/100`

    });
  }


  // ========================================
  // 🔢 NÚMERO
  // ========================================

  if (comando === "numero") {

    const numero =
      Math.floor(
        Math.random() * 100
      ) + 1;


    return sock.sendMessage(chat, {

      text:
`🔢 NÚMERO ALEATORIO

🎯 ${numero}`

    });
  }


  // ========================================
  // 🎯 ADIVINA
  // ========================================

  if (comando === "adivina") {

    const elegido =
      Number(args[0]);


    if (
      !Number.isInteger(elegido) ||
      elegido < 1 ||
      elegido > 10
    ) {

      return sock.sendMessage(chat, {

        text:
`🎯 ADIVINA EL NÚMERO

Debes elegir un número
entre 1 y 10.

Ejemplo:

.adivina 7`

      });
    }


    const secreto =
      Math.floor(
        Math.random() * 10
      ) + 1;


    if (
      elegido === secreto
    ) {

      const premio = 500;

      user.dinero += premio;

      guardarUsuarios(db);


      return sock.sendMessage(chat, {

        text:
`🎉 ¡GANASTE!

🎯 Número:
${secreto}

💰 Premio:
+${premio}

💵 Dinero:
${user.dinero}`

      });

    }


    return sock.sendMessage(chat, {

      text:
`❌ No acertaste.

Tu número:
${elegido}

Número correcto:
${secreto}`

    });
  }


  // ========================================
  // ✋ PIEDRA PAPEL TIJERA
  // ========================================

  if (
    comando === "ppt" ||
    comando === "piedrapapeltijera"
  ) {

    const opciones = [

      "piedra",
      "papel",
      "tijera"

    ];


    const eleccion =
      (args[0] || "")
        .toLowerCase();


    if (
      !opciones.includes(
        eleccion
      )
    ) {

      return sock.sendMessage(chat, {

        text:
`✋ PIEDRA PAPEL TIJERA

Usa:

.ppt piedra
.ppt papel
.ppt tijera`

      });
    }


    const bot =
      opciones[
        Math.floor(
          Math.random() *
          opciones.length
        )
      ];


    let resultado;


    if (
      eleccion === bot
    ) {

      resultado =
        "🤝 EMPATE";

    } else if (

      (
        eleccion === "piedra" &&
        bot === "tijera"
      ) ||

      (
        eleccion === "papel" &&
        bot === "piedra"
      ) ||

      (
        eleccion === "tijera" &&
        bot === "papel"
      )

    ) {

      resultado =
        "🎉 GANASTE";

    } else {

      resultado =
        "❌ PERDISTE";
    }


    return sock.sendMessage(chat, {

      text:
`✋ PIEDRA PAPEL TIJERA

👤 Tú:
${eleccion}

🤖 TitanBot:
${bot}

${resultado}`

    });
  }


  // ========================================
  // 🎲 DOS DADOS
  // ========================================

  if (comando === "dados") {

    const dado1 =
      Math.floor(
        Math.random() * 6
      ) + 1;

    const dado2 =
      Math.floor(
        Math.random() * 6
      ) + 1;

    const total =
      dado1 + dado2;


    return sock.sendMessage(chat, {

      text:
`🎲 DADOS

🎲 Dado 1:
${dado1}

🎲 Dado 2:
${dado2}

🏆 Total:
${total}`

    });
  }


  // ========================================
  // 🎮 MENÚ DE JUEGOS
  // ========================================

  if (comando === "juegos") {

    return sock.sendMessage(chat, {

      text:
`🎮 JUEGOS TITANBOT

🎲 .dado
🪙 .moneda
🔮 .8ball
🍀 .suerte
🔢 .numero
🎯 .adivina 1-10
✋ .ppt piedra/papel/tijera
🎲 .dados

💰 Algunos juegos pueden
dar recompensas.`

    });
  }


  return false;
}


// ==========================================
// EXPORTAR
// ==========================================

module.exports = juegos;
