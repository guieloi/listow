import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ListCollaborator } from '../types';
import apiService from '../services/api';

type ShareListScreenRouteProp = RouteProp<RootStackParamList, 'ShareList'>;
type ShareListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ShareList'>;

const ShareListScreen: React.FC = () => {
  const navigation = useNavigation<ShareListScreenNavigationProp>();
  const route = useRoute<ShareListScreenRouteProp>();
  const { listId, listName } = route.params;

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [collaborators, setCollaborators] = useState<ListCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: `Compartilhar ${listName}` });
    fetchCollaborators();
  }, [listName, navigation]);

  const fetchCollaborators = async () => {
    try {
      console.log('🔄 Fetching collaborators for list:', listId);
      setLoading(true);
      const collaboratorsData = await apiService.getListCollaborators(listId);
      console.log('✅ Collaborators fetched:', collaboratorsData);
      setCollaborators(collaboratorsData);
    } catch (error) {
      console.error('❌ Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (emailText: string) => {
    if (!emailText.trim()) {
      setEmailError('');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedEmail = emailText.trim().toLowerCase();
    
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Formato de email inválido');
      return false;
    }

    if (trimmedEmail.length < 5) {
      setEmailError('Email muito curto');
      return false;
    }

    const atIndex = trimmedEmail.indexOf('@');
    if (atIndex === -1 || !trimmedEmail.substring(atIndex + 1).includes('.')) {
      setEmailError('Email deve ter formato válido');
      return false;
    }

    setEmailError('');
    return true;
  };

  const handleShare = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Digite um email válido');
      return;
    }

    if (emailError) {
      Alert.alert('Erro', 'Corrija o email antes de continuar');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if email is already in collaborators list
    const isAlreadyCollaborator = collaborators.some(collab => 
      collab.email.toLowerCase() === trimmedEmail
    );
    
    if (isAlreadyCollaborator) {
      Alert.alert('Aviso', 'Este email já está na lista de colaboradores');
      return;
    }

    try {
      setSharing(true);
      await apiService.shareList(listId, trimmedEmail, permission);
      Alert.alert('Sucesso', 'Lista compartilhada com sucesso!');
      setEmail('');
      fetchCollaborators(); // Refresh the list
    } catch (error: any) {
      console.error('Error sharing list:', error);
      
      let errorMessage = 'Erro ao compartilhar lista';
      
      if (error.response?.status === 404) {
        errorMessage = 'Usuário não encontrado. Verifique se o email está correto e se o usuário já possui uma conta no sistema.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Dados inválidos';
        // If it's a duplicate permission error, refresh collaborators
        if (error.response.data?.error?.includes('já tem esta permissão')) {
          fetchCollaborators();
        }
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para compartilhar esta lista';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: number) => {
    Alert.alert(
      'Remover Colaborador',
      'Deseja realmente remover este colaborador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removeCollaborator(listId, collaboratorId);
              Alert.alert('Sucesso', 'Colaborador removido com sucesso!');
              fetchCollaborators(); // Refresh the list
            } catch (error: any) {
              console.error('Error removing collaborator:', error);
              Alert.alert('Erro', error.message || 'Erro ao remover colaborador');
            }
          },
        },
      ]
    );
  };

  const renderCollaborator = ({ item }: { item: any }) => (
    <View style={styles.collaboratorItem}>
      <View style={styles.collaboratorInfo}>
        <Text style={styles.collaboratorEmail}>{item.name} ({item.email})</Text>
        <Text style={styles.collaboratorPermission}>
          Permissão: {item.permission === 'read' ? 'Leitura' : 'Escrita'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveCollaborator(item.id)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.shareSection}>
        <Text style={styles.sectionTitle}>Compartilhar Lista</Text>

        <TextInput
          style={[styles.emailInput, emailError && styles.emailInputError]}
          placeholder="Digite o email do usuário"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            validateEmail(text);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {emailError ? (
          <Text style={styles.errorText}>{emailError}</Text>
        ) : null}

        <View style={styles.permissionContainer}>
          <Text style={styles.permissionLabel}>Permissão:</Text>
          <View style={styles.permissionButtons}>
            <TouchableOpacity
              style={[styles.permissionButton, permission === 'read' && styles.permissionButtonActive]}
              onPress={() => setPermission('read')}
            >
              <Text style={[styles.permissionButtonText, permission === 'read' && styles.permissionButtonTextActive]}>
                Leitura
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permissionButton, permission === 'write' && styles.permissionButtonActive]}
              onPress={() => setPermission('write')}
            >
              <Text style={[styles.permissionButtonText, permission === 'write' && styles.permissionButtonTextActive]}>
                Escrita
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, (!email.trim() || sharing || emailError) && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={!email.trim() || sharing || !!emailError}
        >
          <Text style={styles.shareButtonText}>
            {sharing ? 'Compartilhando...' : 'Compartilhar'}
          </Text>
        </TouchableOpacity>
        
        {sharing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.loadingText}>Verificando email...</Text>
          </View>
        )}
      </View>

      <View style={styles.collaboratorsSection}>
        <Text style={styles.sectionTitle}>Colaboradores</Text>

        {loading ? (
          <ActivityIndicator size="small" color="#3498db" style={styles.loading} />
        ) : collaborators.length === 0 ? (
          <Text style={styles.noCollaborators}>Nenhum colaborador ainda</Text>
        ) : (
          <FlatList
            data={collaborators}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCollaborator}
            style={styles.collaboratorsList}
            ListHeaderComponent={() => (
              <Text style={styles.collaboratorsCount}>
                {collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''}
              </Text>
            )}
          />
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Sobre permissões:</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Leitura:</Text> O usuário pode ver e marcar itens como concluídos
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Escrita:</Text> O usuário pode adicionar, editar e excluir itens
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  shareSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 5,
  },
  emailInputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 5,
  },
  permissionContainer: {
    marginBottom: 20,
  },
  permissionLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  permissionButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  permissionButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  permissionButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  collaboratorsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  collaboratorsList: {
    maxHeight: 200,
  },
  collaboratorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  collaboratorPermission: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  collaboratorDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    marginVertical: 20,
  },
  noCollaborators: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 5,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#3498db',
    fontSize: 14,
  },
  collaboratorsCount: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
    fontStyle: 'italic',
  },
});

export default ShareListScreen;
