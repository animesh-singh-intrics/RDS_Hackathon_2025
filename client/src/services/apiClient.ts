import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse, ApiErrorResponse } from '@/types/api.types';

/**
 * API Client configuration and setup
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      timeout: 60000, // Increased to 60 seconds for API processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request
   */
  public async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url);
    return response.data;
  }

  /**
   * Generic POST request
   */
  public async post<T, D = any>(url: string, data?: D): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  public async put<T, D = any>(url: string, data?: D): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }

  /**
   * Set auth token for subsequent requests
   */
  public setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Remove auth token
   */
  public removeAuthToken(): void {
    localStorage.removeItem('auth_token');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();