import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '@/controllers/AuthController';

const router = Router();
const authController = new AuthController();

/**
 * User registration
 * @route POST /api/auth/register
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2, max: 50 }),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  authController.register
);

/**
 * User login
 * @route POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
  ],
  authController.login
);

/**
 * Token refresh
 * @route POST /api/auth/refresh
 */
router.post('/refresh', authController.refreshToken);

/**
 * User logout
 * @route POST /api/auth/logout
 */
router.post('/logout', authController.logout);

export { router as authRoutes };