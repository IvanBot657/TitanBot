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

function elegir(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
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
      text: marco(elegir(["💰 TITAN BANK", "🏦 TU CARTERA", "💎 ESTADO DE CUENTA", "💵 TU FORTUNA"]), `${elegir(["👤 Titular", "🪪 Cuenta de", "🙋 Usuario"])}: ${usuario.nombre || "Usuario"}\n\n💵 Efectivo: ${usuario.dinero} TitanCoins\n🏦 Banco: ${usuario.banco} TitanCoins\n💎 Total: ${usuario.dinero + usuario.banco} TitanCoins\n\n${elegir(["📊 Tus finanzas están actualizadas.", "✨ Este es tu estado económico actual.", "💼 ¡Administra bien tus TitanCoins!", "🔐 Información de tu cuenta TITAN."])}`)
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
        text: marco(elegir(["🎁 DAILY", "⏰ RECOMPENSA DIARIA", "🌞 VUELVE MAÑANA"]), `${elegir(["⏳ Tu regalo de hoy ya fue reclamado.", "🎟️ Ya recogiste tus TitanCoins diarios.", "📅 Tu recompensa diaria está en descanso.", "🙌 ¡Mañana habrá otra recompensa esperándote!"])}\n\n${elegir(["Regresa en", "Disponible nuevamente en", "Siguiente recompensa dentro de"])}: ${tiempoRestante(falta)}`)
      }, { quoted: msg });
    }

    const recompensa = Math.floor(Math.random() * 1001) + 500;
    usuario.dinero += recompensa;
    usuario.ultimoDaily = ahora;
    guardarDB(db);

    return sock.sendMessage(chat, {
      text: marco(elegir(["🎁 RECOMPENSA DAILY", "🌟 REGALO DEL DÍA", "💰 DAILY TITAN", "🎉 PREMIO DIARIO"]), `${elegir(["¡Hoy la suerte estuvo de tu lado!", "¡Tu recompensa diaria llegó!", "¡Has abierto tu regalo de hoy!", "¡Un nuevo día, unas monedas más!"])}\n\n💰 ${elegir(["Recibiste", "Tu premio es", "Ganancia diaria"])}: +${recompensa} TitanCoins\n💵 Saldo actual: ${usuario.dinero} TitanCoins\n\n⏳ ${elegir(["Vuelve en 24 horas.", "Tu próximo regalo estará disponible mañana.", "La próxima recompensa llega en 24 horas."])}`)
    }, { quoted: msg });
  }

  // TRABAJAR
  if (comando === "trabajar") {
    const ganancia = Math.floor(Math.random() * 500) + 100;
    usuario.dinero += ganancia;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco(elegir(["💼 TRABAJO", "🛠️ JORNADA COMPLETADA", "👷 TURNO TERMINADO", "📋 DÍA DE TRABAJO"]), `${elegir(["Terminaste tu jornada con éxito.", "Te esforzaste y llegó tu paga.", "Completaste un encargo del día.", "Tu jefe quedó satisfecho con el trabajo.", "Acabaste el turno y cobraste."])}\n\n💰 ${elegir(["Sueldo", "Pago recibido", "Ganancia", "Recompensa"])}: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
    }, { quoted: msg });
  }

  // CRIME: evento ficticio del juego
  if (comando === "crime") {
    if (Math.random() < 0.65) {
      const ganancia = Math.floor(Math.random() * 901) + 300;
      usuario.dinero += ganancia;
      guardarDB(db);
      return sock.sendMessage(chat, {
        text: marco(elegir(["🎭 EVENTO CRIME", "🎲 SUERTE CRIMINAL", "🃏 EVENTO SORPRESA"]), `${elegir(["¡El plan ficticio salió a tu favor!", "¡La suerte te acompañó esta vez!", "¡Completaste el reto del juego!", "¡Saliste victorioso del evento!"])}\n\n💰 ${elegir(["Botín", "Premio", "Ganancia"])}: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
      }, { quoted: msg });
    }

    const perdida = Math.min(usuario.dinero, Math.floor(Math.random() * 301) + 100);
    usuario.dinero -= perdida;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco(elegir(["🚨 EVENTO CRIME", "🎭 EL RETO FALLÓ", "🃏 MALA SUERTE"]), `${elegir(["Esta ronda no salió como esperabas.", "El reto terminó en pérdida.", "Hoy la suerte no estuvo de tu lado.", "No lograste superar el evento esta vez."])}\n\n💸 ${elegir(["Pérdida", "Penalización", "Descuento"])}: -${perdida} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
    }, { quoted: msg });
  }

  // DALL: sorpresa aleatoria de monedas
  if (comando === "dall") {
    const ganancia = Math.floor(Math.random() * 1501) + 100;
    usuario.dinero += ganancia;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco(elegir(["🎲 SORPRESA TITAN", "🍀 GIRO DE LA SUERTE", "🎁 PREMIO INESPERADO", "✨ EVENTO ALEATORIO"]), `${elegir(["¡Encontraste una pequeña fortuna!", "¡Una sorpresa llegó a tu cuenta!", "¡La suerte te regaló unas monedas!", "¡Has desbloqueado un premio inesperado!", "¡Un bonus apareció de la nada!"])}\n\n💰 ${elegir(["Recibiste", "Premio", "Bonus"])}: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
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
        text: marco(elegir(["🕶️ MINIJUEGO", "⏳ ENFRIAMIENTO", "🎮 ESPERA UN MOMENTO"]), `${elegir(["Ya participaste en esta ronda.", "El minijuego necesita un descanso.", "Todavía no puedes jugar otra vez."])}\n\n${elegir(["Inténtalo en", "Disponible en", "Espera"])}: ${tiempoRestante(falta)}`)
      }, { quoted: msg });
    }

    usuario.ultimoRobar = ahora;
    if (Math.random() < 0.5) {
      const ganancia = Math.floor(Math.random() * 601) + 100;
      usuario.dinero += ganancia;
      guardarDB(db);
      return sock.sendMessage(chat, {
        text: marco(elegir(["🕶️ MINIJUEGO", "🏆 RONDA GANADA", "🎲 BUENA JUGADA"]), `${elegir(["¡Te llevaste la victoria!", "¡Esta ronda fue tuya!", "¡La suerte estuvo de tu lado!", "¡Ganaste el desafío!"])}\n\n💰 ${elegir(["Premio", "Ganancia", "Recompensa"])}: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins\n\n⏳ ${elegir(["Vuelve a jugar en 1 minuto.", "Siguiente ronda disponible en 1 minuto.", "Espera 60 segundos para otra ronda."])}`)
      }, { quoted: msg });
    }

    const perdida = Math.min(usuario.dinero, Math.floor(Math.random() * 201) + 50);
    usuario.dinero -= perdida;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco(elegir(["🕶️ MINIJUEGO", "😅 RONDA PERDIDA", "🎲 ESTA VEZ NO"]), `${elegir(["No lograste ganar esta ronda.", "El desafío te ganó esta vez.", "La suerte no te acompañó.", "Esta partida terminó en pérdida."])}\n\n💸 ${elegir(["Penalización", "Pérdida", "Descuento"])}: -${perdida} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins\n\n⏳ ${elegir(["Vuelve a jugar en 1 minuto.", "Otra ronda en 60 segundos.", "Espera un minuto para intentarlo de nuevo."])}`)
    }, { quoted: msg });
  }

  // W: evento aleatorio inspirado en el ejemplo, apto para todos
  if (comando === "w") {
    const ganancia = Math.floor(Math.random() * 2501) + 500;
    usuario.dinero += ganancia;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco(elegir(["🌸 EVENTO W", "🛍️ ENCARGO ESPECIAL", "💐 RECOMPENSA W", "🎀 MISIÓN CUMPLIDA"]), `${elegir(["Te pidieron hacer unas compras y te dieron una propina.", "Ayudaste con un encargo y recibiste un pago.", "Hiciste un favor y llegó una recompensa.", "Completaste una tarea inesperada en el grupo.", "Te confiaron una diligencia y te premiaron."])}\n\n💰 ${elegir(["Ganaste", "Te pagaron", "Recibiste"])}: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
    }, { quoted: msg });
  }

  // SLUT: evento de suerte/carismo, sin contenido sexual
  if (comando === "slut") {
    const ganancia = Math.floor(Math.random() * 5001) + 700;
    usuario.dinero += ganancia;
    guardarDB(db);
    return sock.sendMessage(chat, {
      text: marco(elegir(["🌺 EVENTO SLUT", "✨ ESTRELLA DEL GRUPO", "💎 EVENTO DE FAMA", "🎤 MOMENTO DE GLORIA"]), `${elegir(["Te volviste la sensación del grupo y recibiste un premio.", "Tu carisma consiguió una recompensa inesperada.", "Todos reconocieron tu talento y llegó una propina.", "Tu popularidad subió y recibiste un bonus.", "Brillaste en el evento y te llevaste un premio."])}\n\n💰 ${elegir(["Ganaste", "Premio recibido", "Bonus"])}: +${ganancia} TitanCoins\n💵 Saldo: ${usuario.dinero} TitanCoins`)
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
