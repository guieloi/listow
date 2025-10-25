# Configuração do Servidor 192.168.0.60

## 📋 Checklist de Deploy

### Pré-requisitos
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Git instalado
- [ ] Portas 8085 e 5432 liberadas no firewall
- [ ] Usuário com permissões sudo

### Configuração de Rede
```bash
# Verificar portas disponíveis
sudo netstat -tulpn | grep :8085
sudo netstat -tulpn | grep :5432

# Liberar portas no firewall (Ubuntu/Debian)
sudo ufw allow 8085
sudo ufw allow 5432

# Liberar portas no firewall (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=8085/tcp
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

### Configuração do Sistema
```bash
# Criar usuário para a aplicação (opcional)
sudo useradd -m -s /bin/bash listow
sudo usermod -aG docker listow

# Criar diretórios
sudo mkdir -p /opt/listow
sudo chown listow:listow /opt/listow
```

## 🚀 Deploy Rápido

### 1. Clonar e Configurar
```bash
cd /opt/listow
git clone https://github.com/guieloi/listow.git .
cp .env.production .env
```

### 2. Executar Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Verificar Status
```bash
docker-compose ps
curl http://192.168.0.60:8085/api/health
```

## 🔧 Configurações Avançadas

### SSL/HTTPS (Produção)
```bash
# Instalar Nginx como proxy reverso
sudo apt install nginx

# Configurar certificado SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### Monitoramento
```bash
# Instalar Portainer para gerenciar containers
docker volume create portainer_data
docker run -d -p 9000:9000 --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data portainer/portainer-ce
```

### Backup Automático
```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2h da manhã
0 2 * * * cd /opt/listow && docker-compose exec postgres pg_dump -U listow_user listow_db > /opt/backups/listow_$(date +\%Y\%m\%d).sql
```

## 📱 Configuração do App Mobile

### Alterar URL da API
Editar arquivo `listow/src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://192.168.0.60:8085/api';
```

### Build do App
```bash
cd listow
npm install
npx expo build:android
# ou
npx expo build:ios
```

## 🔍 Troubleshooting

### Container não inicia
```bash
docker-compose logs backend
docker-compose logs postgres
```

### Banco não conecta
```bash
docker-compose exec postgres psql -U listow_user -d listow_db
```

### API não responde
```bash
curl -v http://192.168.0.60:8085/api/health
docker-compose exec backend npm run dev
```

### Verificar recursos do sistema
```bash
docker stats
df -h
free -h
```

## 📊 Monitoramento

### Logs em tempo real
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Status dos serviços
```bash
docker-compose ps
docker system df
docker volume ls
```

### Performance
```bash
docker stats --no-stream
htop
iotop
```

## 🔒 Segurança

### Alterar senhas padrão
Editar `docker-compose.yml` e alterar:
- `POSTGRES_PASSWORD`
- `DB_PASSWORD`
- `JWT_SECRET`

### Configurar firewall
```bash
# Permitir apenas IPs específicos
sudo ufw allow from 192.168.0.0/24 to any port 8085
sudo ufw allow from 192.168.0.0/24 to any port 5432
```

### Backup de segurança
```bash
# Backup completo
tar -czf listow_backup_$(date +%Y%m%d).tar.gz /opt/listow
```

## 📞 Suporte

Em caso de problemas:
1. Verificar logs: `docker-compose logs`
2. Verificar status: `docker-compose ps`
3. Reiniciar serviços: `docker-compose restart`
4. Rebuild completo: `docker-compose down && docker-compose up -d --build`