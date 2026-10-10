#!/data/data/com.termux/files/usr/bin/bash

set -e

echo "=================================="
echo "       TITANBOT INSTALLER"
echo "=================================="

Comprobar que se ejecuta en Termux

if [ ! -d "/data/data/com.termux/files/usr" ]; then
echo "ERROR: Este instalador está diseñado para Termux."
exit 1
fi

Instalar herramientas necesarias

echo "[1/4] Instalando dependencias del sistema..."
pkg update -y
pkg install -y nodejs git

Verificar instalaciones

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
echo "ERROR: No se pudo instalar Node.js/npm."
exit 1
fi

if ! command -v git >/dev/null 2>&1; then
echo "ERROR: Git no está instalado."
exit 1
fi

Descargar el proyecto

echo "[2/4] Preparando TITANBOT..."

if [ -d "$HOME/TitanBot/.git" ]; then
cd "$HOME/TitanBot"
echo "Repositorio existente. Actualizando..."
git pull --ff-only
else
if [ -e "$HOME/TitanBot" ]; then
echo "ERROR: Ya existe ~/TitanBot y no es un repositorio Git."
echo "Respalda o renombra esa carpeta antes de continuar."
exit 1
fi

git clone https://github.com/IvanBot657/TitanBot.git "$HOME/TitanBot"
cd "$HOME/TitanBot"

fi

Instalar dependencias del proyecto

echo "[3/4] Instalando paquetes de TITANBOT..."

if [ ! -f package.json ]; then
echo "ERROR: No se encontró package.json."
exit 1
fi

npm install

Iniciar el bot

echo "[4/4] Iniciando TITANBOT..."
npm start
