// commands/mascota.js
// 🐾 TITANBOT - Sistema completo de Mascotas Virtuales
// Compatible con index.js:
// mascotaCommand.ejecutarMascota(sock, chat, comando, args, id, msg)

const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "database");
const DB_FILE = path.join(DB_DIR, "mascotas.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, "{}", "utf8");
}

// ======================================================
// BASE DE DATOS
// ======================================================

function cargarMascotas() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, "{}", "utf8");
    }

    const contenido = fs.readFileSync(DB_FILE, "utf8").trim();
    if (!contenido) return {};

    const data = JSON.parse(contenido);
    return data && typeof data === "object" ? data : {};
  } catch (error) {
    console.error("❌ Error leyendo mascotas.json:", error);
    try {
      fs.writeFileSync(DB_FILE, "{}", "utf8");
    } catch (_) {}
    return {};
  }
}

function guardarMascotas(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("❌ Error guardando mascotas.json:", error);
    return false;
  }
}

// ======================================================
// UTILIDADES
// ======================================================

function limitar(numero, minimo = 0, maximo = 100) {
  const n = Number(numero);
  if (!Number.isFinite(n)) return minimo;
  return Math.max(minimo, Math.min(maximo, n));
}

function normalizarId(id, msg) {
  return (
    id ||
    msg?.key?.participant ||
    msg?.participant ||
    msg?.key?.remoteJid ||
    "usuario"
  );
}

function crearID() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function tipoEmoji(tipo) {
  const emojis = {
    perro: "🐶",
    gato: "🐱",
    zorro: "🦊",
    conejo: "🐰",
    panda: "🐼",
    dragon: "🐉",
    lobo: "🐺",
    unicornio: "🦄"
  };

  return emojis[tipo] || "🐾";
}

function barra(valor) {
  const total = 10;
  const llenos = Math.round((limitar(valor) / 100) * total);
  return "🟩".repeat(llenos) + "⬜".repeat(total - llenos);
}

function experienciaNecesaria(nivel) {
  return Math.max(100, Number(nivel || 1) * 100);
}

function crearMascota(nombre, tipo) {
  return {
    id: crearID(),
    nombre,
    tipo,
    nivel: 1,
    experiencia: 0,
    hambre: 80,
    energia: 80,
    felicidad: 80,
    higiene: 80,
    monedas: 100,
    evolucion: 0,
    inventario: {
      comida: 3,
      juguete: 1,
      jabon: 1
    },
    creada: new Date().toISOString(),
    ultimaActualizacion: new Date().toISOString()
  };
}

function normalizarMascota(pet) {
  if (!pet.inventario) {
    pet.inventario = {};
  }

  pet.inventario.comida = Number(pet.inventario.comida || 0);
  pet.inventario.juguete = Number(pet.inventario.juguete || 0);
  pet.inventario.jabon = Number(pet.inventario.jabon || 0);

  pet.nivel = Number(pet.nivel || 1);
  pet.experiencia = Number(pet.experiencia || 0);
  pet.hambre = limitar(pet.hambre);
  pet.energia = limitar(pet.energia);
  pet.felicidad = limitar(pet.felicidad);
  pet.higiene = limitar(pet.higiene);
  pet.monedas = Number(pet.monedas || 0);
  pet.evolucion = Number(pet.evolucion || 0);

  return pet;
}

function subirNivel(pet) {
  let subio = false;
  let niveles = 0;

  while (pet.experiencia >= experienciaNecesaria(pet.nivel)) {
    pet.experiencia -= experienciaNecesaria(pet.nivel);
    pet.nivel++;
    niveles++;
    subio = true;

    pet.hambre = limitar(pet.hambre + 15);
    pet.energia = limitar(pet.energia + 15);
    pet.felicidad = limitar(pet.felicidad + 15);
    pet.higiene = limitar(pet.higiene + 10);
    pet.monedas += 25;
  }

  return { subio, niveles };
}

function obtenerPet(data, userId) {
  return data[userId] ? normalizarMascota(data[userId]) : null;
}

function actualizarFecha(pet) {
  pet.ultimaActualizacion = new Date().toISOString();
}

async function responder(sock, chat, texto, msg) {
  if (!sock || typeof sock.sendMessage !== "function") {
    console.error("❌ El socket recibido no tiene sendMessage.");
    return false;
  }

  if (!chat) {
    console.error("❌ No se recibió chat para mascota.");
    return false;
  }

  try {
    await sock.sendMessage(
      chat,
      { text: String(texto) },
      msg ? { quoted: msg } : undefined
    );
    return true;
  } catch (error) {
    console.error("❌ Error enviando mensaje de mascota:", error);
    return false;
  }
}

function sinMascota() {
  return `
🐾 *TITANBOT - MASCOTA*

❌ No tienes una mascota todavía.

Usa:

🐣 *.crearmascota Nombre Tipo*

Ejemplo:

*.crearmascota Max perro*

Tipos disponibles:

🐶 perro
🐱 gato
🦊 zorro
🐰 conejo
🐼 panda
🐺 lobo
🐉 dragon
🦄 unicornio
`.trim();
}

const TIPOS = [
  "perro",
  "gato",
  "zorro",
  "conejo",
  "panda",
  "dragon",
  "lobo",
  "unicornio"
];

// ======================================================
// 1. .mascota
// ======================================================

async function comandoMascota(sock, chat, args, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) {
    return responder(sock, chat, sinMascota(), msg);
  }

  actualizarFecha(pet);
  guardarMascotas(data);

  const xpNecesaria = experienciaNecesaria(pet.nivel);

  return responder(
    sock,
    chat,
    `
╔══════════════════════╗
       🐾 *MI MASCOTA*
╚══════════════════════╝

${tipoEmoji(pet.tipo)} *${pet.nombre}*

🐾 Tipo: ${pet.tipo}
⭐ Nivel: ${pet.nivel}
✨ XP: ${pet.experiencia}/${xpNecesaria}
💰 Monedas: ${pet.monedas}

🍖 Hambre
${barra(pet.hambre)} ${pet.hambre}/100

⚡ Energía
${barra(pet.energia)} ${pet.energia}/100

❤️ Felicidad
${barra(pet.felicidad)} ${pet.felicidad}/100

🧼 Higiene
${barra(pet.higiene)} ${pet.higiene}/100

🔄 Evolución: ${pet.evolucion}

━━━━━━━━━━━━━━━━━━━━
🐾 *COMANDOS*

🐣 .crearmascota
🍖 .alimentar
🎮 .jugar
🛁 .bañar
😴 .dormir
📊 .estado
✨ .evolucionar
🛒 .tienda
🛍️ .comprar
🎒 .inventario
🎁 .regalar
💰 .trabajar
🗑️ .eliminarmascota
`.trim(),
    msg
  );
}

// ======================================================
// 2. .crearmascota
// ======================================================

async function crearMascotaCommand(sock, chat, args, userId, msg) {
  const data = cargarMascotas();

  if (data[userId]) {
    const pet = normalizarMascota(data[userId]);

    return responder(
      sock,
      chat,
      `
🐾 *YA TIENES UNA MASCOTA*

${tipoEmoji(pet.tipo)} *${pet.nombre}*
🐾 Tipo: ${pet.tipo}
⭐ Nivel: ${pet.nivel}

Usa *.mascota* para verla.
`.trim(),
      msg
    );
  }

  if (!args || args.length < 2) {
    return responder(
      sock,
      chat,
      `
🐣 *CREAR MASCOTA*

Uso:
*.crearmascota Nombre Tipo*

Ejemplos:
*.crearmascota Max perro*
*.crearmascota Luna gato*
*.crearmascota Rex dragon*

Tipos:
${TIPOS.map(t => `${tipoEmoji(t)} ${t}`).join("\n")}
`.trim(),
      msg
    );
  }

  const nombre = String(args[0]).trim().slice(0, 20);
  const tipo = String(args[1]).toLowerCase().trim();

  if (nombre.length < 2) {
    return responder(
      sock,
      chat,
      "❌ El nombre debe tener entre 2 y 20 caracteres.",
      msg
    );
  }

  if (!TIPOS.includes(tipo)) {
    return responder(
      sock,
      chat,
      `❌ Tipo inválido.\n\nTipos disponibles:\n${TIPOS.join(", ")}`,
      msg
    );
  }

  data[userId] = crearMascota(nombre, tipo);

  if (!guardarMascotas(data)) {
    return responder(sock, chat, "❌ No se pudo guardar tu mascota.", msg);
  }

  return responder(
    sock,
    chat,
    `
╔══════════════════════╗
      🐣 *MASCOTA CREADA*
╚══════════════════════╝

${tipoEmoji(tipo)} *${nombre}*

🎉 ¡Felicidades!

⭐ Nivel: 1
🍖 Hambre: 80/100
⚡ Energía: 80/100
❤️ Felicidad: 80/100
🧼 Higiene: 80/100
💰 Monedas: 100

Usa *.mascota* para verla.
`.trim(),
    msg
  );
}

// ======================================================
// 3. .alimentar
// ======================================================

async function alimentar(sock, chat, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  if (pet.inventario.comida <= 0) {
    return responder(
      sock,
      chat,
      `🍖 *SIN COMIDA*\n\nCompra más en *.tienda* y usa *.comprar comida*.`,
      msg
    );
  }

  pet.inventario.comida--;
  pet.hambre = limitar(pet.hambre + 30);
  pet.felicidad = limitar(pet.felicidad + 5);
  pet.experiencia += 10;

  const nivel = subirNivel(pet);
  actualizarFecha(pet);
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `
🍖 *${pet.nombre} HA COMIDO*

🍖 Hambre: ${pet.hambre}/100
❤️ Felicidad: ${pet.felicidad}/100
🍖 Comida restante: ${pet.inventario.comida}
✨ XP: +10
${nivel.subio ? `🎉 ¡Subió ${nivel.niveles} nivel(es)! Ahora es nivel ${pet.nivel}.\n💰 Bono: +${nivel.niveles * 25} monedas.` : ""}
`.trim(),
    msg
  );
}

// ======================================================
// 4. .jugar
// ======================================================

async function jugar(sock, chat, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  if (pet.energia < 15) {
    return responder(
      sock,
      chat,
      `😴 *${pet.nombre} está cansado.*\n\nUsa *.dormir* antes de jugar.`,
      msg
    );
  }

  if (pet.inventario.juguete <= 0) {
    return responder(
      sock,
      chat,
      `🎮 *NO TIENES JUGUETES*\n\nCompra uno en *.tienda* con *.comprar juguete*.`,
      msg
    );
  }

  pet.inventario.juguete--;
  pet.energia = limitar(pet.energia - 15);
  pet.felicidad = limitar(pet.felicidad + 30);
  pet.hambre = limitar(pet.hambre - 5);
  pet.experiencia += 20;

  const nivel = subirNivel(pet);
  actualizarFecha(pet);
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `
🎮 *¡HORA DE JUGAR!*

${tipoEmoji(pet.tipo)} ${pet.nombre} se divirtió muchísimo.

❤️ Felicidad: ${pet.felicidad}/100
⚡ Energía: ${pet.energia}/100
✨ XP: +20
🎮 Juguetes restantes: ${pet.inventario.juguete}
${nivel.subio ? `\n🎉 ¡Subió al nivel ${pet.nivel}!` : ""}
`.trim(),
    msg
  );
}

// ======================================================
// 5. .bañar
// ======================================================

async function banar(sock, chat, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  if (pet.inventario.jabon <= 0) {
    return responder(
      sock,
      chat,
      `🧼 *NO TIENES JABÓN*\n\nCompra uno en *.tienda* con *.comprar jabon*.`,
      msg
    );
  }

  pet.inventario.jabon--;
  pet.higiene = limitar(pet.higiene + 40);
  pet.felicidad = limitar(pet.felicidad + 5);
  pet.experiencia += 10;

  const nivel = subirNivel(pet);
  actualizarFecha(pet);
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `
🛁 *${pet.nombre} ESTÁ LIMPIO/A*

🧼 Higiene: ${pet.higiene}/100
❤️ Felicidad: ${pet.felicidad}/100
✨ XP: +10
🧼 Jabón restante: ${pet.inventario.jabon}
${nivel.subio ? `🎉 ¡Subió al nivel ${pet.nivel}!` : ""}
`.trim(),
    msg
  );
}

// ======================================================
// 6. .dormir
// ======================================================

async function dormir(sock, chat, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  pet.energia = 100;
  pet.hambre = limitar(pet.hambre - 10);
  pet.experiencia += 5;

  const nivel = subirNivel(pet);
  actualizarFecha(pet);
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `
😴 *${pet.nombre} HA DORMIDO*

⚡ Energía: 100/100
🍖 Hambre: ${pet.hambre}/100
✨ XP: +5
${nivel.subio ? `🎉 ¡Subió al nivel ${pet.nivel}!` : ""}

🐾 ¡Ya está listo para continuar!
`.trim(),
    msg
  );
}

// ======================================================
// 7. .estado
// ======================================================

async function estado(sock, chat, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  return responder(
    sock,
    chat,
    `
╔══════════════════════╗
       📊 *ESTADO*
╚══════════════════════╝

${tipoEmoji(pet.tipo)} *${pet.nombre}*

🐾 Tipo: ${pet.tipo}
⭐ Nivel: ${pet.nivel}
✨ XP: ${pet.experiencia}/${experienciaNecesaria(pet.nivel)}

🍖 Hambre
${barra(pet.hambre)} ${pet.hambre}/100

⚡ Energía
${barra(pet.energia)} ${pet.energia}/100

❤️ Felicidad
${barra(pet.felicidad)} ${pet.felicidad}/100

🧼 Higiene
${barra(pet.higiene)} ${pet.higiene}/100

💰 Monedas: ${pet.monedas}
🔄 Evolución: ${pet.evolucion}
`.trim(),
    msg
  );
}

// ======================================================
// 8. .evolucionar
// ======================================================

async function evolucionar(sock, chat, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  if (pet.nivel < 5) {
    return responder(
      sock,
      chat,
      `
✨ *EVOLUCIÓN*

${pet.nombre} todavía no puede evolucionar.

⭐ Nivel actual: ${pet.nivel}
⭐ Nivel necesario: 5
`.trim(),
      msg
    );
  }

  if (pet.evolucion >= 3) {
    return responder(
      sock,
      chat,
      `✨ ${pet.nombre} ya alcanzó la evolución máxima.`,
      msg
    );
  }

  pet.evolucion++;
  pet.hambre = 100;
  pet.energia = 100;
  pet.felicidad = 100;
  pet.higiene = 100;

  actualizarFecha(pet);
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `
╔══════════════════════╗
       ✨ *EVOLUCIÓN*
╚══════════════════════╝

🎉 ¡${pet.nombre} ha evolucionado!

${tipoEmoji(pet.tipo)} *${pet.nombre}*

⭐ Nivel: ${pet.nivel}
🔄 Evolución: ${pet.evolucion}

❤️ Felicidad: 100
🍖 Hambre: 100
⚡ Energía: 100
🧼 Higiene: 100

🐾 ¡Tu mascota está en una nueva etapa!
`.trim(),
    msg
  );
}

// ======================================================
// 9. .tienda
// ======================================================

async function tienda(sock, chat, msg) {
  return responder(
    sock,
    chat,
    `
╔══════════════════════╗
       🛒 *TIENDA*
╚══════════════════════╝

🍖 Comida — 20 monedas
🎮 Juguete — 30 monedas
🧼 Jabón — 25 monedas

━━━━━━━━━━━━━━━━━━━━

Comprar:
*.comprar comida*
*.comprar juguete*
*.comprar jabon*
`.trim(),
    msg
  );
}

// ======================================================
// 10. .comprar
// ======================================================

async function comprar(sock, chat, args, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  const producto = String(args?.[0] || "").toLowerCase();

  const productos = {
    comida: { precio: 20, campo: "comida", emoji: "🍖" },
    juguete: { precio: 30, campo: "juguete", emoji: "🎮" },
    jabon: { precio: 25, campo: "jabon", emoji: "🧼" }
  };

  if (!producto || !productos[producto]) {
    return responder(
      sock,
      chat,
      `🛒 Uso:\n\n*.comprar comida*\n*.comprar juguete*\n*.comprar jabon*`,
      msg
    );
  }

  const item = productos[producto];

  if (pet.monedas < item.precio) {
    return responder(
      sock,
      chat,
      `❌ No tienes suficientes monedas.\n\n💰 Tienes: ${pet.monedas}\n💵 Necesitas: ${item.precio}`,
      msg
    );
  }

  pet.monedas -= item.precio;
  pet.inventario[item.campo]++;

  actualizarFecha(pet);
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `
🛒 *COMPRA REALIZADA*

${item.emoji} Producto: ${producto}
💵 Precio: ${item.precio}
💰 Monedas restantes: ${pet.monedas}
🎒 Cantidad: ${pet.inventario[item.campo]}
`.trim(),
    msg
  );
}

// ======================================================
// 11. .inventario
// ======================================================

async function inventario(sock, chat, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  return responder(
    sock,
    chat,
    `
╔══════════════════════╗
       🎒 *INVENTARIO*
╚══════════════════════╝

${tipoEmoji(pet.tipo)} *${pet.nombre}*

🍖 Comida: ${pet.inventario.comida}
🎮 Juguetes: ${pet.inventario.juguete}
🧼 Jabón: ${pet.inventario.jabon}

💰 Monedas: ${pet.monedas}

🛒 Usa *.tienda* para comprar más.
`.trim(),
    msg
  );
}

// ======================================================
// 12. .regalar
// ======================================================

async function regalar(sock, chat, args, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  const cantidad = Number(args?.[0] || 10);

  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100) {
    return responder(
      sock,
      chat,
      "🎁 La cantidad debe ser un número entre 1 y 100.",
      msg
    );
  }

  if (pet.monedas < cantidad) {
    return responder(
      sock,
      chat,
      `❌ No tienes suficientes monedas.\n\n💰 Tienes: ${pet.monedas}`,
      msg
    );
  }

  pet.monedas -= cantidad;
  pet.felicidad = limitar(pet.felicidad + Math.min(30, cantidad));
  pet.experiencia += Math.min(30, cantidad);

  const nivel = subirNivel(pet);
  actualizarFecha(pet);
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `
🎁 *REGALO PARA ${pet.nombre.toUpperCase()}*

💰 Gastaste: ${cantidad} monedas
❤️ Felicidad: ${pet.felicidad}/100
✨ XP: +${Math.min(30, cantidad)}
💰 Monedas restantes: ${pet.monedas}
${nivel.subio ? `🎉 ¡Subió al nivel ${pet.nivel}!` : ""}
`.trim(),
    msg
  );
}

// ======================================================
// 13. .trabajar
// ======================================================

async function trabajar(sock, chat, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  if (pet.energia < 20) {
    return responder(
      sock,
      chat,
      `😴 ${pet.nombre} necesita descansar.\n\nUsa *.dormir*.`,
      msg
    );
  }

  const ganancia = 20 + Math.floor(Math.random() * 31);

  pet.monedas += ganancia;
  pet.energia = limitar(pet.energia - 20);
  pet.hambre = limitar(pet.hambre - 10);
  pet.experiencia += 15;

  const nivel = subirNivel(pet);
  actualizarFecha(pet);
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `
💰 *${pet.nombre} TRABAJÓ*

💵 Ganaste: +${ganancia} monedas
💰 Total: ${pet.monedas}
⚡ Energía: ${pet.energia}/100
🍖 Hambre: ${pet.hambre}/100
✨ XP: +15
${nivel.subio ? `🎉 ¡Subió al nivel ${pet.nivel}!` : ""}
`.trim(),
    msg
  );
}

// ======================================================
// EXTRA: .eliminarmascota
// ======================================================

async function eliminarMascota(sock, chat, args, userId, msg) {
  const data = cargarMascotas();
  const pet = obtenerPet(data, userId);

  if (!pet) return responder(sock, chat, sinMascota(), msg);

  if (String(args?.[0] || "").toLowerCase() !== "confirmar") {
    return responder(
      sock,
      chat,
      `⚠️ Esto eliminará permanentemente a *${pet.nombre}*.\n\nSi realmente quieres hacerlo usa:\n*.eliminarmascota confirmar*`,
      msg
    );
  }

  delete data[userId];
  guardarMascotas(data);

  return responder(
    sock,
    chat,
    `🗑️ La mascota *${pet.nombre}* ha sido eliminada.`,
    msg
  );
}

// ======================================================
// DISPATCHER
// ======================================================

async function ejecutarMascota(sock, chat, comando, args = [], id, msg) {
  // Validación importante para evitar el error:
  // "sock.sendMessage is not a function"
  if (!sock || typeof sock.sendMessage !== "function") {
    console.error("❌ ejecutarMascota recibió un socket inválido.");
    return false;
  }

  const userId = id || msg?.key?.participant || msg?.key?.remoteJid;

  if (!userId) {
    console.error("❌ No se pudo determinar el ID del usuario.");
    return false;
  }

  const cmd = String(comando || "").toLowerCase().replace(/^\./, "");

  switch (cmd) {
    case "mascota":
    case "mimascota":
    case "pet":
      await comandoMascota(sock, chat, args, userId, msg);
      return true;

    case "crearmascota":
    case "crearp mascota":
    case "adoptar":
      await crearMascotaCommand(sock, chat, args, userId, msg);
      return true;

    case "alimentar":
    case "comida":
    case "feed":
      await alimentar(sock, chat, userId, msg);
      return true;

    case "jugar":
    case "juego":
    case "play":
      await jugar(sock, chat, userId, msg);
      return true;

    case "bañar":
    case "banar":
    case "bano":
    case "baño":
      await banar(sock, chat, userId, msg);
      return true;

    case "dormir":
    case "descansar":
      await dormir(sock, chat, userId, msg);
      return true;

    case "estado":
    case "estadomascota":
      await estado(sock, chat, userId, msg);
      return true;

    case "evolucionar":
    case "evolución":
    case "evolucion":
      await evolucionar(sock, chat, userId, msg);
      return true;

    case "tienda":
    case "pettienda":
      await tienda(sock, chat, msg);
      return true;

    case "comprar":
      await comprar(sock, chat, args, userId, msg);
      return true;

    case "inventario":
    case "inv":
      await inventario(sock, chat, userId, msg);
      return true;

    case "regalar":
    case "regalo":
      await regalar(sock, chat, args, userId, msg);
      return true;

    case "trabajar":
    case "trabajo":
      await trabajar(sock, chat, userId, msg);
      return true;

    case "eliminarmascota":
      await eliminarMascota(sock, chat, args, userId, msg);
      return true;

    default:
      return false;
  }
}

module.exports = {
  ejecutarMascota,
  mascota: comandoMascota,
  crearmascota: crearMascotaCommand,
  alimentar,
  jugar,
  banar,
  dormir,
  estado,
  evolucionar,
  tienda,
  comprar,
  inventario,
  regalar,
  trabajar,
  eliminarmascota: eliminarMascota
};
