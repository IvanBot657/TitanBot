console.log("Comando economía:", comando);

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

function crearUsuario(db, id) {

  if (!db[id]) {

    db[id] = {
      nombre: "Usuario",
      dinero: 500,
      banco: 0
    };

  }

}

async function economia(
  sock,
  chat,
  comando,
  args,
  id
){

  const db = cargarDB();

  crearUsuario(db, id);

  // SALDO
  if (comando === "saldo") {

    return sock.sendMessage(chat, 

{
      text:
`💰 SALDO

Efectivo: ${db[id].dinero}
Banco: ${db[id].banco}`
    });

  }

  // DAILY
  if (comando === "daily") {

    db[id].dinero += 500;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🎁 Daily reclamado

+500 TitanCoins`
    });

  }

  // TRABAJAR
  if (comando === "trabajar") {

    const ganancia =
      Math.floor(
        Math.random() * 500
      ) + 100;

    db[id].dinero += ganancia;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`💼 Trabajaste

Ganaste ${ganancia} TitanCoins`
    });

  }  
  
// MINAR
if (comando === "minar") {

  const ganancia = Math.floor(Math.random() * 800) + 200;

  db[id].dinero += ganancia;

  guardarDB(db);

  return sock.sendMessage(chat, {
    text: `⛏️ Minaste y obtuviste ${ganancia} TitanCoins`
  });

}

// PESCAR
if (comando === "pescar") {

  const ganancia = Math.floor(Math.random() * 600) + 100;

  db[id].dinero += ganancia;

  guardarDB(db);

  return sock.sendMessage(chat, {
    text: `🎣 Pescaste y ganaste ${ganancia} TitanCoins`
  });

}

// CASINO
if (comando === "casino") {

  const gana = Math.random() < 0.5;

  const cantidad = 500;

  if (gana) {
    db[id].dinero += cantidad;
  } else {
    db[id].dinero -= cantidad;
  }

  guardarDB(db);

return sock.sendMessage(chat, {
  text: gana
    ? `🎉 Ganaste ${cantidad} TitanCoins`
    : `💸 Perdiste ${cantidad} TitanCoins`
});
  
}

// APOSTAR
if (comando === "apostar") {

  return sock.sendMessage(chat, {
    text: "🎲 Usa: .apostar cantidad"
  });

}

// TRANSFERIR
if (comando === "transferir") {

  return sock.sendMessage(chat, {
    text: "💸 Sistema de transferencias en desarrollo"
  });

}

// INVENTARIO
if (comando === "inventario") {

  return sock.sendMessage(chat, {
    text: "🎒 Inventario vacío"
  });

}

// MERCADO
if (comando === "mercado") {

  return sock.sendMessage(chat, {
    text: `🏪 MERCADO

🪵 Madera - 100
⛏️ Pico - 500
🎣 Caña - 700`
  });

}

return false;

}

module.exports = economia;
