const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");
const QRCode = require("qrcode");
const fs = require("fs");

const config = require("./config");

const inicio = require("./commands/inicio");
const ejecutarMisterio = require("./commands/misterio");
const usuario = require("./commands/usuario");
const economia = require("./commands/economia");
const misiones = require("./commands/misiones");
const juegos = require("./commands/juegos");
const prediccion = require("./commands/prediccion");
const roleplay = require("./commands/roleplay");
const diversion = require("./commands/diversion");
const personalidad = require("./commands/personalidad");
const anime = require("./commands/anime");
const musica = require("./commands/musica");
const grupos = require("./commands/grupos");
const eventos = require("./commands/eventos");
const sticker = require("./commands/sticker");
const historia = require("./commands/historia");
const rankingpremium = require("./commands/rankingpremium");
const racha = require("./commands/racha");
const titulos = require("./commands/titulos");
const cartas = require("./commands/cartas");
const herramientas = require("./commands/herramientas");
const ajustes = require("./commands/ajustes");
const owner = require("./commands/owner");

const PORT = process.env.PORT || 10000;

let qrActual = null;
let codigoVinculacion = null;
let sockActual = null;
let authStateActual = null;

let estado = "🟡 Iniciando...";
let iniciando = false;


// =====================================================
// DATABASE DE GRUPOS
// =====================================================

const GROUPS_DB = "./database/groups.json";

function cargarGrupos() {
  if (!fs.existsSync(GROUPS_DB)) {
    fs.writeFileSync(GROUPS_DB, "{}");
  }

  try {
    return JSON.parse(
      fs.readFileSync(GROUPS_DB, "utf8")
    );
  } catch {
    return {};
  }
}

function guardarGrupos(db) {
  fs.writeFileSync(
    GROUPS_DB,
    JSON.stringify(db, null, 2)
  );
}

function registrarGrupo(chat) {

  if (!chat || !chat.endsWith("@g.us")) {
    return;
  }

  const db = cargarGrupos();

  if (!db[chat]) {

    db[chat] = {
      bienvenida: false,
      despedida: false,
      reglas: "No hay reglas configuradas."
    };

    guardarGrupos(db);

    console.log(
      "👥 Grupo registrado:",
      chat
    );
  }
}


// =====================================================
// SERVIDOR WEB
// =====================================================

const server = http.createServer(async (req, res) => {

  // ===================================================
  // PÁGINA PRINCIPAL
  // ===================================================

  if (req.url === "/") {

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
<!DOCTYPE html>
<html lang="es">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>${config.nombre}</title>

<style>

body {
  margin: 0;
  padding: 20px;
  background: #111;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
}

.container {
  max-width: 500px;
  margin: auto;
}

h1 {
  margin-bottom: 5px;
}

.estado {
  margin: 15px;
  padding: 10px;
  border-radius: 10px;
  background: #222;
}

img {
  width: 280px;
  max-width: 90%;
  margin-top: 15px;
}

input {
  width: 90%;
  padding: 12px;
  margin-top: 10px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
}

button {
  margin-top: 10px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.codigo {
  margin-top: 15px;
  padding: 15px;
  background: #222;
  border-radius: 10px;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 4px;
}

</style>

</head>

<body>

<div class="container">

<h1>🤖 ${config.nombre}</h1>

<p>📦 Versión ${config.version}</p>

<div class="estado" id="estado">
${estado}
</div>

<h2>📱 Conectar por QR</h2>

<img id="qr" src="" alt="QR">

<hr>

<h2>🔢 Conectar con número</h2>

<p>Escribe tu número con código de país.</p>

<p>Ejemplo: 573001234567</p>

<input
  id="numero"
  type="text"
  placeholder="573001234567"
>

<br>

<button onclick="vincular()">
🔗 Obtener código
</button>

<div id="codigo"></div>

</div>

<script>

async function actualizar() {

  try {

    const respuesta =
      await fetch("/qr-data");

    const data =
      await respuesta.json();

    document.getElementById("estado").innerText =
      data.estado || "🟡 Esperando...";

    if (data.qr) {

      document.getElementById("qr").src =
        data.qr;

    } else {

      document.getElementById("qr").src =
        "";

    }

    if (data.codigo) {

      document.getElementById("codigo").innerHTML =
        '<div class="codigo">' +
        data.codigo +
        '</div>';

    }

  } catch (error) {

    console.log(error);

  }

}


async function vincular() {

  const numero =
    document
      .getElementById("numero")
      .value
      .trim();

  if (!numero) {

    alert("Escribe tu número.");

    return;
  }

  document.getElementById("codigo").innerHTML =
    "⏳ Generando código...";

  try {

    const respuesta =
      await fetch(
        "/pairing?numero=" +
        encodeURIComponent(numero)
      );

    const data =
      await respuesta.json();

    if (data.codigo) {

      document.getElementById("codigo").innerHTML =
        '<div class="codigo">' +
        data.codigo +
        '</div>';

    } else {

      document.getElementById("codigo").innerHTML =
        "❌ " +
        (
          data.error ||
          "No se pudo generar."
        );

    }

  } catch (error) {

    document.getElementById("codigo").innerHTML =
      "❌ Error de conexión.";

  }

}


actualizar();

setInterval(
  actualizar,
  3000
);

</script>

</body>

</html>
`);

    return;
  }


  // ===================================================
  // QR DATA
  // ===================================================

  if (req.url === "/qr-data") {

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        estado,
        qr: qrActual,
        codigo: codigoVinculacion
      })
    );

    return;
  }


  // ===================================================
  // PAIRING CODE
  // ===================================================

  if (req.url.startsWith("/pairing")) {

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    try {

      const url =
        new URL(
          req.url,
          `http://localhost:${PORT}`
        );

      let numero =
        url.searchParams.get("numero");

      if (!numero) {

        res.end(
          JSON.stringify({
            error:
              "Número no proporcionado."
          })
        );

        return;
      }

      numero =
        numero.replace(
          /\D/g,
          ""
        );

      if (numero.length < 10) {

        res.end(
          JSON.stringify({
            error:
              "Número inválido."
          })
        );

        return;
      }

      if (
        !sockActual ||
        !authStateActual
      ) {

        res.end(
          JSON.stringify({
            error:
              "El bot todavía está iniciando."
          })
        );

        return;
      }

      if (
        authStateActual.creds.registered
      ) {

        res.end(
          JSON.stringify({
            error:
              "Este bot ya está vinculado."
          })
        );

        return;
      }

      codigoVinculacion =
        await sockActual.requestPairingCode(
          numero
        );

      estado =
        "🔢 Código de vinculación generado";

      res.end(
        JSON.stringify({
          codigo:
            codigoVinculacion
        })
      );

    } catch (error) {

      console.log(
        "Error pairing:",
        error
      );

      res.end(
        JSON.stringify({
          error:
            "No se pudo generar el código."
        })
      );
    }

    return;
  }


  // ===================================================
  // 404
  // ===================================================

  res.writeHead(404);

  res.end("404");
});


server.listen(
  PORT,
  () => {

    console.log(
      `🌐 Servidor iniciado en puerto ${PORT}`
    );

  }
);


// =====================================================
// BOT
// =====================================================

async function iniciarBot() {

  if (iniciando) {
    return;
  }

  iniciando = true;

  try {

    const {
      state,
      saveCreds
    } =
      await useMultiFileAuthState(
        "./session"
      );


    authStateActual = {
      creds: state.creds,
      keys: state.keys
    };


    const sock =
      makeWASocket({

        auth: state,

        logger:
          P({
            level: "silent"
          }),

        printQRInTerminal: false

      });


    sockActual = sock;


    // =================================================
    // GUARDAR SESIÓN
    // =================================================

    sock.ev.on(
      "creds.update",
      saveCreds
    );


    // =================================================
    // CONEXIÓN
    // =================================================

    sock.ev.on(
      "connection.update",
      async ({
        connection,
        lastDisconnect,
        qr
      }) => {

        // -------------------------
        // QR
        // -------------------------

        if (qr) {

          qrActual =
            await QRCode.toDataURL(
              qr
            );

          estado =
            "📱 Escanea el código QR";

          console.log(
            "📱 Nuevo QR disponible"
          );
        }


        // -------------------------
        // CONECTADO
        // -------------------------

        if (
          connection === "open"
        ) {

          qrActual = null;

          codigoVinculacion =
            null;

          estado =
            "🟢 TitanBot conectado";

          console.log(
            "🟢 TitanBot conectado correctamente"
          );

          iniciando = false;
        }


        // -------------------------
        // DESCONECTADO
        // -------------------------

        if (
          connection === "close"
        ) {

          const codigo =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          console.log(
            "🔴 Conexión cerrada:",
            codigo
          );

          iniciando = false;


          if (
            codigo !==
            DisconnectReason.loggedOut
          ) {

            estado =
              "🟡 Reconectando...";

            setTimeout(
              () => {
                iniciarBot();
              },
              3000
            );

          } else {

            estado =
              "🔴 Sesión cerrada";

          }
        }

      }
    );


    // =================================================
    // MENSAJES
    // =================================================

    sock.ev.on(
      "messages.upsert",
      async ({
        messages
      }) => {

        try {

          for (
            const msg
            of messages
          ) {

            if (!msg) {
              continue;
            }

            if (!msg.message) {
              continue;
            }

            if (
              msg.key &&
              msg.key.fromMe
            ) {
              continue;
            }


            // =========================================
            // CHAT
            // =========================================

            const chat =
              msg.key.remoteJid;

            if (!chat) {
              continue;
            }


            // =========================================
            // TEXTO
            // =========================================

            const texto =
              msg.message.conversation ||
              msg.message.extendedTextMessage?.text ||
              msg.message.imageMessage?.caption ||
              msg.message.videoMessage?.caption ||
              "";


            if (!texto) {
              continue;
            }


            // =========================================
            // PREFIJO
            // =========================================

            if (
              !texto.startsWith(
                config.prefijo
              )
            ) {
              continue;
            }


            const contenido =
              texto
                .slice(
                  config.prefijo.length
                )
                .trim();


            if (!contenido) {
              continue;
            }


            const partes =
              contenido.split(/\s+/);


            const comando =
              partes
                .shift()
                .toLowerCase();


            const args =
              partes;


            // =========================================
            // USUARIO
            // =========================================

            const id =
              msg.key.participant ||
              msg.key.remoteJid;


            // =========================================
            // GRUPO
            // =========================================

            const esGrupo =
              chat.endsWith("@g.us");


            let esAdmin = false;

            let metadata = null;


            if (esGrupo) {

              // Registrar automáticamente el grupo
              registrarGrupo(chat);


              try {

                metadata =
                  await sock.groupMetadata(
                    chat
                  );


                const participante =
                  metadata.participants.find(
                    p =>
                      p.id === id
                  );


                esAdmin =
                  participante?.admin === "admin" ||
                  participante?.admin === "superadmin";

              } catch (error) {

                console.log(
                  "Error obteniendo grupo:",
                  error
                );

              }

            }


            // =========================================
            // XP
            // =========================================

            try {

              const resultadoXP =
                usuario.ganarXP(id);


              if (
                resultadoXP &&
                resultadoXP.subioNivel
              ) {

                await sock.sendMessage(
                  chat,
                  {
                    text:
`🎉 ¡SUBISTE DE NIVEL!

👤 Usuario:
@${id.split("@")[0]}

⭐ Nivel:
${resultadoXP.nivel}

💰 Recompensa:
+${resultadoXP.recompensaTotal} monedas`,
                    mentions: [
                      id
                    ]
                  }
                );

              }

            } catch (error) {

              console.log(
                "Error XP:",
                error
              );

            }


            // =========================================
            // COMANDOS
            // =========================================

            let ejecutado = false;


            // =========================================
            // 📖 MENÚ DIRECTO (RESPALDO)
            // =========================================
            // Evita que .menu dependa de que inicio.js devuelva
            // correctamente el resultado.

            if (!ejecutado && ["menu", "help", "comandos"].includes(comando)) {

              const menuDirecto = `
╭━━━━━━━━━━━━━━━━━━━━╮
┃ ⚡ *TITANBOT* 🤖
╰━━━━━━━━━━━━━━━━━━━━╯

👤 *PERFIL*
• .id
• .perfil
• .completarperfil
• .foto

🎴 *ANIME*
• .s
• .anime
• .waifu
• .quote

💰 *ECONOMÍA*
• .saldo
• .diario
• .trabajar
• .robar
• .pagar
• .tienda
• .comprar
• .inventario
• .topmonedas

⭐ *NIVEL*
• .xp
• .nivel
• .rank
• .topxp
• .logros
• .racha
• .titulos

🔎 *MISTERIO*
• .detective
• .misterio
• .caso
• .pistas
• .investigar
• .culpable

🎮 *JUEGOS*
• .dado
• .moneda
• .ppt
• .numero
• .quiz
• .reto
• .verdad
• .pregunta

🎭 *ROLEPLAY*
• .abrazar
• .besar
• .golpear
• .patada
• .saludo
• .felicitar
• .reir
• .llorar
• .enojado

🎵 *MÚSICA*
• .play

📖 *HISTORIA*
• .historia

🏆 *RANKING PREMIUM*
• .rankingpremium

🃏 *CARTAS*
• .carta
• .cartas

👥 *GRUPO*
• .antilink
• .welcome
• .goodbye
• .admins
• .infogrupo
• .tagall
• .hidetag
• .linkgrupo
• .promote
• .demote
• .kick

🛠️ *UTILIDADES*
• .ping
• .hora
• .fecha
• .calc
• .say
• .stickerinfo

⚡ Escribe *.todos* para ver más comandos.
`;

              await sock.sendMessage(chat, {
                text: menuDirecto
              });

              ejecutado = true;

            }


            // =========================================
            // INICIO
            // =========================================

            if (!ejecutado) {

              const resultado =
                await inicio(
                  sock,
                  chat,
                  comando,
                  args,
                  id,
                  esGrupo,
                  esAdmin
                );


              if (
                resultado !== false
              ) {

                ejecutado = true;

              }

            }


            // =========================================
            // 🔎 MISTERIO / DETECTIVE
            // =========================================

            if (!ejecutado) {

              const resultado = await ejecutarMisterio(
                sock,
                chat,
                comando,
                args,
                id,
                esGrupo,
                esAdmin,
                msg
              );

              if (resultado) {
                ejecutado = true;
              }

            }


            // =========================================
            // USUARIO
            // =========================================

            if (!ejecutado) {

              const resultado =
                await usuario(
                  sock,
                  chat,
                  comando,
                  args,
                  id
                );


              if (
                resultado !== false
              ) {

                ejecutado = true;

              }

            }


            // =========================================
            // ECONOMÍA
            // =========================================

            if (!ejecutado) {

              const resultado =
                await economia(
                  sock,
                  chat,
                  comando,
                  args,
                  id,
                  msg
                );


              if (
                resultado !== false
              ) {

                ejecutado = true;

              }

            }
            
            // =========================================
            // 🎯 MISIONES
            // =========================================

            if (!ejecutado) {

             const resultado = await misiones(
               sock,
               chat,
               comando,
               args,
               id,
               msg
             );

             if (resultado) {
              ejecutado = true;
            }

          }


            // =========================================
            // JUEGOS
            // =========================================

            if (!ejecutado) {

              const resultado =
                await juegos(
                  sock,
                  chat,
                  comando,
                  args,
                  id
                );


              if (
                resultado !== false
              ) {

                ejecutado = true;

              }

            }
            
            // =========================================
            // 🔮 PREDICCIÓN
           // =========================================

           if (!ejecutado) {

            const resultado = await prediccion(
              sock,
              chat,
              comando,
              args,
              id,
              msg
           );

           if (resultado) {
            ejecutado = true;
          }

        }
            
           // =========================================
           // 🎭 PERSONALIDAD
           // =========================================

           if (!ejecutado) {

           const resultado = await personalidad(
             sock,
             chat,
             comando,
             args,
             id,
             msg
           );

           if (resultado) {
            ejecutado = true;
         }

      }

           // =========================================
           // 🎭 ROLEPLAY
          // =========================================

          if (!ejecutado) {
           const resultado = await roleplay(
             sock,
             chat,
             comando,
             args,
             id,
             msg
          );

       if (resultado) {
       ejecutado = true;
      }
 
    }  

            // =========================================
            // DIVERSIÓN
            // =========================================

            if (!ejecutado) {

             const resultado =
               await diversion(
                 sock,
                 chat,
                 comando,
                 args,
                 id,
                 msg
               );

            if (resultado) {
            ejecutado = true;
          }

        }

            // =========================================
            // ANIME
            // =========================================

            if (!ejecutado) {

              const resultado =
                await anime(
                  sock, 
                  chat, 
                  comando, 
                  args, 
                  id,
                  msg
                );


              if (
                resultado !== false
              ) {

                ejecutado = true;

              }

            }

            // =========================================
            // MÚSICA 
            // =========================================

            if (!ejecutado) {
              const resultado = await musica(
                sock,
                chat,
                comando,
                args,
                id
              );

             if (resultado) {
               ejecutado = true;
               }
             }
            
             module.exports = musica;
             module.exports.musica = musica;
            
            // =========================================
            // GRUPOS
            // =========================================

             if (!ejecutado) {
              const resultado = await grupos(
                 sock,
                 chat,
                 comando,
                 args,
                 id,
                 esGrupo,
                 esAdmin,
                 msg
               );

               if (resultado) {
                 ejecutado = true;
                }
             }


            // ========================================
            // EVENTOS DEL GRUPO
           // ========================================

           if (!ejecutado) {
            const resultado = await eventos(
               sock,
               msg,
               comando,
               args
             );

             if (resultado !== false) {
              ejecutado = true;
            }
        }

            // ========================================
            // STICKER
           // ========================================

           if (!ejecutado) {
            const comandosSticker = [
              "sticker",
              "stickertexto",
              "toimg",
              "take"
           ];

           if (comandosSticker.includes(comando)) {
                  const resultado = await sticker(
                    sock,
                    msg,
                    comando,
                    args
                 );

                 if (resultado !== false) {
                 ejecutado = true;
              }
           }
        }
            // =========================================
           // 📖 HISTORIA
           // =========================================

           if (!ejecutado) {

            const resultado = await historia(
              sock,
              chat,
              comando,
              args,
              id,
              msg
            );

            if (resultado) {
             ejecutado = true;
          }

       }
            
          // =========================================
          // 👑 RANKING PREMIUM
          // =========================================

          if (!ejecutado) {

           const resultado = await 
             rankingpremium(
             sock,
             chat,
             comando,
             args,
             id,
             msg
           );

           if (resultado) {
            ejecutado = true;
          }

       }
            // =========================================
            // 🐾 RACHA
            // =========================================

            if (!ejecutado) {

             const resultado = await racha(
               sock,
               chat,
               comando,
               args,
               id,
               msg
            );

            if (resultado) {
             ejecutado = true;
           }

        }
            // =========================================
            // 🎖️ TÍTULOS
            // =========================================

            if (!ejecutado) {

            const resultado = await titulos(
              sock,
              chat,
              comando,
              args,
              id,
              msg
           );

           if (resultado) {
            ejecutado = true;
          }

        }
            
          // =========================================
          // 🃏 CARTAS
          // =========================================

          if (!ejecutado) {

          const resultado = await cartas(
            sock,
            chat,
            comando,
            args,
            id,
            msg
          );

          if (resultado) {
           ejecutado = true;
         }

       }
            
            // =========================================
            // HERRAMIENTAS
            // =========================================

            if (!ejecutado) {

              const resultado =
                await herramientas(
                  sock,
                  chat,
                  comando,
                  args,
                  id
                );


              if (
                resultado !== false
              ) {

                ejecutado = true;

              }

            }


            // =========================================
            // AJUSTES
            // =========================================

            if (!ejecutado) {

              const resultado =
                await ajustes(
                  sock,
                  chat,
                  comando,
                  args,
                  id,
                  esGrupo,
                  esAdmin
                );


              if (
                resultado !== false
              ) {

                ejecutado = true;

              }

            }


            // =========================================
            // OWNER
            // =========================================

            if (!ejecutado) {

              const resultado =
                await owner(
                  sock,
                  chat,
                  comando,
                  args,
                  id
                );


              if (
                resultado !== false
              ) {

                ejecutado = true;

              }

            }


            // =========================================
            // DESCONOCIDO
            // =========================================

            if (!ejecutado) {

              await sock.sendMessage(
                chat,
                {
                  text:
`❌ Comando no encontrado.

Usa:

.menu

para ver todos los comandos disponibles.`
                }
              );

            }

          }

        } catch (error) {

          console.log(
            "❌ Error procesando mensaje:",
  error
          );

        }

      }
    );
    
     // =================================================
    // BIENVENIDA / DESPEDIDA
    // =================================================

    sock.ev.on(
      "group-participants.update",
      async ({
        id: grupoId,
        participants,
        action
      }) => {

        try {

          // Registrar el grupo automáticamente
          registrarGrupo(grupoId);


          const gruposDB =
            cargarGrupos();


          const configuracion =
            gruposDB[grupoId];


          if (!configuracion) {
            return;
          }
          
           // =========================
          // BIENVENIDA
          // =========================

          if (
            action === "add" &&
            configuracion.bienvenida
          ) {

            for (
              const participante
              of participants
            ) {

              await sock.sendMessage(
                grupoId,
                {
                  text:
`🎉 ¡BIENVENIDO/A!

👋 Hola @${participante.split("@")[0]}

🤖 Bienvenido/a a este grupo.
¡Esperamos que la pases muy bien!`,
                  mentions: [
                    participante
                  ]
                }
              );

            }

          }

      // =========================
      // DESPEDIDA
      // =========================

      if (
        action === "remove" &&
        configuracion.despedida
      ) {

        for (
          const participante
          of participants
        ) {

          await sock.sendMessage(
            grupoId,
            {
              text:
`👋 ¡Hasta luego!

@${participante.split("@")[0]} ha salido del grupo.

🤖 TitanBot`,
              mentions: [
                participante
              ]
            }
          );

        }

      }

    } catch (error) {

      console.log(
        "Error bienvenida/despedida:",
        error
      );

    }

  }
);

  } catch (error) {

    console.log(
      "❌ Error iniciando TitanBot:",
      error
    );

    iniciando = false;

    estado =
      "🔴 Error iniciando el bot";

    setTimeout(
      () => {
        iniciarBot();
      },
      5000
    );

  }

}


// =====================================================
// ERROR GENERAL
// =====================================================

process.on(
  "uncaughtException",
  error => {

    console.log(
      "❌ Error no controlado:",
      error
    );

  }
);

process.on(
  "unhandledRejection",
  error => {

    console.log(
      "❌ Promesa rechazada:",
      error
    );

  }
);


// =====================================================
// INICIAR
// =====================================================

iniciarBot();
