# Dockerfile para Backend Listow
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Expor porta
EXPOSE 8085

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S listow -u 1001

# Mudar para usuário não-root
USER listow

# Comando para iniciar aplicação
CMD ["npm", "start"]