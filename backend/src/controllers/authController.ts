import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

import pool from '../config/database';
import { User, CreateUserData, LoginData, AuthResponse } from '../models/User';
import { logger } from '../utils/logger';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined!');
  }
  return secret;
};



export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Register attempt', { ip: req.ip, email: req.body.email, action: 'REGISTER_ATTEMPT', entityType: 'USER' });

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
      logger.warn('Register failed: User already exists', { email, action: 'REGISTER_FAILED_EXISTS', entityType: 'USER' });
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
      getJwtSecret(),
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

    logger.info('User registered successfully', { userId: user.id, email: user.email, action: 'REGISTER_SUCCESS', entityType: 'USER', entityId: String(user.id) });

    res.status(201).json(authResponse);
  } catch (error: any) {
    logger.error('Error registering user', { error: error.message, action: 'REGISTER_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Login attempt', { ip: req.ip, email: req.body.email, action: 'LOGIN_ATTEMPT', entityType: 'USER' });

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
      logger.warn('Login failed: User not found', { email, action: 'LOGIN_FAILED_NOT_FOUND', entityType: 'USER' });
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
      logger.warn('Login failed: Invalid password', { email, action: 'LOGIN_FAILED_INVALID_PASSWORD', entityType: 'USER' });
      res.status(401).json({
        error: 'Usuário ou senha inválido',
        userExists: true
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
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

    logger.info('User logged in successfully', { userId: user.id, email: user.email, action: 'LOGIN_SUCCESS', entityType: 'USER', entityId: String(user.id) });
    res.json(authResponse);
  } catch (error) {
    logger.error('Error logging in user', { error, action: 'LOGIN_ERROR' });
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
    logger.error('Error getting user profile', { error, action: 'GET_PROFILE_ERROR' });
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
    logger.error('Error getting user by id', { error, action: 'GET_USER_BY_ID_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { name } = req.body;
    let photo_url = undefined;

    if ((req as any).file) {
      // Construct the full URL for the uploaded file
      const protocol = req.protocol;
      const host = req.get('host');
      photo_url = `${protocol}://${host}/uploads/${(req as any).file.filename}`;
    }

    // Build query dynamically based on provided fields
    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let paramCount = 1;

    if (name) {
      query += `, name = $${paramCount}`;
      values.push(name);
      paramCount++;
    }

    if (photo_url) {
      query += `, photo_url = $${paramCount}`;
      values.push(photo_url);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING id, name, email, photo_url, created_at, updated_at`;
    values.push(userId);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    logger.info('Profile updated', {
      userId,
      updatedFields: { name: !!name, photo: !!photo_url },
      action: 'UPDATE_PROFILE',
      entityType: 'USER',
      entityId: String(userId)
    });
    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Error updating profile', { error, action: 'UPDATE_PROFILE_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      return;
    }

    // Get user's current password hash
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const user = userResult.rows[0];

    if (!user.password_hash) {
      res.status(400).json({ error: 'Esta conta usa login social. Não é possível alterar senha.' });
      return;
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Senha atual incorreta' });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    logger.info('Password changed successfully', { userId, action: 'CHANGE_PASSWORD_SUCCESS', entityType: 'USER', entityId: String(userId) });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    logger.error('Error changing password', { error, action: 'CHANGE_PASSWORD_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const savePushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token é obrigatório' });
      return;
    }

    // First, remove this token if it exists for any other user
    await pool.query('DELETE FROM user_push_tokens WHERE token = $1 AND user_id != $2', [token, userId]);

    // Insert or do nothing
    await pool.query(
      'INSERT INTO user_push_tokens (user_id, token) VALUES ($1, $2) ON CONFLICT (user_id, token) DO NOTHING',
      [userId, token]
    );

    logger.debug('Push token saved', { userId, action: 'SAVE_PUSH_TOKEN', entityType: 'USER', entityId: String(userId) });
    res.json({ message: 'Token salvo com sucesso' });
  } catch (error) {
    logger.error('Error saving push token', { error, action: 'SAVE_PUSH_TOKEN_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists or not for security
      res.json({ message: 'Se o email existir, um código de recuperação será enviado.' });
      return;
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalidate any previous unused codes for this email
    await pool.query('UPDATE password_resets SET used = true WHERE email = $1 AND used = false', [email]);

    // Save code to database
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );

    // Send email
    const { sendPasswordResetEmail } = require('../services/emailService');
    await sendPasswordResetEmail(email, code);

    logger.info('Password reset code sent', { email, action: 'FORGOT_PASSWORD_REQUEST', entityType: 'USER' });
    res.json({ message: 'Código de recuperação enviado para o email.' });
  } catch (error) {
    logger.error('Error in forgotPassword', { error, action: 'FORGOT_PASSWORD_ERROR' });
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, código e nova senha são obrigatórios' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
      return;
    }

    // Find valid reset code
    const resetResult = await pool.query(
      'SELECT id FROM password_resets WHERE email = $1 AND token = $2 AND used = false AND expires_at > NOW()',
      [email, code]
    );

    if (resetResult.rows.length === 0) {
      res.status(400).json({ error: 'Código inválido ou expirado' });
      return;
    }

    const resetId = resetResult.rows[0].id;

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [newPasswordHash, email]
    );

    // Mark code as used
    await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [resetId]);

    logger.info('Password reset successfully', { email, action: 'RESET_PASSWORD_SUCCESS', entityType: 'USER' });
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    logger.error('Error in resetPassword', { error, action: 'RESET_PASSWORD_ERROR' });
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
};


