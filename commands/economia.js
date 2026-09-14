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

function usuario(db, id) {

  if (!db[id]) {
    db[id] = {
      dinero: 0,
      xp: 0,
      nivel: 1,
      mensajes: 0,
      inventario: [],
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
  const user = usuario(db, id);

  // 💰 SALDO
  if (comando === "saldo") {

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`💰 TU SALDO

💵 ${user.dinero} monedas`
    });
  }

  // 🎁 DAILY
  if (comando === "daily") {

    const ahora = Date.now();
    const espera = 24 * 60 * 60 * 1000;

    if (
      ahora - user.ultimoDaily <
      espera
    ) {

      return sock.sendMessage(chat, {
        text:
          "⏳ Ya reclamaste tu recompensa diaria. Vuelve mañana."
      });
    }

    user.dinero += 500;
    user.ultimoDaily = ahora;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🎁 RECOMPENSA DIARIA

💰 +500 monedas

💵 Saldo:
${user.dinero}`
    });
  }

  // 💼 TRABAJAR
  if (comando === "trabajar") {

    const ahora = Date.now();
    const espera = 60 * 60 * 1000;

    if (
      ahora - user.ultimoTrabajo <
      espera
    ) {

      return sock.sendMessage(chat, {
        text:
          "⏳ Ya trabajaste. Puedes volver a trabajar en 1 hora."
      });
    }

    const dinero =
      Math.floor(
        Math.random() * 201
      ) + 100;

    user.dinero += dinero;
    user.ultimoTrabajo = ahora;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`💼 TRABAJO TERMINADO

💰 Ganaste: +${dinero}

💵 Saldo:
${user.dinero}`
    });
  }

  // ⛏️ MINAR
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

    const dinero =
      Math.floor(
        Math.random() * 251
      ) + 50;

    user.dinero += dinero;
    user.ultimoMineria = ahora;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`⛏️ MINERÍA

Encontraste recursos.

💰 +${dinero} monedas

💵 Saldo:
${user.dinero}`
    });
  }

  // 🎣 PESCAR
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

    const dinero =
      Math.floor(
        Math.random() * 151
      ) + 50;

    user.dinero += dinero;
    user.ultimaPesca = ahora;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🎣 PESCA

🐟 Buena pesca.

💰 +${dinero} monedas

💵 Saldo:
${user.dinero}`
    });
  }

  // 🎒 INVENTARIO
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

  // 🛒 TIENDA
  if (comando === "tienda") {

    return sock.sendMessage(chat, {
      text:
`🛒 TIENDA TITANBOT

1️⃣ 🍎 Manzana — 100
2️⃣ 🎁 Cofre — 500
3️⃣ ⚔️ Espada — 1000

Para comprar:

.comprar 1
.comprar 2
.comprar 3`
    });
  }

  // 🛍️ COMPRAR
  if (comando === "comprar") {

    const numero = args[0];

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
      }

    };

    const producto =
      productos[numero];

    if (!producto) {

      return sock.sendMessage(chat, {
        text:
          "❌ Producto no encontrado.\nUsa .tienda"
      });
    }

    if (
      user.dinero <
      producto.precio
    ) {

      return sock.sendMessage(chat, {
        text:
`❌ No tienes suficiente dinero.

💰 Necesitas: ${producto.precio}
💵 Tienes: ${user.dinero}`
      });
    }

    user.dinero -=
      producto.precio;

    user.inventario.push(
      producto.nombre
    );

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`✅ COMPRA REALIZADA

🛍️ ${producto.nombre}
💰 Precio: ${producto.precio}

💵 Saldo:
${user.dinero}`
    });
  }

  return false;
}

module.exports = economia;
