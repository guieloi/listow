import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import apiService from '../services/api';
import { AuthContextType, User, LoginData, RegisterData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        registerForPushNotifications();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotifications = async () => {
    try {
      const { registerForPushNotificationsAsync } = require('../utils/notifications');
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await apiService.savePushToken(token);
      }
    } catch (error) {
      console.log('Error registering push token:', error);
    }
  };

  const login = async (data: LoginData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(data.email, data.password);

      setUser(response.user);
      setToken(response.token);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));

      registerForPushNotifications();
    } catch (error: any) {
      console.error('Login error:', error);

      let message = 'Erro ao fazer login';

      if (error.response?.data?.error) {
        message = error.response.data.error;

        // Adicionar informação sobre existência do usuário se disponível
        if (error.response.data.userExists !== undefined) {
          if (!error.response.data.userExists) {
            message = 'Usuário não encontrado no sistema. Verifique o email ou crie uma conta.';
          } else {
            message = 'Senha incorreta. Tente novamente.';
          }
        }
      }

      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.register(data.name, data.email, data.password);

      setUser(response.user);
      setToken(response.token);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));

      registerForPushNotifications();
    } catch (error: any) {
      console.error('Register error:', error);
      const message = error.response?.data?.error || 'Erro ao criar conta';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      setToken(null);
      await apiService.clearAuthToken();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Erro', 'Erro ao fazer logout');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
