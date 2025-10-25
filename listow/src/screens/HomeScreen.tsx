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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { RootStackParamList, ShoppingList } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const { user, logout } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

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
      Alert.alert('Sucesso', 'Lista criada com sucesso!');
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
    navigation.navigate('ListDetails', { listId: list.id, listName: list.name });
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
          onPress: logout,
        },
      ]
    );
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleListPress(item)}
      onLongPress={() => handleDeleteList(item)}
    >
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
          <Text style={styles.shareButtonText}>↗</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.welcomeText}>Olá, {user?.name}!</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listsHeader}>
        <Text style={styles.sectionTitle}>Suas Listas</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  logoutButton: {
    padding: 8,
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontSize: 16,
  },
  listsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  listItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listContent: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  shareButtonText: {
    fontSize: 16,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});

export default HomeScreen;
