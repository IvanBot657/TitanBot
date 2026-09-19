// =========================================
// 👑 TITANBOT - EJÉRCITO DORADO PREMIUM
// ⚔️ SISTEMA DE RECLUTAMIENTO
// =========================================

const fs = require("fs");
const path = require("path");

// =========================================
// 📁 ARCHIVO DE DATOS
// =========================================

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "ejercitos.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "{}", "utf8");
}

// =========================================
// 💾 CARGAR EJÉRCITOS
// =========================================

function cargarEjercitos() {

  try {

    const contenido =
      fs.readFileSync(DATA_FILE, "utf8");

    if (!contenido.trim()) {
      return {};
    }

    return JSON.parse(contenido);

  } catch (error) {

    console.error(
      "❌ Error cargando ejércitos:",
      error
    );

    return {};
  }
}

// =========================================
// 💾 GUARDAR EJÉRCITOS
// =========================================

function guardarEjercitos(datos) {

  try {

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(datos, null, 2),
      "utf8"
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Error guardando ejércitos:",
      error
    );

    return false;
  }
}

// =========================================
// 👤 OBTENER USUARIO
// =========================================

function obtenerUsuario(msg, id) {

  return (
    msg?.key?.participant ||
    msg?.participant ||
    id ||
    null
  );
}

// =========================================
// 🏷️ MENCIÓN
// =========================================

function mencionar(id) {

  if (!id) {
    return "@usuario";
  }

  return `@${id.split("@")[0].split(":")[0]}`;
}

// =========================================
// 💰 FORMATO DE NÚMEROS
// =========================================

function numero(valor) {

  return Number(
    valor || 0
  ).toLocaleString("es-CO");
}

// =========================================
// ⚔️ TIPOS DE UNIDADES
// =========================================

const unidades = {

  "1": {
    nombre: "Soldado",
    emoji: "🗡️",
    propiedad: "soldados",
    precio: 50,
    poder: 2
  },

  "2": {
    nombre: "Arquero",
    emoji: "🏹",
    propiedad: "arqueros",
    precio: 100,
    poder: 4
  },

  "3": {
    nombre: "Guardián",
    emoji: "🛡️",
    propiedad: "guardianes",
    precio: 250,
    poder: 8
  },

  "4": {
    nombre: "Caballería",
    emoji: "🐎",
    propiedad: "caballeria",
    precio: 400,
    poder: 12
  }

};

// =========================================
// ⚔️ CALCULAR PODER
// =========================================

function calcularPoder(ejercito) {

  const soldados =
    (ejercito.unidades.soldados || 0) * 2;

  const arqueros =
    (ejercito.unidades.arqueros || 0) * 4;

  const guardianes =
    (ejercito.unidades.guardianes || 0) * 8;

  const caballeria =
    (ejercito.unidades.caballeria || 0) * 12;

  const generales =
    (ejercito.generales || 0) * 50;

  const fortaleza =
    (ejercito.fortaleza?.nivel || 1) * 100;

  return (
    soldados +
    arqueros +
    guardianes +
    caballeria +
    generales +
    fortaleza
  );
}

// =========================================
// 🏆 FUNCIÓN PRINCIPAL
// =========================================

async function reclutar(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  // =========================================
  // COMANDO
  // =========================================

  if (
    comando !== "reclutar"
  ) {
    return false;
  }

  // =========================================
  // SOLO GRUPOS
  // =========================================

  if (!chat.endsWith("@g.us")) {

    await sock.sendMessage(chat, {
      text:
        "❌ *Reclutamiento* solo funciona en grupos."
    });

    return true;
  }

  try {

    // =========================================
    // 👤 USUARIO
    // =========================================

    const usuarioId =
      obtenerUsuario(msg, id);

    if (!usuarioId) {

      await sock.sendMessage(chat, {
        text:
          "❌ No pude identificar al comandante."
      });

      return true;
    }

    // =========================================
    // 💾 DATOS
    // =========================================

    const datos =
      cargarEjercitos();

    // =========================================
    // 🚫 SIN EJÉRCITO
    // =========================================

    if (!datos[usuarioId]) {

      await sock.sendMessage(chat, {
        text:
          `❌ ${mencionar(usuarioId)}, todavía no tienes un ejército.\n\n` +
          `👑 Usa *.ejercito* para crear tu Ejército Dorado.`,
        mentions: [usuarioId]
      });

      return true;
    }

    const ejercito =
      datos[usuarioId];

    // =========================================
    // 🛡️ ASEGURAR ESTRUCTURA
    // =========================================

    if (!ejercito.unidades) {

      ejercito.unidades = {
        soldados: 0,
        arqueros: 0,
        guardianes: 0,
        caballeria: 0
      };
    }

    if (!ejercito.fortaleza) {

      ejercito.fortaleza = {
        nivel: 1,
        defensa: 100
      };
    }

    if (
      typeof ejercito.oro !== "number"
    ) {
      ejercito.oro = 0;
    }

    // =========================================
    // 📋 SIN ARGUMENTOS = MENÚ
    // =========================================

    if (!args || args.length === 0) {

      const oro =
        ejercito.oro;

      const mensaje =
        `╔════════════════════════════╗\n` +
        `      ⚔️ *RECLUTAMIENTO*\n` +
        `        💎 *PREMIUM*\n` +
        `╚════════════════════════════╝\n\n` +

        `👑 Comandante: ${mencionar(usuarioId)}\n` +
        `🪙 Oro disponible: *${numero(oro)}*\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `1️⃣ 🗡️ *SOLDADO*\n` +
        `   💰 Precio: *50 🪙*\n` +
        `   ⚔️ Poder: *+2*\n\n` +

        `2️⃣ 🏹 *ARQUERO*\n` +
        `   💰 Precio: *100 🪙*\n` +
        `   ⚔️ Poder: *+4*\n\n` +

        `3️⃣ 🛡️ *GUARDIÁN*\n` +
        `   💰 Precio: *250 🪙*\n` +
        `   ⚔️ Poder: *+8*\n\n` +

        `4️⃣ 🐎 *CABALLERÍA*\n` +
        `   💰 Precio: *400 🪙*\n` +
        `   ⚔️ Poder: *+12*\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `📌 *FORMA DE USO*\n\n` +
        `*.reclutar 1 10*\n` +
        `➡️ Recluta 10 soldados\n\n` +

        `*.reclutar 2 5*\n` +
        `➡️ Recluta 5 arqueros\n\n` +

        `*.reclutar 3 2*\n` +
        `➡️ Recluta 2 guardianes\n\n` +

        `*.reclutar 4 1*\n` +
        `➡️ Recluta 1 caballería\n\n` +

        `🔥 *Construye tu Ejército Dorado.*`;

      await sock.sendMessage(chat, {
        text: mensaje,
        mentions: [usuarioId]
      });

      return true;
    }

    // =========================================
    // 🔢 TIPO DE UNIDAD
    // =========================================

    const tipo =
      String(args[0]);

    if (!unidades[tipo]) {

      await sock.sendMessage(chat, {
        text:
          `❌ Tipo de unidad inválido.\n\n` +
          `Usa:\n` +
          `1️⃣ Soldado\n` +
          `2️⃣ Arquero\n` +
          `3️⃣ Guardián\n` +
          `4️⃣ Caballería\n\n` +
          `Ejemplo:\n` +
          `*.reclutar 1 10*`
      });

      return true;
    }

    // =========================================
    // 🔢 CANTIDAD
    // =========================================

    const cantidad =
      Number(args[1]);

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {

      await sock.sendMessage(chat, {
        text:
          `❌ Cantidad inválida.\n\n` +
          `Debes indicar una cantidad entera mayor que 0.\n\n` +
          `Ejemplo:\n` +
          `*.reclutar 1 10*`
      });

      return true;
    }

    // =========================================
    // 🚧 LÍMITE DE SEGURIDAD
    // =========================================

    if (cantidad > 1000) {

      await sock.sendMessage(chat, {
        text:
          `❌ *Cantidad demasiado alta.*\n\n` +
          `El máximo por reclutamiento es de *1,000 unidades*.\n\n` +
          `Puedes realizar varios reclutamientos.`
      });

      return true;
    }

    // =========================================
    // 💰 CALCULAR COSTO
    // =========================================

    const unidad =
      unidades[tipo];

    const costo =
      unidad.precio * cantidad;

    // =========================================
    // 💰 COMPROBAR ORO
    // =========================================

    if (
      ejercito.oro < costo
    ) {

      const falta =
        costo - ejercito.oro;

      await sock.sendMessage(chat, {
        text:
          `❌ *ORO INSUFICIENTE*\n\n` +
          `👑 Comandante: ${mencionar(usuarioId)}\n\n` +
          `🪙 Oro disponible: *${numero(ejercito.oro)}*\n` +
          `💰 Necesitas: *${numero(costo)}*\n` +
          `📉 Te faltan: *${numero(falta)}*\n\n` +
          `💡 Consigue más oro para continuar.`,
        mentions: [usuarioId]
      });

      return true;
    }

    // =========================================
    // ⚔️ PODER ANTES
    // =========================================

    const poderAntes =
      calcularPoder(ejercito);

    // =========================================
    // 💰 RESTAR ORO
    // =========================================

    ejercito.oro -= costo;

    // =========================================
    // 🪖 AGREGAR UNIDADES
    // =========================================

    ejercito.unidades[
      unidad.propiedad
    ] += cantidad;

    // =========================================
    // ⚔️ NUEVO PODER
    // =========================================

    ejercito.poder =
      calcularPoder(ejercito);

    const poderDespues =
      ejercito.poder;

    const aumentoPoder =
      poderDespues - poderAntes;

    // =========================================
    // 🕒 ACTIVIDAD
    // =========================================

    ejercito.ultimaActividad =
      new Date().toISOString();

    // =========================================
    // 💾 GUARDAR
    // =========================================

    guardarEjercitos(datos);

    // =========================================
    // 🎉 RESULTADO
    // =========================================

    const total =
      ejercito.unidades[
        unidad.propiedad
      ];

    const mensaje =
      `╔════════════════════════════╗\n` +
      `       ⚔️ *RECLUTAMIENTO*\n` +
      `          COMPLETADO\n` +
      `╚════════════════════════════╝\n\n` +

      `👑 *COMANDANTE*\n` +
      `${mencionar(usuarioId)}\n\n` +

      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +

      `${unidad.emoji} *¡NUEVAS TROPAS!*\n\n` +

      `🎖️ Unidad: *${unidad.nombre}*\n` +
      `👥 Cantidad: *${numero(cantidad)}*\n` +
      `💰 Costo: *${numero(costo)} 🪙*\n\n` +

      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +

      `📊 *ACTUALIZACIÓN DEL EJÉRCITO*\n\n` +

      `${unidad.emoji} ${unidad.nombre}s: *${numero(total)}*\n` +
      `⚔️ Poder anterior: *${numero(poderAntes)}*\n` +
      `🔥 Poder actual: *${numero(poderDespues)}*\n` +
      `📈 Aumento: *+${numero(aumentoPoder)}*\n\n` +

      `🪙 Oro restante: *${numero(ejercito.oro)}*\n\n` +

      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +

      `👑 *¡Tus tropas están listas!*`;

    await sock.sendMessage(chat, {
      text: mensaje,
      mentions: [usuarioId]
    });

    return true;

  } catch (error) {

    console.error(
      "❌ Error en reclutamiento:",
      error
    );

    await sock.sendMessage(chat, {
      text:
        "❌ Ocurrió un error durante el reclutamiento."
    });

    return true;
  }
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = reclutar;
