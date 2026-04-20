import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * API Client for Web App
 * Handles all API calls with authentication, error handling, and interceptors
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadToken();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Don't set Content-Type for FormData - let browser set it with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data instanceof FormData ? '[FormData]' : config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error: AxiosError) => {
        console.error('❌ [API] Request error:', error);
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.warn('⚠️ [API] Unauthorized - Token may be expired');
          this.clearToken();
        }

        if (!error.response) {
          console.error('❌ [API] Network error:', error.message);
          return Promise.reject({
            message: 'Network error. Please check your internet connection.',
            statusCode: 0,
          } as ApiError);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as any;
      return {
        message: data.message || data.error?.message || `Request failed with status ${error.response.status}`,
        statusCode: error.response.status,
        errors: data.errors || data.error,
      };
    } else if (error.request) {
      return {
        message: 'No response from server. Please check your internet connection.',
        statusCode: 0,
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
      };
    }
  }

  private loadToken(): void {
    try {
      this.token = localStorage.getItem('authToken');
    } catch (error) {
      console.error('Error loading auth token:', error);
      this.token = null;
    }
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

