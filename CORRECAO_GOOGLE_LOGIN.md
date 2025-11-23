# 🔧 Correção do Login com Google

## 🐛 Problemas Identificados

1. **Token enviado incorreto**: O frontend estava enviando `accessToken` como `googleToken`, mas o backend espera um `id_token` para verificação em produção
2. **Client ID não configurado**: O `GOOGLE_CLIENT_ID` pode não estar configurado corretamente
3. **Falta de validação**: Não havia verificação se o Client ID estava configurado antes de tentar autenticar

## ✅ Correções Aplicadas

### 1. Validação do Client ID
- Adicionada verificação se o `GOOGLE_CLIENT_ID` está configurado antes de iniciar autenticação
- Mensagem de erro clara se o Client ID não estiver configurado

### 2. Melhor tratamento de erros
- Logs mais detalhados para debug
- Mensagens de erro mais claras
- Tratamento adequado de falhas na obtenção de informações do usuário

### 3. Envio correto do token
- **Antes**: Enviava `accessToken` como `googleToken`
- **Depois**: Envia `idToken` (ou `accessToken` como fallback) como `googleToken` para o backend
- O backend aceita `accessToken` em desenvolvimento (quando `NODE_ENV !== 'production'`)

## 📋 O que ainda precisa ser feito

### 1. Configurar Google Client ID

#### Frontend (`listow/.env` ou variável de ambiente):
```bash
EXPO_PUBLIC_GOOGLE_CLIENT_ID=SEU_CLIENT_ID_ANDROID.apps.googleusercontent.com
```

Ou adicione no `app.json`:
```json
{
  "expo": {
    "extra": {
      "googleClientId": "SEU_CLIENT_ID_ANDROID.apps.googleusercontent.com"
    }
  }
}
```

E atualize `googleAuth.ts`:
```typescript
import Constants from 'expo-constants';
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';
```

#### Backend (`backend/.env`):
```bash
GOOGLE_CLIENT_ID=SEU_CLIENT_ID_WEB.apps.googleusercontent.com
```

### 2. Configurar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione existente
3. Vá em **APIs & Services** > **Credentials**
4. Crie credenciais OAuth 2.0:
   - **Android**: Package name `com.guieloi.listow`
   - **Web**: Para o backend (não precisa de redirect URI para este fluxo)

### 3. Obter SHA-1 do Android (obrigatório)

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

### 4. Testar

1. Configure as variáveis de ambiente
2. Reinicie o app
3. Tente fazer login com Google
4. Verifique os logs no console para debug

## 🔍 Debug

Se ainda não funcionar, verifique:

1. **Console do app**: Procure por mensagens começando com `🔐`, `📱`, `✅`, `❌`
2. **Console do backend**: Verifique se o token está sendo recebido e validado
3. **Google Cloud Console**: Verifique se as credenciais estão ativas e corretas

## 📝 Notas Importantes

- Use **Client ID Android** no frontend
- Use **Client ID Web** no backend
- O SHA-1 é **obrigatório** para Android funcionar
- Em desenvolvimento, o backend pode pular a verificação do token se `NODE_ENV !== 'production'`
- Em produção, a verificação do token é obrigatória

