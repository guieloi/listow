import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../config/multer';

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
}, registerValidation, authController.register);

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 Login route hit from:', req.ip);
  next();
}, loginValidation, authController.login);

router.get('/user/:id', authenticateToken, authController.getUserById);

router.put(
  '/profile',
  authenticateToken,
  upload.single('photo'),
  authController.updateProfile
);

router.put(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres'),
  ],
  authController.changePassword
);

router.post('/save-token', authenticateToken, authController.savePushToken);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido')
], authController.forgotPassword);

router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Código deve ter 6 dígitos'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter no mínimo 6 caracteres')
], authController.resetPassword);

export default router;
