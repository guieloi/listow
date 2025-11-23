# Como Descobrir o Caminho do Projeto no Servidor

## 🎯 Métodos Rápidos

### Método 1: Usando docker inspect (Mais Confiável)
```bash
# Ver o working directory do container
docker inspect listow-backend | grep -i "workingdir"

# Ver todos os mounts (volumes) do container
docker inspect listow-backend | grep -A 20 "Mounts"

# Ver o caminho completo do docker-compose.yml
docker inspect listow-backend --format='{{range .Mounts}}{{.Source}}{{end}}'
```

### Método 2: Entrar no Container
```bash
# Entrar no container e verificar onde está
docker exec -it listow-backend sh
pwd
# Geralmente mostra: /app (dentro do container)
# Mas você precisa do caminho NO SERVIDOR, não no container
exit
```

### Método 3: Procurar pelo docker-compose.yml
```bash
# Procurar em locais comuns
find /home -name "docker-compose.yml" 2>/dev/null | grep listow
find /opt -name "docker-compose.yml" 2>/dev/null | grep listow
find /var/www -name "docker-compose.yml" 2>/dev/null | grep listow

# Procurar em todo o sistema (pode demorar)
find / -name "docker-compose.yml" -type f 2>/dev/null | grep listow
```

### Método 4: Verificar Processos Docker
```bash
# Ver processos docker-compose em execução
ps aux | grep docker-compose

# Ver processos do container
ps aux | grep listow-backend
```

### Método 5: Verificar Histórico de Comandos
```bash
# Ver histórico do bash (se ainda estiver na sessão)
history | grep "docker-compose\|cd\|git clone"

# Ver histórico completo
cat ~/.bash_history | grep -i listow
```

### Método 6: Verificar Onde o Git Clone Foi Feito
```bash
# Procurar por repositórios git
find /home -name ".git" -type d 2>/dev/null | grep listow
find /opt -name ".git" -type d 2>/dev/null | grep listow

# Se encontrar, o caminho do projeto é o diretório pai
```

## 🔍 Comando Completo para Descobrir

Execute este comando que tenta vários métodos:

```bash
echo "=== Tentando encontrar o caminho do projeto Listow ==="
echo ""
echo "1. Verificando processos docker-compose:"
ps aux | grep docker-compose | grep -v grep
echo ""
echo "2. Procurando docker-compose.yml em locais comuns:"
for dir in /home /opt /var/www ~; do
    if [ -d "$dir" ]; then
        result=$(find "$dir" -maxdepth 3 -name "docker-compose.yml" 2>/dev/null | grep -i listow)
        if [ ! -z "$result" ]; then
            echo "   Encontrado em: $result"
            echo "   Caminho do projeto: $(dirname $result)"
        fi
    fi
done
echo ""
echo "3. Verificando containers Docker:"
docker ps -a | grep listow
echo ""
echo "4. Verificando volumes Docker:"
docker volume ls | grep listow
```

## 📍 Locais Mais Comuns

O projeto geralmente está em um destes locais:

```bash
# Verificar cada um:
ls -la ~/listow
ls -la /home/viveza/listow
ls -la /opt/listow
ls -la /var/www/listow
ls -la /srv/listow
```

## ✅ Depois de Encontrar o Caminho

1. **Navegue até o diretório:**
   ```bash
   cd /caminho/encontrado
   ```

2. **Verifique se é o diretório correto:**
   ```bash
   ls -la
   # Deve conter: docker-compose.yml, backend/, etc.
   ```

3. **Configure o .env:**
   ```bash
   chmod +x setup-env.sh
   ./setup-env.sh
   ```

4. **Ou crie manualmente:**
   ```bash
   nano .env
   ```

## 🚀 Solução Rápida (Se Você Não Lembra)

Se você não conseguir encontrar o caminho, pode criar um novo diretório e clonar novamente:

```bash
# Criar diretório
mkdir -p ~/listow
cd ~/listow

# Clonar repositório (se for Git)
git clone https://github.com/seu-usuario/listow.git .

# OU se já tiver o código em outro lugar, copiar
# cp -r /caminho/antigo/* .

# Configurar .env
chmod +x setup-env.sh
./setup-env.sh

# Iniciar containers
docker-compose up -d
```

**⚠️ Atenção:** Se você criar um novo diretório, precisará:
- Parar os containers antigos: `docker-compose down` (no diretório antigo)
- Ou usar nomes diferentes no docker-compose.yml

