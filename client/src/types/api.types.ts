/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  details?: any;
  stack?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  timestamp: string;
}

/**
 * User types
 */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}