// =========================================
// 👹 TITANBOT - BOSS IA CON GROQ
// =========================================

const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const databaseDir = path.join(__dirname, "..", "..", "database");
const databasePath = path.join(databaseDir, "boss.json");

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
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
// 💾 BASE DE DATOS
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
// 🔑 ID
// =========================================

function limpiarID(id) {
  return String(id || "")
    .replace(/[^a-zA-Z0-9_.:@-]/g, "_");
}

// =========================================
// 👹 BOSSES
// =========================================

const BOSSES = [
  {
    nombre: "Señor de las Sombras",
    emoji: "👹",
    vida: 10000,
    ataque: 350
  },

  {
    nombre: "Dragón Infernal",
    emoji: "🐉",
    vida: 15000,
    ataque: 500
  },

  {
    nombre: "TITAN-X",
    emoji: "🤖",
    vida: 20000,
    ataque: 650
  },

  {
    nombre: "Rey Demonio",
    emoji: "😈",
    vida: 18000,
    ataque: 600
  },

  {
    nombre: "Guardián Celestial",
    emoji: "⚡",
    vida: 25000,
    ataque: 750
  }
];

// =========================================
// 🎲 BOSS ALEATORIO
// =========================================

function elegirBoss() {
  return BOSSES[
    Math.floor(Math.random() * BOSSES.length)
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
// 🤖 PERSONALIDAD DEL BOSS
// =========================================

function crearPrompt(boss) {

  return `
Eres el sistema narrativo de TITANBOT.

Estás controlando una batalla ficticia contra un Boss.

BOSS:
Nombre: ${boss.nombre}
Emoji: ${boss.emoji}
Vida máxima: ${boss.vidaMaxima}
Vida actual: ${boss.vidaActual}
Fase actual: ${boss.fase}

TU FUNCIÓN:

Debes actuar como el Boss y como narrador de la batalla.

El jugador puede escribir ABSOLUTAMENTE CUALQUIER COSA.

Puede:

- atacar
- esquivar
- defenderse
- correr
- hablar
- insultar al Boss
- provocarlo
- usar magia
- usar una espada
- inventar ataques
- intentar engañarlo
- hablar normalmente
- intentar negociar
- hacer acciones creativas

Debes interpretar lo que escribió y responder de manera coherente.

NO debes limitar al jugador a botones.

La historia debe sentirse como un videojuego RPG.

IMPORTANTE:

El jugador controla sus propias acciones.

Tú controlas al Boss y al mundo.

NO decidas acciones del jugador por él.

Puedes hacer que sus acciones tengan éxito,
fracasen o tengan consecuencias.

La batalla debe ser emocionante.

El Boss debe tener personalidad.

El Boss debe hablar directamente con el jugador.

Usa bastantes detalles narrativos.

Puedes utilizar diálogos como:

— ¿Eso es todo lo que tienes?

— Entonces ven y demuéstramelo.

— No esperaba que llegaras tan lejos.

La respuesta debe tener aproximadamente
150-300 palabras.

NO uses gore ni descripciones gráficas.

NO conviertas la escena en contenido sexual.

=========================================

ESTADO DEL BOSS

Vida actual:
${boss.vidaActual}

Vida máxima:
${boss.vidaMaxima}

Fase:
${boss.fase}

Turno:
${boss.turno}

=========================================

AL FINAL DE TU RESPUESTA escribe EXACTAMENTE:

[ESTADO]
dano=NUMERO
fase=NUMERO
fin=si/no
[/ESTADO]

REGLAS:

dano = daño que el jugador consiguió hacer al Boss.

Si el jugador no hizo daño:
dano=0

fase puede ser:

1
2
3

fin=si SOLO cuando el Boss haya sido derrotado.

No pongas información adicional dentro de [ESTADO].
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

  // Mantener contexto de la batalla

  for (const item of historial.slice(-12)) {

    mensajes.push({
      role: item.rol,
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
        "llama-3.3-70b-versatile",

      messages: mensajes,

      temperature: 0.9,

      max_tokens: 700

    });

  return (
    respuesta.choices?.[0]?.message?.content ||
    ""
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

  const contenido = bloque[1];

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

    dano: danoMatch
      ? Number(danoMatch[1])
      : 0,

    fase: faseMatch
      ? Number(faseMatch[1])
      : 1,

    fin:
      finMatch
        ? finMatch[1].toLowerCase() === "si"
        : false

  };
}

// =========================================
// 🧹 QUITAR ESTADO
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

  const db = cargarDB();

  const usuario = limpiarID(id);

  // =====================================
  // YA TIENE BOSS
  // =====================================

  if (db[usuario]?.activo) {

    const boss = db[usuario];

    await enviar(
      sock,
      chat,
`👹 *YA TIENES UNA BATALLA ACTIVA*

${boss.emoji} *${boss.nombre}*

❤️ Vida:
${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}

🔥 Fase: ${boss.fase}

💬 Respóndele directamente al Boss.`
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

    ataque:
      plantilla.ataque,

    fase: 1,

    turno: 0,

    danoJugador: 0,

    historial: [],

    iniciado:
      Date.now()

  };

  db[usuario] = boss;

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
El jugador acaba de iniciar la batalla.

Haz una entrada épica y bastante narrativa
para presentar al Boss.

El Boss debe aparecer,
hablar con el jugador,
mostrar su poder
y terminar preguntándole:

¿Qué vas a hacer?

No empieces todavía el combate definitivo.
`
      );

    const estado =
      leerEstado(intro);

    boss.fase =
      Math.max(
        1,
        Math.min(3, estado.fase)
      );

    const respuesta =
      limpiarRespuesta(intro);

    boss.historial.push({

      rol: "assistant",

      texto: respuesta

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

Verifica que hayas configurado:

GROQ_API_KEY

en las variables de entorno de Render.`
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

  if (!boss?.activo) {

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
      leerEstado(respuesta);

    // ===================================
    // DAÑO
    // ===================================

    let dano =
      Math.max(
        0,
        estado.dano
      );

    // Evitar daño absurdo

    dano =
      Math.min(
        dano,
        boss.vidaActual
      );

    boss.vidaActual -= dano;

    boss.danoJugador += dano;

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

      boss.vidaActual = 0;

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

      rol: "user",

      texto:
        mensajeJugador

    });

    boss.historial.push({

      rol: "assistant",

      texto:
        respuestaLimpia

    });

    // Mantener historial pequeño

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

🔥 Fase: ${boss.fase}

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

Escribe nuevamente tu acción.`
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

🔥 Fase: ${boss.fase}

⚔️ Daño causado:
${boss.danoJugador.toLocaleString()}

🎬 Turno:
${boss.turno}`
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

  // .boss

  if (
    comando === "boss"
  ) {

    return iniciarBoss(
      sock,
      chat,
      id
    );

  }

  // .bossestado

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
  // MENSAJE NORMAL DURANTE BATALLA
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
