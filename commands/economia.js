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

      nombre: "Usuario",

      dinero: 500,

      banco: 0,

      xp: 0,

      nivel: 1,

      mensajes: 0,

      inventario: [],

      logros: [],

      fechaRegistro: Date.now(),

      ultimoDaily: 0,

      ultimoTrabajo: 0,

      ultimaMineria: 0,

      ultimaPesca: 0

    };

  }

  return db[id];

}

// ==========================================
// TIEMPOS
// ==========================================

const DAILY = 24 * 60 * 60 * 1000;
const TRABAJO = 60 * 60 * 1000;
const MINERIA = 30 * 60 * 1000;
const PESCA = 20 * 60 * 1000;

// ==========================================
// ECONOMIA V3.0
// ==========================================

async function economia(
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
  // SALDO
  // ========================================

  if (comando === "saldo") {

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`💰 TITANBANK

💵 TitanCoins:
${user.dinero}

🏦 Banco:
${user.banco}

💎 Patrimonio:
${user.dinero + user.banco}

⭐ Nivel:
${user.nivel}`

    });

  }

  // ========================================
  // DAILY
  // ========================================

  if (comando === "daily") {

    const ahora = Date.now();

    const restante =
      DAILY -
      (ahora - user.ultimoDaily);

    if (
      user.ultimoDaily &&
      restante > 0
    ) {

      const horas =
        Math.floor(
          restante / 3600000
        );

      const minutos =
        Math.floor(
          (restante % 3600000) / 60000
        );

      return sock.sendMessage(chat, {

        text:
`⏳ DAILY

Ya reclamaste tu recompensa.

Vuelve en:

${horas}h ${minutos}m`

      });

    }

    const recompensa =
      Math.floor(
        Math.random() * 1001
      ) + 1000;

    user.dinero += recompensa;

    user.ultimoDaily = ahora;

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`🎁 DAILY

💰 Recompensa:
+${recompensa} TitanCoins

💵 Saldo:
${user.dinero}`

    });

  }

  // ========================================
  // TRABAJAR
  // ========================================

  if (comando === "trabajar") {

    const ahora = Date.now();

    const restante =
      TRABAJO -
      (ahora - user.ultimoTrabajo);

    if (
      user.ultimoTrabajo &&
      restante > 0
    ) {

      const minutos =
        Math.ceil(
          restante / 60000
        );

      return sock.sendMessage(chat, {

        text:
`⏳ TRABAJO

Ya trabajaste.

Espera:

${minutos} minutos`

      });

    }

    const trabajos = [

      "👨‍🍳 Cocinaste en un restaurante",
      "💻 Programaste una aplicación",
      "🚕 Trabajaste como conductor",
      "📦 Entregaste paquetes",
      "🔧 Reparaste equipos",
      "🏪 Ayudaste en una tienda",
      "🏗️ Trabajaste en construcción",
      "🧑‍🏫 Diste clases particulares"

    ];

    const trabajo =
      trabajos[
        Math.floor(
          Math.random() *
          trabajos.length
        )
      ];

    const recompensa =
      Math.floor(
        Math.random() * 601
      ) + 400;

    user.dinero += recompensa;

    user.ultimoTrabajo = ahora;

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`💼 TRABAJO

${trabajo}

💰 Ganaste:
+${recompensa} TitanCoins

💵 Saldo:
${user.dinero}`

    });

  }

  // ========================================
  // MINAR
  // ========================================

  if (comando === "minar") {

    const ahora = Date.now();

    const restante =
      MINERIA -
      (ahora - user.ultimaMineria);

    if (
      user.ultimaMineria &&
      restante > 0
    ) {

      const minutos =
        Math.ceil(
          restante / 60000
        );

      return sock.sendMessage(chat, {

        text:
`⛏️ MINERÍA

Debes esperar:

${minutos} minutos`

      });

    }

    const minerales = [

      "🪨 Piedra",
      "🥉 Cobre",
      "🥈 Plata",
      "🥇 Oro",
      "💎 Diamante"

    ];

    const mineral =
      minerales[
        Math.floor(
          Math.random() *
          minerales.length
        )
      ];

    const recompensa =
      Math.floor(
        Math.random() * 801
      ) + 500;

    user.dinero += recompensa;

    user.ultimaMineria = ahora;

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`⛏️ MINERÍA

Encontraste:

${mineral}

💰 Ganaste:
+${recompensa} TitanCoins

💵 Saldo:
${user.dinero}`

    });

  }

  // ========================================
  // PESCAR
  // ========================================

  if (comando === "pescar") {

    const ahora = Date.now();

    const restante =
      PESCA -
      (ahora - user.ultimaPesca);

    if (
      user.ultimaPesca &&
      restante > 0
    ) {

      const minutos =
        Math.ceil(
          restante / 60000
        );

      return sock.sendMessage(chat, {

        text:
`🎣 PESCA

Debes esperar:

${minutos} minutos`

      });

    }

    const peces = [

      "🐟 Pez común",
      "🐠 Pez tropical",
      "🐡 Pez globo",
      "🦈 Tiburón pequeño",
      "🐙 Pulpo"

    ];

    const pez =
      peces[
        Math.floor(
          Math.random() *
          peces.length
        )
      ];

    const recompensa =
      Math.floor(
        Math.random() * 501
      ) + 300;

    user.dinero += recompensa;

    user.ultimaPesca = ahora;

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`🎣 PESCA

Capturaste:

${pez}

💰 Ganaste:
+${recompensa} TitanCoins

💵 Saldo:
${user.dinero}`

    });

  }

  return false;

}

  // ========================================
  // DEPOSITAR
  // ========================================

  if (comando === "depositar") {

    const cantidad = Number(args[0]);

    if (!cantidad || cantidad <= 0) {

      return sock.sendMessage(chat, {
        text: "🏦 Usa:\n.depositar cantidad"
      });

    }

    if (cantidad > user.dinero) {

      return sock.sendMessage(chat, {
        text: "❌ No tienes suficientes TitanCoins."
      });

    }

    user.dinero -= cantidad;
    user.banco += cantidad;

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`🏦 DEPÓSITO

💵 Depositado:
${cantidad}

🏦 Banco:
${user.banco}`

    });

  }

  // ========================================
  // RETIRAR
  // ========================================

  if (comando === "retirar") {

    const cantidad = Number(args[0]);

    if (!cantidad || cantidad <= 0) {

      return sock.sendMessage(chat, {
        text: "🏦 Usa:\n.retirar cantidad"
      });

    }

    if (cantidad > user.banco) {

      return sock.sendMessage(chat, {
        text: "❌ No tienes suficiente dinero en el banco."
      });

    }

    user.banco -= cantidad;
    user.dinero += cantidad;

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`🏦 RETIRO

💵 Retirado:
${cantidad}

💰 Saldo:
${user.dinero}`

    });

  }

  // ========================================
  // INVENTARIO
  // ========================================

  if (comando === "inventario") {

    if (!user.inventario.length) {

      return sock.sendMessage(chat, {
        text: "🎒 Tu inventario está vacío."
      });

    }

    return sock.sendMessage(chat, {

      text:
`🎒 INVENTARIO

${user.inventario.join("\n")}`

    });

  }

  // ========================================
  // TIENDA
  // ========================================

  if (comando === "tienda") {

    return sock.sendMessage(chat, {

      text:
`🛒 TIENDA TITANBOT

1️⃣ 🍎 Manzana - 100
2️⃣ 💎 Diamante - 1000
3️⃣ 🎁 Caja Misteriosa - 500
4️⃣ 🛡️ Escudo - 1500

Usa:

.comprar número`

    });

  }

  // ========================================
  // COMPRAR
  // ========================================

  if (comando === "comprar") {

    const opcion = Number(args[0]);

    const productos = {

      1: {
        nombre: "🍎 Manzana",
        precio: 100
      },

      2: {
        nombre: "💎 Diamante",
        precio: 1000
      },

      3: {
        nombre: "🎁 Caja Misteriosa",
        precio: 500
      },

      4: {
        nombre: "🛡️ Escudo",
        precio: 1500
      }

    };

    const producto =
      productos[opcion];

    if (!producto) {

      return sock.sendMessage(chat, {
        text: "❌ Producto inválido."
      });

    }

    if (user.dinero < producto.precio) {

      return sock.sendMessage(chat, {
        text: "❌ No tienes suficientes TitanCoins."
      });

    }

    user.dinero -= producto.precio;
    user.inventario.push(producto.nombre);

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`🛒 COMPRA EXITOSA

${producto.nombre}

💰 Precio:
${producto.precio}`

    });

  }

  // ========================================
  // CASINO
  // ========================================

  if (comando === "casino") {

    const apuesta =
      Number(args[0]);

    if (!apuesta || apuesta <= 0) {

      return sock.sendMessage(chat, {
        text: "🎰 Usa:\n.casino cantidad"
      });

    }

    if (apuesta > user.dinero) {

      return sock.sendMessage(chat, {
        text: "❌ No tienes suficientes TitanCoins."
      });

    }

    const simbolos =
      ["🍒", "🍋", "💎", "7️⃣"];

    const a =
      simbolos[Math.floor(Math.random() * simbolos.length)];

    const b =
      simbolos[Math.floor(Math.random() * simbolos.length)];

    const c =
      simbolos[Math.floor(Math.random() * simbolos.length)];

    if (a === b && b === c) {

      const premio =
        apuesta * 3;

      user.dinero += premio;

      guardarUsuarios(db);

      return sock.sendMessage(chat, {

        text:
`🎰 CASINO

${a} ${b} ${c}

🏆 Ganaste:
${premio} TitanCoins`

      });

    }

    user.dinero -= apuesta;

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`🎰 CASINO

${a} ${b} ${c}

❌ Perdiste:
${apuesta} TitanCoins`

    });

  }

  // ========================================
  // TOPRICOS
  // ========================================

  if (comando === "topricos") {

    const ranking =
      Object.entries(db)
        .sort(
          (a, b) =>
            (b[1].dinero + b[1].banco) -
            (a[1].dinero + a[1].banco)
        )
        .slice(0, 10);

    let texto =
      "🏆 TOP RICOS\n\n";

    ranking.forEach(
      (u, i) => {

        texto +=
          `${i + 1}. ${u[1].nombre} - ${
            u[1].dinero + u[1].banco
          } TitanCoins\n`;

      }
    );

    return sock.sendMessage(chat, {
      text: texto
    });

  }

  return false;

}

module.exports = economia;
