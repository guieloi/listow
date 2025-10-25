#!/bin/bash

# Script de Deploy Automatizado - Listow
# Para usar no servidor 192.168.0.60

echo "🚀 Iniciando deploy do Listow..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Fazer backup do banco se existir
if docker volume ls | grep -q "listow_postgres_data"; then
    echo "💾 Fazendo backup do banco..."
    docker-compose exec postgres pg_dump -U listow_user listow_db > backup_$(date +%Y%m%d_%H%M%S).sql
fi

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker-compose up -d --build

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 30

# Verificar status
echo "🔍 Verificando status dos containers..."
docker-compose ps

# Testar API
echo "🧪 Testando API..."
if curl -f http://localhost:8085/api/health; then
    echo "✅ API funcionando corretamente!"
else
    echo "❌ Erro na API. Verificando logs..."
    docker-compose logs backend
fi

# Mostrar logs
echo "📋 Logs dos containers:"
docker-compose logs --tail=20

echo "🎉 Deploy concluído!"
echo "📱 API disponível em: http://192