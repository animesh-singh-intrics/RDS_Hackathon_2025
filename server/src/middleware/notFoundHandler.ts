import { Request, Response } from 'express';

/**
 * 404 Not Found handler middleware
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
    },
    timestamp: new Date().toISOString(),
  });
};