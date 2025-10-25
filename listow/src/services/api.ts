import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, AuthResponse, User, ShoppingList, ShoppingItem, CreateListData, CreateItemData, UpdateItemData } from '../types';

// CONFIGURAÇÃO DO BACKEND - PRODUÇÃO
// Backend em produção hospedado em: https://app.grupoigl.online
// Para desenvolvimento local, altere para: 'http://10.0.2.2:8085/api' (Android Emulator)
// ou 'http://192.168.15.194:8085/api' (dispositivo físico com IP da sua máquina)
const API_BASE_URL = 'https://app.grupoigl.online/api'; // ← PRODUÇÃO

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

  async getProfile(): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/profile');
    return response.data.user;
  }

  async getUserById(userId: number): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await this.api.get(`/auth/user/${userId}`);
    return response.data.user;
  }

  // Shopping Lists endpoints
  async getLists(): Promise<ShoppingList[]> {
    const response: AxiosResponse<ShoppingList[]> = await this.api.get('/lists');
    return response.data;
  }

  async createList(data: CreateListData): Promise<ShoppingList> {
    const response: AxiosResponse<ShoppingList> = await this.api.post('/lists', data);
    return response.data;
  }

  async updateList(id: number, data: Partial<CreateListData>): Promise<ShoppingList> {
    const response: AxiosResponse<ShoppingList> = await this.api.put(`/lists/${id}`, data);
    return response.data;
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
    const response: AxiosResponse<ShoppingItem[]> = await this.api.get(`/items/list/${listId}`);
    return response.data;
  }

  async createItem(listId: number, data: CreateItemData): Promise<ShoppingItem> {
    const response: AxiosResponse<ShoppingItem> = await this.api.post(`/items/list/${listId}`, data);
    return response.data;
  }

  async updateItem(id: number, data: UpdateItemData): Promise<ShoppingItem> {
    const response: AxiosResponse<ShoppingItem> = await this.api.put(`/items/${id}`, data);
    return response.data;
  }

  async deleteItem(id: number): Promise<void> {
    await this.api.delete(`/items/${id}`);
  }

  async toggleItem(id: number): Promise<ShoppingItem> {
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

export default new ApiService();
