import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  useTheme, 
  Surface 
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { signInWithGoogle } from '../services/googleAuth';
import { AppTheme } from '../theme';
import LogoSVG from '../components/LogoSVG';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const emailRef = useRef(email);
  const { login, loginWithGoogle, isLoading } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    emailRef.current = email;
  }, [email]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      await login({ email: email.trim(), password });
    } catch (error: any) {
      setPassword('');
      setEmail(emailRef.current); 
      Alert.alert('Erro', error.message || 'Falha no login');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const googleData = await signInWithGoogle();
      await loginWithGoogle(googleData);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer login com Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <LogoSVG width={80} height={80} />
          <Text variant="displayMedium" style={{color: theme.colors.primary, fontWeight: 'bold', marginTop: 16}}>Listow</Text>
          <Text variant="titleMedium" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>Suas listas aqui</Text>
        </View>

        <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
            disabled={isLoading}
          />

          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            disabled={isLoading}
          />

          <Button 
            mode="contained" 
            onPress={handleLogin} 
            loading={isLoading} 
            disabled={isLoading}
            style={styles.button}
            contentStyle={{height: 50}}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Entrar
          </Button>

          <View style={styles.dividerContainer}>
             <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
             <Text variant="bodySmall" style={{marginHorizontal: 8, color: theme.colors.outline}}>OU</Text>
             <View style={[styles.line, { backgroundColor: theme.colors.outline }]} />
          </View>

          <Button
            mode="outlined"
            onPress={handleGoogleLogin}
            loading={isGoogleLoading}
            disabled={isLoading || isGoogleLoading}
            icon="google"
            style={[styles.googleButton, { borderColor: theme.colors.outline }]}
            textColor={theme.colors.onSurface}
          >
            Entrar com Google
          </Button>
        </Surface>

        <View style={styles.footer}>
           <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>Não tem uma conta?</Text>
           <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text variant="bodyMedium" style={{color: theme.colors.primary, fontWeight: 'bold', marginLeft: 4}}>Criar conta</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
  },
  googleButton: {
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
});

export default LoginScreen;
