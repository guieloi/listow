import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import Constants from 'expo-constants';
import { AppTheme } from '../theme';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const theme = useTheme<AppTheme>();
  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        {title}
      </Text>
      {children}
      <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
    </View>
  );
};

const PrivacyPolicyScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const supportEmail =
    Constants.expoConfig?.extra?.supportEmail || Constants.manifest?.extra?.supportEmail || 'suporte@grupoigl.online';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
        Política de Privacidade
      </Text>
      <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </Text>

      <Section title="Dados que coletamos">
        <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
          - Nome, email e senha para criar e acessar sua conta.{'\n'}
          - Dados das listas e itens que você cria ou compartilha.{'\n'}
          - Token de notificação push para envio de alertas.{'\n'}
          - Informações técnicas básicas (modelo do dispositivo, versão do app) para funcionamento e segurança.
        </Text>
      </Section>

      <Section title="Como usamos os dados">
        <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
          Utilizamos seus dados para autenticação, sincronização de listas, compartilhamento com colaboradores
          autorizados, envio de notificações e melhoria contínua do serviço. Não vendemos seus dados.
        </Text>
      </Section>

      <Section title="Armazenamento e segurança">
        <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
          Os dados são transmitidos de forma segura para o nosso backend e armazenados conforme a finalidade do
          serviço. Tokens e caches locais são guardados apenas no seu dispositivo para facilitar o uso offline.
        </Text>
      </Section>

      <Section title="Compartilhamento">
        <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
          Dados de listas podem ser compartilhados somente com usuários que você convidar. Dados pessoais não são
          compartilhados com terceiros sem sua autorização, salvo para cumprir obrigações legais.
        </Text>
      </Section>

      <Section title="Seus direitos">
        <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
          Você pode acessar, corrigir ou solicitar a exclusão da sua conta a qualquer momento. Também pode revogar
          notificações nas configurações do dispositivo.
        </Text>
      </Section>

      <Section title="Contato">
        <Text variant="bodyMedium" style={[styles.paragraph, { color: theme.colors.onSurfaceVariant }]}>
          Em caso de dúvidas ou solicitações relacionadas à privacidade, fale com a gente: {supportEmail}
        </Text>
      </Section>
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
  },
  sectionTitle: {
    marginBottom: 6,
  },
  divider: {
    marginTop: 12,
    opacity: 0.5,
  },
});

export default PrivacyPolicyScreen;
