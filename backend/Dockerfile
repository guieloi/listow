# Dockerfile para Backend Listow
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 8085

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S listow -u 1001

# Mudar propriedade dos arquivos para o usuário listow
RUN chown -R listow:nodejs /app

# Mudar para usuário não-root
USER listow

# Comando para iniciar aplicação
CMD ["npm", "start"]