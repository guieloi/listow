import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Avatar,
  List,
  IconButton,
  useTheme,
  SegmentedButtons,
  Divider,
  Surface
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ListCollaborator, User } from '../types';
import apiService from '../services/api';
import { AppTheme } from '../theme';

type ShareListScreenRouteProp = RouteProp<RootStackParamList, 'ShareList'>;
type ShareListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ShareList'>;

const ShareListScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const navigation = useNavigation<ShareListScreenNavigationProp>();
  const route = useRoute<ShareListScreenRouteProp>();
  const { listId, listName, isOwner, userRole, ownerId } = route.params;

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [collaborators, setCollaborators] = useState<ListCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<User | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Compartilhar',
      headerStyle: { backgroundColor: theme.colors.background },
    });
    if (isOwner) {
      fetchCollaborators();
    } else {
      fetchOwnerInfo();
    }
  }, [listName, navigation, isOwner]);

  const fetchOwnerInfo = async () => {
    if (!ownerId) return;
    try {
      setLoadingOwner(true);
      const owner = await apiService.getUserById(ownerId);
      setOwnerInfo(owner);
    } catch (error) {
      console.error('Error fetching owner info:', error);
    } finally {
      setLoadingOwner(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const collaboratorsData = await apiService.getListCollaborators(listId);
      setCollaborators(collaboratorsData);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (emailText: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(!emailRegex.test(emailText));
  };

  const handleShare = async () => {
    if (!email.trim() || emailError) return;

    const trimmedEmail = email.trim().toLowerCase();

    // Check local duplicates
    if (collaborators.some(c => c.email.toLowerCase() === trimmedEmail)) {
      Alert.alert('Aviso', 'Usuário já é colaborador.');
      return;
    }

    try {
      setSharing(true);
      await apiService.shareList(listId, trimmedEmail, permission);
      Alert.alert('Sucesso', 'Convite enviado!');
      setEmail('');
      fetchCollaborators();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao compartilhar lista.');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: number) => {
    Alert.alert('Remover', 'Remover este colaborador?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            await apiService.removeCollaborator(listId, collaboratorId);
            fetchCollaborators();
          } catch (e) {
            Alert.alert('Erro', 'Falha ao remover.');
          }
        }
      }
    ]);
  };

  const renderCollaborator = ({ item }: { item: ListCollaborator }) => (
    <List.Item
      title={item.name}
      description={item.email}
      left={props => <Avatar.Text {...props} size={40} label={item.name.charAt(0).toUpperCase()} style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />}
      right={props => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="labelSmall" style={{ marginRight: 8, color: theme.colors.onSurfaceVariant }}>
            {item.permission === 'write' ? 'Editor' : 'Leitor'}
          </Text>
          <IconButton icon="close" size={20} onPress={() => handleRemoveCollaborator(item.id)} />
        </View>
      )}
    />
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.container}>

        <View style={styles.header}>
          <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>{listName}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {isOwner ? 'Gerencie quem tem acesso a esta lista.' : 'Você é um colaborador nesta lista.'}
          </Text>
        </View>

        {isOwner ? (
          <>
            <Surface style={[styles.shareCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.onSurface }}>Adicionar Colaborador</Text>

              <TextInput
                label="Email do usuário"
                value={email}
                onChangeText={(text) => { setEmail(text); validateEmail(text); }}
                mode="outlined"
                error={emailError}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                right={<TextInput.Icon icon="email" />}
              />

              <View style={{ marginBottom: 16 }}>
                <SegmentedButtons
                  value={permission}
                  onValueChange={val => setPermission(val as 'read' | 'write')}
                  buttons={[
                    { value: 'read', label: 'Leitura', icon: 'eye' },
                    { value: 'write', label: 'Escrita', icon: 'pencil' },
                  ]}
                />
              </View>

              <Button
                mode="contained"
                onPress={handleShare}
                loading={sharing}
                disabled={!email || emailError || sharing}
              >
                Compartilhar
              </Button>
            </Surface>

            <View style={styles.listSection}>
              <Text variant="titleMedium" style={{ marginBottom: 8, paddingHorizontal: 4, color: theme.colors.onSurface }}>
                Colaboradores ({collaborators.length})
              </Text>

              {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
              ) : (
                <FlatList
                  data={collaborators}
                  keyExtractor={item => item.id.toString()}
                  renderItem={renderCollaborator}
                  ItemSeparatorComponent={() => <Divider />}
                  ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant }}>Nenhum colaborador.</Text>}
                />
              )}
            </View>
          </>
        ) : (
          <Surface style={[styles.shareCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <List.Item
              title={ownerInfo?.name || "Proprietário"}
              description={ownerInfo?.email || 'Carregando...'}
              left={props => <Avatar.Icon {...props} icon="crown" style={{ backgroundColor: theme.colors.tertiary }} />}
            />
            <Divider style={{ marginVertical: 8 }} />
            <List.Item
              title="Sua Permissão"
              description={userRole === 'write' ? 'Você pode editar esta lista.' : 'Você pode apenas visualizar.'}
              left={props => <Avatar.Icon {...props} icon={userRole === 'write' ? 'pencil' : 'eye'} style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.primary} />}
            />
          </Surface>
        )}

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  shareCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  listSection: {
    flex: 1,
  },
});

export default ShareListScreen;
