import { apiClient } from './apiClient';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      schoolId: string;
    };
  };
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.data.token) {
        // Store token in apiClient
        apiClient.setToken(response.data.token);
      }

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout(): void {
    apiClient.clearToken();
  }
}

export const authService = new AuthService();

