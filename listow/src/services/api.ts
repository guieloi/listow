import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ApiResponse, AuthResponse, User, ShoppingList, ShoppingItem, CreateListData, CreateItemData, UpdateItemData } from '../types';
import syncService from './syncService';

// CONFIGURAÇÃO DO BACKEND - PRODUÇÃO
// Backend em produção hospedado em: https://app.grupoigl.online
// Para desenvolvimento local, altere para: 'http://10.0.2.2:8085/api' (Android Emulator)
// ou 'http://192.168.15.194:8085/api' (dispositivo físico com IP da sua máquina)
const API_BASE_URL = 'https://app.grupoigl.online/api'; // ← PRODUÇÃO
// const API_BASE_URL = 'http://10.0.2.2:8085/api'; // ← DESENVOLVIMENTO (Android Emulator)
// Para uso no navegador ou iOS Simulator, use: 'http://localhost:8085/api'

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token automaticamente
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar erros de resposta
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  }

  async loginWithGoogle(googleToken: string, googleId: string, email: string, name: string, photoUrl?: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/google', {
      googleToken,
      googleId,
      email,
      name,
      photoUrl,
    });
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/profile');
    return response.data.user;
  }

  async getUserById(userId: number): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await this.api.get(`/auth/user/${userId}`);
    return response.data.user;
  }

  async updateProfile(name: string, photo?: any): Promise<User> {
    const formData = new FormData();
    formData.append('name', name);

    if (photo) {
      // React Native image picker result handling
      const uriParts = photo.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('photo', {
        uri: photo.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }

    const response: AxiosResponse<{ user: User }> = await this.api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async savePushToken(token: string): Promise<void> {
    await this.api.post('/auth/save-token', { token });
  }

  // Shopping Lists endpoints
  async getLists(): Promise<ShoppingList[]> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      const cached = await AsyncStorage.getItem('cached_lists');
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const response: AxiosResponse<ShoppingList[]> = await this.api.get('/lists');
      await AsyncStorage.setItem('cached_lists', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      const cached = await AsyncStorage.getItem('cached_lists');
      if (cached) return JSON.parse(cached);
      throw error;
    }
  }

  async createList(data: CreateListData): Promise<ShoppingList> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.saveAction('CREATE_LIST', data);
      // Optimistic return
      return {
        id: Date.now(),
        name: data.name,
        description: data.description,
        owner_id: 0,
        is_shared: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_items: 0,
        total_items: 0
      };
    }
    return (await this.api.post('/lists', data)).data;
  }

  async updateList(id: number, data: Partial<CreateListData>): Promise<ShoppingList> {
    return (await this.api.put(`/lists/${id}`, data)).data;
  }

  async deleteList(id: number): Promise<void> {
    await this.api.delete(`/lists/${id}`);
  }

  async shareList(listId: number, email: string, permission: 'read' | 'write' = 'read'): Promise<void> {
    await this.api.post(`/lists/${listId}/share`, { email, permission });
  }

  async getListCollaborators(listId: number): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get(`/lists/${listId}/collaborators`);
    return response.data;
  }

  async removeCollaborator(listId: number, collaboratorId: number): Promise<void> {
    await this.api.delete(`/lists/${listId}/collaborators/${collaboratorId}`);
  }

  // Shopping Items endpoints
  async getItems(listId: number): Promise<ShoppingItem[]> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      const cached = await AsyncStorage.getItem(`cached_items_${listId}`);
      return cached ? JSON.parse(cached) : [];
    }

    try {
      const response: AxiosResponse<ShoppingItem[]> = await this.api.get(`/items/list/${listId}`);
      await AsyncStorage.setItem(`cached_items_${listId}`, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      const cached = await AsyncStorage.getItem(`cached_items_${listId}`);
      if (cached) return JSON.parse(cached);
      throw error;
    }
  }

  async createItem(listId: number, data: CreateItemData): Promise<ShoppingItem> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.saveAction('CREATE_ITEM', { listId, data });
      return {
        id: Date.now(),
        list_id: listId,
        name: data.name,
        quantity: data.quantity || 1,
        unit: data.unit,
        price: data.price,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    return (await this.api.post(`/items/list/${listId}`, data)).data;
  }

  async updateItem(id: number, data: UpdateItemData): Promise<ShoppingItem> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.saveAction('UPDATE_ITEM', { id, data });
      return {
        id,
        list_id: 0,
        name: data.name || '',
        quantity: data.quantity || 1,
        is_completed: data.is_completed || false,
        created_at: '',
        updated_at: new Date().toISOString(),
        ...data
      } as ShoppingItem;
    }
    return (await this.api.put(`/items/${id}`, data)).data;
  }

  async deleteItem(id: number): Promise<void> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.saveAction('DELETE_ITEM', { id });
      return;
    }
    await this.api.delete(`/items/${id}`);
  }

  async toggleItem(id: number): Promise<ShoppingItem> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.saveAction('TOGGLE_ITEM', { id });
      return {
        id,
        list_id: 0,
        name: '',
        quantity: 0,
        is_completed: true,
        created_at: '',
        updated_at: new Date().toISOString()
      } as ShoppingItem;
    }
    const response: AxiosResponse<ShoppingItem> = await this.api.patch(`/items/${id}/toggle`);
    return response.data;
  }

  // Utility methods
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
  }

  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  async clearAuthToken(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }
}

const apiService = new ApiService();
syncService.setApi(apiService);

export default apiService;
