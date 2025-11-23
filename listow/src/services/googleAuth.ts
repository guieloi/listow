import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Obter Client ID do Google de múltiplas fontes:
// 1. Variável de ambiente EXPO_PUBLIC_GOOGLE_CLIENT_ID
// 2. app.json -> expo.extra.googleClientId
// 3. Fallback para valor padrão (que vai gerar erro se não configurado)
const GOOGLE_CLIENT_ID = 
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
  Constants.expoConfig?.extra?.googleClientId || 
  'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';

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

// Função auxiliar para fazer login com Google
export const signInWithGoogle = async (): Promise<{
  accessToken: string;
  idToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    photo?: string;
  };
}> => {
  try {
    // Verificar se o Client ID está configurado
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('SEU_CLIENT_ID')) {
      throw new Error('Google Client ID não configurado. Configure EXPO_PUBLIC_GOOGLE_CLIENT_ID no arquivo .env ou app.json');
    }

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'com.guieloi.listow',
    });

    console.log('🔐 Iniciando autenticação Google com:', {
      clientId: GOOGLE_CLIENT_ID.substring(0, 20) + '...',
      redirectUri,
    });
    console.log('⚠️ IMPORTANTE: Configure este redirect URI no Google Cloud Console:', redirectUri);

    // Construir URL de autorização manualmente para evitar problemas com PKCE
    // Nota: access_type=offline não é permitido com response_type=token
    const authUrl = `${discovery.authorizationEndpoint}?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` + // Usar 'token' para obter access_token diretamente
      `scope=${encodeURIComponent('openid profile email')}`;

    console.log('🔗 URL de autorização:', authUrl.substring(0, 100) + '...');

    // Usar WebBrowser para abrir a URL diretamente
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    console.log('📱 Resultado da autenticação:', result.type, result);

    if (result.type === 'success' && result.url) {
      // Extrair tokens da URL de callback
      const url = new URL(result.url);
      const hash = url.hash.substring(1); // Remover o #
      const params = new URLSearchParams(hash);
      
      const idToken = params.get('id_token') || null;
      const accessToken = params.get('access_token') || null;

      if (!accessToken) {
        throw new Error('access_token não recebido do Google');
      }

      // Obter informações do usuário usando access_token
      let userInfo;
      try {
          const userInfoResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
          );
          
          if (!userInfoResponse.ok) {
            const errorText = await userInfoResponse.text();
            console.error('❌ Erro ao obter informações do usuário:', errorText);
            throw new Error('Falha ao obter informações do usuário');
          }
          
          userInfo = await userInfoResponse.json();
          console.log('✅ Informações do usuário obtidas:', {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
          });
        } catch (error: any) {
          console.error('❌ Erro ao buscar informações do usuário:', error);
          throw new Error('Falha ao obter informações do usuário do Google');
        }
      if (!userInfo) {
        throw new Error('Não foi possível obter informações do usuário');
      }

      // Usar access_token como id_token para o backend (em desenvolvimento funciona)
      // Em produção, seria necessário usar ResponseType.Code para obter id_token
      const tokenToSend = idToken || accessToken;

      return {
        accessToken: accessToken || '',
        idToken: tokenToSend || '',
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          photo: userInfo.picture,
        },
      };
    } else if (result.type === 'cancel') {
      throw new Error('Autenticação cancelada pelo usuário');
    } else {
      console.error('❌ Erro na autenticação:', result);
      throw new Error(`Autenticação falhou: ${result.type}`);
    }
  } catch (error: any) {
    console.error('❌ Error signing in with Google:', error);
    throw new Error(error.message || 'Erro ao fazer login com Google');
  }
};

