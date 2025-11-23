# Configuração Rápida do .env no Servidor

## 📍 Caminho do Projeto
```
/var/www/listow/
```

## 🚀 Passos Rápidos

### 1. Acessar o diretório do projeto
```bash
cd /var/www/listow
```

### 2. Criar o arquivo .env

**Opção A - Usando o script automático (recomendado):**
```bash
chmod +x setup-env.sh
./setup-env.sh
```

**Opção B - Criar manualmente:**
```bash
nano .env
```

Cole o seguinte conteúdo e preencha os valores:

```env
# Configurações do Banco de Dados PostgreSQL
POSTGRES_DB=listow_db
POSTGRES_USER=listow_user
POSTGRES_PASSWORD=SUA_SENHA_AQUI

# Configurações do Backend
JWT_SECRET=GERE_UMA_CHAVE_SEGURA_AQUI
GOOGLE_CLIENT_ID=380197742222-fgno8bchna4atrghfjrqp38kluhnuoag.apps.googleusercontent.com

# Porta do Backend
PORT=8085
```

### 3. Gerar JWT_SECRET seguro

No servidor, execute:
```bash
openssl rand -base64 32
```

Copie o resultado e cole no campo `JWT_SECRET` do arquivo `.env`.

### 4. Salvar o arquivo

No nano: `Ctrl+O`, `Enter`, `Ctrl+X`

### 5. Reiniciar os containers
```bash
docker-compose down
docker-compose up -d
```

### 6. Verificar se está funcionando
```bash
docker logs listow-backend -f
```

Você deve ver algo como:
```
[dotenv@17.2.3] injecting env (5) from .env
Server running on port 8085
```

## ✅ Verificação Rápida

```bash
# Verificar se o arquivo .env existe
ls -la /var/www/listow/.env

# Verificar se as variáveis estão sendo lidas (dentro do container)
docker exec listow-backend env | grep JWT_SECRET

# Ver status dos containers
docker ps | grep listow
```

## 🔒 Segurança

⚠️ **IMPORTANTE:** O arquivo `.env` está no `.gitignore`, então:
- ✅ Não será commitado no Git
- ✅ Não será perdido em novos deploys (o deploy.sh preserva automaticamente)
- ✅ Fica apenas no servidor

## 🐛 Se ainda der erro

1. Verifique se o arquivo está no lugar certo:
   ```bash
   ls -la /var/www/listow/.env
   ```

2. Verifique se não há espaços extras ou caracteres especiais:
   ```bash
   cat /var/www/listow/.env
   ```

3. Verifique se o Docker Compose está lendo o arquivo:
   ```bash
   cd /var/www/listow
   docker-compose config | grep JWT_SECRET
   ```

4. Reinicie os containers:
   ```bash
   docker-compose restart
   ```

