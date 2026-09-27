// =========================================
// 👹 TITANBOT - BOSS NARRATIVO INTERACTIVO
// =========================================
// .boss -> inicia una batalla
// Durante la batalla, el usuario puede responder
// normalmente. El bot interpreta palabras clave,
// avanza la historia y guarda el estado.
// =========================================

const fs = require("fs");
const path = require("path");

const databaseDir = path.join(__dirname, "..", "database");
const databasePath = path.join(databaseDir, "boss.json");

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

function cargar() {
  try {
    if (!fs.existsSync(databasePath)) {
      fs.writeFileSync(databasePath, JSON.stringify({}, null, 2));
      return {};
    }

    const contenido = fs.readFileSync(databasePath, "utf8");
    return contenido.trim() ? JSON.parse(contenido) : {};
  } catch (error) {
    console.error("❌ Error leyendo boss.json:", error);
    return {};
  }
}

function guardar(datos) {
  try {
    fs.writeFileSync(databasePath, JSON.stringify(datos, null, 2));
  } catch (error) {
    console.error("❌ Error guardando boss.json:", error);
  }
}

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obtenerTexto(msg) {
  return (
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.text ||
    ""
  ).trim();
}

function usuarioId(id) {
  return String(id || "").replace(/[^a-zA-Z0-9_.:@-]/g, "_");
}

function danoAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const BOSSES = [
  {
    nombre: "Señor de las Sombras",
    emoji: "👹",
    vida: 10000,
    ataque: 350,
    color: "🌑",
    intro: `🌑 *LAS NUBES CUBREN EL CIELO...*

El viento comienza a soplar con fuerza y todo queda en silencio.

💥 *BOOOOM...*

El suelo comienza a temblar.

Entre una enorme nube de humo aparece una figura gigantesca.

👹 *EL SEÑOR DE LAS SOMBRAS HA APARECIDO.*

Sus ojos brillan en medio de la oscuridad mientras observa a todos los que se encuentran frente a él.

⚔️ Lentamente, levanta su enorme espada.

La espada comienza a emitir una energía oscura que hace temblar el suelo.

🔥 El Boss da un paso hacia adelante.

— ¿Quién se atreve a desafiarme?

Una fuerte explosión sacude el lugar.

🌑 La oscuridad comienza a extenderse por toda la zona.

El Señor de las Sombras levanta su espada y se prepara para atacar.

⚔️ *LA BATALLA HA COMENZADO.*`,
    provocaciones: [
      "— ¿Eso es todo lo que tienes?",
      "— He enfrentado guerreros mucho más fuertes que tú.",
      "— Tu valor es interesante... tu fuerza todavía no.",
      "— Sigue intentándolo. Apenas has comenzado a conocer mi poder."
    ],
    ataqueTexto: [
      "⚔️ El Señor de las Sombras gira su espada y lanza un poderoso golpe.",
      "🌑 Una ráfaga oscura atraviesa el campo de batalla.",
      "💥 El Boss golpea el suelo y una onda de energía avanza hacia ti."
    ]
  },
  {
    nombre: "Dragón Infernal",
    emoji: "🐉",
    vida: 15000,
    ataque: 500,
    color: "🔥",
    intro: `🔥 *EL CIELO COMIENZA A ARDER...*

Una enorme sombra cubre la zona.

El aire se vuelve cada vez más caliente.

💥 *BOOOOM...*

Una criatura gigantesca desciende desde las nubes.

🐉 *EL DRAGÓN INFERNAL HA DESPERTADO.*

Sus alas provocan una ráfaga que levanta polvo y rocas.

🔥 Sus ojos se fijan en ti.

El Dragón abre lentamente sus enormes fauces.

— ¿Has venido a desafiarme?

Una llama ilumina todo el lugar.

🐉 Extiende sus alas y prepara sus garras.

🔥 *EL COMBATE COMIENZA.*`,
    provocaciones: [
      "— Tu valentía me hace gracia.",
      "— ¿Crees que unas palabras pueden derrotar a un dragón?",
      "— Acércate. Quiero ver de qué estás hecho.",
      "— Has despertado algo que no podrás controlar."
    ],
    ataqueTexto: [
      "🔥 El Dragón lanza una llamarada que atraviesa el campo.",
      "🐉 El Dragón se eleva y cae con una fuerza brutal.",
      "💥 Una explosión de fuego sacude el suelo."
    ]
  },
  {
    nombre: "TITAN-X",
    emoji: "🤖",
    vida: 20000,
    ataque: 650,
    color: "⚡",
    intro: `⚡ *SISTEMA DE EMERGENCIA ACTIVADO...*

Las luces comienzan a parpadear.

Un fuerte ruido metálico retumba en la distancia.

🤖 Una enorme máquina aparece entre el humo.

*BEEP... BEEP...*

🔴 Sus ojos se encienden.

🤖 *TITAN-X HA DESPERTADO.*

Su armadura comienza a cargarse.

⚡ Una espada de energía aparece en su mano.

TITAN-X te observa durante unos segundos.

— Objetivo localizado.

El Boss da un paso hacia adelante.

— Iniciando protocolo de combate.

⚔️ *PREPÁRATE.*`,
    provocaciones: [
      "— Tus probabilidades de victoria son mínimas.",
      "— Analizando tu estrategia... resultado: insuficiente.",
      "— Interesante. Has conseguido superar mis cálculos.",
      "— Continúa. Necesito más datos sobre tu estilo de combate."
    ],
    ataqueTexto: [
      "⚡ TITAN-X dispara una descarga de energía.",
      "🤖 TITAN-X avanza rápidamente y lanza un golpe de espada.",
      "💥 Un pulso energético explota frente a ti."
    ]
  }
];

function elegirBoss() {
  return BOSSES[Math.floor(Math.random() * BOSSES.length)];
}

function respuestaAUsuario(texto, estado) {
  const t = normalizar(texto);

  const atacar = /atac|golpe|pego|pegar|disparo|lanzo|espada|puñet|puno|patada|corto|apuñ|fuego|magia/.test(t);
  const defender = /defiend|bloque|escudo|prote|cubrir|cubrirme|parar/.test(t);
  const esquivar = /esquiv|salto|agacho|corro|apart|evito|rodar|rodillo/.test(t);
  const hablar = /habl|digo|respon|pregunt|quien|por que|porque|negocio|trato|amenaz/.test(t);
  const rendirse = /me rindo|rendicion|rendirme|abandono|huir|escapo/.test(t);

  if (rendirse) {
    return { tipo: "rendirse" };
  }

  if (atacar) {
    return { tipo: "atacar" };
  }

  if (defender) {
    return { tipo: "defender" };
  }

  if (esquivar) {
    return { tipo: "esquivar" };
  }

  if (hablar) {
    return { tipo: "hablar" };
  }

  const opciones = ["atacar", "esquivar", "defender", "hablar"];
  return { tipo: opciones[Math.floor(Math.random() * opciones.length)] };
}

async function enviar(sock, chat, texto) {
  await sock.sendMessage(chat, { text: texto });
}

async function iniciarBoss(sock, chat, id) {
  const datos = cargar();
  const key = usuarioId(id);

  if (datos[key]?.activo) {
    const boss = datos[key];

    await enviar(sock, chat,
`👹 *YA TIENES UN BOSS ACTIVO*

${boss.emoji} *${boss.nombre}*

❤️ Vida: ${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}

💬 Respóndele directamente para continuar la batalla.

⚔️ Puedes escribir cosas como:
• *Lo ataco con mi espada*
• *Intento esquivar*
• *Me defiendo*
• *No tengo miedo de ti*`);
    return true;
  }

  const plantilla = elegirBoss();

  datos[key] = {
    activo: true,
    nombre: plantilla.nombre,
    emoji: plantilla.emoji,
    vidaMaxima: plantilla.vida,
    vidaActual: plantilla.vida,
    ataque: plantilla.ataque,
    fase: 1,
    turno: 0,
    danoJugador: 0,
    iniciadoEn: Date.now()
  };

  guardar(datos);

  await enviar(sock, chat,
`${plantilla.intro}

━━━━━━━━━━━━━━━━━━━━

${plantilla.emoji} *BOSS:* ${plantilla.nombre}
❤️ *VIDA:* ${plantilla.vida.toLocaleString()} / ${plantilla.vida.toLocaleString()}
⚔️ *ATAQUE:* ${plantilla.ataque}

💬 *El Boss te observa.*

— ¿Qué vas a hacer?

━━━━━━━━━━━━━━━━━━━━

🗣️ *Respóndele directamente.*
Puedes atacar, esquivar, defenderte o hablar con él.`);

  return true;
}

async function procesarRespuesta(sock, chat, id, texto) {
  const datos = cargar();
  const key = usuarioId(id);
  const estado = datos[key];

  if (!estado?.activo) return false;

  const plantilla =
    BOSSES.find(b => b.nombre === estado.nombre) ||
    BOSSES[0];

  const accion = respuestaAUsuario(texto, estado);
  estado.turno++;

  if (accion.tipo === "rendirse") {
    delete datos[key];
    guardar(datos);

    await enviar(sock, chat,
`🏳️ *HAS ABANDONADO LA BATALLA.*

${estado.emoji} ${estado.nombre} baja lentamente su espada.

— Sabía que terminarías rindiéndote.

💨 La batalla ha terminado.

Puedes iniciar otro Boss usando:
*.boss*`);

    return true;
  }

  if (accion.tipo === "atacar") {
    let dano = danoAleatorio(250, 750);

    if (estado.fase === 2) dano += 100;
    if (estado.fase === 3) dano += 200;

    estado.vidaActual -= dano;
    estado.danoJugador += dano;

    if (estado.vidaActual <= 0) {
      estado.vidaActual = 0;

      const recompensa = 500 + Math.floor(Math.random() * 501);
      const xp = 200 + Math.floor(Math.random() * 201);

      delete datos[key];
      guardar(datos);

      await enviar(sock, chat,
`💥 *GOLPE FINAL.*

Tu ataque atraviesa la defensa del Boss.

${estado.emoji} *${estado.nombre}* retrocede.

— No... puede... ser...

El Boss deja caer su arma.

💥 *BOOOOOOM.*

La energía desaparece y el campo de batalla queda en silencio.

🏆 *¡HAS DERROTADO AL BOSS!*

━━━━━━━━━━━━━━━━━━━━

👹 Boss: ${estado.nombre}
⚔️ Daño causado: ${estado.danoJugador.toLocaleString()}

🎁 *RECOMPENSAS*
💰 +${recompensa} monedas
✨ +${xp} XP

🔥 *¡LA BATALLA HA TERMINADO!*`);

      return true;
    }

    if (estado.fase === 1 && estado.vidaActual <= estado.vidaMaxima * 0.66) {
      estado.fase = 2;
    } else if (estado.fase === 2 && estado.vidaActual <= estado.vidaMaxima * 0.33) {
      estado.fase = 3;
    }

    const respuestaBoss = plantilla.provocaciones[
      Math.floor(Math.random() * plantilla.provocaciones.length)
    ];

    guardar(datos);

    await enviar(sock, chat,
`⚔️ *TU ATAQUE IMPACTA.*

💥 Daño causado: *${dano}*

${estado.emoji} *${estado.nombre}*
❤️ Vida: ${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}

${estado.fase === 2 ? "🔥 *FASE 2 — EL BOSS AUMENTA SU PODER.*\n\n" : ""}
${estado.fase === 3 ? "☠️ *FASE FINAL — EL BOSS ESTÁ DESATANDO TODO SU PODER.*\n\n" : ""}

${respuestaBoss}

${plantilla.emoji} El Boss prepara su próximo movimiento...

💬 *¿Qué haces?*`);

    return true;
  }

  if (accion.tipo === "defender") {
    const dano = Math.floor(estado.ataque * 0.25);
    const bloqueo = Math.floor(estado.ataque * 0.75);

    estado.turno++;
    guardar(datos);

    await enviar(sock, chat,
`🛡️ *TE PREPARAS PARA DEFENDERTE.*

${plantilla.ataqueTexto[
      Math.floor(Math.random() * plantilla.ataqueTexto.length)
    ]}

💥 El golpe impacta contra tu defensa.

🛡️ Bloqueas aproximadamente *${bloqueo}* de daño.
❤️ Daño recibido: *${dano}*

${estado.emoji} El Boss retrocede.

— No podrás defenderte para siempre.

❤️ Boss: ${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}

💬 *¿Cuál será tu próximo movimiento?*`);

    return true;
  }

  if (accion.tipo === "esquivar") {
    const exito = Math.random() < 0.75;

    if (exito) {
      guardar(datos);

      await enviar(sock, chat,
`💨 *¡ESQUIVAS EL ATAQUE!*

${plantilla.ataqueTexto[
        Math.floor(Math.random() * plantilla.ataqueTexto.length)
      ]}

El ataque pasa justo a tu lado.

${estado.emoji} El Boss te mira sorprendido.

— Interesante...

⚔️ La batalla continúa.

❤️ Boss: ${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}

💬 *¿Qué haces ahora?*`);
    } else {
      const dano = danoAleatorio(
        Math.floor(estado.ataque * 0.35),
        estado.ataque
      );

      guardar(datos);

      await enviar(sock, chat,
`💨 *¡INTENTAS ESQUIVAR!*

Pero el Boss predice tu movimiento.

💥 *¡EL ATAQUE TE ALCANZA!*

❤️ Daño recibido: *${dano}*

${estado.emoji} ${plantilla.nombre} prepara otro movimiento.

— Demasiado lento.

❤️ Boss: ${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}

💬 *¿Qué haces?*`);
    }

    return true;
  }

  if (accion.tipo === "hablar") {
    const frase = plantilla.provocaciones[
      Math.floor(Math.random() * plantilla.provocaciones.length)
    ];

    guardar(datos);

    await enviar(sock, chat,
`💬 *TUS PALABRAS RESUENAN EN EL CAMPO DE BATALLA.*

${estado.emoji} ${plantilla.nombre} permanece en silencio durante unos segundos.

Luego sonríe.

${frase}

⚔️ El Boss levanta nuevamente su arma.

— Las palabras se acabarán. La batalla no.

❤️ Boss: ${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}

💬 *¿Qué responderás?*`);

    return true;
  }

  guardar(datos);

  await enviar(sock, chat,
`👹 *${plantilla.nombre} te observa.*

— No esperaba esa respuesta.

⚔️ El Boss prepara su espada.

💬 *¿Qué harás ahora?*`);

  return true;
}

async function boss(sock, chat, comando, args, id, msg) {
  const texto = obtenerTexto(msg);

  // Iniciar solamente con .boss
  if (comando === "boss") {
    return iniciarBoss(sock, chat, id);
  }

  // Estos alias permiten consultar el estado sin romper
  // la conversación narrativa.
  if (comando === "bossestado" || comando === "bossstatus") {
    const datos = cargar();
    const estado = datos[usuarioId(id)];

    if (!estado?.activo) {
      await enviar(sock, chat,
`👹 *NO HAY NINGÚN BOSS ACTIVO.*

Usa:
*.boss*`);
      return true;
    }

    await enviar(sock, chat,
`👹 *BOSS ACTIVO*

${estado.emoji} ${estado.nombre}

❤️ Vida: ${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}
🔥 Fase: ${estado.fase}
⚔️ Daño causado por ti: ${estado.danoJugador.toLocaleString()}
🎬 Turno: ${estado.turno}

💬 *Respóndele directamente para continuar.*`);

    return true;
  }

  // Si el usuario tiene una batalla activa y el mensaje
  // no es otro comando conocido, se trata como respuesta.
  const datos = cargar();
  const estado = datos[usuarioId(id)];

  if (estado?.activo && texto) {
    return procesarRespuesta(
      sock,
      chat,
      id,
      texto
    );
  }

  return false;
}

module.exports = boss;
