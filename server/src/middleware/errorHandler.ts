import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';

/**
 * Error handling middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  // Handle different error types
  if (err.name === 'ValidationError') {
    error = new AppError('Validation Error', 400, err.message);
  }

  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  const appError = error as AppError;
  const statusCode = appError.statusCode || 500;
  const message = appError.isOperational ? appError.message : 'Internal server error';

  // Log error details in development
  if (process.env['NODE_ENV'] === 'development') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: appError.details,
      ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};