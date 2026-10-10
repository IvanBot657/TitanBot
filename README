# TITANBOT

Bot de WhatsApp para grupos, con comandos, herramientas de
administración y funciones de entretenimiento.

Repositorio: https://github.com/IvanBot657/TitanBot

> **Importante:** esta guía es una plantilla de instalación para el
> repositorio TITANBOT. Los nombres de comandos, el método de
> vinculación y las variables necesarias pueden cambiar según la versión
> del código. No publiques tu carpeta de sesión ni claves privadas.

## Índice

1.  Requisitos
2.  Instalar en una computadora
3.  Instalar en Android con Termux
4.  Vincular WhatsApp
5.  Configuración
6.  Ejecutar y detener TITANBOT
7.  Actualizar el bot
8.  Errores frecuentes
9.  Seguridad

## 1. Requisitos

-   Node.js compatible con la versión de Baileys indicada en
    `package.json`.
-   Git.
-   FFmpeg, recomendado para funciones de audio, video y stickers.
-   Conexión a internet.
-   Un número de WhatsApp para vincular el bot.

Comprueba la versión de Node.js y Git:

``` bash
node -v
npm -v
git --version
```

Si el proyecto tiene un archivo `yarn.lock`, usa Yarn según las
instrucciones del repositorio. Si tiene `package-lock.json`, usa npm. No
mezcles gestores de paquetes en la misma instalación.

## 2. Instalar en una computadora

Estos pasos sirven para Windows, macOS o Linux, siempre que tengas
instalados Node.js y Git.

### Paso 1: abrir una terminal

En Windows puedes usar PowerShell o la terminal de VS Code. En macOS o
Linux, abre Terminal.

### Paso 2: clonar el repositorio

``` bash
git clone https://github.com/IvanBot657/TitanBot.git
cd TitanBot
```

### Paso 3: instalar dependencias

Si el proyecto contiene `yarn.lock`:

``` bash
corepack enable
yarn install
```

Si contiene `package-lock.json`:

``` bash
npm install
```

Si el repositorio ya incluye dependencias no significa que debas omitir
siempre la instalación: comprueba que `package.json` y el gestor de
paquetes coincidan con la versión descargada.

### Paso 4: revisar la configuración

Antes de arrancar, revisa el `README.md`, `package.json` y los archivos
de configuración del proyecto. Si existe un archivo de ejemplo como
`.env.example`, copia ese archivo a `.env` y completa únicamente los
valores que el proyecto requiera.

No inventes variables: usa los nombres que aparecen en el código. No
compartas públicamente claves API, contraseñas, archivos `.env` ni datos
de sesión.

### Paso 5: iniciar

Usa el comando definido en `package.json`. Si el script `start` está
configurado como `node index.js`, ejecuta:

``` bash
npm start
```

Si el proyecto utiliza Yarn y su script `start` está configurado,
también puedes ejecutar:

``` bash
yarn start
```

Sigue las instrucciones que muestre la terminal para vincular WhatsApp.

## 3. Instalar en Android con Termux

### Paso 1: instalar Termux

Instala Termux desde una fuente oficial y confiable, como F-Droid. Abre
la aplicación.

### Paso 2: preparar Termux

Ejecuta:

``` bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git ffmpeg
```

Comprueba que las herramientas estén disponibles:

``` bash
node -v
npm -v
git --version
```

### Paso 3: descargar TITANBOT

``` bash
cd ~
git clone https://github.com/IvanBot657/TitanBot.git
cd TitanBot
```

Si ya habías descargado el repositorio, entra en su carpeta en vez de
clonarlo de nuevo.

### Paso 4: instalar dependencias

Si existe `yarn.lock`:

``` bash
corepack enable
yarn install
```

Si existe `package-lock.json`:

``` bash
npm install
```

Si ocurre un error de dependencias, guarda el mensaje completo antes de
probar opciones adicionales. No borres archivos de sesión como primer
intento.

### Paso 5: iniciar el bot

``` bash
npm start
```

Si `npm start` no está definido en `package.json`, consulta el script
`start` del proyecto antes de usar otro comando.

## 4. Vincular WhatsApp

El método depende de cómo esté implementada la versión instalada de
TITANBOT.

1.  Inicia el bot en la terminal.
2.  Busca el QR, código de vinculación o instrucciones que muestre el
    programa.
3.  En WhatsApp, abre **Ajustes → Dispositivos vinculados → Vincular un
    dispositivo**.
4.  Sigue el método que realmente muestre TITANBOT: escanea el QR o usa
    la opción de vinculación por número si el código la ofrece.
5.  Espera a que la terminal indique que la conexión se estableció.

Si TITANBOT muestra una página web para el QR, abre la URL que indique
la terminal o la configuración del despliegue. No supongas que una URL
antigua sigue activa.

Conserva la carpeta de sesión que cree el bot. Si la eliminas,
probablemente tendrás que vincular WhatsApp otra vez. No ejecutes dos
instancias usando la misma sesión simultáneamente.

## 5. Configuración

Configura el bot únicamente con las opciones que existan en tu versión.
Revisa `config.js`, `.env.example`, `package.json` y la documentación
del repositorio.

Según las funciones habilitadas, el proyecto podría necesitar variables
de entorno para servicios externos, por ejemplo:

-   `GROQ_API_KEY`, para funciones que usen Groq.
-   `GIPHY_API_KEY`, para funciones que usen GIPHY.
-   `DATABASE_URL`, para funciones que usen PostgreSQL.

Estas variables solo son necesarias si el código realmente las utiliza.
Añádelas en un archivo `.env` local si el proyecto lo admite, o en la
sección de variables de entorno del hosting. Nunca subas `.env` a
GitHub.

## 6. Ejecutar y detener TITANBOT

Iniciar:

``` bash
npm start
```

Detener en primer plano: pulsa `Ctrl + C` en la terminal.

Para que el bot funcione, el dispositivo o servidor debe permanecer
encendido y conectado a internet. Android puede detener Termux por
restricciones de batería.

### Mantenerlo en segundo plano en Termux (opcional)

Primero comprueba que TITANBOT arranca y se vincula correctamente en
primer plano. Después, si necesitas usar PM2:

``` bash
npm install -g pm2
cd ~/TitanBot
pm2 start index.js --name titanbot
pm2 save
```

Comandos útiles:

``` bash
pm2 status
pm2 logs titanbot
pm2 restart titanbot
pm2 stop titanbot
pm2 delete titanbot
```

Usa PM2 solo si la entrada real del proyecto es `index.js`. Si tu
versión arranca desde otro archivo, ajusta el comando a lo indicado por
`package.json`.

## 7. Actualizar TITANBOT

Antes de actualizar, haz una copia de seguridad de la configuración y de
la sesión. Desde la carpeta del proyecto:

``` bash
git pull
```

Después, si cambió `package.json` o el archivo de bloqueo, instala las
dependencias con el gestor correspondiente (`npm install` o
`yarn install`). Reinicia el bot.

No reemplaces tus archivos de configuración personalizados sin revisar
los cambios.

## 8. Errores frecuentes

### `Cannot find module .../index.js`

-   Comprueba que estás dentro de la carpeta `TitanBot`.
-   Revisa el campo `main` y el script `start` de `package.json`.
-   Confirma que el archivo de entrada realmente existe y respeta
    mayúsculas y minúsculas.

### `npm start` indica que falta el script

Abre `package.json` y revisa `scripts`. Ejecuta únicamente el comando
que el proyecto defina.

### Error de módulos o dependencias

-   Comprueba la versión de Node.js.
-   Usa el gestor correspondiente al archivo de bloqueo.
-   Ejecuta la instalación de dependencias.
-   Si continúa, conserva el texto completo del error para poder
    identificar el paquete que falla.

### No aparece el QR o el código

-   Revisa los mensajes de la terminal.
-   Confirma que no haya otra instancia usando la misma sesión.
-   Verifica el método de vinculación que admite la versión actual.
-   No compartas el QR ni el código con otras personas.

### WhatsApp se desconecta

-   Revisa el estado de la sesión y los registros del bot.
-   Evita ejecutar dos procesos con la misma sesión.
-   Vuelve a vincular solo si el programa indica que la sesión ya no es
    válida.

### Termux detiene el bot

Permite que Termux funcione sin optimización de batería, mantén el
dispositivo con conexión estable y revisa si Android está cerrando la
aplicación en segundo plano.

## 9. Seguridad y uso responsable

-   Usa el bot respetando las condiciones de WhatsApp y las leyes
    aplicables.
-   Considera vincular un número secundario.
-   No publiques archivos de sesión, `.env`, claves API ni credenciales.
-   Haz copias de seguridad de los datos importantes.
-   Mantén actualizadas las dependencias y revisa los cambios antes de
    actualizar.

------------------------------------------------------------------------

**TITANBOT** --- guía de instalación para computadora y Android con
Termux.
