import { Router } from 'express';
import { param } from 'express-validator';
import { UserController } from '@/controllers/UserController';
import { authMiddleware } from '@/middleware/authMiddleware';

const router = Router();
const userController = new UserController();

/**
 * Get all users (protected)
 * @route GET /api/users
 */
router.get('/', authMiddleware, userController.getUsers);

/**
 * Get user by ID (protected)
 * @route GET /api/users/:id
 */
router.get(
  '/:id',
  [param('id').isMongoId()],
  authMiddleware,
  userController.getUser
);

/**
 * Get current user profile (protected)
 * @route GET /api/users/me
 */
router.get('/me', authMiddleware, userController.getCurrentUser);

export { router as userRoutes };