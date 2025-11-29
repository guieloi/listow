# Guia de Build - APK Listow

## ⚠️ IMPORTANTE: Limitação do Windows

**Build local de Android no Windows NÃO é suportado pelo EAS CLI.**

O EAS Build só permite builds locais de Android em:
- ✅ **macOS**
- ✅ **Linux (Ubuntu/Debian)**
- ❌ **Windows** (apenas build na nuvem)

### Opções no Windows:

1. **Build na Nuvem (Recomendado para Windows)**
   - Rápido (10-20 min)
   - Sem instalação necessária
   - Gratuito (número limitado de builds)

2. **WSL2 + Linux (Avançado)**
   - Instalar Ubuntu no WSL2
   - Configurar Android SDK no Linux
   - Build local via WSL

3. **VM Linux ou Dual Boot**
   - Instalar Linux em máquina virtual
   - Ou dual boot com Windows

**Para este projeto, vamos usar Build na Nuvem.** 🚀

---

## Tipo de Build: Local vs Nuvem

### Build Local (Recomendado)
✅ **Mais rápido** (5-10 min)  
✅ **Sem limites** de builds  
✅ **Controle total**  
❌ Requer configuração inicial  

### Build na Nuvem
✅ **Fácil** (sem configuração)  
✅ **Funciona em qualquer PC**  
❌ **Lento** (15-30 min)  
❌ Limites de builds gratuitos  

---

## Build Local - Setup Completo (Windows)

### Passo 1: Instalar Java JDK 17

1. Baixe o **JDK 17**: https://adoptium.net/temurin/releases/?version=17
2. Escolha: **Windows x64** → **JDK** → **.msi installer**
3. Instale com as opções padrão
4. Verifique: `java -version` (deve mostrar 17.x.x)

### Passo 2: Instalar Android Studio

1. Baixe: https://developer.android.com/studio
2. Instale com as opções padrão
3. Abra o Android Studio
4. Vá em: **More Actions** → **SDK Manager**
5. Na aba **SDK Platforms**:
   - Marque **Android 13.0 (Tiramisu)** ou superior
6. Na aba **SDK Tools**:
   - Marque **Android SDK Build-Tools**
   - Marque **Android SDK Command-line Tools**
   - Marque **Android SDK Platform-Tools**
7. Clique em **Apply** e aguarde download

### Passo 3: Configurar Variáveis de Ambiente

1. Abra **Painel de Controle** → **Sistema** → **Configurações avançadas do sistema**
2. Clique em **Variáveis de Ambiente**

#### ANDROID_HOME

1. Em **Variáveis do Sistema**, clique em **Novo**
2. Nome: `ANDROID_HOME`
3. Valor: `C:\Users\[SEU_USUARIO]\AppData\Local\Android\Sdk`
   - **Importante:** Substitua `[SEU_USUARIO]` pelo seu nome de usuário!
   - Exemplo: `C:\Users\Guilherme\AppData\Local\Android\Sdk`

#### Atualizar PATH

1. Em **Variáveis do Sistema**, selecione **Path** e clique em **Editar**
2. Clique em **Novo** e adicione estas 3 linhas:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\cmdline-tools\latest\bin
   ```
3. Clique **OK** em todas as janelas

### Passo 4: Verificar Instalação

Feche e reabra o **PowerShell** (importante!) e execute:

```powershell
# Verificar Java
java -version

# Verificar Android SDK
adb --version

# Verificar variável ANDROID_HOME
echo $env:ANDROID_HOME
```

Se todos comandarem funcionarem, está pronto! ✅

---

## Fazer Build Local

### Passo 1: Instalar EAS CLI

```powershell
npm install -g eas-cli
```

### Passo 2: Login no Expo

```powershell
eas login
```

### Passo 3: Incrementar Versão

Edite `app.json` e incremente a versão:

```json
{
  "expo": {
    "version": "0.0.4"  // Incrementar sempre!
  }
}
```

### Passo 4: Build Local

```powershell
cd c:\wamp64\www\github\listow\listow

# Definir variável para não usar Git
$env:EAS_NO_VCS=1

# Build local
eas build --profile preview --platform android --local
```

**Aguarde 5-10 minutos.** ⏱️

O APK será salvo em:
```
c:\wamp64\www\github\listow\listow\build-<timestamp>.apk
```

---

## Instalar APK no Celular

### Método 1: USB
1. Conecte o celular no PC via USB
2. Copie o APK para o celular
3. Ative **Fontes desconhecidas** nas configurações
4. Abra o APK no celular e instale

### Método 2: Google Drive / WhatsApp
1. Envie o APK para você mesmo
2. Baixe no celular
3. Instale normalmente

---

## Perfis de Build

O projeto tem 3 perfis em `eas.json`:

### 1. Preview (Recomendado)
```powershell
eas build --profile preview --platform android --local
```
- Gera APK standalone
- Para distribuição interna
- **Melhor para testes**

### 2. Production
```powershell
eas build --profile production --platform android --local
```
- Build de release
- Para Play Store
- APK assinado

### 3. Development
```powershell
eas build --profile development --platform android --local
```
- Inclui dev client
- Para desenvolvimento

---

## Build na Nuvem (Alternativa)

Se tiver problemas com build local:

```powershell
cd c:\wamp64\www\github\listow\listow
$env:EAS_NO_VCS=1
eas build --profile preview --platform android
```

Baixe o APK pelo link exibido no terminal.

---

## Troubleshooting

### Erro: "ANDROID_HOME not set"
```powershell
# Verifique se está definido
echo $env:ANDROID_HOME

# Se estiver vazio, defina:
$env:ANDROID_HOME="C:\Users\[SEU_USUARIO]\AppData\Local\Android\Sdk"

# Depois adicione às variáveis do sistema (permanente)
```

### Erro: "Java version mismatch"
```powershell
# Verifique versão
java -version

# Se não for 17, reinstale JDK 17
```

### Erro: "adb not found"
```powershell
# Verifique se Android SDK foi instalado
dir $env:ANDROID_HOME\platform-tools

# Se vazio, reinstale Android SDK pelo Android Studio
```

### Erro: "Could not find or load main class"
```powershell
# Reinicie o PowerShell
# Verifique PATH novamente
echo $env:PATH | Select-String "Android"
```

### Build muito lento?
```powershell
# Use build na nuvem:
eas build --profile preview --platform android
```

---

## Comandos Úteis

```powershell
# Ver builds anteriores
eas build:list

# Cancelar build em andamento
eas build:cancel

# Ver configuração
eas project:info

# Atualizar EAS CLI
npm install -g eas-cli
```

---

## Resumo: Build Rápido

**1. Primeira vez? Configure:**
- Instale JDK 17
- Instale Android Studio + SDK
- Configure ANDROID_HOME
- Adicione ao PATH

**2. Para cada novo build:**
```powershell
cd c:\wamp64\www\github\listow\listow

# Incrementar versão em app.json
# Depois:

$env:EAS_NO_VCS=1
eas build --profile preview --platform android --local
```

**3. Aguarde 5-10 min e instale o APK! 🚀**

---

## Observações Importantes

- ✅ **Não precisa** de variáveis de ambiente específicas do app
- ✅ URL da API já está configurada no código
- ✅ Versão atual: **0.0.3**
- ✅ Sempre incremente a versão antes de buildar
- ✅ APK pode ser instalado diretamente no Android


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
