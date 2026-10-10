
const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../../database/users.json");

// ========================================
// BASE DE DATOS
// ========================================

function cargarUsuarios() {
  if (!fs.existsSync(DB)) {
    fs.mkdirSync(path.dirname(DB), { recursive: true });
    fs.writeFileSync(DB, "{}");
  }

  try {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch (error) {
    console.log("Error leyendo users.json:", error);
    return {};
  }
}

function guardarUsuarios(db) {
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

function crearUsuario() {
  return {
    nombre: "Usuario",
    registrado: false,
    edad: null,
    cumpleanos: null,
    xp: 0,
    nivel: 1,
    dinero: 500,
    banco: 0,
    inventario: {}
  };
}

function obtenerUsuario(id) {
  const db = cargarUsuarios();

  if (!db[id]) {
    db[id] = crearUsuario();
    guardarUsuarios(db);
  }

  // Compatibilidad con usuarios antiguos
  const user = db[id];
  if (user.edad === undefined) user.edad = null;
  if (user.cumpleanos === undefined) user.cumpleanos = null;
  if (user.xp === undefined) user.xp = 0;
  if (user.nivel === undefined) user.nivel = 1;
  if (user.dinero === undefined) user.dinero = 500;
  if (user.banco === undefined) user.banco = 0;
  if (!user.inventario) user.inventario = {};

  guardarUsuarios(db);
  return user;
}

// ========================================
// GANAR XP
// ========================================

function ganarXP(id) {
  const db = cargarUsuarios();

  if (!db[id]) db[id] = crearUsuario();

  const user = db[id];
  const xpGanada = Math.floor(Math.random() * 11) + 5;

  user.xp += xpGanada;

  let nivelesSubidos = 0;
  let recompensaTotal = 0;

  while (user.xp >= user.nivel * 100) {
    user.xp -= user.nivel * 100;
    user.nivel++;
    nivelesSubidos++;

    const recompensa = user.nivel * 250;
    user.dinero += recompensa;
    recompensaTotal += recompensa;
  }

  guardarUsuarios(db);

  return {
    xpGanada,
    subioNivel: nivelesSubidos > 0,
    nivelesSubidos,
    recompensaTotal,
    nivel: user.nivel,
    xp: user.xp
  };
}

// ========================================
// COMANDOS DE USUARIO
// ========================================

async function usuario(sock, chat, comando, args, id) {
  const db = cargarUsuarios();

  if (!db[id]) db[id] = crearUsuario();

  const user = db[id];

  if (user.edad === undefined) user.edad = null;
  if (user.cumpleanos === undefined) user.cumpleanos = null;
  if (user.xp === undefined) user.xp = 0;
  if (user.nivel === undefined) user.nivel = 1;
  if (user.dinero === undefined) user.dinero = 500;
  if (user.banco === undefined) user.banco = 0;
  if (!user.inventario) user.inventario = {};

  // ========================================
  // REGISTRAR
  // Formato: .registrar Nombre|Edad|DD/MM
  // ========================================

  if (comando === "registrar") {
    if (user.registrado) {
      await sock.sendMessage(chat, {
        text: `✅ Ya estás registrado.

👤 Nombre: ${user.nombre}
🎂 Edad: ${user.edad ?? "Sin registrar"}
🎉 Cumpleaños: ${user.cumpleanos ?? "Sin registrar"}
⭐ Nivel: ${user.nivel}`
      });
      return true;
    }

    const datos = (args || []).join(" ").split("|").map(x => x.trim());

    if (datos.length !== 3 || !datos[0] || !datos[1] || !datos[2]) {
      await sock.sendMessage(chat, {
        text: `📝 REGISTRO TITANBOT

Usa este formato:
.registrar Nombre|Edad|DD/MM

Ejemplo:
.registrar Aoi Mizuno|16|15/08`
      });
      return true;
    }

    const nombre = datos[0];
    const edad = Number(datos[1]);
    const cumpleanos = datos[2];

    if (!Number.isInteger(edad) || edad < 1 || edad > 120) {
      await sock.sendMessage(chat, {
        text: "❌ La edad debe ser un número válido entre 1 y 120."
      });
      return true;
    }

    const fecha = cumpleanos.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!fecha) {
      await sock.sendMessage(chat, {
        text: "❌ Escribe el cumpleaños en formato DD/MM, por ejemplo 15/08."
      });
      return true;
    }

    const dia = Number(fecha[1]);
    const mes = Number(fecha[2]);
    const diasMes = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (mes < 1 || mes > 12 || dia < 1 || dia > diasMes[mes - 1]) {
      await sock.sendMessage(chat, {
        text: "❌ Esa fecha de cumpleaños no es válida."
      });
      return true;
    }

    user.nombre = nombre;
    user.edad = edad;
    user.cumpleanos = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`;
    user.registrado = true;
    user.dinero += 500;

    guardarUsuarios(db);

    await sock.sendMessage(chat, {
      text: `🎉 REGISTRO COMPLETADO

👤 Nombre: ${user.nombre}
🎂 Edad: ${user.edad} años
🎉 Cumpleaños: ${user.cumpleanos}

🎁 Recompensa:
+500 TitanCoins

⭐ Nivel: ${user.nivel}

¡Bienvenido a TitanBot! ⚡`
    });

    return true;
  }

  // ========================================
  // PERFIL CON FOTO DE WHATSAPP
  // ========================================

  if (comando === "perfil") {
    const texto = `👤 PERFIL TITANBOT ⚡

📛 Nombre: ${user.nombre}
🎂 Edad: ${user.edad ?? "Sin registrar"}
🎉 Cumpleaños: ${user.cumpleanos ?? "Sin registrar"}

⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}/${user.nivel * 100}

💰 TitanCoins: ${user.dinero}
🏦 Banco: ${user.banco}`;

    guardarUsuarios(db);

    try {
      const foto = await sock.profilePictureUrl(id, "image");

      await sock.sendMessage(chat, {
        image: { url: foto },
        caption: texto
      });
    } catch (error) {
      // Si WhatsApp no permite obtener la foto,
      // mostrar igualmente todos los datos.
      await sock.sendMessage(chat, { text: texto });
    }

    return true;
  }

  // ========================================
  // NIVEL
  // ========================================

  if (comando === "nivel") {
    const necesario = user.nivel * 100;
    const falta = Math.max(0, necesario - user.xp);

    await sock.sendMessage(chat, {
      text: `⭐ NIVEL TITAN

👤 ${user.nombre}
🏆 Nivel: ${user.nivel}
✨ XP: ${user.xp}/${necesario}
📈 Falta: ${falta} XP`
    });

    return true;
  }

  // ========================================
  // XP
  // ========================================

  if (comando === "xp") {
    await sock.sendMessage(chat, {
      text: `✨ EXPERIENCIA

👤 ${user.nombre}
⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}/${user.nivel * 100}`
    });

    return true;
  }

  // ========================================
  // RANK
  // ========================================

  if (comando === "rank") {
    const usuarios = Object.entries(db);

    usuarios.sort((a, b) =>
      b[1].nivel - a[1].nivel || b[1].xp - a[1].xp
    );

    const posicion = usuarios.findIndex(([uid]) => uid === id) + 1;

    await sock.sendMessage(chat, {
      text: `🏆 TU RANK

👤 ${user.nombre}
📊 Posición: #${posicion}
⭐ Nivel: ${user.nivel}
✨ XP: ${user.xp}`
    });

    return true;
  }

  // ========================================
  // TOP
  // ========================================

  if (comando === "top") {
    const usuarios = Object.entries(db);

    usuarios.sort((a, b) =>
      b[1].nivel - a[1].nivel || b[1].xp - a[1].xp
    );

    let texto = "🏆 TOP TITANBOT\n\n";

    usuarios.slice(0, 10).forEach(([uid, datos], index) => {
      texto += `#${index + 1} 👤 ${datos.nombre}
⭐ Nivel: ${datos.nivel}
✨ XP: ${datos.xp}

`;
    });

    await sock.sendMessage(chat, { text: texto });
    return true;
  }

  return false;
}

module.exports = usuario;
module.exports.usuario = usuario;
module.exports.obtenerUsuario = obtenerUsuario;
module.exports.cargarUsuarios = cargarUsuarios;
module.exports.guardarUsuarios = guardarUsuarios;
module.exports.ganarXP = ganarXP;
