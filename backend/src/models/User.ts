export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  google_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  google_id?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}
