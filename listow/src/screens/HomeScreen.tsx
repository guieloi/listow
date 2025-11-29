import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Text,
  FAB,
  useTheme,
  Card,
  Avatar,
  IconButton,
  Portal,
  Modal,
  TextInput,
  Button,
  ProgressBar,
  Menu,
  Divider,
  Surface,
  Switch
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import apiService from '../services/api';
import { RootStackParamList, ShoppingList } from '../types';
import { AppTheme } from '../theme';
import LogoSVG from '../components/LogoSVG';
import Constants from 'expo-constants';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const { isDark, toggleTheme } = useAppTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout } = useAuth();

  // State
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form Data
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editListName, setEditListName] = useState('');

  // Profile Data
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [visibleMenuId, setVisibleMenuId] = useState<number | null>(null);

  const openMenu = (id: number) => setVisibleMenuId(id);
  const closeMenu = () => setVisibleMenuId(null);

  // Initialize profile data
  useEffect(() => {
    if (user?.name) setProfileName(user.name);
  }, [user]);

  // Generate initials from first two names
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'U';
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return 'U';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  };

  const fetchLists = async () => {
    try {
      const fetchedLists = await apiService.getLists();
      setLists(fetchedLists);
    } catch (error: any) {
      console.error('Error fetching lists:', error);
      // Silent error or toast could be better here
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLists();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLists();
  };

  // --- List Actions ---

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      const newList = await apiService.createList({ name: newListName.trim() });
      setLists(prev => [newList, ...prev]);
      setShowCreateModal(false);
      setNewListName('');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar lista');
    }
  };

  const handleEditList = async () => {
    if (!editingList || !editListName.trim()) return;

    try {
      const updatedList = await apiService.updateList(editingList.id, { name: editListName.trim() });
      setLists(prev => prev.map(l => l.id === editingList.id ? updatedList : l));
      setShowEditModal(false);
      setEditingList(null);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao editar lista');
    }
  };

  const handleDeleteList = (list: ShoppingList) => {
    Alert.alert(
      'Excluir Lista',
      `Deseja realmente excluir "${list.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteList(list.id);
              setLists(prev => prev.filter(l => l.id !== list.id));
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir lista');
            }
          },
        },
      ]
    );
  };

  // --- Profile Actions ---

  const handleSaveProfile = async () => {
    try {
      await apiService.updateProfile(profileName, null);
      Alert.alert('Sucesso', 'Perfil atualizado!');
      setShowProfileModal(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar perfil.');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (newPassword.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');

      const hasLetter = /[a-zA-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);

      if (!hasLetter || !hasNumber) {
        throw new Error('A senha deve conter letras e números.');
      }

      await apiService.changePassword(currentPassword, newPassword);
      Alert.alert('Sucesso', 'Senha alterada!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Falha ao alterar senha.');
    }
  };

  // --- Render ---

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const progress = item.total_items && item.total_items > 0
      ? (item.completed_items || 0) / item.total_items
      : 0;

    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate('ListDetails', {
          listId: item.id,
          listName: item.name,
          isOwner: item.is_owner,
          userRole: item.user_role,
          ownerId: item.owner_id
        })}
        mode="elevated"
        elevation={1}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{item.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.completed_items || 0} de {item.total_items || 0} itens marcados
              </Text>
            </View>

            {(item.is_owner || item.user_role === 'write') && (
              <Menu
                visible={visibleMenuId === item.id}
                onDismiss={closeMenu}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    onPress={() => openMenu(item.id)}
                  />
                }
                contentStyle={{ backgroundColor: theme.colors.surface }}
              >
                <Menu.Item
                  onPress={() => {
                    closeMenu();
                    navigation.navigate('ShareList', {
                      listId: item.id,
                      listName: item.name,
                      isOwner: item.is_owner,
                      userRole: item.user_role,
                      ownerId: item.owner_id
                    });
                  }}
                  title="Compartilhar"
                  leadingIcon="share-variant"
                />
                <Menu.Item
                  onPress={() => {
                    closeMenu();
                    setEditingList(item);
                    setEditListName(item.name);
                    setShowEditModal(true);
                  }}
                  title="Editar Nome"
                  leadingIcon="pencil"
                />
                <Divider />
                {item.is_owner ? (
                  <Menu.Item
                    onPress={() => {
                      closeMenu();
                      handleDeleteList(item);
                    }}
                    title="Excluir"
                    leadingIcon="delete"
                    titleStyle={{ color: theme.colors.error }}
                  />
                ) : (
                  <Menu.Item
                    onPress={() => {
                      closeMenu();
                      // TODO: Implement leave list logic
                    }}
                    title="Sair da Lista"
                    leadingIcon="logout"
                    titleStyle={{ color: theme.colors.error }}
                  />
                )}
              </Menu>
            )}
          </View>

          <ProgressBar
            progress={progress}
            color={progress === 1 ? theme.colors.secondary : theme.colors.primary}
            style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
          />

          {item.is_shared && (
            <View style={styles.sharedBadge}>
              <Avatar.Icon size={24} icon="account-group" style={{ backgroundColor: 'transparent' }} color={theme.colors.primary} />
              <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                {item.collaborators_count ? `${item.collaborators_count} membros` : 'Compartilhada'}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Logo e Nome do App */}
      <Surface style={[styles.appHeader, { backgroundColor: theme.colors.background }]} elevation={0}>
        <View style={styles.logoContainer}>
          <LogoSVG width={48} height={48} />
          <Text variant="headlineMedium" style={[styles.appName, { color: theme.colors.primary }]}>
            Listow
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowProfileModal(true)}>
          <Avatar.Text
            size={45}
            label={getInitials(user?.name)}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.onPrimaryContainer}
          />
        </TouchableOpacity>
      </Surface>

      {/* Header Customizado */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.background }]} elevation={0}>
        <View>
          <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>
            Olá, {user?.name || 'Usuário'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Suas listas
          </Text>
        </View>
      </Surface>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderListItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Avatar.Icon size={80} icon="cart-off" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.onSurfaceVariant} />
              <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                Nenhuma lista encontrada
              </Text>
              <Button mode="text" onPress={() => setShowCreateModal(true)}>
                Criar minha primeira lista
              </Button>
            </View>
          ) : null
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setShowCreateModal(true)}
        label="Nova Lista"
      />

      {/* Create List Modal */}
      <Portal>
        <Modal visible={showCreateModal} onDismiss={() => setShowCreateModal(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Nova Lista</Text>
          <TextInput
            label="Nome da Lista"
            value={newListName}
            onChangeText={setNewListName}
            mode="outlined"
            style={styles.input}
            autoFocus
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setShowCreateModal(false)} textColor={theme.colors.onSurfaceVariant}>Cancelar</Button>
            <Button mode="contained" onPress={handleCreateList}>Criar</Button>
          </View>
        </Modal>
      </Portal>

      {/* Edit List Modal */}
      <Portal>
        <Modal visible={showEditModal} onDismiss={() => setShowEditModal(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Editar Lista</Text>
          <TextInput
            label="Nome da Lista"
            value={editListName}
            onChangeText={setEditListName}
            mode="outlined"
            style={styles.input}
            autoFocus
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setShowEditModal(false)} textColor={theme.colors.onSurfaceVariant}>Cancelar</Button>
            <Button mode="contained" onPress={handleEditList}>Salvar</Button>
          </View>
        </Modal>
      </Portal>

      {/* Profile Modal */}
      <Portal>
        <Modal visible={showProfileModal} onDismiss={() => setShowProfileModal(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Avatar.Text
              size={80}
              label={getInitials(user?.name)}
              style={{ backgroundColor: theme.colors.primaryContainer }}
              color={theme.colors.onPrimaryContainer}
            />
          </View>

          <TextInput
            label="Nome"
            value={profileName}
            onChangeText={setProfileName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={user?.email}
            mode="outlined"
            disabled
            style={styles.input}
          />

          <View style={styles.darkModeContainer}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>Modo Escuro</Text>
            <Switch value={isDark} onValueChange={toggleTheme} color={theme.colors.primary} />
          </View>

          <Button
            mode="outlined"
            onPress={() => {
              setShowProfileModal(false);
              navigation.navigate('PrivacyPolicy');
            }}
            style={styles.buttonSpacing}
          >
            Política de Privacidade
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              setShowProfileModal(false);
              navigation.navigate('AccountDeletion');
            }}
            style={styles.buttonSpacing}
          >
            Excluir Conta
          </Button>

          <Button mode="outlined" onPress={() => setShowPasswordModal(true)} style={styles.buttonSpacing}>
            Alterar Senha
          </Button>

          <Button mode="contained" onPress={handleSaveProfile} style={styles.buttonSpacing}>
            Salvar Perfil
          </Button>

          <Divider style={{ marginVertical: 16 }} />

          <Button
            mode="outlined"
            onPress={() => {
              setShowProfileModal(false);
              logout();
            }}
            textColor={theme.colors.error}
            style={[styles.buttonSpacing, { borderColor: theme.colors.error }]}
            icon="logout"
          >
            Sair da Conta
          </Button>

          <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant, opacity: 0.6 }}>
            Versão {Constants.expoConfig?.version}
          </Text>
        </Modal>
      </Portal>

      {/* Password Modal */}
      <Portal>
        <Modal visible={showPasswordModal} onDismiss={() => setShowPasswordModal(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Alterar Senha</Text>
          <TextInput
            label="Senha Atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showCurrentPassword ? "eye-off" : "eye"}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            }
          />
          <TextInput
            label="Nova Senha"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showNewPassword ? "eye-off" : "eye"}
                onPress={() => setShowNewPassword(!showNewPassword)}
              />
            }
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setShowPasswordModal(false)}>Cancelar</Button>
            <Button mode="contained" onPress={handleChangePassword}>Alterar</Button>
          </View>
        </Modal>
      </Portal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  appName: {
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 28,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 24,
    borderRadius: 50, // Round FAB
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    opacity: 0.7,
  },
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  buttonSpacing: {
    marginTop: 10,
  },
  darkModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    marginBottom: 8,
  },
});

export default HomeScreen;
