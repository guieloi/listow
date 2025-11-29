# Guia de Build - APK Listow

## Pré-requisitos

1. **Node.js** instalado (v18 ou superior)
2. **Conta Expo** (criar em https://expo.dev)
3. **EAS CLI** instalado globalmente:
   ```bash
   npm install -g eas-cli
   ```
4. **Login no EAS**:
   ```bash
   eas login
   ```

## Variáveis de Ambiente

O app **NÃO precisa** de variáveis de ambiente para build, pois a URL da API está configurada diretamente no código (`src/services/api.ts`).

Configuração atual:
```typescript
const API_BASE_URL = 'https://app.grupoigl.online/api'; // Produção
```

## Perfis de Build Disponíveis

O projeto tem 3 perfis configurados no `eas.json`:

### 1. **Development** (dev build)
```bash
eas build --profile development --platform android
```
- Inclui desenvolvimento client
- Para testes internos
- Requer conta Expo

### 2. **Preview** (APK standalone)
```bash
eas build --profile preview --platform android
```
- Gera APK pronto para instalação
- Para testes e distribuição interna
- **Recomendado para builds locais**

### 3. **Production** (release)
```bash
eas build --profile production --platform android
```
- Build de produção
- Para publicação na Play Store

## Build Local (Recomendado)

Para fazer o build **localmente** no seu computador (mais rápido, sem depender dos servidores Expo):

### Passo 1: Configurar ambiente local

```bash
# Instalar dependências Android
# Você precisa ter:
# - Android Studio instalado
# - Android SDK configurado
# - JDK 17
# - Variável ANDROID_HOME configurada
```

### Passo 2: Build local

```bash
cd c:\wamp64\www\github\listow\listow

# Build local APK
eas build --profile preview --platform android --local
```

Isso vai:
1. Compilar o app localmente
2. Gerar o APK em poucos minutos
3. Salvar o APK na pasta do projeto

## Build na Nuvem (Alternativa)

Se preferir fazer build nos servidores Expo (não precisa configurar Android SDK):

```bash
cd c:\wamp64\www\github\listow\listow

# Build na nuvem
eas build --profile preview --platform android
```

O build vai:
1. Subir o código para os servidores Expo
2. Compilar na nuvem
3. Gerar link para download do APK

## Incrementar Versão

Antes de cada build, **incremente a versão** no `app.json`:

```json
{
  "expo": {
    "version": "0.0.3",  // Atual: 0.0.2
    ...
  }
}
```

## Após o Build

### Build Local
O APK estará em: `c:\wamp64\www\github\listow\listow\build-<timestamp>.apk`

### Build na Nuvem
1. Aguarde o build terminar (5-15 min)
2. Baixe o APK pelo link fornecido no terminal
3. Ou acesse: https://expo.dev/accounts/[seu-usuario]/projects/listow/builds

## Instalar APK

1. Transfira o APK para o celular Android
2. Ative "Instalar apps desconhecidos" nas configurações
3. Abra o APK e instale

## Troubleshooting

### Erro: "Android SDK not found"
```bash
# Configure ANDROID_HOME
# Windows:
setx ANDROID_HOME "C:\Users\[USER]\AppData\Local\Android\Sdk"

# Adicione ao PATH:
# %ANDROID_HOME%\platform-tools
# %ANDROID_HOME%\tools
```

### Erro: "Java version mismatch"
```bash
# Use JDK 17
# Baixe em: https://adoptium.net/
```

### Build muito lento?
Use build na nuvem:
```bash
eas build --profile preview --platform android
# Remove o --local
```

### Erro de autenticação
```bash
# Re-faça login
eas logout
eas login
```

## Comandos Úteis

```bash
# Ver histórico de builds
eas build:list

# Ver status de um build específico
eas build:view [BUILD_ID]

# Cancelar build em andamento
eas build:cancel

# Ver configuração do projeto
eas project:info
```

## Resumo Rápido

Para fazer um build APK **agora**:

```bash
cd c:\wamp64\www\github\listow\listow

# Incrementar versão em app.json primeiro!
# Depois:

# Opção 1: Build local (mais rápido, requer Android SDK)
eas build --profile preview --platform android --local

# Opção 2: Build na nuvem (mais simples, mas mais lento)
eas build --profile preview --platform android
```

**Pronto!** 🚀
