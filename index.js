const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");
const QRCode = require("qrcode");

const config = require("./config");

// ===============================
// COMANDOS
// ===============================

const inicio = require("./commands/inicio");
const usuarioMod = require("./commands/usuario");
const economia = require("./commands/economia");
const juegos = require("./commands/juegos");
const grupos = require("./commands/grupos");
const anime = require("./commands/anime");
const herramientas = require("./commands/herramientas");
const ajustes = require("./commands/ajustes");
const owner = require("./commands/owner");

// ===============================
// VARIABLES
// ===============================

let qrActual = null;
let codigoVinculacion = null;

let sockActual = null;
let authStateActual = null;

let estado = "Esperando conexión...";
let iniciando = false;

// ===============================
// SERVIDOR WEB
// ===============================

const PORT = process.env.PORT || 10000;

const servidor = http.createServer(async (req, res) => {

  // =============================
  // PÁGINA PRINCIPAL
  // =============================

  if (req.url === "/" || req.url === "/qr") {

    let qrHTML = `
      <div class="espera">
        🟡 Esperando QR...
      </div>
    `;

    if (qrActual) {
      try {

        const imagenQR = await QRCode.toDataURL(qrActual);

        qrHTML = `
          <img
            src="${imagenQR}"
            class="qr"
            alt="QR TitanBot"
          >
        `;

      } catch (error) {

        qrHTML = `
          <div class="error">
            ❌ No se pudo generar el QR
          </div>
        `;
      }
    }

    const codigoHTML = codigoVinculacion
      ? `
        <div class="codigo">
          ${codigoVinculacion}
        </div>
      `
      : `
        <div class="sin-codigo">
          Esperando generación del código...
        </div>
      `;

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    return res.end(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>TitanBot v2.5.0</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  min-height: 100vh;

  display: flex;

  justify-content: center;

  align-items: center;

  background:
    linear-gradient(
      135deg,
      #050505,
      #101010,
      #181818
    );

  color: white;

  font-family: Arial, sans-serif;

}

.container {

  width: 95%;

  max-width: 500px;

  padding: 25px;

  text-align: center;

  background: #111;

  border-radius: 20px;

  box-shadow:
    0 0 30px rgba(0,0,0,.6);

}

h1 {

  margin-bottom: 5px;

}

.version {

  color: #aaa;

  margin-bottom: 20px;

}

.estado {

  margin-bottom: 25px;

  padding: 12px;

  border-radius: 10px;

  background: #1b1b1b;

}

.seccion {

  margin-top: 25px;

  padding-top: 20px;

  border-top: 1px solid #333;

}

.qr {

  width: 280px;

  max-width: 100%;

  background: white;

  padding: 10px;

  border-radius: 12px;

}

.espera,
.sin-codigo {

  color: #aaa;

  padding: 20px;

}

input {

  width: 100%;

  padding: 14px;

  margin-top: 10px;

  border: none;

  border-radius: 10px;

  font-size: 16px;

  outline: none;

}

button {

  width: 100%;

  padding: 14px;

  margin-top: 12px;

  border: none;

  border-radius: 10px;

  background: #25d366;

  color: white;

  font-size: 16px;

  font-weight: bold;

  cursor: pointer;

}

button:hover {

  background: #1ebe5d;

}

.codigo {

  margin-top: 15px;

  padding: 18px;

  background: #222;

  border-radius: 10px;

  font-size: 24px;

  font-weight: bold;

  letter-spacing: 4px;

}

.error {

  color: #ff5555;

  padding: 20px;

}

.info {

  color: #aaa;

  font-size: 13px;

  margin-top: 10px;

}

</style>

</head>

<body>

<div class="container">

  <h1>🤖 TITANBOT</h1>

  <div class="version">
    V2.5.0
  </div>

  <div class="estado">

    🟢 Estado:

    <strong>
      ${estado}
    </strong>

  </div>


  <div class="seccion">

    <h2>📱 CONECTAR CON QR</h2>

    ${qrHTML}

  </div>


  <div class="seccion">

    <h2>🔢 CÓDIGO DE VINCULACIÓN</h2>

    <form action="/pairing" method="GET">

      <input
        type="text"
        name="numero"
        placeholder="573001234567"
        maxlength="15"
        required
      >

      <button type="submit">
        🔢 GENERAR CÓDIGO
      </button>

    </form>

    <div class="info">
      Escribe el número con código de país,
      sin +, espacios ni guiones.
    </div>

    ${codigoHTML}

  </div>

</div>

</body>

</html>
    `);
  }


  // =============================
  // DATOS DEL QR
  // =============================

  if (req.url === "/qr-data") {

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    return res.end(
      JSON.stringify({
        estado,
        qr: qrActual,
        codigo: codigoVinculacion
      })
    );
  }


  // =============================
  // CÓDIGO DE VINCULACIÓN
  // =============================

  if (req.url.startsWith("/pairing")) {

    try {

      const url = new URL(
        req.url,
        `http://localhost:${PORT}`
      );

      const numeroOriginal =
        url.searchParams.get("numero");

      if (!numeroOriginal) {

        res.writeHead(400, {
          "Content-Type": "text/html; charset=utf-8"
        });

        return res.end(`
          <h2>❌ Falta el número</h2>
          <p>Ejemplo: 573001234567</p>
          <a href="/qr">⬅️ Volver</a>
        `);
      }

      const numero =
        numeroOriginal
          .replace(/\D/g, "");

      if (
        numero.length < 10 ||
        numero.length > 15
      ) {

        res.writeHead(400, {
          "Content-Type": "text/html; charset=utf-8"
        });

        return res.end(`
          <h2>❌ Número inválido</h2>

          <p>
            Usa el número con código de país.
          </p>

          <p>
            Ejemplo: 573001234567
          </p>

          <a href="/qr">
            ⬅️ Volver
          </a>
        `);
      }


      if (!sockActual || !authStateActual) {

        res.writeHead(503, {
          "Content-Type": "text/html; charset=utf-8"
        });

        return res.end(`
          <h2>🟡 TitanBot todavía está iniciando</h2>

          <p>
            Espera unos segundos y vuelve a intentarlo.
          </p>

          <a href="/qr">
            🔄 Volver
          </a>
        `);
      }


      // ===========================
      // YA ESTÁ REGISTRADO
      // ===========================

      if (
        authStateActual.creds &&
        authStateActual.creds.registered
      ) {

        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8"
        });

        return res.end(`
          <h2>🟢 TitanBot ya está conectado</h2>

          <p>
            Esta sesión ya está vinculada.
          </p>

          <a href="/qr">
            ⬅️ Volver
          </a>
        `);
      }


      // ===========================
      // GENERAR CÓDIGO
      // ===========================

      codigoVinculacion =
        await sockActual.requestPairingCode(numero);

      estado =
        "Esperando vinculación por código";


      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });

      return res.end(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>Código TitanBot</title>

<style>

body {

  margin: 0;

  min-height: 100vh;

  display: flex;

  justify-content: center;

  align-items: center;

  background: #101010;

  color: white;

  font-family: Arial, sans-serif;

  text-align: center;

}

.box {

  width: 90%;

  max-width: 450px;

  padding: 30px;

  background: #181818;

  border-radius: 20px;

}

.codigo {

  margin: 25px 0;

  padding: 20px;

  background: #222;

  border-radius: 12px;

  font-size: 30px;

  font-weight: bold;

  letter-spacing: 5px;

}

a {

  color: #25d366;

  text-decoration: none;

}

</style>

</head>

<body>

<div class="box">

  <h1>🔢 Código de vinculación</h1>

  <p>
    Abre WhatsApp en tu teléfono.
  </p>

  <p>
    Ve a Dispositivos vinculados →
    Vincular dispositivo.
  </p>

  <p>
    Selecciona la opción para vincular
    con número de teléfono.
  </p>

  <div class="codigo">
    ${codigoVinculacion}
  </div>

  <p>
    📱 Número:
    ${numero}
  </p>

  <br>

  <a href="/qr">
    ⬅️ Volver a TitanBot
  </a>

</div>

</body>

</html>
      `);

    } catch (error) {

      console.log(
        "❌ Error generando código:",
        error
      );

      res.writeHead(500, {
        "Content-Type": "text/html; charset=utf-8"
      });

      return res.end(`
        <h2>❌ No se pudo generar el código</h2>

        <p>
          ${error.message}
        </p>

        <a href="/qr">
          ⬅️ Volver
        </a>
      `);
    }
  }

});

servidor.listen(PORT, () => {

  console.log(
    `🌐 Servidor web iniciado en puerto ${PORT}`
  );

});

// ===============================
// INICIAR BOT
// ===============================

async function iniciarBot() {

  if (iniciando) {
    return;
  }

  iniciando = true;

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState("./session");

    authStateActual = state;


    const sock =
      makeWASocket({

        auth: state,

        logger: P({
          level: "silent"
        }),

        printQRInTerminal: false

      });


    sockActual = sock;


    // =============================
    // GUARDAR SESIÓN
    // =============================

    sock.ev.on(
      "creds.update",
      saveCreds
    );


    // =============================
    // CONEXIÓN
    // =============================

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect,
          qr
        } = update;


        // =========================
        // NUEVO QR
        // =========================

        if (qr) {

          qrActual = qr;

          codigoVinculacion = null;

          estado =
            "Esperando escaneo del QR";

          console.log(
            "📱 QR disponible en /qr"
          );
        }


        // =========================
        // CONECTADO
        // =========================

        if (connection === "open") {

          estado =
            "🟢 TitanBot conectado";

          qrActual = null;

          codigoVinculacion = null;

          console.log(
            "✅ TitanBot conectado correctamente"
          );

        }


        // =========================
        // CERRADO
        // =========================

        if (connection === "close") {

          estado =
            "🔴 Conexión cerrada";

          qrActual = null;

          codigoVinculacion = null;

          const codigo =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;


          if (
            codigo ===
            DisconnectReason.loggedOut
          ) {

            console.log(
              "❌ Sesión cerrada. Debes volver a vincular."
            );

            iniciando = false;

            return;
          }


          console.log(
            "🔄 Reconectando TitanBot..."
          );

          iniciando = false;

          setTimeout(() => {

            iniciarBot();

          }, 3000);
        }

      }
    );


    // =============================
    // MENSAJES
    // =============================

    sock.ev.on(
      "messages.upsert",
      async ({
        messages
      }) => {

        try {

          const mensaje =
            messages[0];

          if (!mensaje.message) {
            return;
          }


          if (
            mensaje.key &&
            mensaje.key.fromMe
          ) {
            return;
          }


          const chat =
            mensaje.key.remoteJid;


          const texto =
            mensaje.message.conversation ||
            mensaje.message.extendedTextMessage
              ?.text ||
            "";


          if (!texto) {
            return;
          }


          if (
            !texto.startsWith(
              config.prefijo
            )
          ) {
            return;
          }


          const contenido =
            texto.slice(
              config.prefijo.length
            ).trim();


          const partes =
            contenido.split(/\s+/);

          const comando =
            (partes.shift() || "")
              .toLowerCase();

          const args =
            partes;


          const id =
            mensaje.key.participant ||
            chat;


          // =========================
          // XP
          // =========================

          try {

            usuarioMod.ganarXP(id);

          } catch (error) {

            console.log(
              "⚠️ Error XP:",
              error.message
            );
          }


          // =========================
          // DATOS DEL GRUPO
          // =========================

          let esGrupo =
            chat.endsWith("@g.us");

          let esAdmin = false;


          if (esGrupo) {

            try {

              const metadata =
                await sock.groupMetadata(
                  chat
                );

              const participante =
                metadata.participants.find(
                  p =>
                    p.id === id
                );


              if (
                participante &&
                (
                  participante.admin ===
                  "admin" ||

                  participante.admin ===
                  "superadmin"
                )
              ) {

                esAdmin = true;
              }

            } catch (error) {

              console.log(
                "⚠️ No se pudo obtener grupo"
              );
            }
          }


          // =========================
          // INICIO
          // =========================

          let resultado =
            await inicio(
              sock,
              chat,
              comando
            );

          if (resultado) {
            return;
          }


          // =========================
          // USUARIO
          // =========================

          resultado =
            await usuarioMod.usuario(
              sock,
              chat,
              comando,
              id
            );

          if (resultado) {
            return;
          }


          // =========================
          // ECONOMÍA
          // =========================

          resultado =
            await economia(
              sock,
              chat,
              comando,
              args,
              id
            );

          if (resultado) {
            return;
          }


          // =========================
          // JUEGOS
          // =========================

          resultado =
            await juegos(
              sock,
              chat,
              comando,
              args,
              id
            );

          if (resultado) {
            return;
          }


          // =========================
          // ANIME
          // =========================

          resultado =
            await anime(
              sock,
              chat,
              comando,
              args
            );

          if (resultado) {
            return;
          }


          // =========================
          // GRUPOS
          // =========================

          resultado =
            await grupos(
              sock,
              chat,
              comando,
              args,
              id,
              esGrupo,
              esAdmin
            );

          if (resultado) {
            return;
          }


          // =========================
          // HERRAMIENTAS
          // =========================

          resultado =
            await herramientas(
              sock,
              chat,
              comando,
              args,
              id
            );

          if (resultado) {
            return;
          }


          // =========================
          // AJUSTES
          // =========================

          resultado =
            await ajustes(
              sock,
              chat,
              comando,
              args,
              id,
              esGrupo,
              esAdmin
            );

          if (resultado) {
            return;
          }


          // =========================
          // OWNER
          // =========================

          resultado =
            await owner(
              sock,
              chat,
              comando,
              args,
              id
            );

          if (resultado) {
            return;
          }


          // =========================
          // DESCONOCIDO
          // =========================

          await sock.sendMessage(
            chat,
            {
              text:
`❌ Comando no encontrado.

Escribe:
${config.prefijo}menu

para ver los comandos.`
            }
          );


        } catch (error) {

          console.log(
            "❌ Error procesando mensaje:",
            error.message
          );

        }

      }
    );


  } catch (error) {

    iniciando = false;

    console.log(
      "❌ Error iniciando TitanBot:",
      error
    );


    setTimeout(() => {

      iniciarBot();

    }, 5000);

  }

}

// ===============================
// INICIAR
// ===============================

iniciarBot();
