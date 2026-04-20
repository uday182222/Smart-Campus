// @ts-nocheck
import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  school?: { id: string; name: string };
}

interface LoginResponse {
  success: boolean;
  data: { user: User; token: string };
}

class AuthService {
  private static currentUser: User | null = null;

  static async login(email: string, password: string, schoolId?: string): Promise<{ success: true; user: User }> {
    const payload: { email: string; password: string; schoolId?: string } = { email, password };
    if (schoolId != null) payload.schoolId = schoolId;
    const response = (await apiClient.post('/auth/login', payload)) as LoginResponse;
    if (!response.success || !response.data?.user || !response.data?.token) {
      throw new Error(response.data?.message || 'Login failed');
    }
    const { user, token } = response.data;

    await apiClient.setToken(token);
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));

    this.currentUser = user;
    return { success: true, user };
  }

  static async logout(): Promise<void> {
    await apiClient.clearToken();
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('currentUser');
    this.currentUser = null;
  }

  static async restoreSession(): Promise<User | null> {
    const token = await AsyncStorage.getItem('authToken');
    const userStr = await AsyncStorage.getItem('currentUser');
    if (token && userStr) {
      await apiClient.setToken(token);
      this.currentUser = JSON.parse(userStr) as User;
      return this.currentUser;
    }
    this.currentUser = null;
    return null;
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static async getProfile(): Promise<User> {
    const response = (await apiClient.get('/auth/profile')) as { success: boolean; data: { user: User } };
    return response.data.user;
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }
}

export default AuthService;
