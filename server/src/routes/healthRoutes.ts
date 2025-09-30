import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 * @route GET /api/health
 */
router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
    },
    message: 'Server is healthy',
  });
});

/**
 * Detailed health check endpoint
 * @route GET /api/health/detailed
 */
router.get('/detailed', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      memory: process.memoryUsage(),
      version: process.version,
    },
    message: 'Server is healthy',
  });
});

export { router as healthRoutes };