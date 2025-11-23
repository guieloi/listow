# 🔧 Como Configurar o Google Client ID

## ⚠️ Erro Atual
```
ERROR ❌ Error signing in with Google: [Error: Google Client ID não configurado]
```

## ✅ Solução Rápida

Você tem **2 opções** para configurar o Google Client ID:

### Opção 1: Usar app.json (Recomendado)

1. Abra o arquivo `listow/app.json`
2. Localize a seção `"extra"` dentro de `"expo"`
3. Substitua `"SEU_CLIENT_ID_AQUI.apps.googleusercontent.com"` pelo seu Client ID real do Google Cloud Console

Exemplo:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "952ef910-9741-4fe8-ac92-2f2acde007e7"
      },
      "googleClientId": "123456789-abcdefghijklmnop.apps.googleusercontent.com"
    }
  }
}
```

4. **Reinicie o servidor Expo** (pare com Ctrl+C e execute `npm start` novamente)

### Opção 2: Usar arquivo .env

1. Crie um arquivo `.env` na pasta `listow/`
2. Adicione a seguinte linha:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=SEU_CLIENT_ID_AQUI.apps.googleusercontent.com
```

3. Substitua `SEU_CLIENT_ID_AQUI.apps.googleusercontent.com` pelo seu Client ID real
4. **Reinicie o servidor Expo**

## 📋 Como Obter o Google Client ID

1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto (ou crie um novo)
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Se solicitado, configure o OAuth consent screen primeiro
6. Selecione **Application type**: **Android**
7. Preencha:
   - **Name**: Listow Android
   - **Package name**: `com.guieloi.listow`
   - **SHA-1 certificate fingerprint**: (obtenha com o comando abaixo)

### Obter SHA-1 (obrigatório para Android)

Execute no terminal:
```bash
cd listow/android
.\gradlew signingReport
```

Ou:
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copie o SHA-1 e cole no Google Cloud Console.

8. Clique em **Create**
9. Copie o **Client ID** (formato: `xxxxxx-xxxxx.apps.googleusercontent.com`)
10. Use este Client ID no `app.json` ou `.env`

## 🔄 Após Configurar

1. **Pare o servidor Expo** (Ctrl+C)
2. **Limpe o cache** (opcional mas recomendado):
   ```bash
   npx expo start --clear
   ```
3. Teste o login com Google novamente

## ✅ Verificação

Após configurar, você deve ver no console (ao iniciar o app):
```
🔐 Iniciando autenticação Google com: { clientId: '123456789-...', redirectUri: '...' }
```

Se ainda aparecer o erro, verifique:
- ✅ O Client ID está correto (sem espaços extras)
- ✅ O servidor Expo foi reiniciado
- ✅ O formato está correto: `xxxxxx-xxxxx.apps.googleusercontent.com`

## 📝 Nota Importante

- Use o **Client ID Android** no frontend
- Use o **Client ID Web** no backend (arquivo `backend/.env`)
- O SHA-1 é **obrigatório** para funcionar no Android

