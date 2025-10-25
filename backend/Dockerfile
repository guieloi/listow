# Dockerfile para Backend Listow
FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover devDependencies após build para reduzir tamanho da imagem
RUN npm prune --production

# Expor porta
EXPOSE 8085

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S listow -u 1001

# Mudar para usuário não-root
USER listow

# Comando para iniciar aplicação
CMD ["npm", "start"]