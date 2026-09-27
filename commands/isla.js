// =========================================
// 🏝️ TITANBOT - SISTEMA DE ISLA
// =========================================

const fs = require("fs");
const path = require("path");

// =========================================
// 📁 BASE DE DATOS
// =========================================

const databaseDir = path.join(__dirname, "..", "database");
const databasePath = path.join(databaseDir, "islas.json");

// Crear carpeta database si no existe
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

// Crear archivo de islas si no existe
if (!fs.existsSync(databasePath)) {
  fs.writeFileSync(databasePath, JSON.stringify({}, null, 2));
}

// =========================================
// 📖 CARGAR DATOS
// =========================================

function cargarIslas() {
  try {
    const contenido = fs.readFileSync(databasePath, "utf8");

    if (!contenido.trim()) {
      return {};
    }

    return JSON.parse(contenido);
  } catch (error) {
    console.error("❌ Error al cargar islas.json:", error);
    return {};
  }
}

// =========================================
// 💾 GUARDAR DATOS
// =========================================

function guardarIslas(islas) {
  try {
    fs.writeFileSync(
      databasePath,
      JSON.stringify(islas, null, 2)
    );

    return true;
  } catch (error) {
    console.error("❌ Error al guardar islas.json:", error);
    return false;
  }
}

// =========================================
// 🏝️ CREAR ISLA
// =========================================

function crearIsla(id) {
  const islas = cargarIslas();

  if (!islas[id]) {
    islas[id] = {
      nombre: "Isla de " + id.split("@")[0],

      nivel: 1,

      experiencia: 0,

      recursos: {
        madera: 0,
        piedra: 0,
        comida: 0
      },

      construcciones: {
        casa: 0,
        granja: 0,
        puerto: 0
      },

      exploraciones: 0,

      mascota: null
    };

    guardarIslas(islas);
  }

  return islas[id];
}

// =========================================
// 🏝️ COMANDO PRINCIPAL
// =========================================

async function isla(sock, chat, comando, args, id, msg) {

  // -----------------------------------------
  // 🏝️ .isla
  // -----------------------------------------

  if (comando === "isla") {

    const datos = crearIsla(id);

    const texto = `
🏝️ *ISLA DE TITANBOT* 🏝️

🌴 *${datos.nombre}*

⭐ Nivel: ${datos.nivel}
✨ XP: ${datos.experiencia}

🌳 Madera: ${datos.recursos.madera}
🪨 Piedra: ${datos.recursos.piedra}
🍎 Comida: ${datos.recursos.comida}

🏠 Casa: nivel ${datos.construcciones.casa}
🌾 Granja: nivel ${datos.construcciones.granja}
⚓ Puerto: nivel ${datos.construcciones.puerto}

🧭 Exploraciones: ${datos.exploraciones}

━━━━━━━━━━━━━━━━━━━━
🏝️ Usa *.explorar* para explorar.
🏗️ Usa *.construir* para construir.
🎒 Usa *.inventario* para ver tus recursos.
📊 Usa *.islastats* para ver tus estadísticas.
`;

    await sock.sendMessage(chat, {
      text: texto
    });

    return true;
  }

  // -----------------------------------------
  // 🐾 .adoptar
  // -----------------------------------------

  if (comando === "adoptar") {

    const datos = crearIsla(id);

    if (datos.mascota) {
      await sock.sendMessage(chat, {
        text: `🐾 Ya tienes una mascota llamada *${datos.mascota}*.`
      });

      return true;
    }

    datos.mascota = "Tigre";

    const islas = cargarIslas();
    islas[id] = datos;
    guardarIslas(islas);

    await sock.sendMessage(chat, {
      text:
`🐾 *¡MASCOTA ADOPTADA!*

🐯 Has adoptado un *Tigre*.

Ahora forma parte de tu isla 🏝️`
    });

    return true;
  }

  // -----------------------------------------
  // 🧭 .explorar
  // -----------------------------------------

  if (comando === "explorar") {

    const datos = crearIsla(id);

    const madera = Math.floor(Math.random() * 6) + 1;
    const piedra = Math.floor(Math.random() * 5) + 1;
    const comida = Math.floor(Math.random() * 4) + 1;

    datos.recursos.madera += madera;
    datos.recursos.piedra += piedra;
    datos.recursos.comida += comida;

    datos.exploraciones++;
    datos.experiencia += 10;

    const islas = cargarIslas();
    islas[id] = datos;
    guardarIslas(islas);

    await sock.sendMessage(chat, {
      text:
`🧭 *EXPEDICIÓN COMPLETADA*

🌳 Madera: +${madera}
🪨 Piedra: +${piedra}
🍎 Comida: +${comida}

✨ XP: +10

🏝️ ¡Has regresado a tu isla!`
    });

    return true;
  }

  // -----------------------------------------
  // 🏗️ .construir
  // -----------------------------------------

  if (comando === "construir") {

    const datos = crearIsla(id);

    const tipo = args[0]
      ? args[0].toLowerCase()
      : "";

    if (!tipo) {

      await sock.sendMessage(chat, {
        text:
`🏗️ *CONSTRUCCIONES*

Usa:

🏠 *.construir casa*
🌾 *.construir granja*
⚓ *.construir puerto*`
      });

      return true;
    }

    const costos = {
      casa: {
        madera: 10,
        piedra: 5
      },

      granja: {
        madera: 8,
        piedra: 3
      },

      puerto: {
        madera: 15,
        piedra: 10
      }
    };

    if (!costos[tipo]) {

      await sock.sendMessage(chat, {
        text:
`❌ Construcción desconocida.

Opciones:

🏠 casa
🌾 granja
⚓ puerto`
      });

      return true;
    }

    const costo = costos[tipo];

    if (
      datos.recursos.madera < costo.madera ||
      datos.recursos.piedra < costo.piedra
    ) {

      await sock.sendMessage(chat, {
        text:
`❌ *No tienes suficientes recursos.*

Necesitas:

🌳 Madera: ${costo.madera}
🪨 Piedra: ${costo.piedra}

Actualmente tienes:

🌳 Madera: ${datos.recursos.madera}
🪨 Piedra: ${datos.recursos.piedra}

Usa *.explorar* para conseguir más.`
      });

      return true;
    }

    datos.recursos.madera -= costo.madera;
    datos.recursos.piedra -= costo.piedra;

    datos.construcciones[tipo]++;

    datos.experiencia += 20;

    const islas = cargarIslas();
    islas[id] = datos;
    guardarIslas(islas);

    await sock.sendMessage(chat, {
      text:
`🏗️ *¡CONSTRUCCIÓN COMPLETADA!*

🏝️ Has mejorado:

${tipo === "casa" ? "🏠 Casa" : ""}
${tipo === "granja" ? "🌾 Granja" : ""}
${tipo === "puerto" ? "⚓ Puerto" : ""}

⭐ Nivel actual:
${datos.construcciones[tipo]}

✨ XP: +20`
    });

    return true;
  }

  // -----------------------------------------
  // 🎒 .inventario
  // -----------------------------------------

  if (comando === "inventario") {

    const datos = crearIsla(id);

    await sock.sendMessage(chat, {
      text:
`🎒 *INVENTARIO DE LA ISLA*

🌳 Madera: ${datos.recursos.madera}
🪨 Piedra: ${datos.recursos.piedra}
🍎 Comida: ${datos.recursos.comida}

🐾 Mascota:
${datos.mascota || "Ninguna"}`
    });

    return true;
  }

  // -----------------------------------------
  // 📊 .islastats
  // -----------------------------------------

  if (comando === "islastats") {

    const datos = crearIsla(id);

    await sock.sendMessage(chat, {
      text:
`📊 *ESTADÍSTICAS DE TU ISLA*

🏝️ ${datos.nombre}

⭐ Nivel: ${datos.nivel}
✨ Experiencia: ${datos.experiencia}

🧭 Exploraciones:
${datos.exploraciones}

🏠 Casa:
Nivel ${datos.construcciones.casa}

🌾 Granja:
Nivel ${datos.construcciones.granja}

⚓ Puerto:
Nivel ${datos.construcciones.puerto}

🐾 Mascota:
${datos.mascota || "Ninguna"}`
    });

    return true;
  }

  // -----------------------------------------
  // 🏆 .islaranking
  // -----------------------------------------

  if (comando === "islaranking") {

    const islas = cargarIslas();

    const ranking = Object.entries(islas)
      .sort((a, b) => {
        return b[1].experiencia - a[1].experiencia;
      })
      .slice(0, 10);

    if (!ranking.length) {

      await sock.sendMessage(chat, {
        text: "🏆 Todavía no hay islas en el ranking."
      });

      return true;
    }

    let texto = "🏆 *RANKING DE ISLAS* 🏝️\n\n";

    ranking.forEach(([usuario, datos], index) => {

      const puesto = index + 1;

      texto +=
`${puesto}. 🏝️ ${datos.nombre}
   ⭐ Nivel: ${datos.nivel}
   ✨ XP: ${datos.experiencia}

`;
    });

    await sock.sendMessage(chat, {
      text: texto
    });

    return true;
  }

  // -----------------------------------------
  // ❌ NO ES COMANDO DE ISLA
  // -----------------------------------------

  return false;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = isla;
