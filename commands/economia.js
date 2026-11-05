const fs = require("fs");
const path = require("path");

// La ruta conserva la base de datos del proyecto: database/users.json
const DB_DIR = path.join(__dirname, "..", "database");
const DB = path.join(DB_DIR, "users.json");

function cargarDB() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB)) fs.writeFileSync(DB, "{}", "utf8");

  try {
    const contenido = fs.readFileSync(DB, "utf8");
    return contenido.trim() ? JSON.parse(contenido) : {};
  } catch (error) {
    console.error("[ECONOMIA] No se pudo leer users.json:", error);
    return {};
  }
}

function guardarDB(db) {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB, JSON.stringify(db, null, 2), "utf8");
}

function crearUsuario(db, id) {
  if (!db[id] || typeof db[id] !== "object") {
    db[id] = {
      nombre: "Usuario",
      dinero: 500,
      banco: 0,
      inventario: {}
    };
  }

  if (typeof db[id].dinero !== "number") db[id].dinero = 500;
  if (typeof db[id].banco !== "number") db[id].banco = 0;
  if (!db[id].inventario || typeof db[id].inventario !== "object") {
    db[id].inventario = {};
  }
}

function agregarObjeto(usuario, objeto, cantidad = 1) {
  if (typeof usuario.inventario[objeto] !== "number") {
    usuario.inventario[objeto] = 0;
  }
  usuario.inventario[objeto] += cantidad;
}

function marco(titulo, contenido) {
  return `╭━━〔 ${titulo} 〕━━╮\n${contenido}\n╰━━━━━━━━━━━━━━╯\n⚫ TITANBOT`;
}

function tiempoRestante(ms) {
  const horas = Math.floor(ms / 3600000);
  const minutos = Math.floor((ms % 3600000) / 60000);
  const segundos = Math.floor((ms % 60000) / 1000);
  return `${horas}h ${minutos}m ${segundos}s`;
}

async function economia(sock, chat, comando, args = [], id, msg) {
  if (!id) return false;

  const db = cargarDB();
  crearUsuario(db, id);
  const usuario = db[id];

  // SALDO y alias .bal
  if (comando === "saldo" || comando === "bal") {
    return sock.sendMessage(chat, {
      text: marco("💰 TITAN BANK", `👤 ${usuario.nombre || "Usuario"}\n\n💵 Efectivo: ${usuario.dinero} TitanCoins\n🏦 Banco: ${usuario.banco} TitanCoins\n💎 Total: ${usuario.dinero + usuario.banco} TitanCoins`)
    }, { quoted: msg });
  }

  // DAILY: una recompensa cada 24 horas
  if (comando === "daily") {
    const ahora = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const ultimo = Number(usuario.ultimoDaily || 0);
    const falta = cooldown - (ahora - ultimo);

    if (falta > 0) {
      return sock.sendMessage(chat, {
        text: marco("🎁 DAILY", `⏳ Ya reclamaste tu recompensa.\n\nVuelve dentro de: ${tiempoRestante(falta)}`)
      }, { quoted: msg });
    }

    const recompensa = Math.floor(Math.random() * 1001) + 500;
    usuario.dinero += recompensa;
    usuario.ultimoDaily = ahora;
    guardarDB(db);

    return sock.sendMessage(chat, {
      text: marco("🎁 RECOMPENSA DAILY", `🎉 ¡Recompensa reclamada!\n\n💰 Ganaste: +${recompensa} TitanCoins\n💵 Saldo actual: ${usuario.dinero} TitanCoins\n\n⏳ Próximo daily en 24 horas.`)
    }, { quoted: msg });
  }

  // TRABAJAR
  if (comando === "trabajar") {
    const ganancia = Math.floor(Math.random() * 500) + 100;
    usuario.dinero += ganancia;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco("💼 TRABAJO", `👷 Cumpliste tu jornada.\n\n💰 Ganaste: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
    }, { quoted: msg });
  }

  // CRIME: evento ficticio del juego
  if (comando === "crime") {
    if (Math.random() < 0.65) {
      const ganancia = Math.floor(Math.random() * 901) + 300;
      usuario.dinero += ganancia;
      guardarDB(db);
      return sock.sendMessage(chat, {
        text: marco("🎭 EVENTO CRIME", `✨ ¡El evento salió a tu favor!\n\n💰 Recompensa: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
      }, { quoted: msg });
    }

    const perdida = Math.min(usuario.dinero, Math.floor(Math.random() * 301) + 100);
    usuario.dinero -= perdida;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco("🚨 EVENTO CRIME", `El evento no salió como esperabas.\n\n💸 Perdiste: ${perdida} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
    }, { quoted: msg });
  }

  // DALL: sorpresa aleatoria de monedas
  if (comando === "dall") {
    const ganancia = Math.floor(Math.random() * 1501) + 100;
    usuario.dinero += ganancia;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco("🎲 SORPRESA TITAN", `🍀 ¡Te tocó una sorpresa!\n\n💰 Recibiste: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
    }, { quoted: msg });
  }

  // ROBAR: minijuego ficticio, con espera de 60 segundos
  if (comando === "robar") {
    const ahora = Date.now();
    const cooldown = 60 * 1000;
    const ultimo = Number(usuario.ultimoRobar || 0);
    const falta = cooldown - (ahora - ultimo);

    if (falta > 0) {
      return sock.sendMessage(chat, {
        text: marco("🕶️ MINIJUEGO", `Espera ${tiempoRestante(falta)} antes de volver a jugar.`)
      }, { quoted: msg });
    }

    usuario.ultimoRobar = ahora;
    if (Math.random() < 0.5) {
      const ganancia = Math.floor(Math.random() * 601) + 100;
      usuario.dinero += ganancia;
      guardarDB(db);
      return sock.sendMessage(chat, {
        text: marco("🕶️ MINIJUEGO", `🎉 ¡Ganaste esta ronda!\n\n💰 Premio: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins\n\n⏳ Espera 1 minuto para jugar otra vez.`)
      }, { quoted: msg });
    }

    const perdida = Math.min(usuario.dinero, Math.floor(Math.random() * 201) + 50);
    usuario.dinero -= perdida;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco("🕶️ MINIJUEGO", `😅 Esta ronda no salió bien.\n\n💸 Penalización: -${perdida} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins\n\n⏳ Espera 1 minuto para jugar otra vez.`)
    }, { quoted: msg });
  }

  // MINAR
  if (comando === "minar") {
    const minerales = [
      { nombre: "Carbón", valor: 100 },
      { nombre: "Hierro", valor: 200 },
      { nombre: "Oro", valor: 400 },
      { nombre: "Diamante", valor: 800 }
    ];
    const mineral = minerales[Math.floor(Math.random() * minerales.length)];
    agregarObjeto(usuario, mineral.nombre);
    usuario.dinero += mineral.valor;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco("⛏️ MINERÍA", `Encontraste: 💎 ${mineral.nombre}\n\n💰 Valor: +${mineral.valor} TitanCoins\n🎒 Añadido a tu inventario.`)
    }, { quoted: msg });
  }

  // PESCAR
  if (comando === "pescar") {
    const peces = [
      { nombre: "Sardina", valor: 100 },
      { nombre: "Trucha", valor: 200 },
      { nombre: "Salmón", valor: 350 },
      { nombre: "Pez Dorado", valor: 700 }
    ];
    const pez = peces[Math.floor(Math.random() * peces.length)];
    agregarObjeto(usuario, pez.nombre);
    usuario.dinero += pez.valor;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco("🎣 PESCA", `Capturaste: 🐟 ${pez.nombre}\n\n💰 Valor: +${pez.valor} TitanCoins\n🎒 Añadido a tu inventario.`)
    }, { quoted: msg });
  }

  // TRANSFERIR
  if (comando === "transferir") {
    const cantidad = Number.parseInt(args[0], 10);
    const mencionados = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const destino = mencionados[0];

    if (!destino) {
      return sock.sendMessage(chat, {
        text: marco("💸 TRANSFERENCIA", "❌ Debes mencionar al usuario.\n\nEjemplo: .transferir @usuario 500")
      }, { quoted: msg });
    }
    if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
      return sock.sendMessage(chat, {
        text: marco("💸 TRANSFERENCIA", "❌ Indica una cantidad válida.\n\nEjemplo: .transferir @usuario 500")
      }, { quoted: msg });
    }
    if (usuario.dinero < cantidad) {
      return sock.sendMessage(chat, {
        text: marco("💸 TRANSFERENCIA", "❌ No tienes suficientes TitanCoins.")
      }, { quoted: msg });
    }

    crearUsuario(db, destino);
    usuario.dinero -= cantidad;
    db[destino].dinero += cantidad;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco("💸 TRANSFERENCIA", `👤 Destinatario: @${destino.split("@")[0]}\n\n💰 Cantidad: ${cantidad} TitanCoins\n✅ Transferencia realizada.`),
      mentions: [destino]
    }, { quoted: msg });
  }

  // INVENTARIO
  if (comando === "inventario") {
    const objetos = Object.entries(usuario.inventario);
    if (!objetos.length) {
      return sock.sendMessage(chat, {
        text: marco("🎒 INVENTARIO", "Tu inventario está vacío.")
      }, { quoted: msg });
    }
    const texto = objetos.map(([nombre, cantidad]) => `📦 ${nombre}: ${cantidad}`).join("\n");
    return sock.sendMessage(chat, {
      text: marco("🎒 INVENTARIO", texto)
    }, { quoted: msg });
  }

  // MERCADO
  if (comando === "mercado") {
    return sock.sendMessage(chat, {
      text: marco("🏪 MERCADO", `1️⃣ Madera — 100 TitanCoins\n2️⃣ Pico — 500 TitanCoins\n3️⃣ Caña — 700 TitanCoins\n\n🛒 Para comprar:\n.comprar madera\n.comprar pico\n.comprar caña`)
    }, { quoted: msg });
  }

  // COMPRAR
  if (comando === "comprar") {
    const producto = args[0]?.toLowerCase();
    const tienda = {
      madera: { precio: 100, nombre: "Madera" },
      pico: { precio: 500, nombre: "Pico" },
      caña: { precio: 700, nombre: "Caña" }
    };
    if (!tienda[producto]) {
      return sock.sendMessage(chat, {
        text: marco("🛒 MERCADO", "❌ Producto no encontrado.\n\nUsa .mercado")
      }, { quoted: msg });
    }
    const item = tienda[producto];
    if (usuario.dinero < item.precio) {
      return sock.sendMessage(chat, {
        text: marco("🛒 MERCADO", "❌ No tienes suficientes TitanCoins.")
      }, { quoted: msg });
    }
    usuario.dinero -= item.precio;
    agregarObjeto(usuario, item.nombre);
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco("🛒 COMPRA", `📦 Producto: ${item.nombre}\n💰 Precio: ${item.precio} TitanCoins\n\n✅ Comprado correctamente.`)
    }, { quoted: msg });
  }

  return false;
}

module.exports = economia;
