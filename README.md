# Listow - App de Lista de Compras

Um aplicativo mobile para Android e iOS que permite criar e gerenciar listas de compras, com compartilhamento colaborativo entre usuários.

## 🚀 Funcionalidades

- ✅ **Autenticação**: Login e cadastro com email/senha
- ✅ **Listas de Compras**: Criar, editar e excluir listas
- ✅ **Itens**: Adicionar itens com nome, quantidade e preço
- ✅ **Inserção Rápida**: Barra de digitação rápida para adicionar itens
- ✅ **Compartilhamento**: Compartilhar listas com outros usuários
- ✅ **CRUD Completo**: Todas as operações básicas implementadas
- ✅ **Interface Intuitiva**: Design moderno e fácil de usar

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (banco local)
- **JWT** para autenticação
- **bcryptjs** para hash de senhas

### Frontend
- **React Native** + **Expo**
- **TypeScript**
- **React Navigation** para navegação
- **AsyncStorage** para armazenamento local

## 📱 Estrutura do Projeto

```
listow/
├── backend/                 # API REST
│   ├── src/
│   │   ├── controllers/     # Lógica dos endpoints
│   │   ├── models/          # Tipos e interfaces
│   │   ├── routes/          # Definição das rotas
│   │   ├── middleware/      # Middleware de autenticação
│   │   └── config/          # Configuração do banco
│   └── database.sql         # Schema do banco
├── listow/                  # App React Native
│   ├── src/
│   │   ├── screens/         # Telas do app
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── services/        # Chamadas para API
│   │   ├── context/         # Context API para estado
│   │   ├── types/           # Tipos TypeScript
│   │   └── utils/           # Utilitários
│   └── App.tsx              # Ponto de entrada
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js (v16+)
- PostgreSQL instalado e rodando localmente
- Expo CLI (`npm install -g @expo/cli`)

### 1. Backend

```bash
cd backend
npm install
# Configure as credenciais do PostgreSQL em src/config/database.ts
npm run build
npm run dev
```

### 2. Frontend

```bash
cd listow
npm install
npx expo start
```

### 3. Banco de Dados

Execute o script `backend/database.sql` no PostgreSQL para criar as tabelas.

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/profile` - Obter perfil

### Listas
- `GET /api/lists` - Listar listas do usuário
- `POST /api/lists` - Criar lista
- `PUT /api/lists/:id` - Atualizar lista
- `DELETE /api/lists/:id` - Excluir lista
- `POST /api/lists/:id/share` - Compartilhar lista

### Itens
- `GET /api/items/list/:listId` - Listar itens
- `POST /api/items/list/:listId` - Criar item
- `PUT /api/items/:id` - Atualizar item
- `DELETE /api/items/:id` - Excluir item
- `PATCH /api/items/:id/toggle` - Alternar status

## 🎨 Telas do App

1. **Login** - Tela de autenticação
2. **Cadastro** - Registro de novos usuários
3. **Home** - Lista todas as listas de compras
4. **Detalhes da Lista** - Mostra itens da lista com inserção rápida
5. **Compartilhar Lista** - Gerenciar colaboradores

## 🔐 Autenticação e Autorização

- JWT tokens armazenados localmente
- Middleware de autenticação em todas as rotas protegidas
- Controle de permissões para listas compartilhadas
- Renovação automática de tokens

## 📱 Recursos Mobile

- **Cross-platform**: Android e iOS
- **Offline-ready**: Dados armazenados localmente
- **Performance**: Interface otimizada
- **UX**: Design intuitivo e responsivo

## 🧪 Testando

Para testar o app:

1. Execute o backend (`npm run dev` na pasta backend)
2. Execute o app (`npx expo start` na pasta listow)
3. Use um emulador ou dispositivo físico
4. Crie uma conta ou faça login
5. Teste todas as funcionalidades

## 📝 Notas de Desenvolvimento

- O projeto está configurado para desenvolvimento local
- Para produção, será necessário configurar variáveis de ambiente
- A autenticação Google pode ser adicionada futuramente
- O design pode ser aprimorado com mais componentes customizados

## 🤝 Contribuição

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
