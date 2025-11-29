import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  useTheme,
  Checkbox,
  IconButton,
  TextInput,
  FAB,
  Surface,
  Portal,
  Modal,
  Button,
  Divider,
  Snackbar,
  Icon,
  TouchableRipple
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ShoppingItem } from '../types';
import apiService from '../services/api';
import { AppTheme } from '../theme';

// --- Utilities ---

const formatPrice = (price: any): string => {
  if (price !== undefined && price !== null && typeof price === 'number' && price > 0) {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }
  return '';
};

const formatPriceMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const number = parseInt(numbers) / 100;
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const parseMaskedPrice = (value: string): number => {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

const validateItem = (item: any): ShoppingItem => ({
  ...item,
  name: item.name || 'Item sem nome',
  quantity: item.quantity !== null && item.quantity !== undefined && item.quantity !== '' ?
    (typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity)) : null,
  price: item.price !== null && item.price !== undefined && item.price !== '' ?
    (typeof item.price === 'number' ? item.price : parseFloat(item.price)) : undefined,
  is_completed: Boolean(item.is_completed)
});

const sortItems = (items: ShoppingItem[]): ShoppingItem[] => {
  return items.sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    if (a.is_completed && b.is_completed) {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
};

type ListDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ListDetails'>;
type ListDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ListDetails'>;

const ShoppingListItem = React.memo(({
  item,
  theme,
  isLongPressed,
  onToggle,
  onLongPress,
  onEdit,
  onDelete
}: {
  item: ShoppingItem;
  theme: AppTheme;
  isLongPressed: boolean;
  onToggle: (item: ShoppingItem) => void;
  onLongPress: (id: number | null) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (item: ShoppingItem) => void;
}) => {
  // Local state to handle optimistic update and delay
  const [internalIsCompleted, setInternalIsCompleted] = useState(item.is_completed);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(item.is_completed ? 1 : 0)).current;

  // Sync internal state with prop when prop changes (e.g. from refresh or other updates)
  useEffect(() => {
    setInternalIsCompleted(item.is_completed);
  }, [item.is_completed]);

  // Animation effect based on internal state
  useEffect(() => {
    const toValue = internalIsCompleted ? 1 : 0;

    Animated.parallel([
      Animated.timing(colorAnim, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: internalIsCompleted ? 1.2 : 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [internalIsCompleted]);

  const handlePress = () => {
    if (isLongPressed) {
      onLongPress(null);
      return;
    }

    // 1. Toggle locally immediately for visual feedback
    const newStatus = !internalIsCompleted;
    setInternalIsCompleted(newStatus);

    // 2. Wait 300ms before notifying parent to move the item
    setTimeout(() => {
      onToggle(item);
    }, 500);
  };

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surface, theme.colors.surfaceVariant],
  });

  const checkboxColor = internalIsCompleted ? theme.colors.primary : 'transparent';
  const checkboxBorderColor = internalIsCompleted ? theme.colors.primary : theme.colors.outline;

  return (
    <Surface style={[styles.itemContainer]} elevation={0}>
      <Animated.View style={{ backgroundColor }}>
        <TouchableOpacity
          style={styles.itemTouchable}
          onPress={handlePress}
          onLongPress={() => onLongPress(item.id)}
          delayLongPress={300}
          activeOpacity={0.7}
        >
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={handlePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View style={[
              styles.checkboxCircle,
              {
                borderColor: checkboxBorderColor,
                backgroundColor: checkboxColor,
                transform: [{ scale: scaleAnim }]
              }
            ]}>
              {internalIsCompleted && (
                <Icon source="check" size={20} color={theme.colors.onPrimary} />
              )}
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.itemContent}>
            <Text
              variant="bodyLarge"
              style={[
                styles.itemName,
                internalIsCompleted && { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' }
              ]}
            >
              {item.name}
            </Text>

            <View style={styles.itemMeta}>
              {item.quantity ? (
                <View style={[styles.miniChip, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Text style={[styles.miniChipText, { color: theme.colors.onSecondaryContainer }]}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              ) : null}
              {item.price ? (
                <View style={[styles.miniChip, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={[styles.miniChipText, { color: theme.colors.onPrimaryContainer }]}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {isLongPressed && (
            <View style={styles.actionButtons}>
              <IconButton icon="pencil" size={20} onPress={() => onEdit(item)} />
              <IconButton icon="delete" size={20} iconColor={theme.colors.error} onPress={() => onDelete(item)} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      <Divider />
    </Surface>
  );
});

const ListDetailsScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const navigation = useNavigation<ListDetailsScreenNavigationProp>();
  const route = useRoute<ListDetailsScreenRouteProp>();
  const { listId, listName, isOwner, userRole, ownerId } = route.params;

  // State
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Quick Add State
  const [newItemText, setNewItemText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Action State
  const [longPressedItemId, setLongPressedItemId] = useState<number | null>(null);

  // Undo Delete State
  const [deletedItem, setDeletedItem] = useState<ShoppingItem | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lifecycle
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: listName,
      headerRight: () => (
        <IconButton
          icon="share-variant"
          iconColor={theme.colors.primary}
          onPress={() => navigation.navigate('ShareList', {
            listId,
            listName,
            isOwner,
            userRole,
            ownerId
          })}
        />
      ),
    });
  }, [listName, navigation, theme, isOwner, userRole, ownerId]);

  const fetchItems = async () => {
    try {
      const fetchedItems = await apiService.getItems(listId);
      const validatedItems = fetchedItems.map(validateItem);
      setItems(sortItems(validatedItems));
    } catch (error) {
      console.error('Error fetching items:', error);
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

  // --- Actions ---

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    try {
      const newItem = await apiService.createItem(listId, { name: newItemText.trim() });
      setItems(prev => sortItems([...prev, validateItem(newItem)]));
      setNewItemText('');
      setSuggestions([]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    }
  };

  const handleTextChange = (text: string) => {
    setNewItemText(text);
    if (text.trim().length > 0) {
      const searchTerm = text.trim().toLowerCase();
      const uniqueNames = Array.from(new Set(items.map(item => item.name).filter(name => name && name.toLowerCase().includes(searchTerm))));
      setSuggestions(uniqueNames.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    // Optimistic update
    const updatedItems = items.map(i =>
      i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
    );
    setItems(sortItems(updatedItems));

    try {
      await apiService.toggleItem(item.id);
      // Background sync optional here if needed
    } catch (error: any) {
      // Revert on error
      setItems(sortItems(items));
      const errorMessage = error.response?.data?.error || 'Erro ao atualizar item';
      Alert.alert('Erro', errorMessage);
    }
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditQuantity(item.quantity ? item.quantity.toString() : '');
    setEditPrice(item.price && item.price > 0 ? formatPriceMask((item.price * 100).toString()) : '');
    setShowEditModal(true);
    setLongPressedItemId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) return;

    const quantity = editQuantity.trim() ? parseFloat(editQuantity) : null;
    const price = editPrice.trim() ? parseMaskedPrice(editPrice) : null;

    try {
      const updateData: any = { name: editName.trim(), quantity, price };
      const updatedItem = await apiService.updateItem(editingItem.id, updateData);

      setItems(prev => prev.map(i => i.id === editingItem.id ? validateItem(updatedItem) : i));
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar item');
    }
  };

  const handleDeleteItem = (item: ShoppingItem) => {
    setLongPressedItemId(null);

    // Cancelar qualquer exclusão pendente anterior imediatamente para evitar conflitos
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }

    // Salvar item para possível restauração
    setDeletedItem(item);

    // Remover visualmente
    setItems(prev => prev.filter(i => i.id !== item.id));

    // Mostrar Snackbar
    setShowSnackbar(true);

    // Agendar exclusão na API
    deleteTimeoutRef.current = setTimeout(async () => {
      try {
        await apiService.deleteItem(item.id);
        // Sucesso silencioso
      } catch (error) {
        console.error("Erro ao excluir item no servidor", error);
      }
      setDeletedItem(null); // Limpar referência
    }, 3000); // 3 segundos
  };

  const handleUndoDelete = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }

    if (deletedItem) {
      setItems(prev => sortItems([...prev, deletedItem]));
      setDeletedItem(null);
    }
    setShowSnackbar(false);
  };

  const calculateTotal = () => {
    return items
      .filter(item => !item.is_completed && item.price && item.price > 0)
      .reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
  };

  // --- Render ---

  const renderItem = useCallback(({ item }: { item: ShoppingItem }) => (
    <ShoppingListItem
      item={item}
      theme={theme}
      isLongPressed={longPressedItemId === item.id}
      onToggle={handleToggleItem}
      onLongPress={setLongPressedItemId}
      onEdit={handleEditItem}
      onDelete={handleDeleteItem}
    />
  ), [theme, longPressedItemId, handleToggleItem, handleEditItem, handleDeleteItem]);

  const totalValue = calculateTotal();
  const completedCount = items.filter(i => i.is_completed).length;

  const activeItems = items.filter(i => !i.is_completed);
  const completedItems = items.filter(i => i.is_completed);

  const sections = [
    { title: 'Active', data: activeItems },
    { title: 'Completed', data: showCompleted ? completedItems : [] }
  ];

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
    if (title === 'Completed') {
      return (
        <View style={styles.completedHeaderContainer}>
          <TouchableRipple
            onPress={() => setShowCompleted(!showCompleted)}
            style={styles.completedHeader}
          >
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '500' }}>
                Exibir marcados ({completedItems.length})
              </Text>
              <Icon
                source={showCompleted ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.primary}
              />
            </>
          </TouchableRipple>
        </View>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

        {/* Quick Add Bar */}
        <Surface style={[styles.addBar, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <TextInput
            mode="outlined"
            placeholder="Adicionar item..."
            value={newItemText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleAddItem}
            right={<TextInput.Icon icon="plus" onPress={handleAddItem} color={newItemText ? theme.colors.primary : theme.colors.outline} />}
            style={styles.addInput}
            dense
          />
          {suggestions.length > 0 && (
            <Surface style={[styles.suggestions, { backgroundColor: theme.colors.surface }]} elevation={4}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { setNewItemText(s); handleAddItem(); }}
                  style={[styles.suggestionItem, { borderBottomColor: theme.colors.outline }]}
                >
                  <Text style={{ color: theme.colors.onSurface }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </Surface>
          )}
        </Surface>

        {/* Summary */}
        <View style={styles.summary}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {completedCount}/{items.length} concluídos
          </Text>
          {totalValue > 0 && (
            <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              Total: R$ {totalValue.toFixed(2)}
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={{ paddingBottom: 80 }}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 40 }}>
                  Lista vazia. Adicione itens acima!
                </Text>
              </View>
            }
          />
        )}

        {/* Edit Modal */}
        <Portal>
          <Modal visible={showEditModal} onDismiss={() => setShowEditModal(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleLarge" style={{ marginBottom: 16, color: theme.colors.onSurface }}>Editar Item</Text>
            <TextInput label="Nome" value={editName} onChangeText={setEditName} mode="outlined" style={styles.input} />
            <View style={styles.row}>
              <TextInput label="Qtd" value={editQuantity} onChangeText={setEditQuantity} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1, marginRight: 8 }]} />
              <TextInput label="Preço" value={editPrice} onChangeText={(t) => setEditPrice(formatPriceMask(t))} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1 }]} />
            </View>
            <View style={styles.modalActions}>
              <Button onPress={() => setShowEditModal(false)}>Cancelar</Button>
              <Button mode="contained" onPress={handleSaveEdit}>Salvar</Button>
            </View>
          </Modal>
        </Portal>

        <Snackbar
          visible={showSnackbar}
          onDismiss={() => {
            // Se o snackbar fechar sozinho (timeout do paper), não fazemos nada aqui 
            // pois o timeout do setTimeout cuidará da deleção.
            // Apenas atualizamos o estado visual.
            setShowSnackbar(false);
          }}
          duration={3000}
          action={{
            label: 'Desfazer',
            onPress: handleUndoDelete,
            textColor: theme.colors.primary,
          }}
          style={{ marginBottom: 80 }} // Acima do FAB/Input
        >
          Item excluído.
        </Snackbar>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBar: {
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 10,
  },
  addInput: {
  },
  suggestions: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    borderRadius: 8,
    elevation: 4,
    padding: 8,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 0.5,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  itemContainer: {
  },
  itemTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  itemCompleted: {
  },
  checkboxContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
  },
  checkboxCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'center',
  },
  itemMeta: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  modal: {
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  completedHeaderContainer: {
    marginTop: 8,
    marginBottom: 1,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
});

export default ListDetailsScreen;
