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
  Surface,
  Portal,
  Modal
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import apiService from '../services/api';

import { AppTheme } from '../theme';
import LogoSVG from '../components/LogoSVG';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const emailRef = useRef(email);
  const { login, isLoading } = useAuth();
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

  const handleSendCode = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Erro', 'Digite seu email');
      return;
    }

    try {
      setForgotLoading(true);
      await apiService.forgotPassword(forgotEmail.trim());
      Alert.alert('Sucesso', 'Código enviado para seu email!');
      setForgotStep('code');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao enviar código');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim() || !newPassword.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setForgotLoading(true);
      await apiService.resetPassword(forgotEmail.trim(), resetCode.trim(), newPassword);
      Alert.alert('Sucesso', 'Senha redefinida! Faça login com a nova senha.');
      setShowForgotModal(false);
      setForgotStep('email');
      setForgotEmail('');
      setResetCode('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao redefinir senha');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotStep('email');
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setShowForgotModal(true);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <LogoSVG width={80} height={80} />
          <Text variant="displayMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 16 }}>Listow</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>Suas listas aqui</Text>
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
            secureTextEntry={!showPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            disabled={isLoading}
          />

          <TouchableOpacity onPress={openForgotModal} style={styles.forgotButton}>
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={{ height: 50 }}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Entrar
          </Button>

        </Surface>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Não tem uma conta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginLeft: 4 }}>Criar conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Forgot Password Modal */}
      <Portal>
        <Modal
          visible={showForgotModal}
          onDismiss={() => setShowForgotModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ marginBottom: 16, color: theme.colors.onSurface }}>
            {forgotStep === 'email' ? 'Recuperar Senha' : 'Digite o Código'}
          </Text>

          {forgotStep === 'email' ? (
            <>
              <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
                Digite seu email para receber o código de recuperação.
              </Text>
              <TextInput
                label="Email"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                disabled={forgotLoading}
              />
              <View style={styles.modalActions}>
                <Button onPress={() => setShowForgotModal(false)}>Cancelar</Button>
                <Button mode="contained" onPress={handleSendCode} loading={forgotLoading} disabled={forgotLoading}>
                  Enviar Código
                </Button>
              </View>
            </>
          ) : (
            <>
              <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
                Digite o código de 6 dígitos enviado para {forgotEmail}
              </Text>
              <TextInput
                label="Código"
                value={resetCode}
                onChangeText={setResetCode}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
                disabled={forgotLoading}
              />
              <TextInput
                label="Nova Senha"
                value={newPassword}
                onChangeText={setNewPassword}
                mode="outlined"
                secureTextEntry={!showNewPassword}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? "eye-off" : "eye"}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
                disabled={forgotLoading}
              />
              <View style={styles.modalActions}>
                <Button onPress={() => setForgotStep('email')}>Voltar</Button>
                <Button mode="contained" onPress={handleResetPassword} loading={forgotLoading} disabled={forgotLoading}>
                  Redefinir Senha
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
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
  forgotButton: {
    alignSelf: 'flex-end',
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
  modal: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
});

export default LoginScreen;

