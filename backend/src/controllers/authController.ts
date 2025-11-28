import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/database';
import { User, CreateUserData, LoginData, AuthResponse } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined!');
}

// Inicializar cliente Google OAuth
const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Register   attempt from :', req.ip, 'with data:', { name: req.body.name, email: req.body.email });

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

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
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

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Error changing password:', error);
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

    res.json({ message: 'Token salvo com sucesso' });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔐 Google login attempt from:', req.ip);

    const { googleToken, googleId, email, name, photoUrl } = req.body;

    if (!googleToken || !googleId || !email || !name) {
      res.status(400).json({ error: 'Dados do Google incompletos' });
      return;
    }

    if (!googleClient || !GOOGLE_CLIENT_ID) {
      console.error('[GoogleLogin] GOOGLE_CLIENT_ID não configurado. Bloqueando login com Google.');
      res.status(500).json({ error: 'Login com Google indisponível. Tente novamente mais tarde.' });
      return;
    }

    // Verificar token do Google se o cliente estiver configurado
    if (googleClient && GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: googleToken,
          audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || payload.sub !== googleId) {
          console.log('❌ Invalid Google token:', { payloadSub: payload?.sub, googleId });
          res.status(401).json({ error: 'Token do Google inválido' });
          return;
        }

        // Validar que o email corresponde
        if (payload.email !== email) {
          console.log('❌ Email mismatch:', { payloadEmail: payload.email, providedEmail: email });
          res.status(401).json({ error: 'Email não corresponde ao token do Google' });
          return;
        }
      } catch (verifyError) {
        console.error('Error verifying Google token:', verifyError);
        // Em desenvolvimento, podemos permitir continuar sem verificação
        // Em produção, isso deve ser obrigatório
        res.status(401).json({ error: 'Falha ao verificar token do Google' });
        return;
      }
    }

    // Verificar se usuário já existe
    let result = await pool.query(
      'SELECT id, name, email, google_id, photo_url, created_at, updated_at FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    let user;
    if (result.rows.length > 0) {
      // Usuário existe
      user = result.rows[0];

      // Se não tem google_id, atualizar (caso de conta criada com email/senha que agora usa Google)
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, photo_url = COALESCE($2, photo_url), updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [googleId, photoUrl || null, user.id]
        );
        // Buscar usuário atualizado
        const updatedResult = await pool.query(
          'SELECT id, name, email, google_id, photo_url, created_at, updated_at FROM users WHERE id = $1',
          [user.id]
        );
        user = updatedResult.rows[0];
      } else if (photoUrl && user.photo_url !== photoUrl) {
        // Atualizar foto se fornecida e diferente
        await pool.query(
          'UPDATE users SET photo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [photoUrl, user.id]
        );
        user.photo_url = photoUrl;
      }
    } else {
      // Criar novo usuário
      const insertResult = await pool.query(
        'INSERT INTO users (name, email, google_id, photo_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, google_id, photo_url, created_at, updated_at',
        [name, email, googleId, photoUrl || null]
      );
      user = insertResult.rows[0];
      console.log('✅ New user created via Google:', email);
    }

    // Gerar JWT token
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
        updated_at: user.updated_at,
      },
      token
    };

    console.log('✅ Google login successful for:', email);
    res.json(authResponse);
  } catch (error) {
    console.error('Error in Google login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
