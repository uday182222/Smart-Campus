import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API Client with interceptors for authentication, error handling, and request/response logging.
 *
 * NETWORK SETUP:
 * For local development on a physical device:
 * 1. Find your computer's local IP: Mac → ifconfig | grep "inet ", Windows → ipconfig
 * 2. Update EXPO_PUBLIC_API_URL in .env or .env.local to http://YOUR_IP:5000/api/v1
 * 3. Make sure your phone and computer are on the SAME WiFi network
 * 4. Make sure server is running: cd server && npm run dev
 */

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:5000/api/v1';

if (__DEV__) {
  console.log('🌐 [API] baseURL:', API_BASE_URL, '(If on physical device, use your computer IP in .env.local and restart Expo)');
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: any;
}

export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private token: string | null = null;

  private constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // 15 seconds — use computer's local IP in .env.local when testing on device
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadToken();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Load token if not already loaded
        if (!this.token) {
          await this.loadToken();
        }

        // Add authorization header if token exists
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Log request in development
        if (__DEV__) {
          console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
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

    // Response interceptor - Handle errors and logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful response in development
        if (__DEV__) {
          console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401) {
          console.warn('⚠️ [API] Unauthorized - Token may be expired');
          // Clear token and redirect to login
          await this.clearToken();
          
          // You can emit an event here to trigger navigation to login screen
          // EventEmitter.emit('UNAUTHORIZED');
        }

        // Handle timeout and network errors
        if (error.code === 'ECONNABORTED') {
          console.error('[API] Request timed out — is the server running? Check EXPO_PUBLIC_API_URL in .env.local');
        } else if (!error.response) {
          const url = String(this.client?.defaults?.baseURL || API_BASE_URL);
          const loopback =
            url.includes('localhost') || url.includes('127.0.0.1');
          console.error(
            '[API] Network error — nothing reached the server (timeout, refused, or wrong host). Is `npm run dev` running in server/, and Redis up?'
          );
          if (loopback) {
            console.error(
              '[API] If you are on a physical phone, replace localhost with your Mac LAN IP (e.g. http://192.168.x.x:5000/api/v1); same Wi‑Fi. Simulator on this Mac can use localhost.'
            );
          }
          console.error('[API] Current baseURL:', url);
        }
        if (!error.response) {
          return Promise.reject({
            message: error.code === 'ECONNABORTED'
              ? 'Request timed out. Is the server running? Use your computer IP in .env.local when on a physical device.'
              : 'Network error. Check .env.local (EXPO_PUBLIC_API_URL) and that you are on the same WiFi as the server.',
            statusCode: 0,
          } as ApiError);
        }

        // Log error response in development
        if (__DEV__) {
          console.error(`❌ [API] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
            status: error.response.status,
            data: error.response.data,
          });
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle and format API errors
   */
  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      return {
        message: data.message || data.error?.message || `Request failed with status ${error.response.status}`,
        statusCode: error.response.status,
        errors: data.errors || data.error,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'No response from server. Please check your internet connection.',
        statusCode: 0,
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
      };
    }
  }

  /**
   * Load authentication token from storage
   */
  private async loadToken(): Promise<void> {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error loading auth token:', error);
      this.token = null;
    }
  }

  /**
   * Set authentication token
   */
  public async setToken(token: string): Promise<void> {
    this.token = token;
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  /**
   * Clear authentication token
   */
  public async clearToken(): Promise<void> {
    this.token = null;
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST request with FormData (for file uploads)
   */
  async postFormData<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the underlying axios instance (for advanced use cases)
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }

  /**
   * Update base URL (useful for switching environments)
   */
  setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.client.defaults.baseURL || API_BASE_URL;
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export default for convenience
export default apiClient;

