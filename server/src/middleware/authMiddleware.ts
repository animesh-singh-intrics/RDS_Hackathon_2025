import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/AppError';

/**
 * Extended Request interface with user property
 */
export interface AuthRequest extends Request {
  user?: { 
    id: string; 
    email: string;
    name: string;
  };
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new AppError('Access denied. No token provided.', 401);
  }

  try {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
};