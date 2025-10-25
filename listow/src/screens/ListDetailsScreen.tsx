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

// Utility function to safely format price
const formatPrice = (price: any): string => {
  if (price !== undefined && price !== null && typeof price === 'number' && price > 0) {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }
  return 'Sem preço';
};

// Utility function to parse price input (accepts both comma and dot)
const parsePriceInput = (input: string): number => {
  // Replace comma with dot for parsing
  const normalized = input.trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Utility function to format price for input display
const formatPriceForInput = (price: number): string => {
  return price.toFixed(2).replace('.', ',');
};

// Utility function to validate item data
const validateItem = (item: any): ShoppingItem => ({
  ...item,
  name: item.name || 'Item sem nome',
  quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 1,
  price: item.price !== null && item.price !== undefined && item.price !== '' ?
    (typeof item.price === 'number' ? item.price : parseFloat(item.price)) : undefined,
  is_completed: Boolean(item.is_completed)
});

// Utility function to sort items
const sortItems = (items: ShoppingItem[]): ShoppingItem[] => {
  return items.sort((a, b) => {
    // First sort by completion status (false comes before true)
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    
    // Within each group, sort by date
    if (a.is_completed && b.is_completed) {
      // Both completed: sort by updated_at DESC (most recently completed first)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    } else {
      // Both not completed: sort by created_at DESC (most recently added first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
};
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, ShoppingItem } from '../types';
import apiService from '../services/api';

type ListDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ListDetails'>;
type ListDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ListDetails'>;

const ListDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ListDetailsScreenNavigationProp>();
  const route = useRoute<ListDetailsScreenRouteProp>();
  const { listId, listName } = route.params;
  

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'write'>('write');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: listName,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShareList}
          style={{ marginRight: 15 }}
        >
          <Text style={{ fontSize: 16, color: '#3498db' }}>↗</Text>
        </TouchableOpacity>
      ),
    });
  }, [listName, navigation]);

  const fetchItems = async () => {
    try {
      const fetchedItems = await apiService.getItems(listId);
      console.log('Fetched items data:', fetchedItems);
      // Ensure all items have valid data
      const validatedItems = fetchedItems.map(validateItem);
      
      // Sort items: non-completed first, then completed, both by creation date
      const sortedItems = sortItems(validatedItems);
      
      setItems(sortedItems);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      Alert.alert('Erro', 'Erro ao carregar itens');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [listId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      return;
    }

    try {
      const newItem = await apiService.createItem(listId, {
        name: newItemText.trim(),
      });
      
      // Add new item and reorder the list
      setItems(prev => {
        const updatedItems = [...prev, newItem];
        return sortItems(updatedItems);
      });
      
      setNewItemText('');
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao adicionar item');
    }
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    try {
      const updatedItem = await apiService.toggleItem(item.id);
      
      // Update the item and reorder the list
      setItems(prev => {
        const updatedItems = prev.map(i => i.id === item.id ? updatedItem : i);
        return sortItems(updatedItems);
      });
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao atualizar item');
    }
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditQuantity((item.quantity || 1).toString());
    setEditPrice(item.price && item.price > 0 ? formatPriceForInput(item.price) : '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) {
      Alert.alert('Erro', 'Nome do item é obrigatório');
      return;
    }

    console.log('Saving edit with values:', { editName, editQuantity, editPrice });

    const quantity = parseFloat(editQuantity);
    let price: number | null = null; // Usar null explicitamente para limpar preço

    // Melhor validação para o preço
    if (editPrice.trim()) {
      const parsedPrice = parsePriceInput(editPrice);
      if (parsedPrice > 0) {
        price = parsedPrice;
      } else {
        Alert.alert('Erro', 'Preço deve ser um número válido maior que zero (use vírgula como separador decimal)');
        return;
      }
    }

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Erro', 'Quantidade deve ser um número maior que zero');
      return;
    }

    console.log('Parsed values:', { quantity, price });

    try {
      const updateData: any = {
        name: editName.trim(),
        quantity: quantity,
      };

      // Sempre incluir o preço, mesmo que seja undefined ou null
      updateData.price = price;

      console.log('Sending update data:', updateData);

      const updatedItem = await apiService.updateItem(editingItem.id, updateData);

      console.log('Updated item:', updatedItem);

      // Ensure the updated item has valid data
      const validatedUpdatedItem = validateItem(updatedItem);

      console.log('Validated updated item:', validatedUpdatedItem);

      setItems(prev => prev.map(i => i.id === editingItem.id ? validatedUpdatedItem : i));
      setShowEditModal(false);
      setEditingItem(null);
      setEditName('');
      setEditQuantity('');
      setEditPrice('');
    } catch (error: any) {
      console.error('Error saving edit:', error);
      Alert.alert('Erro', `Erro ao editar item: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditName('');
    setEditQuantity('');
    setEditPrice('');
  };

  const handleShareList = () => {
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    if (!shareEmail.trim()) {
      Alert.alert('Erro', 'Digite o email do usuário');
      return;
    }

    try {
      setSharing(true);
      await apiService.shareList(listId, shareEmail.trim(), sharePermission);
      Alert.alert('Sucesso', `Lista compartilhada com ${shareEmail.trim()}!`);
      setShowShareModal(false);
      setShareEmail('');
      setSharePermission('write');
    } catch (error: any) {
      console.error('Error sharing list:', error);
      Alert.alert('Erro', error.message || 'Erro ao compartilhar lista');
    } finally {
      setSharing(false);
    }
  };

  const handleCancelShare = () => {
    setShowShareModal(false);
    setShareEmail('');
    setSharePermission('write');
  };

  const handleDeleteItem = (item: ShoppingItem) => {
    Alert.alert(
      'Excluir Item',
      `Deseja realmente excluir "${item.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteItem(item.id);
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (error: any) {
              Alert.alert('Erro', 'Erro ao excluir item');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const handleLongPress = () => {
      // Show action buttons temporarily
      Alert.alert(
        'Ações do Item',
        `O que deseja fazer com "${item.name}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Editar', onPress: () => handleEditItem(item) },
          { text: 'Excluir', style: 'destructive', onPress: () => handleDeleteItem(item) }
        ]
      );
    };

    const handlePress = () => {
      handleToggleItem(item);
    };

    return (
      <View style={[styles.itemContainer, item.is_completed && styles.itemCompleted]}>
        {/* Checkbox à esquerda */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handlePress}
        >
          <Text style={styles.checkboxText}>
            {item.is_completed ? '☑' : '☐'}
          </Text>
        </TouchableOpacity>

        {/* Conteúdo principal */}
        <TouchableOpacity
          style={styles.itemContent}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
        >
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, item.is_completed && styles.itemTextCompleted]}>
              {item.name || 'Item sem nome'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Detalhes do item (quantidade e preço) - apenas se houver valores */}
        {(item.quantity && item.quantity > 0) || (item.price && item.price > 0) ? (
          <View style={styles.itemDetailsContainer}>
            {/* Mostrar quantidade apenas se tiver valor */}
            {item.quantity && item.quantity > 0 ? (
              <Text style={styles.detailText}>
                Qtd: {item.quantity} {item.unit || 'un'}
              </Text>
            ) : null}
            
            {/* Mostrar preço apenas se tiver valor */}
            {item.price && item.price > 0 ? (
              <Text style={styles.detailText}>
                {formatPrice(item.price)}
              </Text>
            ) : null}
          </View>
        ) : null}

      </View>
    );
  };

  const calculateTotal = () => {
    return items
      .filter(item => !item.is_completed && item.price !== undefined && item.price !== null && typeof item.price === 'number' && item.price > 0)
      .reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Carregando itens...</Text>
      </View>
    );
  }

  const completedCount = items.filter(item => item.is_completed).length;
  const totalValue = calculateTotal();

  return (
    <View style={styles.container}>
      {/* Quick Add Input */}
      <View style={styles.addContainer}>
        <TextInput
          style={styles.addInput}
          placeholder="Adicionar item..."
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, !newItemText.trim() && styles.addButtonDisabled]}
          onPress={handleAddItem}
          disabled={!newItemText.trim()}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {completedCount}/{items.length} concluídos
        </Text>
        {totalValue > 0 && (
          <Text style={styles.totalText}>
            Total: R$ {totalValue.toFixed(2)}
          </Text>
        )}
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum item na lista</Text>
            <Text style={styles.emptySubtext}>Adicione itens usando o campo acima</Text>
          </View>
        }
        contentContainerStyle={items.length === 0 ? styles.emptyListContainer : undefined}
      />

      {/* Modal de compartilhamento */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelShare}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Compartilhar Lista</Text>

            <Text style={styles.inputLabel}>Email do usuário:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite o email"
              value={shareEmail}
              onChangeText={setShareEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Permissão:</Text>
            <View style={styles.permissionContainer}>
              <TouchableOpacity
                style={[styles.permissionButton, sharePermission === 'read' && styles.permissionButtonActive]}
                onPress={() => setSharePermission('read')}
              >
                <Text style={[styles.permissionButtonText, sharePermission === 'read' && styles.permissionButtonTextActive]}>
                  Apenas visualizar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.permissionButton, sharePermission === 'write' && styles.permissionButtonActive]}
                onPress={() => setSharePermission('write')}
              >
                <Text style={[styles.permissionButtonText, sharePermission === 'write' && styles.permissionButtonTextActive]}>
                  Editar itens
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelShare}
                disabled={sharing}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.shareButton]}
                onPress={handleShareSubmit}
                disabled={sharing}
              >
                <Text style={styles.shareButtonText}>
                  {sharing ? 'Compartilhando...' : 'Compartilhar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de edição de item */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Item</Text>
            
            <Text style={styles.inputLabel}>Nome do item:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite o nome do item"
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>Quantidade:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite a quantidade"
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Preço (opcional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite o preço (ex: 10,50)"
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
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
  addContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#27ae60',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  summaryText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
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
  itemCompleted: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  checkboxContainer: {
    marginRight: 12,
    padding: 4,
  },
  checkboxText: {
    fontSize: 20,
    color: '#3498db',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 15,
  },
    itemDetailsContainer: {
      flex: 1,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
  detailText: {
    fontSize: 12,
    color: '#34495e',
    backgroundColor: '#f1f2f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 5,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 5,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  saveButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Share modal styles
  permissionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  permissionButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  permissionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  permissionButtonText: {
    fontSize: 12,
    color: '#666',
  },
  permissionButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#3498db',
  },
});

export default ListDetailsScreen;
