import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, getUserById } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Routes
router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  console.log('📝 Register route hit from:', req.ip);
  next();
}, registerValidation, register);

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 Login route hit from:', req.ip);
  next();
}, loginValidation, login);

router.get('/profile', authenticateToken, getProfile);
router.get('/user/:id', authenticateToken, getUserById);

export default router;
