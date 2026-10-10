#!/data/data/com.termux/files/usr/bin/bash

set -e

echo "=================================="
echo "       TITANBOT INSTALLER"
echo "=================================="

# Comprobar que se ejecuta en Termux
if [ ! -d "/data/data/com.termux/files/usr" ]; then
    echo "ERROR: Este instalador está diseñado para Termux."
    exit 1
fi

# Instalar herramientas necesarias
echo "[1/4] Instalando dependencias del sistema..."
pkg update -y
pkg install -y nodejs git

# Descargar el proyecto
echo "[2/4] Preparando TITANBOT..."

if [ -d "$HOME/TitanBot/.git" ]; then
    cd "$HOME/TitanBot"
    git pull
else
    if [ -d "$HOME/TitanBot" ]; then
        echo "Ya existe ~/TitanBot, pero no parece ser un repositorio Git."
        echo "Renombra o respalda esa carpeta antes de continuar."
        exit 1
    fi

    git clone https://github.com/IvanBot657/TitanBot.git "$HOME/TitanBot"
    cd "$HOME/TitanBot"
fi

# Instalar dependencias del proyecto
echo "[3/4] Instalando paquetes de TITANBOT..."

if [ ! -f package.json ]; then
    echo "ERROR: No se encontró package.json."
    exit 1
fi

npm install

# Iniciar el bot
echo "[4/4] Iniciando TITANBOT..."
npm start
