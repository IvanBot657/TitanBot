const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestWaWebVersion,
  jidNormalizedUser
} = require("@whiskeysockets/baileys");

const P = require("pino");
const http = require("http");
const QRCode = require("qrcode");
const fs = require("fs");

const config = require("./config");

const inicio = require("./commands/inicio");
const usuario = require("./commands/usuario");
const economia = require("./commands/economia");
const misiones = require("./commands/misiones");
const juegos = require("./commands/juegos");
const ruleta = require("./commands/ruleta");
const prediccion = require("./commands/prediccion");
const roleplay = require("./commands/roleplay");
const batallas = require("./commands/batallas");
const ejercito = require("./commands/ejercito");
const diversion = require("./commands/diversion");
const personalidad = require("./commands/personalidad");
const casar = require("./commands/casar");
const anime = require("./commands/anime");
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
const mascotaCommand = require("./commands/mascota");
const isla = require("./commands/isla");
const boss = require("./commands/Juegos/boss");

const PORT = process.env.PORT || 10000;

let qrActual = null;
let codigoVinculacion = null;
let sockActual = null;
let generandoCodigo = false;
let authStateActual = null;
let conexionActual = "close";
let socketListoParaVincular = false;

// Mensajes recientes necesarios para que Baileys pueda descifrar/agrup ar
// las respuestas de las encuestas del sistema de EVENTOS.
const messageStore = new Map();
const MAX_STORED_MESSAGES = 5000;

function guardarMensajeEnMemoria(msg) {
  const id = msg?.key?.id;
  const chat = msg?.key?.remoteJid;

  if (!id || !chat) return;

  const key = `${chat}:${id}`;
  messageStore.set(key, msg);

  if (messageStore.size > MAX_STORED_MESSAGES) {
    const primero = messageStore.keys().next().value;
    if (primero) messageStore.delete(primero);
  }
}

let estado = "🟡 Iniciando...";
let iniciando = false;

// Control de reconexión para evitar múltiples sockets simultáneos.
let reconectando = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let socketGeneration = 0;

const RECONNECT_BASE_MS = 3000;
const RECONNECT_MAX_MS = 30000;

function obtenerCodigoDesconexion(lastDisconnect) {
  return (
    lastDisconnect?.error?.output?.statusCode ??
    lastDisconnect?.error?.statusCode ??
    lastDisconnect?.error?.data?.statusCode ??
    null
  );
}

function esSesionInvalida(codigo, error = null) {
  const texto = String(
    error?.message ||
    error ||
    ""
  ).toLowerCase();

  return (
    codigo === DisconnectReason.loggedOut ||
    codigo === 401 ||
    String(codigo).toLowerCase() === "device_removed" ||
    texto.includes("device_removed") ||
    texto.includes("device removed")
  );
}

function programarReconexión(motivo = "desconexión") {
  if (reconectando || reconnectTimer) return;

  reconectando = true;
  reconnectAttempts++;

  const espera = Math.min(
    RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts - 1),
    RECONNECT_MAX_MS
  );

  estado = `🟡 Reconectando en ${Math.ceil(espera / 1000)}s...`;

  console.log(
    `🔄 Reconexión programada (${motivo}) en ${espera} ms. Intento #${reconnectAttempts}`
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconectando = false;

    iniciarBot().catch(error => {
      console.log("❌ Error durante la reconexión:", error);
    });
  }, espera);
}

function cerrarSocketActual(motivo = "reemplazo") {
  const socket = sockActual;

  if (!socket) return;

  console.log(`🧹 Cerrando socket anterior: ${motivo}`);

  try {
    if (typeof socket.end === "function") {
      socket.end(new Error(`Socket cerrado: ${motivo}`));
    } else if (socket.ws && typeof socket.ws.close === "function") {
      socket.ws.close();
    }
  } catch (error) {
    console.log("⚠️ Error cerrando socket anterior:", error?.message || error);
  }

  if (sockActual === socket) {
    sockActual = null;
  }
}


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
// DATOS DEL QR
// ===================================================

if (req.url === "/qr-data") {

  res.writeHead(200, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    qr: qrActual || null,
    codigo: codigoVinculacion || null,
    estado: estado || "🟡 Esperando..."
  }));

  return;
}

    // ===================================================
// 🏝️ ISLA WEB
// ===================================================

if (req.url.startsWith("/isla")) {

  const fs = require("fs");
  const path = require("path");

  const usuariosPath = path.join(
    __dirname,
    "database",
    "usuarios_isla.json"
  );

  const islasPath = path.join(
    __dirname,
    "database",
    "islas.json"
  );

  // =========================================
  // 🔎 LEER ID DE LA URL
  // =========================================

  const urlActual = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  const usuarioId = urlActual.searchParams.get("id");

  // =========================================
  // 📖 CARGAR DATOS
  // =========================================

  let usuarios = {};
  let islas = [];

  try {
    if (fs.existsSync(usuariosPath)) {
      usuarios = JSON.parse(
        fs.readFileSync(usuariosPath, "utf8")
      );
    }

    if (fs.existsSync(islasPath)) {
      islas = JSON.parse(
        fs.readFileSync(islasPath, "utf8")
      );
    }
  } catch (error) {

    console.error(
      "❌ Error cargando datos de isla:",
      error
    );
  }

  // =========================================
  // 🏝️ DATOS DEL USUARIO
  // =========================================

  const perfil = usuarioId
    ? usuarios[usuarioId]
    : null;

  // =========================================
  // 🌅 SI NO HAY USUARIO
  // =========================================

  if (!perfil) {

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

<title>🏝️ Isla Titan</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  font-family: Arial, sans-serif;

  color: white;

  background:
    radial-gradient(
      circle at top,
      #2563eb,
      transparent 40%
    ),
    linear-gradient(
      135deg,
      #07111f,
      #102a43,
      #174e63
    );
}

.card {

  width: min(100%, 600px);

  padding: 40px 25px;

  text-align: center;

  border-radius: 28px;

  background: rgba(0,0,0,.38);

  border: 1px solid rgba(255,255,255,.15);

  box-shadow:
    0 20px 50px rgba(0,0,0,.4);

  backdrop-filter: blur(10px);
}

.icon {
  font-size: 75px;
}

h1 {
  font-size: 38px;
}

p {
  color: #dbeafe;
  line-height: 1.6;
}

</style>

</head>

<body>

<div class="card">

  <div class="icon">🏝️</div>

  <h1>Isla Titan</h1>

  <p>
    No encontramos un perfil de isla.
  </p>

  <p>
    Abre el enlace que TITANBOT te envió
    después de seleccionar tu isla.
  </p>

</div>

</body>

</html>
`);

    return;
  }

  // =========================================
  // 🏝️ BUSCAR ISLA
  // =========================================

  const islaActual = islas.find(
    isla => isla.id === perfil.isla
  );

  // =========================================
  // ❌ ISLA NO ENCONTRADA
  // =========================================

  if (!islaActual) {

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

<title>🏝️ Isla Titan</title>

<style>

body {
  margin: 0;
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  font-family: Arial, sans-serif;

  color: white;

  background:
    linear-gradient(
      135deg,
      #07111f,
      #102a43,
      #174e63
    );
}

.card {
  width: min(90%, 600px);
  padding: 35px;
  text-align: center;
  border-radius: 25px;
  background: rgba(0,0,0,.4);
}

</style>

</head>

<body>

<div class="card">

  <h1>🏝️</h1>

  <h2>No tienes una isla seleccionada</h2>

  <p>
    Ve a TITANBOT y utiliza:
  </p>

  <p>
    <b>.isla</b>
  </p>

</div>

</body>

</html>
`);

    return;
  }

  // =========================================
  // 📊 DATOS
  // =========================================

  const recursos = perfil.recursos || {};

  const construcciones =
    perfil.construcciones || {};

  const mascota =
    perfil.mascota || "Ninguna";

  // =========================================
  // 🌐 PÁGINA DE LA ISLA
  // =========================================

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

<title>
${islaActual.icono} ${islaActual.nombre}
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  min-height: 100vh;

  font-family: Arial, sans-serif;

  color: white;

  padding: 25px 15px;

  background:
    radial-gradient(
      circle at top,
      ${islaActual.color || "#2563eb"},
      transparent 40%
    ),
    linear-gradient(
      135deg,
      #07111f,
      #102a43,
      #174e63
    );
}

.container {

  width: min(100%, 1000px);

  margin: auto;
}

.header {

  text-align: center;

  padding: 30px 10px;
}

.icon {

  font-size: 80px;

  filter:
    drop-shadow(
      0 10px 20px rgba(0,0,0,.4)
    );
}

h1 {

  font-size: clamp(
    35px,
    8vw,
    58px
  );

  margin: 10px 0;
}

.descripcion {

  max-width: 650px;

  margin: auto;

  color: #dbeafe;

  line-height: 1.7;

  font-size: 17px;
}

.grid {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px, 1fr)
    );

  gap: 18px;

  margin-top: 25px;
}

.card {

  padding: 23px;

  border-radius: 22px;

  background:
    rgba(0,0,0,.38);

  border:
    1px solid
    rgba(255,255,255,.14);

  box-shadow:
    0 15px 35px
    rgba(0,0,0,.3);

  backdrop-filter: blur(10px);
}

.card h2 {

  margin-top: 0;

  font-size: 22px;
}

.stat {

  display: flex;

  justify-content: space-between;

  padding: 9px 0;

  border-bottom:
    1px solid
    rgba(255,255,255,.08);
}

.stat:last-child {

  border-bottom: none;
}

.numero {

  font-weight: bold;

  color: #fff;
}

.actividades {

  line-height: 1.9;

  color: #dbeafe;
}

.badge {

  display: inline-block;

  padding: 8px 14px;

  margin-top: 8px;

  border-radius: 20px;

  background:
    rgba(255,255,255,.12);

  font-weight: bold;
}

.footer {

  text-align: center;

  margin-top: 30px;

  color: #94a3b8;

  font-size: 14px;
}

</style>

</head>

<body>

<div class="container">

  <!-- ================================= -->
  <!-- 🏝️ ENCABEZADO -->
  <!-- ================================= -->

  <div class="header">

    <div class="icon">
      ${islaActual.icono}
    </div>

    <h1>
      ${islaActual.nombre}
    </h1>

    <p class="descripcion">
      ${islaActual.descripcion}
    </p>

    <div class="badge">
      🌤️ ${islaActual.clima}
    </div>

    <div class="badge">
      ✨ ${islaActual.ambiente}
    </div>

  </div>


  <!-- ================================= -->
  <!-- 📊 ESTADÍSTICAS -->
  <!-- ================================= -->

  <div class="grid">

    <div class="card">

      <h2>⭐ Progreso</h2>

      <div class="stat">
        <span>Nivel</span>
        <span class="numero">
          ${perfil.nivel || 1}
        </span>
      </div>

      <div class="stat">
        <span>Experiencia</span>
        <span class="numero">
          ${perfil.experiencia || 0} XP
        </span>
      </div>

      <div class="stat">
        <span>Exploraciones</span>
        <span class="numero">
          ${perfil.exploraciones || 0}
        </span>
      </div>

    </div>


    <!-- ================================= -->
    <!-- 🎒 RECURSOS -->
    <!-- ================================= -->

    <div class="card">

      <h2>🎒 Recursos</h2>

      <div class="stat">
        <span>🌳 Madera</span>
        <span class="numero">
          ${recursos.madera || 0}
        </span>
      </div>

      <div class="stat">
        <span>🪨 Piedra</span>
        <span class="numero">
          ${recursos.piedra || 0}
        </span>
      </div>

      <div class="stat">
        <span>🍎 Comida</span>
        <span class="numero">
          ${recursos.comida || 0}
        </span>
      </div>

    </div>


    <!-- ================================= -->
    <!-- 🏗️ CONSTRUCCIONES -->
    <!-- ================================= -->

    <div class="card">

      <h2>🏗️ Construcciones</h2>

      <div class="stat">
        <span>🏠 Casa</span>
        <span class="numero">
          ${construcciones.casa || 0}
        </span>
      </div>

      <div class="stat">
        <span>🌾 Granja</span>
        <span class="numero">
          ${construcciones.granja || 0}
        </span>
      </div>

      <div class="stat">
        <span>⚓ Puerto</span>
        <span class="numero">
          ${construcciones.puerto || 0}
        </span>
      </div>

    </div>


    <!-- ================================= -->
    <!-- 🐯 MASCOTA -->
    <!-- ================================= -->

    <div class="card">

      <h2>🐾 Mascota</h2>

      <p>

        ${
          mascota === "Tigre"
            ? "🐯"
            : "🐾"
        }

        <b>${mascota}</b>

      </p>

      ${
        mascota === "Tigre"
          ? `
          <p class="actividades">
            Tu compañero forma parte
            de tu aventura en la isla.
          </p>
          `
          : `
          <p class="actividades">
            Todavía no tienes una mascota.
            <br><br>
            Usa <b>.adoptar</b> en TITANBOT.
          </p>
          `
      }

    </div>

  </div>


  <!-- ================================= -->
  <!-- 🎯 ACTIVIDADES -->
  <!-- ================================= -->

  <div class="card" style="margin-top:18px;">

    <h2>🎯 Actividades de ${islaActual.nombre}</h2>

    <div class="actividades">

      ${islaActual.actividades
        .map(actividad => `• ${actividad}`)
        .join("<br>")}

    </div>

  </div>


  <div class="footer">

    🏝️ TITANBOT — Tu isla, tu aventura ⚡

  </div>

</div>

</body>

</html>
`);

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

      // El QR ya demuestra que WhatsApp Web está en fase de vinculación.
      // No dependemos únicamente de socketListoParaVincular, porque puede
      // quedar desfasado respecto al evento connection.update.
      const listoParaVincular =
        socketListoParaVincular ||
        !!qrActual ||
        conexionActual === "connecting";

      if (!listoParaVincular) {
        res.end(
          JSON.stringify({
            error:
              "WhatsApp todavía no está listo para vincular. Espera a que aparezca el QR y vuelve a intentarlo."
          })
        );

        return;
      }

      if (generandoCodigo) {
        res.end(
          JSON.stringify({
            error: "Ya se está generando un código. Espera unos segundos."
          })
        );
        return;
      }

      generandoCodigo = true;

      try {

        codigoVinculacion =
          await sockActual.requestPairingCode(
            numero
          );

        if (codigoVinculacion) {
          codigoVinculacion =
            String(codigoVinculacion)
              .replace(/\s+/g, "")
              .match(/.{1,4}/g)
              ?.join("-") ||
            codigoVinculacion;
        }

        estado =
          "🔢 Código de vinculación generado";

      } finally {

        generandoCodigo = false;

      }

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
    console.log("⏳ Ya hay una conexión en proceso. Se omite el intento duplicado.");
    return;
  }

  iniciando = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  reconectando = false;

  // Nunca dejamos dos sockets de TitanBot activos al mismo tiempo.
  if (sockActual) {
    cerrarSocketActual("inicio de una nueva conexión");
  }

  const miGeneracion = ++socketGeneration;

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


    // =================================================
    // VERSIÓN ACTUAL DE WHATSAPP WEB
    // =================================================

    let waVersion = null;

    try {
      const versionInfo =
        typeof fetchLatestWaWebVersion === "function"
          ? await fetchLatestWaWebVersion()
          : null;

      if (
        versionInfo &&
        Array.isArray(versionInfo.version)
      ) {
        waVersion = versionInfo.version;

        console.log(
          "🌐 WhatsApp Web:",
          waVersion.join("."),
          versionInfo.isLatest === false
            ? "(no marcada como latest)"
            : "(actual)"
        );
      }
    } catch (error) {
      console.log(
        "⚠️ No se pudo obtener la versión actual de WhatsApp Web:",
        error?.message || error
      );
    }

    const opcionesSocket = {

      auth: state,

      // Baileys necesita recuperar el mensaje original de la encuesta
      // para poder procesar correctamente sus votos cifrados.
      getMessage: async (key) => {
        const chat = key?.remoteJid;
        const id = key?.id;

        if (!chat || !id) return undefined;

        const guardado = messageStore.get(`${chat}:${id}`);
        if (guardado?.message) {
          return guardado.message;
        }

        const mensajeEvento = eventos.obtenerMensajeEncuesta(chat, id);
        return mensajeEvento?.message || undefined;
      },

      logger:
        P({
          level: "info"
        }),

      browser: Browsers.macOS("Chrome"),

      markOnlineOnConnect: false,

      syncFullHistory: false,

      printQRInTerminal: false,

      connectTimeoutMs: 60000,

      qrTimeout: 60000

    };

    if (waVersion) {
      opcionesSocket.version = waVersion;
    }

    const sock =
      makeWASocket(opcionesSocket);

    // Este socket queda identificado para que eventos atrasados de un
    // socket viejo no puedan iniciar otra conexión ni modificar el estado.
    sock.__titanGeneration = miGeneracion;
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

        // Ignorar eventos atrasados de un socket que ya no es el actual.
        if (sockActual !== sock || sock.__titanGeneration !== socketGeneration) {
          console.log("⚠️ Evento ignorado de un socket anterior.");
          return;
        }

        conexionActual = connection || conexionActual;

        // -------------------------
        // QR
        // -------------------------

        if (qr) {

          qrActual =
            await QRCode.toDataURL(
              qr
            );

          codigoVinculacion = null;
          socketListoParaVincular = true;

          estado =
            "📱 Escanea el código QR";

          console.log(
            "📱 Nuevo QR disponible"
          );
        }


        // -------------------------
        // CONECTANDO
        // -------------------------

        if (connection === "connecting") {

          conexionActual = "connecting";

          if (!estado.includes("QR")) {
            estado = "🟡 Conectando con WhatsApp...";
          }

          console.log("🟡 TitanBot conectando...");
        }


        // -------------------------
        // CONECTADO
        // -------------------------

        if (
          connection === "open"
        ) {

          conexionActual = "open";
          qrActual = null;
          codigoVinculacion = null;
          socketListoParaVincular = false;

          estado =
            "🟢 TitanBot conectado";

          reconnectAttempts = 0;
          reconectando = false;

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
            obtenerCodigoDesconexion(lastDisconnect);

          const mensajeError =
            lastDisconnect?.error?.message ||
            lastDisconnect?.error ||
            "";

          console.log(
            "🔴 Conexión cerrada:",
            codigo,
            mensajeError
          );

          // Solo el socket actual puede cambiar estas variables.
          if (sockActual !== sock) {
            return;
          }

          sockActual = null;
          authStateActual = null;
          conexionActual = "close";
          qrActual = null;
          codigoVinculacion = null;
          socketListoParaVincular = false;
          iniciando = false;

          // 401 / loggedOut / device_removed significa que la sesión
          // actual fue invalidada. NO borramos ./session automáticamente.
          // Así no se destruyen los archivos del usuario sin confirmación.
          if (esSesionInvalida(codigo, lastDisconnect?.error)) {

            estado =
              "🔴 Sesión invalidada (401/device_removed). Vincula de nuevo el bot.";

            console.log(
              "🔑 Sesión invalidada. No se elimina ./session automáticamente."
            );

            return;
          }

          // Otros cortes: reconexión con espera y backoff.
          estado =
            "🟡 Reconectando...";

          programarReconexión(
            `código ${codigo ?? "desconocido"}`
          );
        }

      }
    );


    // =================================================
    // 🗳️ VOTOS DE ENCUESTAS - EVENTOS
    // =================================================

     sock.ev.on("messages.update", async (updates) => {
  try {
    if (typeof eventos.procesarVotos === "function") {
      await eventos.procesarVotos(sock, updates);
    }
  } catch (error) {
    console.log(
      "❌ Error procesando encuesta:",
      error
    );
  }
});

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

            // Guardamos mensajes para que Baileys pueda recuperar
            // encuestas originales cuando lleguen sus votos.
            guardarMensajeEnMemoria(msg);

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
            // USUARIO
            // =========================================

            const id =
              msg.key.participant ||
              msg.key.remoteJid;


            // =========================================
            // PREFIJO
            // =========================================

            // =========================================
            // 👹 BOSS IA - MENSAJES LIBRES
            // =========================================
            // Si el BOSS está activo en este grupo, cualquier
            // mensaje normal se entrega directamente a boss.js.
            //
            // IMPORTANTE:
            // boss.js mantiene el estado por grupo mediante su
            // propio sistema. No debemos buscar boss.json aquí
            // usando el ID del participante, porque eso impediría
            // detectar correctamente el BOSS activo del grupo.

            if (!texto.startsWith(config.prefijo)) {

              const resultadoBoss = await boss(
                sock,
                chat,
                "__libre__",
                [],
                id,
                msg
              );

              if (resultadoBoss) {
                continue;
              }

              // Si el BOSS no está activo, el mensaje normal
              // simplemente se ignora.
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
            // 👹 BOSS IA
            // =========================================

            if (!ejecutado) {

              const resultado = await boss(
                sock,
                chat,
                comando,
                args,
                id,
                msg
              );

              if (resultado !== false) {
                ejecutado = true;
              }
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
            // 🎰 RULETA
            // =========================================

            if (!ejecutado) {
             const resultado = await ruleta(
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
           // CASAR💍
           // =========================================
            
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
        // ⚔️ BATALLAS
        // =========================================

        if (!ejecutado) {
         const resultado = await batallas(
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
         // 🏆 EJÉRCITO DORADO
         // =========================================

         if (!ejecutado) {

          const resultado = await ejercito(
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
            // 🐾 MASCOTA
            // =========================================

            if (!ejecutado) {

              const resultado =
                await mascotaCommand.ejecutarMascota(
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
            // 🏝️ ISLA
            // =========================================

            if (!ejecutado) {

              const resultado = await isla(
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

    // Si este intento falló, dejamos el estado listo para que el
    // siguiente intento sea controlado por el mismo backoff.
    if (sockActual?.__titanGeneration === miGeneracion) {
      sockActual = null;
    }

    estado =
      "🔴 Error iniciando el bot";

    programarReconexión("error al iniciar");

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
