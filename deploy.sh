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

# Verificar se .env existe
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado."
    
    # Verificar se o .env tem as variáveis críticas
    if grep -q "POSTGRES_PASSWORD=" .env && grep -q "JWT_SECRET=" .env; then
        echo "✅ Arquivo .env contém as configurações necessárias."
    else
        echo "⚠️ Arquivo .env incompleto. Tentando recriar..."
        # Só tentamos recriar se as variáveis estiverem disponíveis
        if [ -n "$POSTGRES_PASSWORD" ] && [ -n "$JWT_SECRET" ]; then
            rm .env
        else
            echo "❌ Arquivo .env incompleto e variáveis de ambiente não disponíveis. Mantendo arquivo atual."
            # Não falhamos aqui, tentamos seguir com o que tem
        fi
    fi
fi

# Se .env não existe, criar (somente se variáveis estiverem disponíveis)
if [ ! -f .env ]; then
    if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
        echo "⚠️ Variáveis de ambiente POSTGRES_PASSWORD e/ou JWT_SECRET não encontradas e arquivo .env não existe!"
        echo "   O deploy falhará se o backend não tiver configuração."
        # Não damos exit 1 aqui para permitir troubleshooting, mas avisamos
    else
        echo "📝 Criando arquivo .env com as variáveis de ambiente..."
        cat > .env << EOF
# Configurações do Banco de Dados PostgreSQL
POSTGRES_DB=listow_db
POSTGRES_USER=listow_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Configurações do Backend
JWT_SECRET=$JWT_SECRET
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-278950160388-9iavu1duamc7lofv9a34a356a5dm6637.apps.googleusercontent.com}

# Porta do Backend
PORT=8085
EOF
        echo "✅ Arquivo .env criado com sucesso!"
    fi
fi

# Construir e iniciar containers (Sem --force-recreate para ser mais rápido)
echo "🔨 Construindo e iniciando containers..."
docker-compose up -d --build

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
        # Não falhamos o script inteiro para permitir ver logs, mas avisamos erro
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
