// =========================================
// 👹 TITANBOT - BOSS NARRATIVO INTERACTIVO
// =========================================
// .boss -> inicia una batalla
// Durante la batalla, el usuario responde
// normalmente. El bot interpreta su acción,
// narra la consecuencia anterior y prepara
// el siguiente ataque.
// =========================================

// =========================================
// ⚔️ REGLAS IMPORTANTES DEL BOSS
// =========================================

const REGLAS_BOSS = `
El jugador controla sus propias acciones.

NUNCA decidas lo que hace el jugador.

NUNCA escribas:
"esquivas"
"te golpea"
"logras escapar"
"fallas"

si el jugador todavía no respondió.

El trabajo del Boss es:

1. Narrar las consecuencias de la acción anterior del jugador.
2. Mostrar la reacción del Boss.
3. Preparar o lanzar un nuevo ataque.
4. TERMINAR SIEMPRE justo antes del resultado del ataque.

NO preguntar:
"¿Qué haces?"

NO dar opciones.

NO controlar al jugador.

El turno debe terminar dejando la acción pendiente.
`;

// =========================================
// 📁 SISTEMA
// =========================================

const fs = require("fs");
const path = require("path");

const databaseDir = path.join(__dirname, "..", "database");
const databasePath = path.join(databaseDir, "boss.json");

if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
}

// =========================================
// 💾 CARGAR BASE DE DATOS
// =========================================

function cargar() {
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

        return contenido.trim()
            ? JSON.parse(contenido)
            : {};

    } catch (error) {
        console.error(
            "❌ Error leyendo boss.json:",
            error
        );

        return {};
    }
}

// =========================================
// 💾 GUARDAR BASE DE DATOS
// =========================================

function guardar(datos) {
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
// 🔤 NORMALIZAR TEXTO
// =========================================

function normalizar(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// =========================================
// 📨 OBTENER TEXTO
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
// 👤 ID SEGURO
// =========================================

function usuarioId(id) {
    return String(id || "")
        .replace(/[^a-zA-Z0-9_.:@-]/g, "_");
}

// =========================================
// 🎲 DAÑO ALEATORIO
// =========================================

function danoAleatorio(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

// =========================================
// 👹 BOSSES
// =========================================

const BOSSES = [

    // =====================================
    // 🌑 SEÑOR DE LAS SOMBRAS
    // =====================================

    {
        nombre: "Señor de las Sombras",
        emoji: "👹",
        vida: 10000,
        ataque: 350,
        color: "🌑",

        intro: `
🌑 LAS NUBES CUBREN EL CIELO...

El viento comienza a soplar con fuerza y todo queda en silencio.

💥 BOOOOM...

El suelo comienza a temblar.

Entre una enorme nube de humo aparece una figura gigantesca.

👹 EL SEÑOR DE LAS SOMBRAS HA APARECIDO.

Sus ojos brillan en medio de la oscuridad mientras observa a todos los que se encuentran frente a él.

⚔️ Lentamente, levanta su enorme espada.

La espada comienza a emitir una energía oscura que hace temblar el suelo.

🔥 El Boss da un paso hacia adelante.

— ¿Quién se atreve a desafiarme?

Una fuerte explosión sacude el lugar.

🌑 La oscuridad comienza a extenderse por toda la zona.

El Señor de las Sombras levanta su espada y se prepara para atacar.

⚔️ LA BATALLA HA COMENZADO.
`,

        provocaciones: [
            "— ¿Eso es todo lo que tienes?",
            "— He enfrentado guerreros mucho más fuertes que tú.",
            "— Tu valor es interesante... tu fuerza todavía no.",
            "— Sigue intentándolo. Apenas has comenzado a conocer mi poder."
        ],

        ataqueTexto: [
            "⚔️ El Señor de las Sombras gira su espada y lanza un poderoso golpe.",
            "🌑 Una ráfaga oscura atraviesa el campo de batalla.",
            "💥 El Boss golpea el suelo y una onda de energía avanza hacia tu posición."
        ]
    },

    // =====================================
    // 🔥 DRAGÓN INFERNAL
    // =====================================

    {
        nombre: "Dragón Infernal",
        emoji: "🐉",
        vida: 15000,
        ataque: 500,
        color: "🔥",

        intro: `
🔥 EL CIELO COMIENZA A ARDER...

Una enorme sombra cubre la zona.

El aire se vuelve cada vez más caliente.

💥 BOOOOM...

Una criatura gigantesca desciende desde las nubes.

🐉 EL DRAGÓN INFERNAL HA DESPERTADO.

Sus alas provocan una ráfaga que levanta polvo y rocas.

🔥 Sus ojos se fijan en ti.

El Dragón abre lentamente sus enormes fauces.

— ¿Has venido a desafiarme?

Una llama ilumina todo el lugar.

🐉 Extiende sus alas y prepara sus garras.

🔥 EL COMBATE COMIENZA.
`,

        provocaciones: [
            "— Tu valentía me hace gracia.",
            "— ¿Crees que unas palabras pueden derrotar a un dragón?",
            "— Acércate. Quiero ver de qué estás hecho.",
            "— Has despertado algo que no podrás controlar."
        ],

        ataqueTexto: [
            "🔥 El Dragón concentra una enorme llamarada frente a ti.",
            "🐉 El Dragón extiende sus alas y se prepara para lanzarse al combate.",
            "💥 Una explosión de fuego comienza a formarse en el campo."
        ]
    },

    // =====================================
    // ⚡ TITAN-X
    // =====================================

    {
        nombre: "TITAN-X",
        emoji: "🤖",
        vida: 20000,
        ataque: 650,
        color: "⚡",

        intro: `
⚡ SISTEMA DE EMERGENCIA ACTIVADO...

Las luces comienzan a parpadear.

Un fuerte ruido metálico retumba en la distancia.

🤖 Una enorme máquina aparece entre el humo.

BEEP... BEEP...

🔴 Sus ojos se encienden.

🤖 TITAN-X HA DESPERTADO.

Su armadura comienza a cargarse.

⚡ Una espada de energía aparece en su mano.

TITAN-X te observa durante unos segundos.

— Objetivo localizado.

El Boss da un paso hacia adelante.

— Iniciando protocolo de combate.

⚔️ PREPÁRATE.
`,

        provocaciones: [
            "— Tus probabilidades de victoria son mínimas.",
            "— Analizando tu estrategia... resultado: insuficiente.",
            "— Interesante. Has conseguido superar mis cálculos.",
            "— Continúa. Necesito más datos sobre tu estilo de combate."
        ],

        ataqueTexto: [
            "⚡ TITAN-X concentra una descarga de energía en su espada.",
            "🤖 TITAN-X apunta directamente hacia tu posición.",
            "💥 Un pulso energético comienza a cargarse frente a ti."
        ]
    }
];

// =========================================
// 🎲 ELEGIR BOSS
// =========================================

function elegirBoss() {
    return BOSSES[
        Math.floor(Math.random() * BOSSES.length)
    ];
}

// =========================================
// 🧠 INTERPRETAR ACCIÓN
// =========================================

function respuestaAUsuario(texto) {

    const t = normalizar(texto);

    const atacar =
        /atac|golpe|pego|pegar|disparo|lanzo|espada|punet|puno|patada|corto|apuñ|fuego|magia|muerdo/.test(t);

    const defender =
        /defiend|bloque|escudo|prote|cubrir|cubrirme|parar/.test(t);

    const esquivar =
        /esquiv|salto|agacho|corro|apart|evito|rodar|rodillo/.test(t);

    const hablar =
        /habl|digo|respon|pregunt|quien|por que|porque|negocio|trato|amenaz/.test(t);

    const rendirse =
        /me rindo|rendicion|rendirme|abandono|huir|escapo/.test(t);

    if (rendirse) {
        return {
            tipo: "rendirse"
        };
    }

    if (atacar) {
        return {
            tipo: "atacar"
        };
    }

    if (defender) {
        return {
            tipo: "defender"
        };
    }

    if (esquivar) {
        return {
            tipo: "esquivar"
        };
    }

    if (hablar) {
        return {
            tipo: "hablar"
        };
    }

    // Si no reconoce claramente la acción,
    // NO se inventa una acción del jugador.
    return {
        tipo: "desconocido"
    };
}

// =========================================
// 📤 ENVIAR MENSAJE
// =========================================

async function enviar(sock, chat, texto) {
    await sock.sendMessage(chat, {
        text: texto
    });
}

// =========================================
// 👹 INICIAR BOSS
// =========================================

async function iniciarBoss(sock, chat, id) {

    const datos = cargar();
    const key = usuarioId(id);

    if (datos[key]?.activo) {

        const boss = datos[key];

        await enviar(
            sock,
            chat,

`👹 YA TIENES UN BOSS ACTIVO

${boss.emoji} ${boss.nombre}

❤️ Vida: ${boss.vidaActual.toLocaleString()} / ${boss.vidaMaxima.toLocaleString()}

💬 Responde directamente para continuar la batalla.

━━━━━━━━━━━━━━━━━━━━

⚔️ El Boss permanece frente a ti.`
        );

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

    await enviar(
        sock,
        chat,

`${plantilla.intro}

━━━━━━━━━━━━━━━━━━━━

${plantilla.emoji} BOSS: ${plantilla.nombre}

❤️ VIDA:
${plantilla.vida.toLocaleString()} / ${plantilla.vida.toLocaleString()}

⚔️ ATAQUE:
${plantilla.ataque}

━━━━━━━━━━━━━━━━━━━━

${plantilla.emoji} El Boss fija su mirada sobre ti.

Levanta lentamente su arma.

La energía comienza a concentrarse a su alrededor...

⚔️ Un nuevo ataque está a punto de comenzar...`
    );

    return true;
}

// =========================================
// ⚔️ PROCESAR RESPUESTA
// =========================================

async function procesarRespuesta(
    sock,
    chat,
    id,
    texto
) {

    const datos = cargar();
    const key = usuarioId(id);

    const estado = datos[key];

    if (!estado?.activo) {
        return false;
    }

    const plantilla =
        BOSSES.find(
            b => b.nombre === estado.nombre
        ) || BOSSES[0];

    const accion =
        respuestaAUsuario(texto);

    estado.turno++;

    // =====================================
    // 🏳️ RENDIRSE
    // =====================================

    if (accion.tipo === "rendirse") {

        delete datos[key];

        guardar(datos);

        await enviar(
            sock,
            chat,

`🏳️ LA BATALLA TERMINA

${estado.emoji} ${estado.nombre} baja lentamente su arma.

— Has decidido abandonar este combate.

🌑 La energía del campo comienza a desaparecer.

⚔️ BOSS: ${estado.nombre}

🔥 Puedes iniciar otra batalla usando:

.boss`
        );

        return true;
    }

    // =====================================
    // ⚔️ ATAQUE DEL JUGADOR
    // =====================================

    if (accion.tipo === "atacar") {

        const dano =
            danoAleatorio(250, 750);

        estado.vidaActual -= dano;
        estado.danoJugador += dano;

        if (estado.vidaActual <= 0) {

            estado.vidaActual = 0;

            const recompensa =
                500 +
                Math.floor(
                    Math.random() * 501
                );

            const xp =
                200 +
                Math.floor(
                    Math.random() * 201
                );

            delete datos[key];

            guardar(datos);

            await enviar(
                sock,
                chat,

`💥 GOLPE FINAL

Tu ataque atraviesa la defensa del Boss.

${estado.emoji} ${estado.nombre} retrocede.

— No... puede... ser...

El Boss deja caer lentamente su arma.

💥 BOOOOOOM.

La energía comienza a desaparecer.

🏆 ¡HAS DERROTADO AL BOSS!

━━━━━━━━━━━━━━━━━━━━

👹 Boss:
${estado.nombre}

⚔️ Daño causado:
${estado.danoJugador.toLocaleString()}

🎁 RECOMPENSAS

💰 +${recompensa} monedas
✨ +${xp} XP

🔥 ¡LA BATALLA HA TERMINADO!`
            );

            return true;
        }

        if (
            estado.fase === 1 &&
            estado.vidaActual <=
                estado.vidaMaxima * 0.66
        ) {

            estado.fase = 2;

        } else if (
            estado.fase === 2 &&
            estado.vidaActual <=
                estado.vidaMaxima * 0.33
        ) {

            estado.fase = 3;
        }

        const provocacion =
            plantilla.provocaciones[
                Math.floor(
                    Math.random() *
                    plantilla.provocaciones.length
                )
            ];

        const nuevoAtaque =
            plantilla.ataqueTexto[
                Math.floor(
                    Math.random() *
                    plantilla.ataqueTexto.length
                )
            ];

        guardar(datos);

        let faseTexto = "";

        if (estado.fase === 2) {
            faseTexto =
`🔥 FASE 2 — EL BOSS AUMENTA SU PODER.

`;
        }

        if (estado.fase === 3) {
            faseTexto =
`☠️ FASE FINAL — EL BOSS DESATA TODO SU PODER.

`;
        }

        await enviar(
            sock,
            chat,

`⚔️ TU ATAQUE

💥 Daño causado: ${dano}

${estado.emoji} ${estado.nombre}

❤️ Vida:
${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}

${faseTexto}${provocacion}

${nuevoAtaque}

⚠️ El ataque queda suspendido justo antes del resultado...`
        );

        return true;
    }

    // =====================================
    // 🛡️ DEFENDER
    // =====================================

    if (accion.tipo === "defender") {

        const nuevoAtaque =
            plantilla.ataqueTexto[
                Math.floor(
                    Math.random() *
                    plantilla.ataqueTexto.length
                )
            ];

        guardar(datos);

        await enviar(
            sock,
            chat,

`🛡️ TU ACCIÓN DEFENSIVA

${estado.emoji} ${estado.nombre} observa tu movimiento.

— Veamos cuánto tiempo puedes resistir.

El Boss cambia de postura.

${nuevoAtaque}

⚠️ El ataque queda suspendido antes de conocerse el resultado.

❤️ Boss:
${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}`
        );

        return true;
    }

    // =====================================
    // 💨 ESQUIVAR
    // =====================================

    if (accion.tipo === "esquivar") {

        const nuevoAtaque =
            plantilla.ataqueTexto[
                Math.floor(
                    Math.random() *
                    plantilla.ataqueTexto.length
                )
            ];

        guardar(datos);

        await enviar(
            sock,
            chat,

`💨 INTENTO DE EVASIÓN

${estado.emoji} ${estado.nombre} sigue atentamente tu movimiento.

— Interesante...

El Boss gira rápidamente y cambia el ángulo de su ataque.

${nuevoAtaque}

⚠️ El resultado de la acción queda pendiente.

❤️ Boss:
${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}`
        );

        return true;
    }

    // =====================================
    // 💬 HABLAR
    // =====================================

    if (accion.tipo === "hablar") {

        const frase =
            plantilla.provocaciones[
                Math.floor(
                    Math.random() *
                    plantilla.provocaciones.length
                )
            ];

        const nuevoAtaque =
            plantilla.ataqueTexto[
                Math.floor(
                    Math.random() *
                    plantilla.ataqueTexto.length
                )
            ];

        guardar(datos);

        await enviar(
            sock,
            chat,

`💬 TUS PALABRAS RESUENAN EN EL CAMPO DE BATALLA.

${estado.emoji} ${plantilla.nombre} permanece en silencio durante unos segundos.

${frase}

— Las palabras no cambiarán el destino de este combate.

El Boss vuelve a levantar su arma.

${nuevoAtaque}

⚠️ El resultado del ataque queda pendiente.

❤️ Boss:
${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}`
        );

        return true;
    }

    // =====================================
    // ❓ ACCIÓN NO RECONOCIDA
    // =====================================

    guardar(datos);

    await enviar(
        sock,
        chat,

`👹 ${plantilla.nombre} permanece inmóvil.

— No entiendo tu movimiento.

La oscuridad comienza a concentrarse alrededor del Boss.

${plantilla.ataqueTexto[
    Math.floor(
        Math.random() *
        plantilla.ataqueTexto.length
    )
]}

⚠️ El ataque queda pendiente de resultado.`
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
    // .boss
    // =====================================

    if (comando === "boss") {

        return iniciarBoss(
            sock,
            chat,
            id
        );
    }

    // =====================================
    // .bossestado
    // =====================================

    if (
        comando === "bossestado" ||
        comando === "bossstatus"
    ) {

        const datos = cargar();

        const estado =
            datos[usuarioId(id)];

        if (!estado?.activo) {

            await enviar(
                sock,
                chat,

`👹 NO HAY NINGÚN BOSS ACTIVO.

Usa:

.boss`
            );

            return true;
        }

        await enviar(
            sock,
            chat,

`👹 BOSS ACTIVO

${estado.emoji} ${estado.nombre}

❤️ Vida:
${estado.vidaActual.toLocaleString()} / ${estado.vidaMaxima.toLocaleString()}

🔥 Fase:
${estado.fase}

⚔️ Daño causado:
${estado.danoJugador.toLocaleString()}

🎬 Turno:
${estado.turno}

━━━━━━━━━━━━━━━━━━━━

${estado.emoji} El Boss espera el siguiente movimiento.`
        );

        return true;
    }

    // =====================================
    // 💬 RESPUESTA NARRATIVA
    // =====================================

    const datos = cargar();

    const estado =
        datos[usuarioId(id)];

    if (
        estado?.activo &&
        texto
    ) {

        return procesarRespuesta(
            sock,
            chat,
            id,
            texto
        );
    }

    return false;
}

// =========================================
// 📦 EXPORTAR
// =========================================

module.exports = boss;
