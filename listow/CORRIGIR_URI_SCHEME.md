# 🔧 Corrigir Erro: "Custom URI scheme is not enabled"

## 🐛 Erro Atual
```
Error 400: invalid_request
Custom URI scheme is not enabled for your Android client.
```

## ✅ Solução

Este erro ocorre porque o Google Cloud Console precisa ter o **Authorized redirect URIs** configurado para o seu app Android.

### Passo 1: Obter o Redirect URI correto

O redirect URI que estamos usando é baseado no scheme do app:
- **Scheme**: `com.guieloi.listow`
- **Redirect URI completo**: `com.guieloi.listow://` (ou similar)

### Passo 2: Configurar no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto
3. Vá em **APIs & Services** > **Credentials**
4. Encontre suas credenciais OAuth 2.0 Client ID para **Android**
5. Clique para editar
6. Na seção **Authorized redirect URIs**, adicione:
   ```
   com.guieloi.listow:/
   ```
   ou
   ```
   com.guieloi.listow://
   ```

### Passo 3: Verificar o Package Name

Certifique-se de que o **Package name** nas credenciais OAuth está configurado como:
```
com.guieloi.listow
```

### Passo 4: Verificar SHA-1

O SHA-1 também precisa estar configurado. Para obter:

```bash
cd listow/android
.\gradlew signingReport
```

Ou:
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copie o SHA-1 e adicione nas credenciais OAuth.

### Passo 5: Salvar e Aguardar

- Clique em **Save** no Google Cloud Console
- Aguarde alguns minutos para as mudanças propagarem
- Reinicie o app e teste novamente

## 🔍 Verificação

Para verificar qual redirect URI o app está usando, verifique os logs do console quando tentar fazer login. Você verá algo como:
```
🔐 Iniciando autenticação Google com: { redirectUri: 'com.guieloi.listow:/...' }
```

Use exatamente esse URI no Google Cloud Console.

## 📝 Nota Importante

- O redirect URI deve corresponder **exatamente** ao que o app está usando
- Mudanças no Google Cloud Console podem levar alguns minutos para propagar
- Certifique-se de que está editando as credenciais **Android**, não Web

