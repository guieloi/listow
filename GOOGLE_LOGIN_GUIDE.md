# Guia Completo: Implementação de Login com Google

## 📋 Visão Geral

Este guia detalha todos os passos necessários para implementar login com Google no app Listow, tanto no frontend (React Native/Expo) quanto no backend (Node.js/Express).

---

## 🔧 PARTE 1: Configuração do Google Cloud Console

### Passo 1.1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em "Criar Projeto" ou selecione um projeto existente
3. Anote o **Project ID** criado

### Passo 1.2: Habilitar Google Sign-In API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Procure por "Google Sign-In API" ou "Google+ API"
3. Clique em **Enable**

### Passo 1.3: Configurar OAuth 2.0 Credentials

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**
3. Se solicitado, configure a **OAuth consent screen**:
   - Escolha **External** (para testes) ou **Internal** (para organização)
   - Preencha: App name, User support email, Developer contact
   - Adicione seu email como test user se necessário
4. Crie credenciais para cada plataforma:

#### Para Android:
- **Application type**: Android
- **Name**: Listow Android
- **Package name**: `com.guieloi.listow`
- **SHA-1 certificate fingerprint**: (obtenha com o comando abaixo)

Para obter o SHA-1:
```bash
# Windows (PowerShell)
cd listow/android
.\gradlew signingReport

# Ou usando keytool diretamente
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### Para iOS (se necessário):
- **Application type**: iOS
- **Name**: Listow iOS
- **Bundle ID**: `com.guieloi.listow`

#### Para Web (backend):
- **Application type**: Web application
- **Name**: Listow Backend
- **Authorized redirect URIs**: 
  - `http://localhost:8085/api/auth/google/callback` (desenvolvimento)
  - `https://app.grupoigl.online/api/auth/google/callback` (produção)

### Passo 1.4: Anotar Credenciais

Anote os seguintes valores (você precisará deles):
- **Client ID** (Android)
- **Client ID** (Web - para backend)
- **Client Secret** (Web - para backend)

---

## 📱 PARTE 2: Frontend (React Native/Expo)

### Passo 2.1: Instalar Dependências

```bash
cd listow
npx expo install expo-auth-session expo-crypto
```

### Passo 2.2: Configurar app.json

Adicione a configuração do Google no `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

**Nota**: Os arquivos `google-services.json` e `GoogleService-Info.plist` serão baixados do Google Cloud Console.

### Passo 2.3: Criar Serviço de Autenticação Google

Crie o arquivo `listow/src/services/googleAuth.ts`:

```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Substitua pelo seu Client ID do Google (Android)
const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'com.guieloi.listow',
      }),
    },
    discovery
  );

  return { request, response, promptAsync };
};
```

### Passo 2.4: Adicionar Método no apiService

No arquivo `listow/src/services/api.ts`, adicione:

```typescript
async loginWithGoogle(googleToken: string, googleId: string, email: string, name: string, photoUrl?: string): Promise<AuthResponse> {
  const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/google', {
    googleToken,
    googleId,
    email,
    name,
    photoUrl,
  });
  return response.data;
}
```

### Passo 2.5: Adicionar Função no AuthContext

No arquivo `listow/src/context/AuthContext.tsx`, adicione:

```typescript
const loginWithGoogle = async (googleData: {
  accessToken: string;
  idToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    photo?: string;
  };
}): Promise<void> => {
  try {
    setIsLoading(true);
    const response = await apiService.loginWithGoogle(
      googleData.accessToken,
      googleData.user.id,
      googleData.user.email,
      googleData.user.name,
      googleData.user.photo
    );

    setUser(response.user);
    setToken(response.token);

    await AsyncStorage.setItem('auth_token', response.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.user));

    registerForPushNotifications();
  } catch (error: any) {
    console.error('Google login error:', error);
    const message = error.response?.data?.error || 'Erro ao fazer login com Google';
    throw new Error(message);
  } finally {
    setIsLoading(false);
  }
};
```

E adicione no `value` do contexto:
```typescript
const value: AuthContextType = {
  // ... outros valores
  loginWithGoogle,
};
```

### Passo 2.6: Atualizar Types

No arquivo `listow/src/types/index.ts`, adicione ao `AuthContextType`:

```typescript
loginWithGoogle: (googleData: {
  accessToken: string;
  idToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    photo?: string;
  };
}) => Promise<void>;
```

### Passo 2.7: Adicionar Botão na Tela de Login

No arquivo `listow/src/screens/LoginScreen.tsx`, adicione o botão de login com Google.

---

## 🖥️ PARTE 3: Backend (Node.js/Express)

### Passo 3.1: Instalar Dependências

```bash
cd backend
npm install google-auth-library
```

### Passo 3.2: Criar Controller para Google Login

Crie/atualize `backend/src/controllers/authController.ts`:

```typescript
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleToken, googleId, email, name, photoUrl } = req.body;

    // Verificar token do Google
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || payload.sub !== googleId) {
      res.status(401).json({ error: 'Token do Google inválido' });
      return;
    }

    // Verificar se usuário já existe
    let result = await pool.query(
      'SELECT id, name, email, google_id FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    let user;
    if (result.rows.length > 0) {
      // Usuário existe - atualizar google_id se necessário
      user = result.rows[0];
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, photo_url = $2 WHERE id = $3',
          [googleId, photoUrl || null, user.id]
        );
      }
    } else {
      // Criar novo usuário
      const insertResult = await pool.query(
        'INSERT INTO users (name, email, google_id, photo_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, google_id, created_at, updated_at',
        [name, email, googleId, photoUrl || null]
      );
      user = insertResult.rows[0];
    }

    // Gerar JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      String(JWT_SECRET),
    );

    const authResponse: AuthResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        google_id: user.google_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      token
    };

    res.json(authResponse);
  } catch (error) {
    console.error('Error in Google login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
```

### Passo 3.3: Adicionar Rota

No arquivo `backend/src/routes/auth.ts`:

```typescript
router.post('/google', authController.googleLogin);
```

### Passo 3.4: Configurar Variáveis de Ambiente

No arquivo `.env` do backend:

```
GOOGLE_CLIENT_ID=seu_client_id_web_aqui.apps.googleusercontent.com
```

---

## ✅ Checklist Final

- [ ] Google Cloud Console configurado
- [ ] Credenciais OAuth criadas (Android, Web)
- [ ] SHA-1 do Android obtido e configurado
- [ ] Dependências instaladas (frontend e backend)
- [ ] Código implementado em ambos os lados
- [ ] Variáveis de ambiente configuradas
- [ ] Testado no emulador/dispositivo

---

## 🧪 Testando

1. Inicie o servidor backend
2. Inicie o app no emulador
3. Clique no botão "Entrar com Google"
4. Selecione uma conta Google
5. Verifique se o login foi bem-sucedido

---

## 📝 Notas Importantes

- O SHA-1 é necessário para Android funcionar corretamente
- Para produção, use credenciais diferentes das de desenvolvimento
- Mantenha as credenciais seguras (não commite no Git)
- O `google-services.json` deve ser baixado do Google Cloud Console

