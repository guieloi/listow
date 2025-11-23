#!/bin/bash

# Script para configurar o arquivo .env no servidor
# Uso: ./setup-env.sh

echo "🔧 Configuração do arquivo .env para Listow"
echo ""

# Verificar se .env já existe
if [ -f .env ]; then
    echo "⚠️ Arquivo .env já existe!"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Operação cancelada."
        exit 1
    fi
    echo "💾 Fazendo backup do .env atual..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Coletar informações
echo "📝 Preencha as informações abaixo:"
echo ""

read -p "Nome do banco de dados [listow_db]: " POSTGRES_DB
POSTGRES_DB=${POSTGRES_DB:-listow_db}

read -p "Usuário do PostgreSQL [listow_user]: " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-listow_user}

read -sp "Senha do PostgreSQL: " POSTGRES_PASSWORD
echo ""

read -sp "JWT_SECRET (ou pressione Enter para gerar automaticamente): " JWT_SECRET
echo ""

# Gerar JWT_SECRET se não fornecido
if [ -z "$JWT_SECRET" ]; then
    echo "🔐 Gerando JWT_SECRET seguro..."
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
    elif command -v node &> /dev/null; then
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    else
        echo "⚠️ Não foi possível gerar JWT_SECRET automaticamente."
        echo "   Instale openssl ou node, ou gere manualmente em: https://randomkeygen.com/"
        read -sp "Digite o JWT_SECRET manualmente: " JWT_SECRET
        echo ""
    fi
fi

read -p "GOOGLE_CLIENT_ID [380197742222-fgno8bchna4atrghfjrqp38kluhnuoag.apps.googleusercontent.com]: " GOOGLE_CLIENT_ID
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-380197742222-fgno8bchna4atrghfjrqp38kluhnuoag.apps.googleusercontent.com}

read -p "Porta do Backend [8085]: " PORT
PORT=${PORT:-8085}

# Criar arquivo .env
cat > .env << EOF
# Configurações do Banco de Dados PostgreSQL
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Configurações do Backend
JWT_SECRET=${JWT_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}

# Porta do Backend
PORT=${PORT}
EOF

echo ""
echo "✅ Arquivo .env criado com sucesso!"
echo ""
echo "📋 Resumo das configurações:"
echo "   POSTGRES_DB: ${POSTGRES_DB}"
echo "   POSTGRES_USER: ${POSTGRES_USER}"
echo "   POSTGRES_PASSWORD: [oculto]"
echo "   JWT_SECRET: [oculto]"
echo "   GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}"
echo "   PORT: ${PORT}"
echo ""
echo "🚀 Agora você pode executar: docker-compose up -d"
echo ""

