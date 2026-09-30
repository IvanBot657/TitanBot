// ============================================
// 🎉 TITANBOT - SISTEMA DE EVENTOS
// ============================================

const {
    getAggregateVotesInPollMessage
} = require("@whiskeysockets/baileys");

const eventosActivos = new Map();
const encuestasActivas = new Map();

const TIEMPO_VOTACION = 50 * 60 * 1000;
const TIEMPO_EVENTO = 10 * 60 * 1000;

const misiones = [
    {
        nombre: "🗺️ Búsqueda del Tesoro",
        premio: 500
    },
    {
        nombre: "🌑 Exploración Misteriosa",
        premio: 700
    },
    {
        nombre: "🏛️ Templo Perdido",
        premio: 800
    },
    {
        nombre: "👑 Reino Oculto",
        premio: 1000
    },
    {
        nombre: "🌙 Noche Misteriosa",
        premio: 600
    }
];

// ============================================
// ▶️ INICIAR EVENTO
// ============================================

async function iniciarEvento(sock, chat) {

    if (!chat.endsWith("@g.us")) {
        await sock.sendMessage(chat, {
            text: "❌ Este comando solo funciona en grupos."
        });
        return true;
    }

    if (eventosActivos.has(chat)) {
        await sock.sendMessage(chat, {
            text: "⚠️ Ya hay un evento activo en este grupo."
        });
        return true;
    }

    try {

        const metadata = await sock.groupMetadata(chat);

        const participantes = metadata.participants.map(p => p.id);

        const botJid = sock.user?.id;

        const botParticipante = metadata.participants.find(
            p => p.id === botJid ||
                 p.jid === botJid
        );

        const botEsAdmin =
            botParticipante?.admin === "admin" ||
            botParticipante?.admin === "superadmin";

        eventosActivos.set(chat, {
            iniciado: Date.now(),
            botEsAdmin
        });

        // ========================================
        // 📢 ANUNCIO
        // ========================================

        await sock.sendMessage(chat, {
            text:
`🎉 *EVENTO SORPRESA* 🎉

⚡ *TITANBOT HA ACTIVADO UN EVENTO*

🌑 *NOCHE MISTERIOSA*

━━━━━━━━━━━━━━━━━━
🗳️ Primero debemos saber:
*¿QUIÉNES JUEGAN?*
━━━━━━━━━━━━━━━━━━

🎮 Vota en la encuesta para participar.

⏱️ La votación permanecerá abierta durante *50 MINUTOS*.

📜 *REGLAS*
• Respeta a los demás participantes.
• No abandones la actividad a mitad del evento.
• Sigue las instrucciones de TITAN.
• Al finalizar la votación comenzará la Noche Misteriosa.

🔥 ¡QUE COMIENCE EL EVENTO!`,
            mentions: participantes
        });

        // ========================================
        // 🗳️ ENCUESTA
        // ========================================

        const poll = await sock.sendMessage(chat, {
            poll: {
                name: "🎮 ¿QUIÉNES JUEGAN?",
                values: [
                    "🎮 Yo juego",
                    "❌ No juego"
                ],
                selectableCount: 1
            }
        });

        if (!poll?.key?.id) {
            await sock.sendMessage(chat, {
                text: "❌ No pude crear la encuesta."
            });

            eventosActivos.delete(chat);
            return true;
        }

        encuestasActivas.set(`${chat}:${poll.key.id}`, {
            chat,
            pollMessage: poll,
            iniciado: Date.now()
        });

        // ========================================
        // ⏱️ ESPERAR 50 MINUTOS
        // ========================================

        setTimeout(async () => {

            await finalizarVotacion(sock, chat, poll);

        }, TIEMPO_VOTACION);

        return true;

    } catch (error) {

        console.error("❌ ERROR EVENTO:", error);

        eventosActivos.delete(chat);

        await sock.sendMessage(chat, {
            text: "❌ Ocurrió un error al iniciar el evento."
        }).catch(() => {});

        return true;
    }
}

// ============================================
// 🗳️ FINALIZAR VOTACIÓN
// ============================================

async function finalizarVotacion(sock, chat, poll) {

    const encuestaKey = `${chat}:${poll.key.id}`;
    const encuesta = encuestasActivas.get(encuestaKey);

    if (!encuesta) return;

    try {

        const mensajeEncuesta = poll.message;

        const pollUpdates = encuesta.pollUpdates || [];

        const votos = getAggregateVotesInPollMessage({
            message: mensajeEncuesta,
            pollUpdates
        });

        const opcionJugar = votos.find(
            voto => voto.name === "🎮 Yo juego"
        );

        const jugadores = opcionJugar?.voters || [];

        encuestasActivas.delete(encuestaKey);

        // ========================================
        // 👑 PROMOVER JUGADORES
        // ========================================

        if (jugadores.length > 0) {

            const metadata = await sock.groupMetadata(chat);

            const botParticipante = metadata.participants.find(
                p => p.id === sock.user?.id ||
                     p.jid === sock.user?.id
            );

            const botEsAdmin =
                botParticipante?.admin === "admin" ||
                botParticipante?.admin === "superadmin";

            if (botEsAdmin) {

                const promovidos = [];

                for (const jugador of jugadores) {

                    try {

                        await sock.groupParticipantsUpdate(
                            chat,
                            [jugador],
                            "promote"
                        );

                        promovidos.push(jugador);

                    } catch (error) {

                        console.log(
                            "No se pudo promover:",
                            jugador,
                            error.message
                        );
                    }
                }

                let textoPromocion =
`⏰ *¡VOTACIÓN TERMINADA!*

🎮 Jugadores registrados: *${jugadores.length}*

👑 Los participantes que eligieron *"Yo juego"* han recibido rango de administrador.

🌑 *LA NOCHE MISTERIOSA COMIENZA AHORA...*`;

                if (promovidos.length !== jugadores.length) {
                    textoPromocion +=
`\n\n⚠️ Algunos jugadores no pudieron ser promovidos.`;
                }

                await sock.sendMessage(chat, {
                    text: textoPromocion
                });

            } else {

                await sock.sendMessage(chat, {
                    text:
`⏰ *¡VOTACIÓN TERMINADA!*

🎮 Jugadores registrados: *${jugadores.length}*

⚠️ TITAN no tiene permisos de administrador, así que no puede promoverlos.

🌑 *LA NOCHE MISTERIOSA COMIENZA...*`
                });
            }

        } else {

            await sock.sendMessage(chat, {
                text:
`⏰ *VOTACIÓN TERMINADA*

😴 Nadie eligió *"🎮 Yo juego"*.

🌑 Aun así...

*LA NOCHE MISTERIOSA COMIENZA.*`
            });
        }

        // ========================================
        // 🌑 COMENZAR EVENTO DE 10 MINUTOS
        // ========================================

        await comenzarNocheMisteriosa(sock, chat);

    } catch (error) {

        console.error(
            "❌ ERROR FINALIZANDO VOTACIÓN:",
            error
        );

        await sock.sendMessage(chat, {
            text:
                "⚠️ La votación terminó, pero ocurrió un error al procesar los participantes."
        }).catch(() => {});

        await comenzarNocheMisteriosa(sock, chat);
    }
}

// ============================================
// 🌑 NOCHE MISTERIOSA
// ============================================

async function comenzarNocheMisteriosa(sock, chat) {

    try {

        const evento = eventosActivos.get(chat);

        if (!evento) return;

        const metadata = await sock.groupMetadata(chat);

        const botParticipante = metadata.participants.find(
            p => p.id === sock.user?.id ||
                 p.jid === sock.user?.id
        );

        const botEsAdmin =
            botParticipante?.admin === "admin" ||
            botParticipante?.admin === "superadmin";

        // ========================================
        // 🔒 CERRAR GRUPO
        // ========================================

        if (botEsAdmin) {

            await sock.groupSettingUpdate(
                chat,
                "announcement"
            );

            await sock.sendMessage(chat, {
                text:
`🔒 *EL GRUPO HA SIDO CERRADO*

🌑 *NOCHE MISTERIOSA*

🎯 Las misiones comenzarán ahora.

⏱️ Duración:
*10 MINUTOS*

⚡ ¡Prepárense!`
            });

        } else {

            await sock.sendMessage(chat, {
                text:
`🌑 *NOCHE MISTERIOSA*

⚠️ TITAN no tiene permisos para cerrar el grupo.

🎯 Las misiones comenzarán ahora.

⏱️ Duración: *10 MINUTOS*`
            });
        }

        // ========================================
        // 🎯 MISIÓN
        // ========================================

        const mision =
            misiones[Math.floor(Math.random() * misiones.length)];

        await new Promise(resolve =>
            setTimeout(resolve, 3000)
        );

        await sock.sendMessage(chat, {
            text:
`🎯 *MISIÓN ACTIVADA*

${mision.nombre}

💰 Recompensa:
*${mision.premio} monedas*

⏱️ Tienen *10 minutos* para completar la actividad.

🔥 ¡QUE COMIENCE!`
        });

        // ========================================
        // ⏳ MITAD DEL EVENTO
        // ========================================

        setTimeout(async () => {

            await sock.sendMessage(chat, {
                text:
`🌑 *LA NOCHE MISTERIOSA CONTINÚA...*

⏳ Han pasado *5 minutos*.

🔥 ¡Todavía queda tiempo!
🎯 Continúen con la misión.`
            }).catch(() => {});

        }, 5 * 60 * 1000);

        // ========================================
        // 🏁 FINAL
        // ========================================

        setTimeout(async () => {

            try {

                if (botEsAdmin) {

                    await sock.groupSettingUpdate(
                        chat,
                        "not_announcement"
                    );
                }

                await sock.sendMessage(chat, {
                    text:
`🎉 *EVENTO TERMINADO* 🎉

🌑 *Noche Misteriosa finalizada.*

⏱️ Duración: *10 minutos*

🏆 Gracias a todos los participantes.

⚡ *TITANBOT*
¡Nos vemos en el próximo evento!`
                });

                eventosActivos.delete(chat);

            } catch (error) {

                console.error(
                    "❌ ERROR CERRANDO EVENTO:",
                    error
                );
            }

        }, TIEMPO_EVENTO);

    } catch (error) {

        console.error(
            "❌ ERROR NOCHE MISTERIOSA:",
            error
        );
    }
}

// ============================================
// 🗳️ RECIBIR ACTUALIZACIONES DE VOTOS
// ============================================

function procesarVotos(updates) {

    for (const { key, update } of updates) {

        if (!update?.pollUpdates) continue;

        const chat = key.remoteJid;

        const encuestaKey = `${chat}:${key.id}`;

        const encuesta = encuestasActivas.get(encuestaKey);

        if (!encuesta) continue;

        if (!encuesta.pollUpdates) {
            encuesta.pollUpdates = [];
        }

        encuesta.pollUpdates.push(
            ...update.pollUpdates
        );
    }
}

// ============================================
// 📤 EXPORTAR
// ============================================

module.exports = iniciarEvento;
module.exports.procesarVotos = procesarVotos;
module.exports.eventosActivos = eventosActivos;
module.exports.encuestasActivas = encuestasActivas;
