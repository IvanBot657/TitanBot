const fs = require("fs");

const DB = "./database/users.json";

function cargarDB() {
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
      banco: 0,
      inventario: {}
    };
  }

  if (typeof db[id].dinero !== "number") {
    db[id].dinero = 500;
  }

  if (typeof db[id].banco !== "number") {
    db[id].banco = 0;
  }

  if (!db[id].inventario) {
    db[id].inventario = {};
  }
}

function agregarObjeto(usuario, objeto, cantidad = 1) {

  if (!usuario.inventario[objeto]) {
    usuario.inventario[objeto] = 0;
  }

  usuario.inventario[objeto] += cantidad;
}

async function economia(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const db = cargarDB();

  crearUsuario(db, id);

  const usuario = db[id];

  // ========================================
  // SALDO
  // ========================================

  if (comando === "saldo") {

    return sock.sendMessage(chat, {
      text:
`💰 SALDO

💵 Efectivo: ${usuario.dinero} TitanCoins
🏦 Banco: ${usuario.banco} TitanCoins
💎 Total: ${usuario.dinero + usuario.banco} TitanCoins`
    });
  }

  // ========================================
  // DAILY
  // ========================================

  if (comando === "daily") {

    const recompensa = 500;

    usuario.dinero += recompensa;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🎁 DAILY

💰 Recibiste:
+${recompensa} TitanCoins

💵 Saldo:
${usuario.dinero} TitanCoins`
    });
  }

  // ========================================
  // TRABAJAR
  // ========================================

  if (comando === "trabajar") {

    const ganancia =
      Math.floor(
        Math.random() * 500
      ) + 100;

    usuario.dinero += ganancia;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`💼 TRABAJO

👷 Trabajaste duro.

💰 Ganaste:
+${ganancia} TitanCoins

💵 Saldo:
${usuario.dinero} TitanCoins`
    });
  }

  // ========================================
  // MINAR
  // ========================================

  if (comando === "minar") {

    const minerales = [
      {
        nombre: "Carbón",
        valor: 100
      },
      {
        nombre: "Hierro",
        valor: 200
      },
      {
        nombre: "Oro",
        valor: 400
      },
      {
        nombre: "Diamante",
        valor: 800
      }
    ];

    const mineral =
      minerales[
        Math.floor(
          Math.random() *
          minerales.length
        )
      ];

    agregarObjeto(
      usuario,
      mineral.nombre
    );

    usuario.dinero += mineral.valor;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`⛏️ MINERÍA

Encontraste:
💎 ${mineral.nombre}

💰 Valor:
+${mineral.valor} TitanCoins

🎒 También fue añadido a tu inventario.`
    });
  }

  // ========================================
  // PESCAR
  // ========================================

  if (comando === "pescar") {

    const peces = [
      {
        nombre: "Sardina",
        valor: 100
      },
      {
        nombre: "Trucha",
        valor: 200
      },
      {
        nombre: "Salmón",
        valor: 350
      },
      {
        nombre: "Pez Dorado",
        valor: 700
      }
    ];

    const pez =
      peces[
        Math.floor(
          Math.random() *
          peces.length
        )
      ];

    agregarObjeto(
      usuario,
      pez.nombre
    );

    usuario.dinero += pez.valor;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🎣 PESCA

Capturaste:
🐟 ${pez.nombre}

💰 Valor:
+${pez.valor} TitanCoins

🎒 Añadido a tu inventario.`
    });
  }

  // ========================================
  // TRANSFERIR
  // ========================================

  if (comando === "transferir") {

    const cantidad =
      parseInt(args[0]);

    const mencionados =
      msg?.message
        ?.extendedTextMessage
        ?.contextInfo
        ?.mentionedJid || [];

    const destino =
      mencionados[0];

    if (!destino) {

      return sock.sendMessage(chat, {
        text:
`❌ Debes mencionar al usuario.

Ejemplo:

.transferir @usuario 500`
      });
    }

    if (
      !cantidad ||
      cantidad <= 0
    ) {

      return sock.sendMessage(chat, {
        text:
"❌ Indica una cantidad válida."
      });
    }

    if (
      usuario.dinero < cantidad
    ) {

      return sock.sendMessage(chat, {
        text:
"❌ No tienes suficientes TitanCoins."
      });
    }

    crearUsuario(
      db,
      destino
    );

    usuario.dinero -= cantidad;

    db[destino].dinero += cantidad;

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`💸 TRANSFERENCIA

👤 Destinatario:
@${destino.split("@")[0]}

💰 Cantidad:
${cantidad} TitanCoins

✅ Transferencia realizada.`,
      mentions: [
        destino
      ]
    });
  }

  // ========================================
  // INVENTARIO
  // ========================================

  if (comando === "inventario") {

    const objetos =
      Object.entries(
        usuario.inventario
      );

    if (objetos.length === 0) {

      return sock.sendMessage(chat, {
        text:
`🎒 INVENTARIO

Tu inventario está vacío.`
      });
    }

    let texto =
      "🎒 INVENTARIO\n\n";

    objetos.forEach(
      ([nombre, cantidad]) => {

        texto +=
          `📦 ${nombre}: ${cantidad}\n`;

      }
    );

    return sock.sendMessage(chat, {
      text: texto
    });
  }

  // ========================================
  // MERCADO
  // ========================================

  if (comando === "mercado") {

    return sock.sendMessage(chat, {
      text:
`🏪 MERCADO

1️⃣ Madera — 100 TitanCoins
2️⃣ Pico — 500 TitanCoins
3️⃣ Caña — 700 TitanCoins

🛒 Para comprar:

.comprar madera

.comprar pico

.comprar caña`
    });
  }

  // ========================================
  // COMPRAR
  // ========================================

  if (comando === "comprar") {

    const producto =
      args[0]?.toLowerCase();

    const tienda = {

      madera: {
        precio: 100,
        nombre: "Madera"
      },

      pico: {
        precio: 500,
        nombre: "Pico"
      },

      caña: {
        precio: 700,
        nombre: "Caña"
      }

    };

    if (!tienda[producto]) {

      return sock.sendMessage(chat, {
        text:
`❌ Producto no encontrado.

Usa:

.mercado`
      });
    }

    const item =
      tienda[producto];

    if (
      usuario.dinero < item.precio
    ) {

      return sock.sendMessage(chat, {
        text:
"❌ No tienes suficientes TitanCoins."
      });
    }

    usuario.dinero -=
      item.precio;

    agregarObjeto(
      usuario,
      item.nombre
    );

    guardarDB(db);

    return sock.sendMessage(chat, {
      text:
`🛒 COMPRA

📦 Producto:
${item.nombre}

💰 Precio:
${item.precio} TitanCoins

✅ Comprado correctamente.`
    });
  }

  return false;
}

module.exports = economia;
