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

# Preservar arquivo .env se existir
if [ -f .env ]; then
    echo "💾 Preservando arquivo .env..."
    cp .env .env.backup
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

# Restaurar arquivo .env se existir backup
if [ -f .env.backup ]; then
    echo "🔄 Restaurando arquivo .env..."
    mv .env.backup .env
fi

# Verificar se .env existe e se as variáveis de ambiente estão definidas
if [ ! -f .env ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
        echo "⚠️ Variáveis de ambiente POSTGRES_PASSWORD e/ou JWT_SECRET não encontradas!"
        echo "   Verifique se as secrets estão configuradas no GitHub Actions."
        exit 1
    fi

    if [ ! -f .env ]; then
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
    else
        echo "🔄 Atualizando arquivo .env com as variáveis de ambiente..."
        # Backup do arquivo atual
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

        # Recriar .env com as novas variáveis
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
        echo "✅ Arquivo .env atualizado com sucesso!"
    fi
else
    echo "✅ Arquivo .env já existe e variáveis de ambiente estão definidas."
fi

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
