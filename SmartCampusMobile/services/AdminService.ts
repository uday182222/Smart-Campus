/**
 * Admin Service
 * Handles admin-related API calls for user and school management using apiClient
 */

import apiClient from './apiClient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'TEACHER' | 'PARENT' | 'STUDENT' | 'OFFICE_STAFF' | 'BUS_HELPER' | 'ADMIN' | 'PRINCIPAL';
  schoolId: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  photo?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  role: 'TEACHER' | 'PARENT' | 'STUDENT' | 'OFFICE_STAFF' | 'BUS_HELPER';
  schoolId: string;
  phone?: string;
  classIds?: string[];
  parentId?: string; // For students
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  classIds?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface DashboardAnalytics {
  users: {
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    total: number;
    active: number;
    inactive: number;
  };
  attendance: {
    todayPercentage: number;
    todayRecords: number;
    todayPresent: number;
  };
  homework: {
    pending: number;
  };
  events: {
    upcoming: number;
    nextEvents: Array<{
      id: string;
      title: string;
      startDate: string;
      type: string;
    }>;
  };
  activities: {
    recent: Array<{
      id: string;
      action: string;
      resource: string;
      user: {
        id: string;
        name: string;
        role: string;
      };
      timestamp: Date;
    }>;
  };
}

class AdminService {
  /**
   * POST /api/admin/user
   * Create new user
   */
  async createUser(data: CreateUserData): Promise<{ success: boolean; data?: { userId: string; temporaryPassword?: string; user: User }; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: any; message?: string }>(
        '/admin/user',
        data
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            userId: response.data.userId || response.data.user?.id,
            temporaryPassword: response.data.temporaryPassword || undefined,
            user: {
              ...response.data.user,
              lastLogin: response.data.user.lastLogin ? new Date(response.data.user.lastLogin) : undefined,
              createdAt: new Date(response.data.user.createdAt),
              updatedAt: new Date(response.data.user.updatedAt),
            },
          },
          message: response.message || 'User created successfully',
        };
      }
      
      return { success: false, error: 'Failed to create user' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  /**
   * GET /api/admin/users
   * Get all users in school
   */
  async getUsers(
    schoolId: string,
    options?: { role?: string; status?: string; search?: string; limit?: number; offset?: number }
  ): Promise<{ success: boolean; data?: { users: User[]; total: number; pagination: any }; error?: string }> {
    try {
      const params = new URLSearchParams();
      params.append('schoolId', schoolId);
      if (options?.role) params.append('role', options.role);
      if (options?.status) params.append('status', options.status);
      if (options?.search) params.append('search', options.search);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const url = `/admin/users?${params.toString()}`;
      const response = await apiClient.get<{ success: boolean; data: any }>(url);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            users: response.data.users.map((user: any) => ({
              ...user,
              lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
            })),
            total: response.data.total || 0,
            pagination: response.data.pagination,
          },
        };
      }
      
      return { success: false, error: 'Failed to get users' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get users',
      };
    }
  }

  /**
   * PUT /api/admin/user/:userId
   * Update user details
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<{ success: boolean; data?: { user: User }; message?: string; error?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; data: any; message?: string }>(
        `/admin/user/${userId}`,
        data
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            user: {
              ...response.data.user,
              lastLogin: response.data.user.lastLogin ? new Date(response.data.user.lastLogin) : undefined,
              createdAt: new Date(response.data.user.createdAt),
              updatedAt: new Date(response.data.user.updatedAt),
            },
          },
          message: response.message || 'User updated successfully',
        };
      }
      
      return { success: false, error: 'Failed to update user' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }

  /**
   * DELETE /api/admin/user/:userId
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string): Promise<{ success: boolean; message?: string; data?: { user: User }; error?: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string; data?: any }>(
        `/admin/user/${userId}`
      );
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'User deactivated successfully',
          data: response.data
            ? {
                user: {
                  ...response.data.user,
                  lastLogin: response.data.user.lastLogin ? new Date(response.data.user.lastLogin) : undefined,
                  createdAt: new Date(response.data.user.createdAt),
                  updatedAt: new Date(response.data.user.updatedAt),
                },
              }
            : undefined,
        };
      }
      
      return { success: false, error: 'Failed to deactivate user' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate user',
      };
    }
  }

  /**
   * GET /api/admin/analytics/dashboard
   * Get dashboard analytics for admin
   */
  async getDashboardAnalytics(schoolId: string): Promise<{ success: boolean; data?: { analytics: DashboardAnalytics }; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/admin/analytics/dashboard?schoolId=${schoolId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            analytics: {
              ...response.data.analytics,
              activities: {
                recent: response.data.analytics.activities.recent.map((activity: any) => ({
                  ...activity,
                  timestamp: new Date(activity.timestamp),
                })),
              },
            },
          },
        };
      }
      
      return { success: false, error: 'Failed to get dashboard analytics' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dashboard analytics',
      };
    }
  }
}

export default new AdminService();

