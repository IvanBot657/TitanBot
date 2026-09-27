// =========================================
// 🏝️ TITANBOT - SISTEMA DE ISLAS
// =========================================

const fs = require("fs");
const path = require("path");

const islasPath = path.join(__dirname, "..", "database", "islas.json");
const usuariosPath = path.join(__dirname, "..", "database", "usuarios_isla.json");

const databaseDir = path.join(__dirname, "..", "database");

// =========================================
// 🌐 URL DE LA WEB
// =========================================

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL ||
  "https://titanbot-mijc.onrender.com";

// =========================================
// 📁 CREAR DATABASE
// =========================================

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

// =========================================
// 📖 CARGAR JSON
// =========================================

function cargarJSON(ruta, defecto) {
  try {
    if (!fs.existsSync(ruta)) {
      fs.writeFileSync(
        ruta,
        JSON.stringify(defecto, null, 2)
      );

      return defecto;
    }

    const contenido = fs.readFileSync(
      ruta,
      "utf8"
    );

    if (!contenido.trim()) {
      return defecto;
    }

    return JSON.parse(contenido);

  } catch (error) {

    console.error(
      "❌ Error leyendo:",
      ruta,
      error
    );

    return defecto;
  }
}

// =========================================
// 💾 GUARDAR JSON
// =========================================

function guardarJSON(ruta, datos) {
  try {

    fs.writeFileSync(
      ruta,
      JSON.stringify(datos, null, 2)
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Error guardando:",
      ruta,
      error
    );

    return false;
  }
}

// =========================================
// 🏝️ ISLAS
// =========================================

const ISLAS_POR_DEFECTO = [

  {
    id: "aurora",

    nombre: "Isla Aurora",

    descripcion:
      "Una isla tranquila con playas luminosas, palmeras y noches llenas de estrellas.",

    clima: "Cálido y despejado",

    ambiente: "Relajado y mágico",

    color: "#6c63ff",

    icono: "🌅",

    actividades: [
      "Explorar la playa",
      "Ver el atardecer",
      "Observar estrellas"
    ]
  },

  {
    id: "cristal",

    nombre: "Isla Cristal",

    descripcion:
      "Famosa por sus aguas transparentes y pequeñas cuevas junto a la costa.",

    clima: "Tropical",

    ambiente: "Aventura y exploración",

    color: "#00bcd4",

    icono: "💎",

    actividades: [
      "Explorar cuevas",
      "Nadar",
      "Buscar tesoros"
    ]
  },

  {
    id: "bosque",

    nombre: "Isla Bosque",

    descripcion:
      "Una isla cubierta de vegetación, senderos y zonas naturales para descubrir.",

    clima: "Húmedo y fresco",

    ambiente: "Natural y misterioso",

    color: "#43a047",

    icono: "🌿",

    actividades: [
      "Caminar por senderos",
      "Explorar la selva",
      "Descubrir animales"
    ]
  }

];

// =========================================
// 📖 CARGAR ISLAS
// =========================================

function cargarIslas() {

  const islas = cargarJSON(
    islasPath,
    ISLAS_POR_DEFECTO
  );

  if (
    !Array.isArray(islas) ||
    !islas.length
  ) {

    guardarJSON(
      islasPath,
      ISLAS_POR_DEFECTO
    );

    return ISLAS_POR_DEFECTO;
  }

  return islas;
}

// =========================================
// 👤 USUARIOS
// =========================================

function cargarUsuarios() {
  return cargarJSON(
    usuariosPath,
    {}
  );
}

function guardarUsuarios(usuarios) {
  guardarJSON(
    usuariosPath,
    usuarios
  );
}

// =========================================
// 🏝️ CREAR PERFIL
// =========================================

function crearPerfil(id) {

  const usuarios = cargarUsuarios();

  if (!usuarios[id]) {

    usuarios[id] = {

      isla: null,

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

      exploraciones: 0
    };

    guardarUsuarios(usuarios);
  }

  return usuarios[id];
}

// =========================================
// 🏝️ COMANDO ISLA
// =========================================

async function isla(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  if (
    ![
      "isla",
      "adoptar",
      "explorar",
      "construir",
      "inventario",
      "islastats",
      "islaranking"
    ].includes(comando)
  ) {

    return false;
  }

  const islas = cargarIslas();
  const usuarios = cargarUsuarios();

  // =======================================
  // 🏝️ .ISLA
  // =======================================

  if (comando === "isla") {

    const perfil = crearPerfil(id);

    // =====================================
    // 🏝️ SELECCIONAR ISLA
    // =====================================

    if (args[0]) {

      const opcion =
        args[0].toLowerCase();

      let islaElegida =
        islas.find(
          isla =>
            isla.id.toLowerCase() === opcion ||
            isla.nombre
              .toLowerCase()
              .includes(opcion)
        );

      // .isla 1 / 2 / 3

      if (
        !islaElegida &&
        ["1", "2", "3"].includes(opcion)
      ) {

        const posicion =
          Number(opcion) - 1;

        if (islas[posicion]) {
          islaElegida =
            islas[posicion];
        }
      }

      if (!islaElegida) {

        await sock.sendMessage(
          chat,
          {
            text:
`❌ *No encontré esa isla.*

Puedes elegir:

🌅 *.isla aurora*
💎 *.isla cristal*
🌿 *.isla bosque*`
          }
        );

        return true;
      }

      usuarios[id].isla =
        islaElegida.id;

      guardarUsuarios(
        usuarios
      );

      // =====================================
      // 🌐 ENLACE PERSONALIZADO
      // =====================================

      const enlaceWeb =
        `${BASE_URL}/isla?id=${encodeURIComponent(id)}`;

      await sock.sendMessage(
        chat,
        {
          text:
`🏝️ *¡ISLA SELECCIONADA!*

${islaElegida.icono} *${islaElegida.nombre}*

${islaElegida.descripcion}

🌤️ Clima: ${islaElegida.clima}
✨ Ambiente: ${islaElegida.ambiente}

🎯 *Actividades:*
• ${islaElegida.actividades.join("\n• ")}

━━━━━━━━━━━━━━━━━━━━
🏝️ Esta es ahora tu isla.

🌐 *VISITA TU ISLA*
${enlaceWeb}

⚡ Allí podrás ver tu progreso y estadísticas.`
        }
      );

      return true;
    }

    // =====================================
    // 🏝️ YA TIENE ISLA
    // =====================================

    if (perfil.isla) {

      const actual =
        islas.find(
          isla =>
            isla.id === perfil.isla
        );

      if (actual) {

        const enlaceWeb =
          `${BASE_URL}/isla?id=${encodeURIComponent(id)}`;

        await sock.sendMessage(
          chat,
          {
            text:
`${actual.icono} *${actual.nombre}*

${actual.descripcion}

🌤️ Clima: ${actual.clima}
✨ Ambiente: ${actual.ambiente}

🏝️ Ya tienes esta isla seleccionada.

🌐 *Ver mi isla:*
${enlaceWeb}

Para cambiarla:

🌅 *.isla aurora*
💎 *.isla cristal*
🌿 *.isla bosque*`
          }
        );

        return true;
      }
    }

    // =====================================
    // 🏝️ MOSTRAR ISLAS
    // =====================================

    await sock.sendMessage(
      chat,
      {
        text:
`🏝️ *ISLAS DISPONIBLES* 🏝️

🌅 *1. Isla Aurora*
Una isla tranquila con playas luminosas.

💎 *2. Isla Cristal*
Aguas transparentes y cuevas misteriosas.

🌿 *3. Isla Bosque*
Una isla llena de naturaleza y secretos.

━━━━━━━━━━━━━━━━━━━━

Para elegir una:

🌅 *.isla aurora*
💎 *.isla cristal*
🌿 *.isla bosque*

También puedes usar:

*.isla 1*
*.isla 2*
*.isla 3*`
      }
    );

    return true;
  }

  // =======================================
  // 🐾 ADOPTAR
  // =======================================

  if (comando === "adoptar") {

    const perfil =
      crearPerfil(id);

    if (!perfil.isla) {

      await sock.sendMessage(
        chat,
        {
          text:
`🏝️ Primero debes elegir una isla.

Usa:
*.isla*`
        }
      );

      return true;
    }

    if (perfil.mascota) {

      await sock.sendMessage(
        chat,
        {
          text:
`🐾 Ya tienes una mascota: *${perfil.mascota}*`
        }
      );

      return true;
    }

    perfil.mascota =
      "Tigre";

    usuarios[id] =
      perfil;

    guardarUsuarios(
      usuarios
    );

    await sock.sendMessage(
      chat,
      {
        text:
`🐾 *¡MASCOTA ADOPTADA!*

🐯 Has adoptado un Tigre.

Ahora forma parte de tu isla 🏝️`
      }
    );

    return true;
  }

  // =======================================
  // 🧭 EXPLORAR
  // =======================================

  if (comando === "explorar") {

    const perfil =
      crearPerfil(id);

    if (!perfil.isla) {

      await sock.sendMessage(
        chat,
        {
          text:
`🏝️ Primero elige una isla.

Usa:
*.isla*`
        }
      );

      return true;
    }

    const madera =
      Math.floor(
        Math.random() * 6
      ) + 1;

    const piedra =
      Math.floor(
        Math.random() * 5
      ) + 1;

    const comida =
      Math.floor(
        Math.random() * 4
      ) + 1;

    perfil.recursos.madera +=
      madera;

    perfil.recursos.piedra +=
      piedra;

    perfil.recursos.comida +=
      comida;

    perfil.exploraciones++;

    perfil.experiencia +=
      10;

    usuarios[id] =
      perfil;

    guardarUsuarios(
      usuarios
    );

    await sock.sendMessage(
      chat,
      {
        text:
`🧭 *EXPEDICIÓN COMPLETADA*

🌳 Madera: +${madera}
🪨 Piedra: +${piedra}
🍎 Comida: +${comida}

✨ XP: +10

🏝️ ¡Has regresado a tu isla!`
      }
    );

    return true;
  }

  // =======================================
  // 🏗️ CONSTRUIR
  // =======================================

  if (comando === "construir") {

    const perfil =
      crearPerfil(id);

    if (!perfil.isla) {

      await sock.sendMessage(
        chat,
        {
          text:
`🏝️ Primero elige una isla.

Usa:
*.isla*`
        }
      );

      return true;
    }

    const tipo =
      args[0]
        ? args[0].toLowerCase()
        : "";

    if (!tipo) {

      await sock.sendMessage(
        chat,
        {
          text:
`🏗️ *CONSTRUCCIONES*

🏠 *.construir casa*
🌾 *.construir granja*
⚓ *.construir puerto*`
        }
      );

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

      await sock.sendMessage(
        chat,
        {
          text:
`❌ Construcción desconocida.

Puedes construir:

🏠 casa
🌾 granja
⚓ puerto`
        }
      );

      return true;
    }

    const costo =
      costos[tipo];

    if (
      perfil.recursos.madera <
        costo.madera ||
      perfil.recursos.piedra <
        costo.piedra
    ) {

      await sock.sendMessage(
        chat,
        {
          text:
`❌ *No tienes suficientes recursos.*

Necesitas:

🌳 Madera: ${costo.madera}
🪨 Piedra: ${costo.piedra}

Tienes:

🌳 Madera: ${perfil.recursos.madera}
🪨 Piedra: ${perfil.recursos.piedra}

🧭 Usa *.explorar* para conseguir recursos.`
        }
      );

      return true;
    }

    perfil.recursos.madera -=
      costo.madera;

    perfil.recursos.piedra -=
      costo.piedra;

    perfil.construcciones[tipo]++;

    perfil.experiencia +=
      20;

    usuarios[id] =
      perfil;

    guardarUsuarios(
      usuarios
    );

    await sock.sendMessage(
      chat,
      {
        text:
`🏗️ *¡CONSTRUCCIÓN COMPLETADA!*

${tipo === "casa" ? "🏠 Casa" : ""}
${tipo === "granja" ? "🌾 Granja" : ""}
${tipo === "puerto" ? "⚓ Puerto" : ""}

⭐ Nivel: ${perfil.construcciones[tipo]}

✨ XP: +20`
      }
    );

    return true;
  }

  // =======================================
  // 🎒 INVENTARIO
  // =======================================

  if (comando === "inventario") {

    const perfil =
      crearPerfil(id);

    if (!perfil.isla) {

      await sock.sendMessage(
        chat,
        {
          text:
`🏝️ Primero elige una isla.

Usa:
*.isla*`
        }
      );

      return true;
    }

    await sock.sendMessage(
      chat,
      {
        text:
`🎒 *INVENTARIO*

🌳 Madera: ${perfil.recursos.madera}
🪨 Piedra: ${perfil.recursos.piedra}
🍎 Comida: ${perfil.recursos.comida}`
      }
    );

    return true;
  }

  // =======================================
  // 📊 ISLASTATS
  // =======================================

  if (comando === "islastats") {

    const perfil =
      crearPerfil(id);

    if (!perfil.isla) {

      await sock.sendMessage(
        chat,
        {
          text:
`🏝️ Primero debes elegir una isla.

Usa:
*.isla*`
        }
      );

      return true;
    }

    const actual =
      islas.find(
        isla =>
          isla.id === perfil.isla
      );

    await sock.sendMessage(
      chat,
      {
        text:
`📊 *ESTADÍSTICAS DE TU ISLA*

${actual ? actual.icono : "🏝️"} ${actual ? actual.nombre : "Isla"}

⭐ Nivel: ${perfil.nivel}
✨ XP: ${perfil.experiencia}

🧭 Exploraciones: ${perfil.exploraciones}

🏠 Casa: nivel ${perfil.construcciones.casa}
🌾 Granja: nivel ${perfil.construcciones.granja}
⚓ Puerto: nivel ${perfil.construcciones.puerto}`
      }
    );

    return true;
  }

  // =======================================
  // 🏆 ISLARANKING
  // =======================================

  if (comando === "islaranking") {

    const lista =
      Object.entries(usuarios)
        .sort(
          (a, b) => {
            return (
              (b[1].experiencia || 0) -
              (a[1].experiencia || 0)
            );
          }
        )
        .slice(0, 10);

    if (!lista.length) {

      await sock.sendMessage(
        chat,
        {
          text:
`🏆 Todavía no hay jugadores en el ranking.`
        }
      );

      return true;
    }

    let texto =
      "🏆 *RANKING DE ISLAS* 🏝️\n\n";

    lista.forEach(
      ([usuario, datos], index) => {

        const actual =
          islas.find(
            isla =>
              isla.id === datos.isla
          );

        texto +=
`${index + 1}. ${actual ? actual.icono : "🏝️"} ${actual ? actual.nombre : "Sin isla"}
⭐ Nivel: ${datos.nivel || 1}
✨ XP: ${datos.experiencia || 0}

`;
      }
    );

    await sock.sendMessage(
      chat,
      {
        text: texto
      }
    );

    return true;
  }

  return false;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = isla;
