import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Substitua pelo seu Client ID do Google (Android)
// Você obterá isso no Google Cloud Console após criar as credenciais OAuth
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';

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
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'com.guieloi.listow',
    });

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.params.access_token) {
      // Obter informações do usuário usando o access token
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${result.params.access_token}`
      );
      
      if (!userInfoResponse.ok) {
        throw new Error('Falha ao obter informações do usuário');
      }
      
      const userInfo = await userInfoResponse.json();

      return {
        accessToken: result.params.access_token,
        idToken: result.params.id_token || result.params.access_token,
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
      throw new Error('Autenticação falhou');
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(error.message || 'Erro ao fazer login com Google');
  }
};

