#!/bin/bash

echo "🚀 Iniciando TaskQuest Pro..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale Node.js 18+ em https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Criando a partir de .env.example..."
    cp .env.example .env
    echo "📝 Por favor, edite o arquivo .env com suas configurações de email"
    echo ""
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Iniciar servidor
echo "🎮 Iniciando servidor..."
npm start
