import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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

// Utility function to format price with mask (point for thousands, comma for decimal)
const formatPriceMask = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número e divide por 100 para ter centavos
  const number = parseInt(numbers) / 100;
  
  // Formata com ponto para milhar e vírgula para decimal
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Utility function to parse masked price back to number
const parseMaskedPrice = (value: string): number => {
  // Remove pontos e substitui vírgula por ponto
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Utility function to validate item data
const validateItem = (item: any): ShoppingItem => ({
  ...item,
  name: item.name || 'Item sem nome',
  quantity: item.quantity !== null && item.quantity !== undefined && item.quantity !== '' ?
    (typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity)) : null,
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'write'>('write');
  const [sharing, setSharing] = useState(false);
  const [longPressedItemId, setLongPressedItemId] = useState<number | null>(null);
  const [deletedItem, setDeletedItem] = useState<ShoppingItem | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const deletedItemAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
    };
  }, [undoTimeout]);

  useEffect(() => {
    navigation.setOptions({
      title: listName,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShareList}
          style={{ marginRight: 15 }}
        >
          <MaterialIcons name="groups" size={24} color="#3498db" />
        </TouchableOpacity>
      ),
    });
  }, [listName, navigation]);

  const handleDeleteList = () => {
    Alert.alert(
      'Excluir Lista',
      `Deseja realmente excluir a lista "${listName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteList(listId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erro', 'Erro ao excluir lista');
            }
          },
        },
      ]
    );
  };

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
      setSuggestions([]);
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao adicionar item');
    }
  };

  const handleTextChange = (text: string) => {
    setNewItemText(text);

    // Buscar sugestões baseado nos itens da lista atual
    if (text.trim().length > 0) {
      const searchTerm = text.trim().toLowerCase();
      // Obter nomes únicos dos itens que contêm o termo de busca
      const uniqueNames = Array.from(
        new Set(
          items
            .map(item => item.name)
            .filter(name => name && name.toLowerCase().includes(searchTerm))
        )
      );
      // Limitar a 5 sugestões
      setSuggestions(uniqueNames.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (suggestion: string) => {
    if (!suggestion.trim()) {
      return;
    }

    try {
      const newItem = await apiService.createItem(listId, {
        name: suggestion.trim(),
      });

      // Add new item and reorder the list
      setItems(prev => {
        const updatedItems = [...prev, newItem];
        return sortItems(updatedItems);
      });

      setNewItemText('');
      setSuggestions([]);
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
    setEditQuantity(item.quantity ? item.quantity.toString() : '');
    setEditPrice(item.price && item.price > 0 ? formatPriceMask((item.price * 100).toString()) : '');
    setShowEditModal(true);
  };

  const handlePriceChange = (text: string) => {
    const masked = formatPriceMask(text);
    setEditPrice(masked);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) {
      Alert.alert('Erro', 'Nome do item é obrigatório');
      return;
    }

    console.log('Saving edit with values:', { editName, editQuantity, editPrice });

    let quantity: number | null = null;
    let price: number | null = null;

    // Processar quantidade - aceita nula/vazia
    if (editQuantity.trim()) {
      const parsedQuantity = parseFloat(editQuantity);
      if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
        quantity = parsedQuantity;
      } else {
        Alert.alert('Erro', 'Quantidade deve ser um número válido maior que zero');
        return;
      }
    }

    // Processar preço - aceita nulo/vazio
    if (editPrice.trim()) {
      const parsedPrice = parseMaskedPrice(editPrice);
      if (parsedPrice > 0) {
        price = parsedPrice;
      } else {
        Alert.alert('Erro', 'Preço deve ser um número válido maior que zero');
        return;
      }
    }

    console.log('Parsed values:', { quantity, price });

    try {
      const updateData: any = {
        name: editName.trim(),
      };

      // Incluir quantidade apenas se fornecida
      if (quantity !== null) {
        updateData.quantity = quantity;
      } else {
        updateData.quantity = null;
      }

      // Incluir preço apenas se fornecido
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

  const handleDeleteItem = async (item: ShoppingItem) => {
    // Remove o item da lista imediatamente
    setItems(prev => prev.filter(i => i.id !== item.id));
    setDeletedItem(item);
    setLongPressedItemId(null);

    // Mostra animação do toast de desfazer
    deletedItemAnim.setValue(0);
    Animated.timing(deletedItemAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Limpa timeout anterior se existir
    if (undoTimeout) {
      clearTimeout(undoTimeout);
    }

    // Cria novo timeout para confirmar exclusão após 2 segundos
    const timeout = setTimeout(async () => {
      // Animação de fade out do toast
      Animated.timing(deletedItemAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(async () => {
        try {
          await apiService.deleteItem(item.id);
        } catch (error: any) {
          // Se der erro, restaura o item
          setItems(prev => {
            const updated = [...prev, item];
            return sortItems(updated);
          });
          Alert.alert('Erro', 'Erro ao excluir item');
        }
        setDeletedItem(null);
      });
    }, 2000);

    setUndoTimeout(timeout);
  };

  const handleUndoDelete = () => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    if (deletedItem) {
      // Restaura o item na lista
      setItems(prev => {
        const updated = [...prev, deletedItem];
        return sortItems(updated);
      });
      
      // Animação de fade out do toast
      Animated.timing(deletedItemAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setDeletedItem(null);
      });
    }
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const handleLongPress = () => {
      setLongPressedItemId(item.id);
    };

    const handlePress = () => {
      // Se o item está sendo pressionado, apenas fecha os ícones
      if (longPressedItemId === item.id) {
        setLongPressedItemId(null);
      }
    };

    const handleCheckboxPress = () => {
      handleToggleItem(item);
    };

    const isLongPressed = longPressedItemId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer, 
          item.is_completed && styles.itemCompleted
        ]}
        onLongPress={handleLongPress}
        onPress={handlePress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={[styles.itemContentWrapper, isLongPressed && styles.itemContentWrapperPressed]}>
          {/* Checkbox, nome, quantidade e preço na mesma linha */}
          <View style={styles.itemTopRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleCheckboxPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.checkboxText}>
                {item.is_completed ? '☑' : '☐'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.itemName, item.is_completed && styles.itemTextCompleted]}>
              {item.name || 'Item sem nome'}
            </Text>
            {/* Quantidade e preço na mesma linha */}
            {(item.quantity && item.quantity > 0) || (item.price && item.price > 0) ? (
              <View style={styles.itemDetailsInline}>
                {item.quantity && item.quantity > 0 && (
                  <Text style={styles.detailTextInline}>
                    {item.quantity} {item.unit || 'un'}
                  </Text>
                )}
                {item.quantity && item.quantity > 0 && item.price && item.price > 0 && (
                  <Text style={styles.detailSeparator}> • </Text>
                )}
                {item.price && item.price > 0 && (
                  <Text style={styles.detailTextInline}>
                    {formatPrice(item.price)}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        </View>

        {/* Ícones de ação quando pressionado */}
        {isLongPressed && (
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setLongPressedItemId(null);
                handleEditItem(item);
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="edit" size={24} color="#f39c12" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setLongPressedItemId(null);
                handleDeleteItem(item);
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const calculateTotal = () => {
    return items
      .filter(item => !item.is_completed && item.price !== undefined && item.price !== null && typeof item.price === 'number' && item.price > 0)
      .reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
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
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.addInput}
            placeholder="Adicionar item..."
            value={newItemText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleAddItem}
            onBlur={() => {
              // Delay para permitir o clique nas sugestões antes de fechar
              setTimeout(() => setSuggestions([]), 200);
            }}
            returnKeyType="next"
            blurOnSubmit={false}
            autoFocus={true}
          />
          {/* Sugestões */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionItem,
                    index === suggestions.length - 1 && styles.suggestionItemLast
                  ]}
                  onPress={() => handleSelectSuggestion(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
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

      {/* Toast de desfazer exclusão */}
      {deletedItem && (
        <Animated.View style={[styles.undoToast, { opacity: deletedItemAnim }]}>
          <View style={styles.undoToastContent}>
            <Text style={styles.undoToastText}>
              Item "{deletedItem.name}" excluído
            </Text>
            <TouchableOpacity
              style={styles.undoToastButton}
              onPress={handleUndoDelete}
              activeOpacity={0.7}
            >
              <Text style={styles.undoToastButtonText}>Desfazer</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

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

            <Text style={styles.inputLabel}>Nome do item</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Quantidade</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editQuantity}
                  onChangeText={setEditQuantity}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Preço</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPrice}
                  onChangeText={handlePriceChange}
                  keyboardType="numeric"
                />
              </View>
            </View>

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
  inputWrapper: {
    flex: 1,
    marginRight: 10,
    position: 'relative',
  },
  addInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 16,
    color: '#2c3e50',
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
    marginVertical: 2,
    borderRadius: 8,
    paddingTop: 4,
    paddingBottom: 2, // Espaço inferior do card
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 50, // Garante altura mínima para toque
  },
  itemCompleted: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  undoToast: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2c3e50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  undoToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoToastText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  undoToastButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  undoToastButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxContainer: {
    marginRight: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40, // Largura fixa para alinhamento
  },
  checkboxText: {
    fontSize: 36, // Aumentado
    color: '#bdc3c7',
    lineHeight: 38, // Ajuste de altura de linha para centralizar ícone
  },
  itemContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
    minWidth: 0, // Permite que o conteúdo encolha quando necessário
  },
  itemContentWrapperPressed: {
    flex: 1,
    minWidth: 0,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1,
    lineHeight: 24, // Altura de linha ajustada para fonte maior
    marginRight: 8,
    minWidth: 0,
  },
  itemDetailsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  detailTextInline: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 16,
  },
  detailSeparator: {
    fontSize: 12,
    color: '#bdc3c7',
    marginHorizontal: 4,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginLeft: 6,
    alignSelf: 'stretch',
    width: 100, // Largura fixa para não aumentar o card
    flexShrink: 0, // Não encolhe
  },
  actionButton: {
    paddingHorizontal: 10,
    marginLeft: 6,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    alignSelf: 'stretch',
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
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#3498db',
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
  shareButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ListDetailsScreen;
