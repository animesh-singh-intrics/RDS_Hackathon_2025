import { Router } from 'express';
import { ChatController } from '@/controllers/ChatController';
import { body } from 'express-validator';

const router = Router();
const chatController = new ChatController();

/**
 * @route POST /api/chat
 * @desc Process chat request via OpenRouter
 * @access Public (for now - can add auth later)
 */
router.post(
  '/',
  [
    body('messages')
      .isArray({ min: 1 })
      .withMessage('Messages must be a non-empty array'),
    body('messages.*.role')
      .isIn(['user', 'assistant', 'system'])
      .withMessage('Each message must have a valid role'),
    body('messages.*.content')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Each message must have non-empty content'),
    body('model')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Model is required'),
    body('apiKey')
      .isString()
      .isLength({ min: 1 })
      .withMessage('API key is required'),
  ],
  chatController.chat
);

export { router as chatRoutes };