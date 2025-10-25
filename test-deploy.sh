#!/bin/bash

# Script de teste para verificar deploy
echo "🧪 Testando deploy do Listow..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    exit 1
fi

echo "✅ Docker está rodando"

# Verificar sintaxe do docker-compose
echo "🔍 Verificando sintaxe do docker-compose..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml está válido"
else
    echo "❌ Erro na sintaxe do docker-compose.yml"
    docker-compose config
    exit 1
fi

# Verificar se as portas estão livres
echo "🔍 Verificando portas..."
if lsof -i :8085 > /dev/null 2>&1; then
    echo "⚠️  Porta 8085 está ocupada"
    lsof -i :8085
fi

if lsof -i :5432 > /dev/null 2>&1; then
    echo "⚠️  Porta 5432 está ocupada"
    lsof -i :5432
fi

# Testar build do backend
echo "🔨 Testando build do backend..."
cd backend
if npm run build > /dev/null 2>&1; then
    echo "✅ Build do backend funcionou"
    rm -rf dist
else
    echo "❌ Erro no build do backend"
    npm run build
    exit 1
fi
cd ..

echo "🎉 Todos os testes passaram! Deploy deve funcionar."