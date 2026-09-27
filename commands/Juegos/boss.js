// =========================================
// 👹 TITANBOT - BOSS IA CON GROQ
// =========================================
// Comandos:
// .boss
// .bossestado
//
// Requiere:
// npm install groq-sdk
//
// Variable de Render:
// GROQ_API_KEY
// =========================================

const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

// =========================================
// 📁 BASE DE DATOS
// =========================================

const databaseDir = path.join(
  __dirname,
  "..",
  "..",
  "database"
);

const databasePath = path.join(
  databaseDir,
  "boss.json"
);

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, {
    recursive: true
  });
}

// =========================================
// 🤖 GROQ
// =========================================

const groq = process.env.GROQ_API_KEY
  ? new Groq({
      apiKey: process.env.GROQ_API_KEY
    })
  : null;

// =========================================
// 💾 CARGAR DB
// =========================================

function cargarDB() {
  try {
    if (!fs.existsSync(databasePath)) {
      fs.writeFileSync(
        databasePath,
        JSON.stringify({}, null, 2)
      );

      return {};
    }

    const contenido =
      fs.readFileSync(
        databasePath,
        "utf8"
      );

    if (!contenido.trim()) {
      return {};
    }

    return JSON.parse(contenido);

  } catch (error) {
    console.error(
      "❌ Error cargando boss.json:",
      error
    );

    return {};
  }
}

// =========================================
// 💾 GUARDAR DB
// =========================================

function guardarDB(datos) {
  try {
    fs.writeFileSync(
      databasePath,
      JSON.stringify(datos, null, 2)
    );
  } catch (error) {
    console.error(
      "❌ Error guardando boss.json:",
      error
    );
  }
}

// =========================================
// 🔑 LIMPIAR ID
// =========================================

function limpiarID(id) {
  return String(id || "")
    .replace(
      /[^a-zA-Z0-9_.:@-]/g,
      "_"
    );
}

// =========================================
// 👹 BOSSES
// =========================================

const BOSSES = [

  {
    nombre: "Señor de las Sombras",
    emoji: "👹",
    vida: 10000
  },

  {
    nombre: "Dragón Infernal",
    emoji: "🐉",
    vida: 15000
  },

  {
    nombre: "TITAN-X",
    emoji: "🤖",
    vida: 20000
  },

  {
    nombre: "Rey Demonio",
    emoji: "😈",
    vida: 18000
  },

  {
    nombre: "Guardián Celestial",
    emoji: "⚡",
    vida: 25000
  }

];

// =========================================
// 🎲 ELEGIR BOSS
// =========================================

function elegirBoss() {
  return BOSSES[
    Math.floor(
      Math.random() * BOSSES.length
    )
  ];
}

// =========================================
// 📩 OBTENER TEXTO
// =========================================

function obtenerTexto(msg) {
  return (
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.text ||
    ""
  ).trim();
}

// =========================================
// 🤖 PROMPT DEL BOSS
// =========================================

function crearPrompt(boss) {

  return `
Eres el narrador de una batalla RPG
para TITANBOT en WhatsApp.

Controlas únicamente al Boss y el mundo.

=========================================
👹 BOSS
=========================================

Nombre: ${boss.nombre}
Emoji: ${boss.emoji}

Vida:
${boss.vidaActual}/${boss.vidaMaxima}

Fase:
${boss.fase}

Turno:
${boss.turno}

=========================================
🎭 ESTILO
=========================================

RESPUESTA MUY CORTA.

Escribe solamente 2 partes:

1. Una narración breve de máximo 2 frases.
2. Un diálogo breve del Boss de máximo 2 frases.

No escribas párrafos largos.

No hagas explicaciones.

No repitas información innecesaria.

La escena debe sentirse como un videojuego
RPG y conservar personalidad.

Ejemplo:

🌑 Una sombra cubre la caverna y el suelo tiembla.

😈 Rey Demonio:
— ¡¿Eso es todo lo que tienes?!
— ¡Ahora conocerás mi verdadero poder!

=========================================
⚔️ REGLAS
=========================================

El jugador controla sus propias acciones.

No decidas acciones del jugador.

Reacciona a lo que escribió.

Puede atacar, defenderse, esquivar,
negociar, provocar o inventar acciones.

Puedes hacer que una acción tenga éxito,
falle o tenga consecuencias.

No uses gore.

No uses contenido sexual.

No termines la batalla sin razón narrativa.

=========================================
📌 ESTADO INTERNO
=========================================

Al final escribe exactamente:

[ESTADO]
dano=NUMERO
fase=NUMERO
fin=si/no
[/ESTADO]

dano:
Daño realizado por el jugador durante este turno.

Si no hizo daño:
dano=0

fase:
Debe ser 1, 2 o 3.

fin:
Usa fin=si solamente si el Boss fue derrotado.

De lo contrario:
fin=no

NO escribas nada más dentro de [ESTADO].
`;

}

// =========================================
// 🧠 CONSULTAR GROQ
// =========================================

async function consultarGroq(
  boss,
  historial,
  mensaje
) {

  if (!groq) {
    throw new Error(
      "GROQ_API_KEY no configurada"
    );
  }

  const mensajes = [

    {
      role: "system",
      content: crearPrompt(boss)
    }

  ];

  for (
    const item of historial.slice(-10)
  ) {

    mensajes.push({
      role: item.rol || item.role,
      content: item.texto
    });

  }

  mensajes.push({
    role: "user",
    content: mensaje
  });

  const respuesta =
    await groq.chat.completions.create({

      model:
        "openai/gpt-oss-120b",

      messages: mensajes,

      temperature: 0.8,

      max_tokens: 300,

      reasoning_effort: "medium"

    });

  return (
    respuesta
      ?.choices?.[0]
      ?.message
      ?.content || ""
  );
}

// =========================================
// 📊 LEER ESTADO
// =========================================

function leerEstado(texto) {

  const bloque =
    texto.match(
      /\[ESTADO\]([\s\S]*?)\[\/ESTADO\]/i
    );

  if (!bloque) {

    return {
      dano: 0,
      fase: 1,
      fin: false
    };

  }

  const contenido =
    bloque[1];

  const danoMatch =
    contenido.match(
      /dano\s*=\s*(\d+)/i
    );

  const faseMatch =
    contenido.match(
      /fase\s*=\s*(\d+)/i
    );

  const finMatch =
    contenido.match(
      /fin\s*=\s*(si|no)/i
    );

  return {

    dano:
      danoMatch
        ? Number(danoMatch[1])
        : 0,

    fase:
      faseMatch
        ? Number(faseMatch[1])
        : 1,

    fin:
      finMatch
        ? finMatch[1].toLowerCase() === "si"
        : false

  };
}

// =========================================
// 🧹 LIMPIAR RESPUESTA
// =========================================

function limpiarRespuesta(texto) {

  return texto
    .replace(
      /\[ESTADO\][\s\S]*?\[\/ESTADO\]/i,
      ""
    )
    .trim();

}

// =========================================
// 📤 ENVIAR
// =========================================

async function enviar(
  sock,
  chat,
  texto
) {

  if (!texto) return;

  await sock.sendMessage(
    chat,
    {
      text: texto
    }
  );

}

// =========================================
// 🚀 INICIAR BOSS
// =========================================

async function iniciarBoss(
  sock,
  chat,
  id
) {

  const db =
    cargarDB();

  const usuario =
    limpiarID(id);

  // =====================================
  // BATALLA YA ACTIVA
  // =====================================

  if (
    db[usuario]?.activo
  ) {

    const boss =
      db[usuario];

    await enviar(
      sock,
      chat,
`👹 *BOSS ACTIVO*

${boss.emoji} *${boss.nombre}*
❤️ ${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}
🔥 Fase ${boss.fase}`
    );

    return true;
  }

  // =====================================
  // ELEGIR BOSS
  // =====================================

  const plantilla =
    elegirBoss();

  const boss = {

    activo: true,

    nombre:
      plantilla.nombre,

    emoji:
      plantilla.emoji,

    vidaMaxima:
      plantilla.vida,

    vidaActual:
      plantilla.vida,

    fase: 1,

    turno: 0,

    danoJugador: 0,

    historial: [],

    iniciado:
      Date.now()

  };

  db[usuario] =
    boss;

  guardarDB(db);

  // =====================================
  // INTRODUCCIÓN
  // =====================================

  try {

    const intro =
      await consultarGroq(
        boss,
        [],
        `
El jugador acaba de comenzar la batalla.

Haz una introducción MUY CORTA.

Presenta al Boss en máximo 2 frases.

Después haz que el Boss diga máximo 2 frases.

Termina con:
¿Qué vas a hacer?

No termines la batalla.
`
      );

    const estado =
      leerEstado(intro);

    boss.fase =
      Math.max(
        1,
        Math.min(
          3,
          estado.fase
        )
      );

    const respuesta =
      limpiarRespuesta(intro);

    boss.historial.push({

      rol:
        "assistant",

      texto:
        respuesta

    });

    guardarDB(db);

    // ===================================
    // TEXTO 1
    // ===================================

    await enviar(
      sock,
      chat,
      respuesta
    );

    // ===================================
    // TEXTO 2
    // ===================================

    await enviar(
      sock,
      chat,
`👹 *${boss.nombre}*

❤️ ${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}

🔥 Fase ${boss.fase}

💬 *¿Qué haces?*`
    );

  } catch (error) {

    console.error(
      "❌ Error iniciando Boss:",
      error
    );

    delete db[usuario];

    guardarDB(db);

    await enviar(
      sock,
      chat,
`❌ *No pude iniciar el Boss.*

Verifica GROQ_API_KEY en Render.`
    );

  }

  return true;
}

// =========================================
// ⚔️ CONTINUAR BATALLA
// =========================================

async function continuarBoss(
  sock,
  chat,
  id,
  mensajeJugador
) {

  const db =
    cargarDB();

  const usuario =
    limpiarID(id);

  const boss =
    db[usuario];

  if (
    !boss?.activo
  ) {

    return false;

  }

  boss.turno++;

  try {

    const respuesta =
      await consultarGroq(
        boss,
        boss.historial,
        mensajeJugador
      );

    const estado =
      leerEstado(
        respuesta
      );

    // ===================================
    // DAÑO
    // ===================================

    let dano =
      Math.max(
        0,
        estado.dano
      );

    dano =
      Math.min(
        dano,
        boss.vidaActual
      );

    boss.vidaActual -=
      dano;

    boss.danoJugador +=
      dano;

    boss.fase =
      Math.max(
        1,
        Math.min(
          3,
          estado.fase
        )
      );

    const respuestaLimpia =
      limpiarRespuesta(
        respuesta
      );

    // ===================================
    // VICTORIA
    // ===================================

    if (
      estado.fin ||
      boss.vidaActual <= 0
    ) {

      boss.vidaActual =
        0;

      const monedas =
        500 +
        Math.floor(
          Math.random() * 501
        );

      const xp =
        200 +
        Math.floor(
          Math.random() * 201
        );

      // =================================
      // TEXTO 1
      // =================================

      await enviar(
        sock,
        chat,
        respuestaLimpia
      );

      // =================================
      // TEXTO 2
      // =================================

      await enviar(
        sock,
        chat,
`🏆 *¡BOSS DERROTADO!*

👹 ${boss.nombre}
⚔️ Daño: ${boss.danoJugador.toLocaleString()}

🎁 +${monedas} monedas
✨ +${xp} XP`
      );

      delete db[usuario];

      guardarDB(db);

      return true;
    }

    // ===================================
    // HISTORIAL
    // ===================================

    boss.historial.push({

      rol:
        "user",

      texto:
        mensajeJugador

    });

    boss.historial.push({

      rol:
        "assistant",

      texto:
        respuestaLimpia

    });

    if (
      boss.historial.length > 20
    ) {

      boss.historial =
        boss.historial.slice(-20);

    }

    guardarDB(db);

    // ===================================
    // TEXTO 1
    // ===================================

    await enviar(
      sock,
      chat,
      respuestaLimpia
    );

    // ===================================
    // TEXTO 2
    // ===================================

    await enviar(
      sock,
      chat,
`👹 *${boss.nombre}*

❤️ ${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}

🔥 Fase ${boss.fase}

💬 *¿Qué haces?*`
    );

  } catch (error) {

    console.error(
      "❌ Error con Groq:",
      error
    );

    guardarDB(db);

    await enviar(
      sock,
      chat,
`⚠️ *Groq no pudo responder.*

La batalla sigue activa.`
    );

  }

  return true;
}

// =========================================
// 📊 ESTADO DEL BOSS
// =========================================

async function estadoBoss(
  sock,
  chat,
  id
) {

  const db =
    cargarDB();

  const boss =
    db[limpiarID(id)];

  if (!boss?.activo) {

    await enviar(
      sock,
      chat,
`👹 *NO TIENES UN BOSS ACTIVO.*

Usa:
*.boss*`
    );

    return true;
  }

  await enviar(
    sock,
    chat,
`👹 *BOSS ACTIVO*

${boss.emoji} *${boss.nombre}*

❤️ ${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}
🔥 Fase: ${boss.fase}
⚔️ Daño: ${boss.danoJugador.toLocaleString()}
🎬 Turno: ${boss.turno}`
  );

  return true;
}

// =========================================
// 🎮 COMANDO PRINCIPAL
// =========================================

async function boss(
  sock,
  chat,
  comando,
  args,
  id,
  msg
) {

  const texto =
    obtenerTexto(msg);

  // =====================================
  // NORMALIZAR COMANDO
  // =====================================

  comando = String(comando || "")
    .toLowerCase()
    .replace(/^\./, "");

  // =====================================
  // .BOSS
  // =====================================

  if (
    comando === "boss"
  ) {

    return iniciarBoss(
      sock,
      chat,
      id
    );

  }

  // =====================================
  // .BOSSESTADO
  // =====================================

  if (
    comando === "bossestado"
  ) {

    return estadoBoss(
      sock,
      chat,
      id
    );

  }

  // =====================================
  // BATALLA ACTIVA
  // =====================================

  const db =
    cargarDB();

  const bossActivo =
    db[limpiarID(id)];

  // =====================================
  // 🔒 NO CAPTURAR OTROS COMANDOS
  // =====================================

  const esComando =
    String(comando || "").startsWith(".") ||
    String(texto || "").startsWith(".");

  // =====================================
  // SOLO MENSAJES NORMALES
  // =====================================

  if (
    bossActivo?.activo &&
    texto &&
    !esComando
  ) {

    return continuarBoss(
      sock,
      chat,
      id,
      texto
    );

  }

  // =====================================
  // NO ES DEL BOSS
  // =====================================

  return false;
}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = boss;
