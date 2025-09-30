import type { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/api.types';
import { apiClient } from './apiClient';

/**
 * Authentication service
 * Handles user authentication operations
 */
class AuthService {
  /**
   * Register a new user
   */
  public async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    if (response.success && response.data) {
      apiClient.setAuthToken(response.data.token);
      return response.data;
    }
    
    throw new Error('Registration failed');
  }

  /**
   * Login user
   */
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      apiClient.setAuthToken(response.data.token);
      return response.data;
    }
    
    throw new Error('Login failed');
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      apiClient.removeAuthToken();
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to get current user');
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

// Export singleton instance
export const authService = new AuthService();