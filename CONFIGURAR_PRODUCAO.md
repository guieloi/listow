# Configuração para Produção

## Problema: Variáveis de Ambiente Não Configuradas

Se você está vendo o erro:
```
Error: JWT_SECRET environment variable is not defined!
```

Isso significa que as variáveis de ambiente não estão configuradas no servidor de produção.

## Solução: Criar arquivo .env

No servidor de produção, você precisa criar um arquivo `.env` na **raiz do projeto** (mesmo diretório onde está o `docker-compose.yml`).

### Passos:

1. **Acesse o servidor de produção via SSH:**
   ```bash
   ssh viveza@SRVWEB
   ```

2. **Descubra o caminho do projeto usando o container Docker:**
   ```bash
   # Opção 1: Verificar o working directory do container
   docker inspect listow-backend | grep -A 5 "WorkingDir"
   
   # Opção 2: Verificar onde está o docker-compose.yml
   docker inspect listow-backend | grep -A 10 "Mounts"
   
   # Opção 3: Entrar no container e verificar
   docker exec listow-backend pwd
   
   # Opção 4: Procurar pelo docker-compose.yml no servidor
   find / -name "docker-compose.yml" -type f 2>/dev/null | grep listow
   
   # Opção 5: Verificar processos Docker para encontrar o caminho
   ps aux | grep docker-compose
   ```

   **Dica rápida:** Se você souber onde clonou o repositório, geralmente está em:
   - `/home/viveza/listow`
   - `/opt/listow`
   - `/var/www/listow`
   - `~/listow` (diretório home do usuário)

3. **Navegue até o diretório do projeto:**
   ```bash
   cd /caminho/encontrado/acima
   ```

3. **Crie o arquivo `.env` na raiz do projeto:**

   **Opção A - Usando o script automático (recomendado):**
   ```bash
   chmod +x setup-env.sh
   ./setup-env.sh
   ```
   
   **Opção B - Criar manualmente:**
   ```bash
   nano .env
   ```

4. **Adicione as seguintes variáveis (substitua pelos valores reais):**
   ```env
   # Configurações do Banco de Dados PostgreSQL
   POSTGRES_DB=listow_db
   POSTGRES_USER=listow_user
   POSTGRES_PASSWORD=sua_senha_segura_aqui

   # Configurações do Backend
   JWT_SECRET=sua_chave_secreta_jwt_aqui_use_uma_string_aleatoria_longa_e_segura
   GOOGLE_CLIENT_ID=380197742222-fgno8bchna4atrghfjrqp38kluhnuoag.apps.googleusercontent.com

   # Porta do Backend (opcional, padrão: 8085)
   PORT=8085
   ```

5. **Para gerar um JWT_SECRET seguro, você pode usar:**
   ```bash
   # Opção 1: Usando openssl
   openssl rand -base64 32

   # Opção 2: Usando node
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

   # Opção 3: Usando um gerador online seguro
   # https://randomkeygen.com/
   ```

6. **Salve o arquivo** (no nano: `Ctrl+O`, `Enter`, `Ctrl+X`)

7. **Reinicie os containers Docker:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

8. **Verifique os logs para confirmar que está funcionando:**
   ```bash
   docker logs listow-backend -f
   ```

## Importante: Segurança e Preservação do .env

⚠️ **NUNCA** commite o arquivo `.env` no Git! Ele contém informações sensíveis.

O arquivo `.env` já está no `.gitignore`, então ele **NÃO será commitado** no Git.

### ⚠️ Preservar .env em Novos Deploys

**O arquivo `.env` NÃO será perdido em novos deploys** porque:

1. ✅ O `.env` está no `.gitignore` - não será sobrescrito pelo `git pull`
2. ✅ O script `deploy.sh` preserva automaticamente o `.env`:
   - Faz backup antes do `git pull`
   - Restaura após o `git pull`
3. ✅ O Docker Compose lê o `.env` do sistema de arquivos do servidor, não do Git

**Como funciona:**
```bash
# Quando você executa deploy.sh:
1. Faz backup do .env → .env.backup
2. Atualiza código do Git (git pull)
3. Restaura o .env do backup
```

**Se você fizer deploy manualmente:**
```bash
# Sempre preserve o .env antes de atualizar
cp .env .env.backup
git pull
mv .env.backup .env
docker-compose up -d --build
```

### Verificar se .env está no .gitignore

```bash
cat .gitignore | grep "\.env"
```

Se não estiver, adicione:

```gitignore
.env
.env.local
.env.production
.env.backup
```

## Verificação

Após configurar o `.env` e reiniciar os containers, você deve ver nos logs algo como:

```
> backend@1.0.0 start
> ts-node src/index.ts

[dotenv@17.2.3] injecting env (5) from .env
Server running on port 8085
```

O número `(5)` indica quantas variáveis foram carregadas do arquivo `.env`.

## Variáveis Necessárias

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `POSTGRES_DB` | Nome do banco de dados | Sim |
| `POSTGRES_USER` | Usuário do PostgreSQL | Sim |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | Sim |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | Sim |
| `GOOGLE_CLIENT_ID` | Client ID do Google OAuth | Não (mas necessário para login Google) |
| `PORT` | Porta do backend (padrão: 8085) | Não |

## Troubleshooting

### Erro persiste após criar .env

1. Verifique se o arquivo está na raiz do projeto (mesmo diretório do `docker-compose.yml`)
2. Verifique se o nome do arquivo é exatamente `.env` (sem extensão)
3. Verifique se não há espaços extras ou caracteres especiais nas variáveis
4. Reinicie os containers: `docker-compose restart`

### Verificar variáveis dentro do container

```bash
docker exec listow-backend env | grep JWT_SECRET
```

Se retornar vazio, a variável não está sendo passada corretamente.

