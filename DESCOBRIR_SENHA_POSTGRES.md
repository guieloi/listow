# Como Descobrir ou Redefinir a Senha do PostgreSQL

## 🔍 Método 1: Verificar se já existe um arquivo .env

No servidor, execute:
```bash
cd /var/www/listow
cat .env | grep POSTGRES_PASSWORD
```

Se o arquivo existir e tiver a senha, você verá algo como:
```
POSTGRES_PASSWORD=sua_senha_aqui
```

## 🔍 Método 2: Verificar variáveis de ambiente do container

```bash
# Ver variáveis do container PostgreSQL
docker exec listow-postgres env | grep POSTGRES_PASSWORD

# Ver variáveis do container backend (que também usa a senha)
docker exec listow-backend env | grep DB_PASSWORD
```

## 🔍 Método 3: Verificar configuração do Docker Compose

```bash
cd /var/www/listow
docker-compose config | grep POSTGRES_PASSWORD
```

Isso mostrará se a variável está sendo lida do .env.

## 🔄 Método 4: Se não conseguir descobrir, redefinir a senha

### Opção A: Redefinir via arquivo .env (Recomendado)

1. **Criar/editar o arquivo .env:**
   ```bash
   cd /var/www/listow
   nano .env
   ```

2. **Adicionar ou atualizar a senha:**
   ```env
   POSTGRES_PASSWORD=nova_senha_segura_aqui
   ```

3. **Redefinir a senha no PostgreSQL:**
   ```bash
   # Entrar no container PostgreSQL
   docker exec -it listow-postgres psql -U listow_user -d listow_db
   
   # Dentro do PostgreSQL, alterar a senha:
   ALTER USER listow_user WITH PASSWORD 'nova_senha_segura_aqui';
   \q
   ```

4. **Reiniciar os containers:**
   ```bash
   docker-compose restart
   ```

### Opção B: Recriar o banco com nova senha (se não houver dados importantes)

⚠️ **ATENÇÃO:** Isso apagará todos os dados do banco!

```bash
cd /var/www/listow

# Parar containers
docker-compose down

# Remover volume do banco (APAGA TODOS OS DADOS!)
docker volume rm listow_postgres_data

# Criar novo arquivo .env com nova senha
nano .env
# Adicione:
# POSTGRES_PASSWORD=nova_senha_segura_aqui

# Recriar containers
docker-compose up -d
```

## ✅ Verificar se a senha está correta

```bash
# Testar conexão com a senha
docker exec -it listow-postgres psql -U listow_user -d listow_db -c "SELECT version();"
```

Se pedir senha e você não souber, a senha no .env está incorreta ou não existe.

## 🎯 Solução Rápida: Criar nova senha

Se você não sabe a senha atual e precisa criar uma nova:

1. **Gerar uma senha segura:**
   ```bash
   openssl rand -base64 16
   ```

2. **Criar/editar .env:**
   ```bash
   cd /var/www/listow
   nano .env
   ```

3. **Adicionar:**
   ```env
   POSTGRES_DB=listow_db
   POSTGRES_USER=listow_user
   POSTGRES_PASSWORD=COLE_A_SENHA_GERADA_AQUI
   JWT_SECRET=GERE_UMA_CHAVE_AQUI
   GOOGLE_CLIENT_ID=380197742222-fgno8bchna4atrghfjrqp38kluhnuoag.apps.googleusercontent.com
   PORT=8085
   ```

4. **Se o banco já existe, alterar a senha:**
   ```bash
   # Parar containers
   docker-compose down
   
   # Iniciar apenas o PostgreSQL temporariamente
   docker run --rm -v listow_postgres_data:/var/lib/postgresql/data \
     -e POSTGRES_PASSWORD=senha_temporaria \
     postgres:15-alpine \
     psql -U postgres -c "ALTER USER listow_user WITH PASSWORD 'COLE_A_SENHA_GERADA_AQUI';"
   
   # Ou mais simples: entrar no container e alterar
   docker-compose up -d postgres
   sleep 5
   docker exec -it listow-postgres psql -U postgres -c "ALTER USER listow_user WITH PASSWORD 'COLE_A_SENHA_GERADA_AQUI';"
   ```

5. **Reiniciar tudo:**
   ```bash
   docker-compose restart
   ```

## 🔒 Boas Práticas

- Use senhas fortes (mínimo 16 caracteres)
- Não compartilhe a senha
- Mantenha o arquivo .env seguro (permissões 600)
- Faça backup do banco antes de alterar senhas

```bash
# Definir permissões corretas no .env
chmod 600 /var/www/listow/.env
```

