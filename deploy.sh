#!/bin/bash

# Script de Deploy Automatizado - Listow
# Para usar no servidor 192.168.0.60

echo "🚀 Iniciando deploy do Listow..."

# Parar execução se houver erro
set -e

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

# Fazer backup do banco se existir (ANTES de parar os containers)
if docker ps | grep -q "listow-postgres"; then
    echo "💾 Fazendo backup do banco..."
    # Usar -T para evitar erro de TTY em ambientes não interativos
    docker-compose exec -T postgres pg_dump -U listow_user listow_db > backup_$(date +%Y%m%d_%H%M%S).sql
fi

# Atualizar código
echo "📥 Atualizando código..."
git fetch origin
git reset --hard origin/main

# Construir e iniciar containers (Forçando rebuild para garantir npm install)
echo "🔨 Construindo e iniciando containers..."
docker-compose up -d --build --force-recreate

# Aguardar um momento para o container tentar subir
sleep 10

# Se o container estiver reiniciando, pode ser necessário rodar npm install manualmente
if docker ps | grep "listow-backend" | grep -q "Restarting"; then
    echo "⚠️ Container em loop de reinício. Tentando instalar dependências..."
    docker-compose run --rm backend npm install
    docker-compose restart backend
fi

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
echo "📱 API disponível em: http://192.168.0.60:8085"
echo "🔍 Health check: http://192.168.0.60:8085/api/health"
echo "🗄️ PostgreSQL: 192.168.0.60:5432"
echo ""
echo "📋 Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Parar: docker-compose down"
echo "  - Reiniciar: docker-compose restart"
echo "  - Atualizar: git pull && docker-compose up -d --build"
echo ""
echo "📱 Para configurar o app mobile:"
echo "  Altere a URL da API em: listow/src/services/api.ts"
echo "  const API_BASE_URL = 'http://192.168.0.60:8085/api';"
