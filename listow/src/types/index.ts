// User types
export interface User {
  id: number;
  name: string;
  email: string;
  google_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Shopping List types
export interface ShoppingList {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  items?: ShoppingItem[];
  collaborators?: ListCollaborator[];
}

export interface ShoppingItem {
  id: number;
  list_id: number;
  name: string;
  quantity: number;
  unit?: string;
  price?: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListCollaborator {
  id: number;
  list_id: number;
  user_id: number;
  permission: 'read' | 'write';
  added_at: string;
}

export interface CreateListData {
  name: string;
  description?: string;
}

export interface CreateItemData {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
}

export interface UpdateItemData {
  name?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  is_completed?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ListDetails: { listId: number; listName: string };
  ShareList: { listId: number; listName: string };
};

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
