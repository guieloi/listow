# Criar arquivo .env URGENTE

## ⚠️ Problema
O Docker Compose está mostrando:
```
WARN[0000] The "POSTGRES_PASSWORD" variable is not set. Defaulting to a blank string.
```

Isso significa que o arquivo `.env` não existe ou não está sendo lido.

## ✅ Solução Rápida

Execute estes comandos no servidor:

```bash
cd /var/www/listow

# 1. Verificar se o arquivo .env existe
ls -la .env

# 2. Se não existir, criar:
nano .env
```

Cole este conteúdo (use a senha padrão `postgres` por enquanto):

```env
POSTGRES_DB=listow_db
POSTGRES_USER=listow_user
POSTGRES_PASSWORD=postgres
JWT_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=380197742222-fgno8bchna4atrghfjrqp38kluhnuoag.apps.googleusercontent.com
PORT=8085
```

**OU** execute este comando para criar automaticamente:

```bash
cd /var/www/listow

# Gerar JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)

# Criar arquivo .env
cat > .env << EOF
POSTGRES_DB=listow_db
POSTGRES_USER=listow_user
POSTGRES_PASSWORD=postgres
JWT_SECRET=${JWT_SECRET}
GOOGLE_CLIENT_ID=380197742222-fgno8bchna4atrghfjrqp38kluhnuoag.apps.googleusercontent.com
PORT=8085
EOF

# Verificar se foi criado
cat .env
```

Depois reinicie:

```bash
docker-compose down
docker-compose up -d
```

Verifique os logs:

```bash
docker logs listow-backend -f
```

Você NÃO deve mais ver o aviso sobre POSTGRES_PASSWORD.

