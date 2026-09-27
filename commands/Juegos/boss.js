// =========================================
// 👹 TITANBOT - BOSS IA CON GROQ
// =========================================
// Comando:
// .boss
//
// Estado:
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
// 💾 CARGAR BASE DE DATOS
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

    const contenido = fs.readFileSync(
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
// 💾 GUARDAR BASE DE DATOS
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

Tu función es controlar al Boss y narrar
la historia.

=========================================
👹 BOSS
=========================================

Nombre:
${boss.nombre}

Emoji:
${boss.emoji}

Vida máxima:
${boss.vidaMaxima}

Vida actual:
${boss.vidaActual}

Fase:
${boss.fase}

Turno:
${boss.turno}

=========================================
🎭 ESTILO
=========================================

La batalla debe sentirse como una historia
interactiva de videojuego.

El jugador puede escribir libremente.

Puede hablar, atacar, defenderse,
esquivar, correr, negociar, provocar,
inventar habilidades o hacer acciones
creativas.

No limites al jugador a comandos.

Debes reaccionar específicamente
a lo que el jugador escribió.

El Boss debe tener personalidad.

El Boss puede hablar directamente
con el jugador.

Usa bastante texto narrativo.

Usa diálogos como:

— ¿Eso es todo lo que tienes?

— Has llegado demasiado lejos.

— Entonces demuéstrame de qué eres capaz.

=========================================
⚔️ REGLAS
=========================================

El jugador controla sus propias acciones.

Tú controlas al Boss y el mundo.

No decidas automáticamente qué hace
el jugador.

Puedes hacer que sus acciones tengan
éxito, fallen o tengan consecuencias.

No hagas que el jugador gane
automáticamente.

No termines la batalla sin una razón
narrativa.

Mantén la historia coherente.

No uses gore ni descripciones gráficas.

No conviertas la historia en contenido sexual.

=========================================
📊 ESTADO
=========================================

Vida:
${boss.vidaActual}/${boss.vidaMaxima}

Fase:
${boss.fase}

Turno:
${boss.turno}

=========================================
📌 ESTADO INTERNO
=========================================

Al final de tu respuesta escribe:

[ESTADO]
dano=NUMERO
fase=NUMERO
fin=si/no
[/ESTADO]

dano:
Cantidad de daño que el jugador hizo
al Boss durante este turno.

Si no hizo daño:

dano=0

fase:
Debe ser 1, 2 o 3.

fin:
Usa:

fin=si

solamente cuando el Boss haya sido
derrotado.

De lo contrario:

fin=no

No escribas nada dentro del bloque
[ESTADO] excepto esas tres líneas.
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

  // Mantener contexto

  for (
    const item of historial.slice(-12)
  ) {

    mensajes.push({
      role: item.rol,
      content: item.texto
    });

  }

  // Mensaje actual

  mensajes.push({
    role: "user",
    content: mensaje
  });

  const respuesta =
    await groq.chat.completions.create({

      // ===================================
      // MODELO ACTUAL DE GROQ
      // ===================================

      model:
        "openai/gpt-oss-120b",

      messages: mensajes,

      temperature: 0.9,

      max_tokens: 900,

      // GPT-OSS permite razonamiento
      // controlado.
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
// 📤 ENVIAR MENSAJE
// =========================================

async function enviar(
  sock,
  chat,
  texto
) {

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
  // YA TIENE BATALLA
  // =====================================

  if (
    db[usuario]?.activo
  ) {

    const boss =
      db[usuario];

    await enviar(
      sock,
      chat,
`👹 *YA TIENES UNA BATALLA ACTIVA*

${boss.emoji} *${boss.nombre}*

❤️ Vida:
${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}

🔥 Fase: ${boss.fase}

💬 Continúa escribiendo tu acción.`
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
El jugador acaba de comenzar
la batalla.

Haz una introducción muy épica.

Presenta al Boss.

Haz que aparezca de forma
impresionante.

Haz que el Boss diga algunas frases.

Describe el ambiente.

Termina preguntando:

¿Qué vas a hacer?

No derrotes al jugador.
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
      limpiarRespuesta(
        intro
      );

    boss.historial.push({

      rol:
        "assistant",

      texto:
        respuesta

    });

    guardarDB(db);

    await enviar(
      sock,
      chat,
      respuesta
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

Verifica que:

1️⃣ GROQ_API_KEY esté en Render.

2️⃣ La variable se llame exactamente:

GROQ_API_KEY

3️⃣ El servicio haya sido reiniciado después de agregarla.`
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

    // Evitar daño mayor
    // que la vida restante

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

      delete db[usuario];

      guardarDB(db);

      await enviar(
        sock,
        chat,
`${respuestaLimpia}

━━━━━━━━━━━━━━━━━━━━

🏆 *¡BOSS DERROTADO!*

👹 *${boss.nombre}*

⚔️ Daño total:
${boss.danoJugador.toLocaleString()}

🎁 *RECOMPENSAS*

💰 +${monedas} monedas
✨ +${xp} XP

🔥 *LA BATALLA HA TERMINADO.*`
      );

      return true;
    }

    // ===================================
    // GUARDAR HISTORIAL
    // ===================================

    boss.historial.push({

      role: "user",
      rol: "user",

      texto:
        mensajeJugador

    });

    boss.historial.push({

      role: "assistant",
      rol: "assistant",

      texto:
        respuestaLimpia

    });

    // ===================================
    // LIMITAR HISTORIAL
    // ===================================

    if (
      boss.historial.length > 20
    ) {

      boss.historial =
        boss.historial.slice(-20);

    }

    guardarDB(db);

    // ===================================
    // RESPUESTA
    // ===================================

    await enviar(
      sock,
      chat,
`${respuestaLimpia}

━━━━━━━━━━━━━━━━━━━━

👹 *${boss.nombre}*

❤️ Vida:
${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}

🔥 Fase:
${boss.fase}

💬 *¿Qué haces ahora?*`
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

Tu batalla sigue activa.

Intenta escribir nuevamente tu acción.`
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

❤️ Vida:
${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}

🔥 Fase:
${boss.fase}

⚔️ Daño causado:
${boss.danoJugador.toLocaleString()}

🎬 Turno:
${boss.turno}`
  );

  return true;

}

// =========================================
// 🎮 COMANDO
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

  if (
    bossActivo?.activo &&
    texto
  ) {

    return continuarBoss(
      sock,
      chat,
      id,
      texto
    );

  }

  return false;

}

// =========================================
// 📤 EXPORTAR
// =========================================

module.exports = boss;
