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

# Fazer backup do banco se existir
if docker ps | grep -q "listow-postgres"; then
    echo "💾 Fazendo backup do banco..."
    # Usar -T para evitar erro de TTY em ambientes não interativos
    docker-compose exec -T postgres pg_dump -U listow_user listow_db > backup_$(date +%Y%m%d_%H%M%S).sql
fi

# Atualizar código
echo "📥 Atualizando código para branch $1..."
git fetch origin
if [ -z "$1" ]; then
    echo "⚠️ Nenhum branch especificado. Usando main como padrão."
    git reset --hard origin/main
else
    git reset --hard origin/$1
fi

# Verificar se .env existe e tentar carregar
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado."
    
    # Debug: Verificar se o arquivo tem conteúdo (sem mostrar senhas)
    echo "🔍 Verificando conteúdo do .env..."
    if grep -q "JWT_SECRET=" .env; then
        echo "   - JWT_SECRET encontrado no arquivo."
    else
        echo "   ❌ JWT_SECRET NÃO encontrado no arquivo .env!"
    fi
    
    # Carregar variáveis do .env para o ambiente atual
    # Isso garante que o docker-compose consiga fazer a substituição ${VAR}
    echo "📥 Carregando variáveis de ambiente do .env..."
    set -a
    source .env
    set +a
else
    echo "❌ Arquivo .env não encontrado! O deploy pode falhar."
fi

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
# --env-file garante que o docker-compose leia o arquivo
docker-compose --env-file .env up -d --build

# Aguardar containers iniciarem com verificação ativa
echo "⏳ Aguardando API iniciar..."
MAX_RETRIES=60
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    # Tenta conectar no healthcheck
    if curl -s -f http://localhost:8085/api/health > /dev/null; then
        echo "✅ API iniciou com sucesso em ${COUNT}s!"
        break
    fi
    
    sleep 1
    COUNT=$((COUNT+1))
    
    # Mostrar progresso a cada 5s
    if [ $((COUNT % 5)) -eq 0 ]; then
        echo "   ... aguardando (${COUNT}s)"
    fi

    if [ $COUNT -eq $MAX_RETRIES ]; then
        echo "❌ Timeout aguardando API iniciar."
        echo "📋 Logs recentes do backend:"
        docker-compose logs --tail=50 backend
        exit 1
    fi
done

# Verificar status final
echo "🔍 Verificando status dos containers..."
docker-compose ps

echo "🎉 Deploy concluído!"
echo "📱 API disponível em: http://192.168.0.60:8085"
echo "🔍 Health check: http://192.168.0.60:8085/api/health"
echo "🗄️ PostgreSQL: 192.168.0.60:5432"
