import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import { User, CreateUserData, LoginData, AuthResponse } from '../models/User';

const JWT_SECRET = 'listow_jwt_secret_key_2024';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Register attempt from:', req.ip, 'with data:', { name: req.body.name, email: req.body.email });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password }: CreateUserData = req.body;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'Usuário já existe com este email' });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, password_hash]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      String(JWT_SECRET),
    );

    const authResponse: AuthResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        google_id: undefined,
        created_at: user.created_at,
        updated_at: user.created_at
      },
      token
    };

    res.status(201).json(authResponse);
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔐 Login attempt from:', req.ip, 'with email:', req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password }: LoginData = req.body;

    // Find user
    const result = await pool.query(
      'SELECT id, name, email, password_hash, google_id, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found:', email);
      res.status(401).json({ 
        error: 'Usuário ou senha inválido',
        userExists: false 
      });
      return;
    }

    const user = result.rows[0];

    // Check password
    if (!user.password_hash) {
      res.status(401).json({ error: 'Esta conta foi criada com Google. Use o login do Google.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      res.status(401).json({ 
        error: 'Usuário ou senha inválido',
        userExists: true 
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      String(JWT_SECRET),
    );

    const authResponse: AuthResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        google_id: user.google_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };

    res.json(authResponse);
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // User info is attached by auth middleware
    const userId = (req as any).user.userId;

    const result = await pool.query(
      'SELECT id, name, email, google_id, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);

    if (!userId || isNaN(userId)) {
      res.status(400).json({ error: 'ID do usuário inválido' });
      return;
    }

    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error getting user by id:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
