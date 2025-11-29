import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Button, useTheme, TextInput, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { AppTheme } from '../theme';

const AccountDeletionScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const { user, logout } = useAuth();
  const [reason, setReason] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const supportEmail =
    Constants.expoConfig?.extra?.supportEmail || Constants.manifest?.extra?.supportEmail || 'suporte@grupoigl.online';

  const openDeletionRequest = async () => {
    const subject = encodeURIComponent('Solicitação de exclusão de conta - Listow');
    const body = encodeURIComponent(
      [
        `Olá, gostaria de excluir minha conta no Listow.`,
        user?.email ? `Email cadastrado: ${user.email}` : '',
        reason ? `Motivo: ${reason}` : '',
        '',
        'Por favor, confirme quando a exclusão for concluída.',
      ]
        .filter(Boolean)
        .join('\n')
    );
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (!canOpen) {
      Alert.alert('Erro', `Não foi possível abrir o app de email. Envie para ${supportEmail}.`);
      return;
    }
    await Linking.openURL(mailtoUrl);
  };

  const requestDeletion = async () => {
    try {
      setRequestingDeletion(true);
      await apiService.requestAccountDeletion(reason);
      await AsyncStorage.clear();
      await logout();
      Alert.alert('Solicitação enviada', 'Seu pedido de exclusão foi registrado. Você receberá a confirmação por email.');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Não foi possível enviar a solicitação. Tente novamente.';
      Alert.alert('Erro', message);
    } finally {
      setRequestingDeletion(false);
    }
  };

  const clearLocalData = async () => {
    try {
      setSendingEmail(true);
      await AsyncStorage.clear();
      await logout();
      Alert.alert('Dados locais apagados', 'Sua sessão e dados em cache foram removidos deste dispositivo.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível limpar os dados locais.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
        Exclusão de Conta
      </Text>

      <View style={styles.section}>
        <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
          Você pode solicitar a exclusão da sua conta a qualquer momento. Enviaremos a confirmação da exclusão para o
          email cadastrado.
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleSmall" style={{ color: theme.colors.onBackground, marginBottom: 6 }}>
          Motivo (opcional)
        </Text>
        <TextInput
          mode="outlined"
          placeholder="Quero excluir minha conta porque..."
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />
      </View>

      <Button
        mode="contained"
        icon="email"
        onPress={openDeletionRequest}
        style={styles.button}
        buttonColor={theme.colors.errorContainer}
        textColor={theme.colors.onErrorContainer}
        loading={sendingEmail}
        disabled={sendingEmail}
      >
        Solicitar exclusão por email
      </Button>

      <Button
        mode="contained"
        icon="delete-alert"
        onPress={requestDeletion}
        style={styles.button}
        loading={requestingDeletion}
        disabled={requestingDeletion}
      >
        Solicitar exclusão no servidor
      </Button>

      <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

      <View style={styles.section}>
        <Text variant="titleSmall" style={{ color: theme.colors.onBackground, marginBottom: 6 }}>
          Remover dados locais agora
        </Text>
        <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
          Isso encerra sua sessão e limpa dados em cache deste dispositivo. A exclusão definitiva depende da conclusão
          pelo suporte.
        </Text>
      </View>

      <Button
        mode="outlined"
        icon="delete"
        onPress={clearLocalData}
        style={styles.button}
        textColor={theme.colors.error}
        disabled={sendingEmail || requestingDeletion}
      >
        Apagar dados locais e sair
      </Button>

      <Text variant="bodySmall" style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>
        Suporte: {supportEmail}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontWeight: '700',
  },
  paragraph: {
    lineHeight: 20,
  },
  section: {
    marginTop: 8,
    gap: 4,
  },
  button: {
    marginTop: 12,
  },
  divider: {
    marginVertical: 16,
    opacity: 0.5,
  },
  footer: {
    marginTop: 12,
    textAlign: 'center',
  },
});

export default AccountDeletionScreen;
