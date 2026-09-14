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

  // Compatibilidad con usuarios antiguos

  if (typeof db[id].dinero !== "number") {
    db[id].dinero = 0;
  }

  if (typeof db[id].banco !== "number") {
    db[id].banco = 0;
  }

  if (typeof db[id].xp !== "number") {
    db[id].xp = 0;
  }

  if (typeof db[id].nivel !== "number") {
    db[id].nivel = 1;
  }

  if (!Array.isArray(db[id].inventario)) {
    db[id].inventario = [];
  }

  return db[id];
}


// ==========================================
// TIEMPOS
// ==========================================

const DAILY =
  24 * 60 * 60 * 1000;

const TRABAJO =
  60 * 60 * 1000;

const MINERIA =
  30 * 60 * 1000;

const PESCA =
  20 * 60 * 1000;


// ==========================================
// ECONOMÍA
// ==========================================

async function economia(
  sock,
  chat,
  comando,
  args,
  id
) {

  const db =
    cargarUsuarios();

  const user =
    obtenerUsuario(db, id);


  // ========================================
  // SALDO
  // ========================================

  if (comando === "saldo") {

    guardarUsuarios(db);

    return sock.sendMessage(chat, {

      text:
`💰 SALDO

💵 Dinero:
${user.dinero}

🏦 Banco:
${user.banco}

💎 Patrimonio:
${user.dinero + user.banco}`

    });
  }


  // ========================================
  // DAILY
  // ========================================

  if (comando === "daily") {

    const ahora =
      Date.now();

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
          (restante % 3600000) /
          60000
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
        Math.random() * 501
      ) + 500;


    user.dinero +=
      recompensa;

    user.ultimoDaily =
      ahora;

    guardarUsuarios(db);


    return sock.sendMessage(chat, {

      text:
`🎁 DAILY

💰 Recompensa:
+${recompensa} monedas

💵 Saldo:
${user.dinero}`

    });
  }


  // ========================================
  // TRABAJAR
  // ========================================

  if (comando === "trabajar") {

    const ahora =
      Date.now();

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

Ya trabajaste recientemente.

Espera:
${minutos} minutos.`

      });
    }


    const trabajos = [

      "👨‍🍳 Cocinaste en un restaurante.",
      "💻 Trabajaste como programador.",
      "🚕 Trabajaste como conductor.",
      "📦 Entregaste varios paquetes.",
      "🔧 Reparaste algunos equipos.",
      "🏪 Ayudaste en una tienda."

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
        Math.random() * 401
      ) + 200;


    user.dinero +=
      recompensa;

    user.ultimoTrabajo =
      ahora;

    guardarUsuarios(db);


    return sock.sendMessage(chat, {

      text:
`💼 TRABAJO

${trabajo}

💰 Ganaste:
+${recompensa}

💵 Saldo:
${user.dinero}`

    });
  }


  // ========================================
  // MINAR
  // ========================================

  if (comando === "minar") {

    const ahora =
      Date.now();

    const restante =
      MINERIA -
      (ahora - user.ultimoMineria);


    if (
      user.ultimoMineria &&
      restante > 0
    ) {

      const minutos =
        Math.ceil(
          restante / 60000
        );

      return sock.sendMessage(chat, {

        text:
`⏳ MINERÍA

Debes esperar:
${minutos} minutos.`

      });
    }


    const recompensa =
      Math.floor(
        Math.random() * 501
      ) + 300;


    user.dinero +=
      recompensa;

    user.ultimoMineria =
      ahora;

    guardarUsuarios(db);


    return sock.sendMessage(chat, {

      text:
`⛏️ MINERÍA

Encontraste recursos valiosos.

💰 Ganaste:
+${recompensa}

💵 Saldo:
${user.dinero}`

    });
  }


  // ========================================
  // PESCA
  // ========================================

  if (comando === "pescar") {

    const ahora =
      Date.now();

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
`⏳ PESCA

Espera:
${minutos} minutos.`

      });
    }


    const peces = [

      "🐟 Pez común",
      "🐠 Pez tropical",
      "🐡 Pez globo",
      "🦈 Pez raro"

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
        Math.random() * 301
      ) + 100;


    user.dinero +=
      recompensa;

    user.ultimaPesca =
      ahora;

    guardarUsuarios(db);


    return sock.sendMessage(chat, {

      text:
`🎣 PESCA

Encontraste:
${pez}

💰 Ganaste:
+${recompensa}

💵 Saldo:
${user.dinero}`

    });
  }


  // ========================================
  // DEPOSITAR
  // ========================================

  if (comando === "depositar") {

    const cantidad =
      Number(args[0]);


    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {

      return sock.sendMessage(chat, {

        text:
`🏦 DEPOSITAR

Usa:

.depositar cantidad

Ejemplo:

.depositar 500`

      });
    }


    if (
      cantidad >
      user.dinero
    ) {

      return sock.sendMessage(chat, {

        text:
          "❌ No tienes suficiente dinero."
      });
    }


    user.dinero -=
      cantidad;

    user.banco +=
      cantidad;

    guardarUsuarios(db);


    return sock.sendMessage(chat, {

      text:
`🏦 DEPÓSITO

💵 Depositado:
${cantidad}

💰 Dinero:
${user.dinero}

🏦 Banco:
${user.banco}`

    });
  }


  // ========================================
  // RETIRAR
  // ========================================

  if (comando === "retirar") {

    const cantidad =
      Number(args[0]);


    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {

      return sock.sendMessage(chat, {

        text:
`🏦 RETIRAR

Usa:

.retirar cantidad

Ejemplo:

.retirar 500`

      });
    }


    if (
      cantidad >
      user.banco
    ) {

      return sock.sendMessage(chat, {

        text:
          "❌ No tienes suficiente dinero en el banco."
      });
    }


    user.banco -=
      cantidad;

    user.dinero +=
      cantidad;

    guardarUsuarios(db);


    return sock.sendMessage(chat, {

      text:
`🏦 RETIRO

💵 Retirado:
${cantidad}

💰 Dinero:
${user.dinero}

🏦 Banco:
${user.banco}`

    });
  }


  // ========================================
  // INVENTARIO
  // ========================================

  if (comando === "inventario") {

    const inventario =
      user.inventario || [];


    if (
      inventario.length === 0
    ) {

      return sock.sendMessage(chat, {

        text:
          "🎒 Tu inventario está vacío."
      });
    }


    return sock.sendMessage(chat, {

      text:
`🎒 INVENTARIO

${inventario
  .map(
    (item, i) =>
      `${i + 1}. ${item}`
  )
  .join("\n")}`

    });
  }


  // ========================================
  // TIENDA
  // ========================================

  if (comando === "tienda") {

    return sock.sendMessage(chat, {

      text:
`🛒 TIENDA TITANBOT

1️⃣ 🍎 Manzana
Precio: 100

2️⃣ 💎 Diamante
Precio: 1000

3️⃣ 🎁 Caja misteriosa
Precio: 500

4️⃣ 🛡️ Escudo
Precio: 1500

Usa:

.comprar número

Ejemplo:

.comprar 1`

    });
  }


  // ========================================
  // COMPRAR
  // ========================================

  if (comando === "comprar") {

    const opcion =
      Number(args[0]);


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
        nombre: "🎁 Caja misteriosa",
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

        text:
          "❌ Producto no encontrado.\n\nUsa .tienda"
      });
    }


    if (
      user.dinero <
      producto.precio
    ) {

      return sock.sendMessage(chat, {

        text:
          "❌ No tienes suficiente dinero."
      });
    }


    user.dinero -=
      producto.precio;


    if (
      !Array.isArray(
        user.inventario
      )
    ) {

      user.inventario = [];
    }


    user.inventario.push(
      producto.nombre
    );


    guardarUsuarios(db);


    return sock.sendMessage(chat, {

      text:
`🛒 COMPRA REALIZADA

${producto.nombre}

💰 Precio:
${producto.precio}

💵 Dinero restante:
${user.dinero}

🎒 Añadido al inventario.`

    });
  }


  // ========================================
  // TRANSFERIR
  // ========================================

  if (comando === "transferir") {

    return sock.sendMessage(chat, {

      text:
`💸 TRANSFERIR

Esta función todavía está en desarrollo.

Próximamente podrás enviar
dinero a otros usuarios.

Ejemplo:

.transferir @usuario 500`

    });
  }


  return false;
}


module.exports = economia;
