# Deploy do Listow no Servidor 192.168.0.60

## 📋 Pré-requisitos no Servidor

1. **Docker e Docker Compose instalados**
2. **Git instalado**
3. **Portas liberadas**: 8085 (backend), 5432 (postgres)

## 🚀 Passos para Deploy

### 1. Conectar ao Servidor
```bash
ssh usuario@192.168.0.60
```

### 2. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/listow.git
cd listow
```

### 3. Configurar Variáveis de Ambiente (Opcional)
```bash
# Criar arquivo .env se necessário
cp .env.example .env
nano .env
```

### 4. Executar o Deploy
```bash
# Construir e iniciar os containers
docker-compose up -d --build

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 5. Verificar Funcionamento
```bash
# Testar API
curl http://192.168.0.60:8085/api/health

# Verificar banco
docker-compose exec postgres psql -U listow_user -d listow_db -c "\dt"
```

## 🔧 Comandos Úteis

### Gerenciamento dos Containers
```bash
# Parar containers
docker-compose down

# Reiniciar containers
docker-compose restart

# Ver logs específicos
docker-compose logs backend
docker-compose logs postgres

# Atualizar aplicação
git pull
docker-compose up -d --build
```

### Backup do Banco
```bash
# Fazer backup
docker-compose exec postgres pg_dump -U listow_user listow_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U listow_user listow_db < backup.sql
```

## 🌐 Acessos

- **API Backend**: http://192.168.0.60:8085
- **Health Check**: http://192.168.0.60:8085/api/health
- **PostgreSQL**: 192.168.0.60:5432

## 🔒 Segurança

1. **Firewall**: Liberar apenas portas necessárias
2. **SSL**: Configurar certificado SSL para produção
3. **Senhas**: Alterar senhas padrão do docker-compose.yml
4. **Backup**: Configurar backup automático do banco

## 📱 Configuração do App Mobile

No app React Native, alterar a URL da API:
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://192.168.0.60:8085/api';
```

## 🐛 Troubleshooting

### Container não inicia
```bash
docker-compose logs backend
docker-compose logs postgres
```

### Banco não conecta
```bash
docker-compose exec postgres psql -U listow_user -d listow_db
```

### Porta ocupada
```bash
sudo netstat -tulpn | grep :8085
sudo lsof -i :8085
```