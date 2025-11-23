import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { RootStackParamList, ShoppingList } from '../types';

import * as ImagePicker from 'expo-image-picker';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [longPressedListId, setLongPressedListId] = useState<number | null>(null);

  // Edit List Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editListName, setEditListName] = useState('');

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileImage, setProfileImage] = useState<any>(null);

  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { user, logout } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowProfileModal(true)}
          style={{ marginRight: 15 }}
        >
          <MaterialIcons name="account-circle" size={28} color="#ffffff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchLists = async () => {
    try {
      console.log('🔄 Fetching lists...');
      const fetchedLists = await apiService.getLists();
      console.log('✅ Lists fetched:', fetchedLists.length, 'lists with counts:', fetchedLists.map(l => ({ name: l.name, completed: l.completed_items, total: l.total_items, format: `${l.completed_items || 0}/${l.total_items || 0}` })));
      setLists(fetchedLists);
    } catch (error: any) {
      console.error('❌ Error fetching lists:', error);
      Alert.alert('Erro', `Erro ao carregar listas: ${error.message || 'Erro desconhecido'}`);
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

  const handleCreateList = () => {
    console.log('Create list button pressed');
    setShowCreateModal(true);
  };

  const handleCreateListSubmit = async () => {
    if (!newListName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a lista');
      return;
    }

    try {
      console.log('Creating list with name:', newListName.trim());
      const newList = await apiService.createList({ name: newListName.trim() });
      console.log('List created successfully:', newList);
      setLists(prev => [newList, ...prev]);
      setShowCreateModal(false);
      setNewListName('');

      // Show success indicator
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error('Error creating list:', error);
      Alert.alert('Erro', `Erro ao criar lista: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewListName('');
  };

  const handleListPress = (list: ShoppingList) => {
    // Se a lista está sendo pressionada, apenas fecha os botões
    if (longPressedListId === list.id) {
      setLongPressedListId(null);
      return;
    }
    navigation.navigate('ListDetails', { listId: list.id, listName: list.name });
  };

  const handleLongPressList = (list: ShoppingList) => {
    setLongPressedListId(list.id);
  };

  const handleEditList = (list: ShoppingList) => {
    setEditingList(list);
    setEditListName(list.name);
    setShowEditModal(true);
    setLongPressedListId(null);
  };

  const handleEditListSubmit = async () => {
    if (!editingList || !editListName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a lista');
      return;
    }

    try {
      const updatedList = await apiService.updateList(editingList.id, { name: editListName.trim() });
      setLists(prev => prev.map(l => l.id === editingList.id ? updatedList : l));
      setShowEditModal(false);
      setEditingList(null);
      setEditListName('');
      Alert.alert('Sucesso', 'Lista atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error updating list:', error);
      Alert.alert('Erro', `Erro ao editar lista: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingList(null);
    setEditListName('');
  };

  const handleDeleteList = (list: ShoppingList) => {
    setLongPressedListId(null);
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
            } catch (error: any) {
              Alert.alert('Erro', 'Erro ao excluir lista');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          onPress: () => {
            setShowProfileModal(false);
            logout();
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
    if (user?.photo_url) {
      setProfileImage({ uri: user.photo_url });
    }
  }, [user]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'É necessário permitir o acesso à galeria para alterar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!profileName.trim()) {
        Alert.alert('Erro', 'O nome não pode ficar vazio.');
        return;
      }

      await apiService.updateProfile(profileName, profileImage);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setShowProfileModal(false);
      // Force refresh or update context would be ideal here, but for now user needs to reload or we rely on local state update if implemented in context
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', 'Falha ao atualizar perfil.');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword) {
        Alert.alert('Erro', 'Preencha todos os campos de senha.');
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }

      await apiService.changePassword(currentPassword, newPassword);
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Falha ao alterar senha.');
    }
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const isLongPressed = longPressedListId === item.id;

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleListPress(item)}
        onLongPress={() => handleLongPressList(item)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={[styles.listContentWrapper, isLongPressed && styles.listContentWrapperPressed]}>
          <View style={styles.listContent}>
            <Text style={styles.listName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.listDescription}>{item.description}</Text>
            )}
            <Text style={styles.listMeta}>
              {item.completed_items || 0}/{item.total_items || 0} •
              {item.is_shared ? ' Compartilhada' : ' Privada'}
            </Text>
          </View>
          <View style={styles.listActions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => navigation.navigate('ShareList', {
                listId: item.id,
                listName: item.name,
                isOwner: item.is_owner,
                userRole: item.user_role,
                ownerId: item.owner_id
              })}
            >
              <MaterialIcons name="groups" size={18} color="#3498db" />
              {(item.collaborators_count && item.collaborators_count > 0) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.collaborators_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Botões de ação quando pressionado */}
        {isLongPressed && (
          <View style={styles.listActionButtons}>
            {(item.is_owner || item.user_role === 'write') && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditList(item)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="edit" size={24} color="#f39c12" />
              </TouchableOpacity>
            )}
            {item.is_owner && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteList(item)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="delete" size={24} color="#e74c3c" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Carregando listas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Olá, {user?.name}!</Text>
          <Text style={styles.subtitleText}>Suas listas de compras</Text>
        </View>
      </View>

      <View style={styles.listsHeader}>
        <Text style={styles.sectionTitle}>Minhas Listas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateList}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderListItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma lista encontrada</Text>
            <Text style={styles.emptySubtext}>Toque no + para criar sua primeira lista</Text>
          </View>
        }
        contentContainerStyle={lists.length === 0 ? styles.emptyListContainer : undefined}
      />

      {/* Modal para criar nova lista */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelCreate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Lista</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite o nome da lista"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelCreate}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateListSubmit}
              >
                <Text style={styles.createButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar lista */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Lista</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite o nome da lista"
              value={editListName}
              onChangeText={setEditListName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleEditListSubmit}
              >
                <Text style={styles.createButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Perfil */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalContent}>
            <Text style={styles.modalTitle}>Meu Perfil</Text>

            <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
              ) : (
                <View style={styles.largeAvatarPlaceholder}>
                  <Text style={styles.largeAvatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <Text style={styles.changePhotoText}>Alterar foto</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Nome de exibição</Text>
            <TextInput
              style={styles.modalInput}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Seu nome"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.modalInput, styles.disabledInput]}
              value={user?.email}
              editable={false}
            />

            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <Text style={styles.changePasswordButtonText}>Alterar Senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveProfileButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveProfileButtonText}>Salvar Alterações</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButtonFull}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonTextFull}>Sair da Conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeProfileButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.closeProfileButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Alterar Senha */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Senha</Text>

            <Text style={styles.inputLabel}>Senha Atual</Text>
            <TextInput
              style={styles.modalInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Digite sua senha atual"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Nova Senha</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Digite a nova senha"
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.createButtonText}>Alterar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Indicator */}
      {showSuccess && (
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <MaterialIcons name="check-circle" size={50} color="#2ecc71" />
            <Text style={styles.successText}>Criado com sucesso!</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitleText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
  },
  listsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContentWrapperPressed: {
    opacity: 0.7,
  },
  listContent: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  listMeta: {
    fontSize: 12,
    color: '#95a5a6',
  },
  listActions: {
    flexDirection: 'row',
  },
  shareButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  shareButtonText: {
    fontSize: 14,
    color: '#3498db',
  },
  listActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  profileModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    width: '100%',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#7f8c8d',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none', // Allow touches to pass through if needed, but here we want it to be just visual
  },
  successContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  successText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  createButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  createButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Profile specific styles
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  largeAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  largeAvatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  changePhotoText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
    fontWeight: '500',
  },
  saveProfileButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  saveProfileButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButtonFull: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButtonTextFull: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeProfileButton: {
    padding: 10,
  },
  closeProfileButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  changePasswordButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  changePasswordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
