const fs = require("fs");

const DB = "./database/users.json";

function cargarDB() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, "{}");
  }

  return JSON.parse(
    fs.readFileSync(DB, "utf8")
  );
}

function guardarDB(db) {
  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}

function obtenerUsuario(db, id) {

  if (!db[id]) {

    db[id] = {
      dinero: 0,
      xp: 0,
      nivel: 1,
      mensajes: 0,
      inventario: [],
      banco: 0,
      ultimoDaily: 0,
      ultimoTrabajo: 0,
      ultimoMineria: 0,
      ultimaPesca: 0
    };

  }

  return db[id];
}

async function economia(
  sock,
  chat,
  comando,
  args,
  id
) {

  const db = cargarDB();
  const user = obtenerUsuario(db, id);

  // ==============================
  // SALDO
  // ==============================

  if (comando === "saldo") {

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`💰 SALDO

💵 Efectivo: ${user.dinero}
🏦 Banco: ${user.banco || 0}

💰 Total:
${user.dinero + (user.banco || 0)} monedas`
    });

  }

  // ==============================
  // DAILY
  // ==============================

  if (comando === "daily") {

    const ahora = Date.now();
    const espera = 24 * 60 * 60 * 1000;

    if (
      ahora - user.ultimoDaily <
      espera
    ) {

      const restante =
        espera -
        (ahora - user.ultimoDaily);

      const horas =
        Math.ceil(
          restante / (60 * 60 * 1000)
        );

      return sock.sendMessage(chat, {
        text:
`⏳ RECOMPENSA DIARIA

Ya reclamaste tu recompensa.

🕐 Vuelve en aproximadamente ${horas} horas.`
      });

    }

    const recompensa =
      Math.floor(
        Math.random() * 501
      ) + 500;

    user.dinero += recompensa;
    user.ultimoDaily = ahora;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🎁 RECOMPENSA DIARIA

💰 Ganaste:
+${recompensa} monedas

💵 Saldo:
${user.dinero}`
    });

  }

  // ==============================
  // TRABAJAR
  // ==============================

  if (comando === "trabajar") {

    const ahora = Date.now();
    const espera = 60 * 60 * 1000;

    if (
      ahora - user.ultimoTrabajo <
      espera
    ) {

      return sock.sendMessage(chat, {
        text:
"⏳ Ya trabajaste recientemente.\nPuedes volver a trabajar en 1 hora."
      });

    }

    const trabajos = [
      "👨‍🍳 Trabajaste como cocinero.",
      "💻 Trabajaste como programador.",
      "🚗 Trabajaste como conductor.",
      "📦 Trabajaste organizando paquetes.",
      "🛠️ Trabajaste reparando equipos."
    ];

    const trabajo =
      trabajos[
        Math.floor(
          Math.random() * trabajos.length
        )
      ];

    const dinero =
      Math.floor(
        Math.random() * 301
      ) + 200;

    user.dinero += dinero;
    user.ultimoTrabajo = ahora;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`${trabajo}

💰 Ganaste:
+${dinero} monedas

💵 Saldo:
${user.dinero}`
    });

  }

  // ==============================
  // MINAR
  // ==============================

  if (comando === "minar") {

    const ahora = Date.now();
    const espera = 30 * 60 * 1000;

    if (
      ahora - user.ultimoMineria <
      espera
    ) {

      return sock.sendMessage(chat, {
        text:
"⏳ Debes esperar 30 minutos para volver a minar."
      });

    }

    const minerales = [
      "🪨 Piedra",
      "🪙 Oro",
      "💎 Diamante",
      "⛏️ Hierro"
    ];

    const mineral =
      minerales[
        Math.floor(
          Math.random() * minerales.length
        )
      ];

    const dinero =
      Math.floor(
        Math.random() * 401
      ) + 100;

    user.dinero += dinero;

    if (!user.inventario) {
      user.inventario = [];
    }

    user.inventario.push(mineral);

    user.ultimoMineria = ahora;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`⛏️ MINERÍA

Encontraste:
${mineral}

💰 Valor obtenido:
+${dinero} monedas

💵 Saldo:
${user.dinero}`
    });

  }

  // ==============================
  // PESCA
  // ==============================

  if (comando === "pescar") {

    const ahora = Date.now();
    const espera = 20 * 60 * 1000;

    if (
      ahora - user.ultimaPesca <
      espera
    ) {

      return sock.sendMessage(chat, {
        text:
"⏳ Debes esperar 20 minutos para pescar nuevamente."
      });

    }

    const peces = [
      "🐟 Sardina",
      "🐠 Pez tropical",
      "🐡 Pez globo",
      "🦈 Pez grande"
    ];

    const pez =
      peces[
        Math.floor(
          Math.random() * peces.length
        )
      ];

    const dinero =
      Math.floor(
        Math.random() * 251
      ) + 100;

    user.dinero += dinero;

    if (!user.inventario) {
      user.inventario = [];
    }

    user.inventario.push(pez);

    user.ultimaPesca = ahora;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🎣 PESCA

Atrapaste:
${pez}

💰 Ganaste:
+${dinero} monedas

💵 Saldo:
${user.dinero}`
    });

  }

  // ==============================
  // DEPOSITAR
  // ==============================

  if (comando === "depositar") {

    const cantidad =
      parseInt(args[0]);

    if (
      !cantidad ||
      cantidad <= 0
    ) {

      return sock.sendMessage(chat, {
        text:
"❌ Usa el comando así:\n.depositar 500"
      });

    }

    if (
      user.dinero < cantidad
    ) {

      return sock.sendMessage(chat, {
        text:
"❌ No tienes suficiente dinero en efectivo."
      });

    }

    user.dinero -= cantidad;
    user.banco =
      (user.banco || 0) + cantidad;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🏦 DEPÓSITO

💵 Depositaste:
${cantidad}

💰 Efectivo:
${user.dinero}

🏦 Banco:
${user.banco}`
    });

  }

  // ==============================
  // RETIRAR
  // ==============================

  if (comando === "retirar") {

    const cantidad =
      parseInt(args[0]);

    if (
      !cantidad ||
      cantidad <= 0
    ) {

      return sock.sendMessage(chat, {
        text:
"❌ Usa el comando así:\n.retirar 500"
      });

    }

    if (
      (user.banco || 0) < cantidad
    ) {

      return sock.sendMessage(chat, {
        text:
"❌ No tienes suficiente dinero en el banco."
      });

    }

    user.banco -= cantidad;
    user.dinero += cantidad;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🏦 RETIRO

💵 Retiraste:
${cantidad}

💰 Efectivo:
${user.dinero}

🏦 Banco:
${user.banco}`
    });

  }

  // ==============================
  // INVENTARIO
  // ==============================

  if (comando === "inventario") {

    const inventario =
      user.inventario || [];

    if (!inventario.length) {

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

  // ==============================
  // TIENDA
  // ==============================

  if (comando === "tienda") {

    return sock.sendMessage(chat, {
      text:
`🛒 TIENDA TITANBOT

1️⃣ 🍎 Manzana — 100
2️⃣ 🎁 Cofre — 500
3️⃣ ⚔️ Espada — 1000
4️⃣ 🧪 Poción — 750
5️⃣ 💎 Diamante — 1500

Comprar:

.comprar 1
.comprar 2
.comprar 3
.comprar 4
.comprar 5`
    });

  }

  // ==============================
  // COMPRAR
  // ==============================

  if (comando === "comprar") {

    const numero =
      args[0];

    const productos = {

      "1": {
        nombre: "🍎 Manzana",
        precio: 100
      },

      "2": {
        nombre: "🎁 Cofre",
        precio: 500
      },

      "3": {
        nombre: "⚔️ Espada",
        precio: 1000
      },

      "4": {
        nombre: "🧪 Poción",
        precio: 750
      },

      "5": {
        nombre: "💎 Diamante",
        precio: 1500
      }

    };

    const producto =
      productos[numero];

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
`❌ DINERO INSUFICIENTE

💰 Precio:
${producto.precio}

💵 Tienes:
${user.dinero}`
      });

    }

    user.dinero -=
      producto.precio;

    if (!user.inventario) {
      user.inventario = [];
    }

    user.inventario.push(
      producto.nombre
    );

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`✅ COMPRA REALIZADA

🛍️ ${producto.nombre}

💰 Precio:
${producto.precio}

💵 Saldo:
${user.dinero}`
    });

  }

  // ==============================
  // TRANSFERIR
  // ==============================

  if (comando === "transferir") {

    return sock.sendMessage(chat, {
      text:
`💸 TRANSFERENCIAS

Para agregar transferencias entre usuarios necesitamos identificar correctamente al destinatario.

Esta función la agregaremos en la siguiente mejora de economía.`
    });

  }

  return false;
}

module.exports = economia;
