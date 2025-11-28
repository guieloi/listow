import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

const WEB_CLIENT_ID =
  Constants.expoConfig?.extra?.googleClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

if (!WEB_CLIENT_ID) {
  console.warn(
    '[GoogleAuth] WEB_CLIENT_ID ausente. Defina EXPO_PUBLIC_GOOGLE_CLIENT_ID no .env'
  );
}

// Configure Google Signin
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID || undefined,
  offlineAccess: true,
});

export const useGoogleAuth = () => {
  // This hook is no longer needed with native sign in, but keeping interface for compatibility if needed
  // or we can remove it. For now, returning dummy values to avoid breaking calls.
  return {
    request: null,
    response: null,
    promptAsync: async () => {
      console.warn('useGoogleAuth.promptAsync is deprecated. Use signInWithGoogle directly.');
      return { type: 'cancel' };
    }
  };
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
    if (!WEB_CLIENT_ID) {
      throw new Error('Google Client ID n\u00e3o configurado (EXPO_PUBLIC_GOOGLE_CLIENT_ID)');
    }

    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    // Check if userInfo.data is present (new API structure) or use userInfo directly (old API)
    // The library version installed might be v11+ or older. Assuming latest v13+ structure:
    const user = userInfo.data?.user || (userInfo as any).user;
    const idToken = userInfo.data?.idToken || (userInfo as any).idToken;

    // Note: accessToken is not always available directly in the result object in newer versions
    // You might need to use getTokens() if you explicitly need the access token.
    // For Firebase auth, idToken is usually enough.
    // Let's try to get tokens if possible, or return empty string if not critical.
    let accessToken = '';
    try {
      const tokens = await GoogleSignin.getTokens();
      accessToken = tokens.accessToken;
    } catch (e) {
      console.log('Could not get access token, might not be needed depending on backend', e);
    }

    if (!idToken) {
      throw new Error('No idToken returned from Google Sign-In');
    }

    console.log('✅ Google Sign-In success:', user.email);

    return {
      accessToken: accessToken,
      idToken: idToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        photo: user.photo || undefined,
      },
    };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Autenticação cancelada pelo usuário');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Autenticação já em andamento');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services não disponível ou desatualizado');
    } else {
      console.error('❌ Error signing in with Google:', error);
      throw new Error(error.message || 'Erro ao fazer login com Google');
    }
  }
};
