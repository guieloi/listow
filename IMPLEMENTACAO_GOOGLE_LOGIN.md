# ✅ Implementação de Login com Google - Resumo

## 📦 O que foi implementado

### ✅ Backend
- [x] Controller `googleLogin` criado em `backend/src/controllers/authController.ts`
- [x] Rota `/auth/google` adicionada em `backend/src/routes/auth.ts`
- [x] Suporte para verificação de token Google (quando configurado)
- [x] Criação/atualização de usuários via Google

### ✅ Frontend
- [x] Método `loginWithGoogle` adicionado em `listow/src/services/api.ts`
- [x] Função `loginWithGoogle` adicionada em `listow/src/context/AuthContext.tsx`
- [x] Serviço `googleAuth.ts` criado com função `signInWithGoogle`
- [x] Botão "Entrar com Google" adicionado na tela de Login
- [x] Tipos atualizados em `listow/src/types/index.ts`

---

## 🚀 Próximos Passos (AÇÃO NECESSÁRIA)

### 1. Instalar Dependências

#### Frontend:
```bash
cd listow
npx expo install expo-auth-session expo-crypto
```

#### Backend:
```bash
cd backend
npm install google-auth-library
```

### 2. Configurar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Configure OAuth consent screen (se necessário)
6. Crie credenciais para:
   - **Android**: Package name `com.guieloi.listow`
   - **Web**: Para o backend

### 3. Obter SHA-1 do Android

Execute no terminal:
```bash
cd listow/android
.\gradlew signingReport
```

Ou:
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copie o SHA-1 e adicione nas credenciais OAuth do Google Cloud Console.

### 4. Configurar Variáveis de Ambiente

#### Frontend (`listow/.env` ou `app.json`):
```json
{
  "expo": {
    "extra": {
      "googleClientId": "SEU_CLIENT_ID_ANDROID.apps.googleusercontent.com"
    }
  }
}
```

Ou crie arquivo `.env`:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=SEU_CLIENT_ID_ANDROID.apps.googleusercontent.com
```

#### Backend (`backend/.env`):
```
GOOGLE_CLIENT_ID=SEU_CLIENT_ID_WEB.apps.googleusercontent.com
```

### 5. Atualizar Código com Client ID

Edite `listow/src/services/googleAuth.ts` e substitua:
```typescript
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';
```

Pelo seu Client ID real do Google Cloud Console.

### 6. Testar

1. Inicie o backend
2. Inicie o app no emulador
3. Clique em "Entrar com Google"
4. Selecione uma conta Google
5. Verifique se o login funciona

---

## 📝 Arquivos Modificados

### Backend:
- `backend/src/controllers/authController.ts` - Adicionado `googleLogin`
- `backend/src/routes/auth.ts` - Adicionada rota `/auth/google`

### Frontend:
- `listow/src/services/api.ts` - Adicionado `loginWithGoogle`
- `listow/src/context/AuthContext.tsx` - Adicionada função `loginWithGoogle`
- `listow/src/types/index.ts` - Atualizado `AuthContextType`
- `listow/src/screens/LoginScreen.tsx` - Adicionado botão Google
- `listow/src/services/googleAuth.ts` - **NOVO** - Serviço de autenticação Google

---

## ⚠️ Importante

1. **Client IDs diferentes**: Use o Client ID Android no frontend e o Client ID Web no backend
2. **SHA-1 obrigatório**: Sem o SHA-1 correto, o login Google não funcionará no Android
3. **Ambiente de produção**: Configure credenciais separadas para produção
4. **Segurança**: Nunca commite as credenciais no Git. Use variáveis de ambiente

---

## 🐛 Troubleshooting

### Erro: "Token do Google inválido"
- Verifique se o `GOOGLE_CLIENT_ID` no backend está correto
- Certifique-se de usar o Client ID **Web** no backend

### Erro: "Autenticação cancelada"
- Verifique se o SHA-1 está configurado corretamente no Google Cloud Console
- Verifique se o Package Name está correto (`com.guieloi.listow`)

### Botão não aparece
- Verifique se as dependências foram instaladas
- Verifique se não há erros de lint/compilação

---

## 📚 Documentação Adicional

Consulte `GOOGLE_LOGIN_GUIDE.md` para instruções detalhadas passo a passo.

