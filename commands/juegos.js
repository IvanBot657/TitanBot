const fs = require("fs");

const DB = "./database/users.json";

function cargarUsuarios() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  try {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
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

function obtenerUsuario(db, id) {

  if (!db[id]) {
    db[id] = {
      dinero: 0,
      banco: 0,
      xp: 0,
      nivel: 1,
      mensajes: 0,
      inventario: []
    };
  }

  if (typeof db[id].dinero !== "number") {
    db[id].dinero = 0;
  }

  if (!Array.isArray(db[id].inventario)) {
    db[id].inventario = [];
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

  // ========================================
  // MENÚ
  // ========================================

  if (comando === "juegos") {

    return sock.sendMessage(chat, {

      text:
`🎮 JUEGOS TITANBOT

🎲 .dado
Lanza un dado.

🪙 .moneda
Cara o cruz.

🔮 .8ball pregunta
Responde una pregunta.

🍀 .suerte
Prueba tu suerte.

🔢 .numero
Número aleatorio.

🎯 .adivina número
Adivina un número del 1 al 10.

✋ .ppt piedra/papel/tijera
Juega contra TitanBot.

🎲 .dados
Lanza dos dados.

━━━━━━━━━━━━━━━━━━

💰 Algunos juegos pueden darte
recompensas.`

    });
  }


  // ========================================
  // DADO
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
  // MONEDA
  // ========================================

  if (comando === "moneda") {

    const resultado =
      Math.random() < 0.5
        ? "🪙 CARA"
        : "🪙 CRUZ";

    return sock.sendMessage(chat, {

      text:
`🪙 MONEDA

Resultado:

${resultado}`

    });
  }


  // ========================================
  // 8 BALL
  // ========================================

  if (comando === "8ball") {

    if (args.length === 0) {

      return sock.sendMessage(chat, {

        text:
`🔮 8 BALL

Haz una pregunta.

Ejemplo:

.8ball ¿Voy a ganar?`

      });
    }

    const respuestas = [

      "✅ Sí, definitivamente.",
      "🟢 Todo apunta a que sí.",
      "👍 Probablemente.",
      "🤔 Puede ser.",
      "❓ No estoy seguro.",
      "🟡 Tal vez más adelante.",
      "🔴 Probablemente no.",
      "❌ No.",
      "🌟 Las posibilidades son altas.",
      "🎲 El destino decidirá."

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
`🔮 8 BALL

❓ ${args.join(" ")}

💬 Respuesta:

${respuesta}`

    });
  }


  // ========================================
  // SUERTE
  // ========================================

  if (comando === "suerte") {

    const porcentaje =
      Math.floor(
        Math.random() * 101
      );

    let mensaje;

    if (porcentaje >= 90) {
      mensaje = "🌟 ¡Increíble suerte!";
    } else if (porcentaje >= 70) {
      mensaje = "🍀 ¡Tienes bastante suerte!";
    } else if (porcentaje >= 40) {
      mensaje = "🙂 Tu suerte es normal.";
    } else if (porcentaje >= 20) {
      mensaje = "😬 Hoy no parece tu mejor día.";
    } else {
      mensaje = "💀 Mejor inténtalo otro día.";
    }

    return sock.sendMessage(chat, {

      text:
`🍀 SUERTE

Tu suerte es:

🎯 ${porcentaje}%

${mensaje}`

    });
  }


  // ========================================
  // NÚMERO
  // ========================================

  if (comando === "numero") {

    const numero =
      Math.floor(
        Math.random() * 100
      ) + 1;

    return sock.sendMessage(chat, {

      text:
`🔢 NÚMERO ALEATORIO

🎯 Resultado:

${numero}`

    });
  }


  // ========================================
  // ADIVINA
  // ========================================

  if (comando === "adivina") {

    const numero =
      Number(args[0]);

    if (
      !Number.isInteger(numero) ||
      numero < 1 ||
      numero > 10
    ) {

      return sock.sendMessage(chat, {

        text:
`🎯 ADIVINA EL NÚMERO

Debes elegir un número
del 1 al 10.

Ejemplo:

.adivina 7`

      });
    }

    const secreto =
      Math.floor(
        Math.random() * 10
      ) + 1;

    const db =
      cargarUsuarios();

    const user =
      obtenerUsuario(
        db,
        id
      );

    if (
      numero === secreto
    ) {

      const premio = 500;

      user.dinero +=
        premio;

      guardarUsuarios(db);

      return sock.sendMessage(chat, {

        text:
`🎯 ¡GANASTE!

🎉 El número era:

${secreto}

💰 Premio:
+${premio}

💵 Saldo:
${user.dinero}`

      });

    }

    return sock.sendMessage(chat, {

      text:
`❌ PERDISTE

Tu número:
${numero}

🎯 El número correcto era:
${secreto}

🍀 ¡Inténtalo nuevamente!`

    });
  }


  // ========================================
  // PIEDRA PAPEL TIJERA
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

    const jugador =
      String(args[0] || "")
        .toLowerCase();

    if (
      !opciones.includes(jugador)
    ) {

      return sock.sendMessage(chat, {

        text:
`✋ PIEDRA, PAPEL O TIJERA

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

    if (jugador === bot) {

      resultado =
        "🤝 ¡EMPATE!";

    } else if (

      (jugador === "piedra" && bot === "tijera") ||
      (jugador === "papel" && bot === "piedra") ||
      (jugador === "tijera" && bot === "papel")

    ) {

      resultado =
        "🏆 ¡GANASTE!";

    } else {

      resultado =
        "😈 ¡GANÓ TITANBOT!";

    }

    return sock.sendMessage(chat, {

      text:
`✋ PIEDRA, PAPEL O TIJERA

👤 Tú:
${jugador}

🤖 TitanBot:
${bot}

━━━━━━━━━━━━

${resultado}`

    });
  }


  // ========================================
  // DOS DADOS
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
`🎲🎲 DOS DADOS

🎲 Dado 1:
${dado1}

🎲 Dado 2:
${dado2}

➕ Total:
${total}`

    });
  }


  return false;
}


module.exports = juegos;
