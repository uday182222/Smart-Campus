/**
 * Super Admin Service
 * Handles all platform management, school management, and system operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

export interface School {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  logoUrl?: string;
  status: 'active' | 'trial' | 'inactive';
  subscriptionPlan: 'basic' | 'standard' | 'premium';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  userCount: number;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  features: string[];
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolAdmin {
  id: string;
  schoolId: string;
  schoolName: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'school_admin';
  status: 'active' | 'inactive';
  lastLogin?: Date;
  activityLog: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface PlatformStats {
  totalSchools: number;
  activeSchools: number;
  trialSchools: number;
  inactiveSchools: number;
  totalUsers: number;
  activeUsers: number;
  totalAdmins: number;
  supportTickets: number;
  criticalAlerts: number;
  systemHealth: number;
  storageUsed: string;
  apiResponseTime: number;
}

export interface SystemSettings {
  appVersion: string;
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
  globalLimits: {
    maxFileSize: number; // in MB
    maxUsersPerSchool: number;
    maxStoragePerSchool: number; // in GB
  };
  emailTemplates: Record<string, string>;
  notificationPreferences: {
    enablePush: boolean;
    enableEmail: boolean;
    enableWhatsApp: boolean;
  };
}

export interface CreateSchoolData {
  // Step 1: Basic Info
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  
  // Step 2: Admin Account
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  
  // Step 3: Logo
  logoUrl?: string;
  
  // Step 4: Settings
  settings?: Record<string, any>;
  
  // Step 5: Subscription
  subscriptionPlan: 'basic' | 'standard' | 'premium';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  targetAudience: {
    type: 'all' | 'schools' | 'roles';
    schoolIds?: string[];
    roles?: string[];
  };
  scheduledFor?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sent';
  deliveryCount: number;
  acknowledgmentCount: number;
  createdBy: string;
  createdAt: Date;
}

class SuperAdminService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadToken();
  }

  /**
   * Load JWT token from storage
   */
  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  /**
   * Set authentication token
   */
  public async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  /**
   * Make authenticated API request
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.token) {
      await this.loadToken();
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'API request failed');
    }

    return await response.json();
  }

  // PLATFORM STATISTICS

  /**
   * Get platform-wide statistics
   */
  async getPlatformStatistics(): Promise<PlatformStats> {
    const response = await this.request('/superadmin/statistics');
    return response.data;
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<any> {
    const response = await this.request('/superadmin/system-health');
    return response.data;
  }

  // SCHOOL MANAGEMENT

  /**
   * Get all schools (Node API: GET /schools)
   */
  async getAllSchools(): Promise<School[]> {
    const response = await this.request('/schools');
    const list = response.data?.schools ?? response.data ?? [];
    return (Array.isArray(list) ? list : []).map((school: any) => ({
      id: school.id,
      name: school.name,
      address: school.address ?? '',
      city: school.city ?? '',
      state: school.state ?? '',
      zipCode: school.zipCode ?? '',
      country: school.country ?? '',
      contactEmail: school.contactEmail ?? school.email ?? '',
      contactPhone: school.contactPhone ?? school.phone ?? '',
      adminId: '',
      adminName: '',
      adminEmail: '',
      logoUrl: school.logoUrl,
      status: (school.status ?? 'active') as School['status'],
      subscriptionPlan: (school.subscriptionPlan ?? 'basic') as School['subscriptionPlan'],
      subscriptionStartDate: new Date(school.subscriptionStart ?? school.subscriptionStartDate ?? Date.now()),
      subscriptionEndDate: new Date(school.subscriptionEnd ?? school.subscriptionEndDate ?? Date.now()),
      userCount: school._count?.users ?? school.userCount ?? 0,
      storageUsed: school.storageUsed ?? 0,
      storageLimit: school.storageLimit ?? 0,
      features: school.features ?? [],
      settings: school.settings ?? {},
      createdAt: new Date(school.createdAt ?? Date.now()),
      updatedAt: new Date(school.updatedAt ?? Date.now()),
    }));
  }

  /**
   * Get school by ID (Node API: GET /schools/:id)
   */
  async getSchoolById(schoolId: string): Promise<School> {
    const response = await this.request(`/schools/${schoolId}`);
    const s = response.data?.school ?? response.data;
    return {
      id: s.id,
      name: s.name,
      address: s.address ?? '',
      city: s.city ?? '',
      state: s.state ?? '',
      zipCode: s.zipCode ?? '',
      country: s.country ?? '',
      contactEmail: s.contactEmail ?? s.email ?? '',
      contactPhone: s.contactPhone ?? s.phone ?? '',
      adminId: '',
      adminName: '',
      adminEmail: '',
      logoUrl: s.logoUrl,
      status: (s.status ?? 'active') as School['status'],
      subscriptionPlan: (s.subscriptionPlan ?? 'basic') as School['subscriptionPlan'],
      subscriptionStartDate: new Date(s.subscriptionStart ?? s.subscriptionStartDate ?? Date.now()),
      subscriptionEndDate: new Date(s.subscriptionEnd ?? s.subscriptionEndDate ?? Date.now()),
      userCount: s._count?.users ?? s.userCount ?? 0,
      storageUsed: s.storageUsed ?? 0,
      storageLimit: s.storageLimit ?? 0,
      features: s.features ?? [],
      settings: s.settings ?? {},
      createdAt: new Date(s.createdAt ?? Date.now()),
      updatedAt: new Date(s.updatedAt ?? Date.now()),
    };
  }

  /**
   * Create new school (Node API: POST /schools)
   */
  async createSchool(schoolData: CreateSchoolData): Promise<School> {
    const response = await this.request('/schools', {
      method: 'POST',
      body: JSON.stringify({
        name: schoolData.name,
        address: [schoolData.address, schoolData.city, schoolData.state, schoolData.zipCode, schoolData.country].filter(Boolean).join(', ') || schoolData.address,
        city: schoolData.city,
        state: schoolData.state,
        zipCode: schoolData.zipCode,
        country: schoolData.country,
        contactEmail: schoolData.contactEmail,
        contactPhone: schoolData.contactPhone,
        logoUrl: schoolData.logoUrl,
        status: 'active',
        subscriptionPlan: schoolData.subscriptionPlan ?? 'basic',
        subscriptionStart: schoolData.subscriptionStartDate?.toISOString?.() ?? new Date().toISOString(),
        subscriptionEnd: schoolData.subscriptionEndDate?.toISOString?.() ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    const s = response.data?.school ?? response.data;
    return this.getSchoolById(s.id);
  }

  /**
   * Update school (Node API: PUT /schools/:id)
   */
  async updateSchool(schoolId: string, updates: Partial<School>): Promise<School> {
    await this.request(`/schools/${schoolId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        address: updates.address,
        city: updates.city,
        state: updates.state,
        zipCode: updates.zipCode,
        country: updates.country,
        contactEmail: updates.contactEmail,
        contactPhone: updates.contactPhone,
        logoUrl: updates.logoUrl,
        status: updates.status,
        subscriptionPlan: updates.subscriptionPlan,
        subscriptionStart: updates.subscriptionStartDate?.toISOString?.(),
        subscriptionEnd: updates.subscriptionEndDate?.toISOString?.(),
      }),
    });
    return this.getSchoolById(schoolId);
  }

  /**
   * Update school status (Node API: PUT /schools/:id with status)
   */
  async updateSchoolStatus(
    schoolId: string,
    status: 'active' | 'trial' | 'inactive'
  ): Promise<void> {
    await this.request(`/schools/${schoolId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Delete school (Node API: DELETE /schools/:id)
   */
  async deleteSchool(schoolId: string): Promise<void> {
    await this.request(`/schools/${schoolId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get school analytics
   */
  async getSchoolAnalytics(schoolId: string): Promise<any> {
    const response = await this.request(`/superadmin/schools/${schoolId}/analytics`);
    return response.data;
  }

  /**
   * Upload school logo
   */
  async uploadSchoolLogo(schoolId: string, logoFile: any): Promise<string> {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await fetch(`${this.baseURL}/superadmin/schools/${schoolId}/logo`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Logo upload failed');
    }

    const result = await response.json();
    return result.logoUrl;
  }

  // ADMIN MANAGEMENT

  /**
   * Get all school admins
   */
  async getAllAdmins(): Promise<SchoolAdmin[]> {
    const response = await this.request('/superadmin/admins');
    return response.data.map((admin: any) => ({
      ...admin,
      lastLogin: admin.lastLogin ? new Date(admin.lastLogin) : undefined,
      createdAt: new Date(admin.createdAt),
      updatedAt: new Date(admin.updatedAt),
      activityLog: admin.activityLog?.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
      })) || [],
    }));
  }

  /**
   * Get admin by ID
   */
  async getAdminById(adminId: string): Promise<SchoolAdmin> {
    const response = await this.request(`/superadmin/admins/${adminId}`);
    return {
      ...response.data,
      lastLogin: response.data.lastLogin ? new Date(response.data.lastLogin) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
      activityLog: response.data.activityLog?.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
      })) || [],
    };
  }

  /**
   * Create school admin
   */
  async createAdmin(adminData: {
    schoolId: string;
    name: string;
    email: string;
    phone: string;
  }): Promise<SchoolAdmin> {
    const response = await this.request('/superadmin/admins', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Update admin
   */
  async updateAdmin(adminId: string, updates: Partial<SchoolAdmin>): Promise<SchoolAdmin> {
    const response = await this.request(`/superadmin/admins/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return {
      ...response.data,
      lastLogin: response.data.lastLogin ? new Date(response.data.lastLogin) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Deactivate admin
   */
  async deactivateAdmin(adminId: string): Promise<void> {
    await this.request(`/superadmin/admins/${adminId}/deactivate`, {
      method: 'PUT',
    });
  }

  /**
   * Get admin activity log
   */
  async getAdminActivity(adminId: string): Promise<Activity[]> {
    const response = await this.request(`/superadmin/admins/${adminId}/activity`);
    return response.data.map((activity: any) => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    }));
  }

  // USER MANAGEMENT

  /**
   * Get all platform users
   */
  async getAllUsers(filters?: {
    schoolId?: string;
    role?: string;
    status?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams(filters as any).toString();
    const response = await this.request(`/superadmin/users?${queryParams}`);
    return response.data;
  }

  /**
   * Search users
   */
  async searchUsers(query: string): Promise<any[]> {
    const response = await this.request(`/superadmin/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * Get user growth metrics
   */
  async getUserGrowthMetrics(): Promise<any> {
    const response = await this.request('/superadmin/users/growth');
    return response.data;
  }

  // SYSTEM CONFIGURATION

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await this.request('/superadmin/settings');
    return response.data;
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await this.request('/superadmin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return response.data;
  }

  /**
   * Toggle maintenance mode
   */
  async toggleMaintenanceMode(enabled: boolean): Promise<void> {
    await this.request('/superadmin/settings/maintenance', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(featureName: string, enabled: boolean): Promise<void> {
    await this.request('/superadmin/settings/feature-flags', {
      method: 'PUT',
      body: JSON.stringify({ featureName, enabled }),
    });
  }

  // MONITORING

  /**
   * Get system monitoring data
   */
  async getMonitoringData(): Promise<any> {
    const response = await this.request('/superadmin/monitoring');
    return response.data;
  }

  /**
   * Get real-time active users
   */
  async getActiveUsers(): Promise<number> {
    const response = await this.request('/superadmin/monitoring/active-users');
    return response.data.count;
  }

  /**
   * Get error logs
   */
  async getErrorLogs(limit: number = 100): Promise<any[]> {
    const response = await this.request(`/superadmin/monitoring/errors?limit=${limit}`);
    return response.data.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  }

  /**
   * Get API performance metrics
   */
  async getAPIPerformance(): Promise<any> {
    const response = await this.request('/superadmin/monitoring/api-performance');
    return response.data;
  }

  // ANNOUNCEMENTS

  /**
   * Get all announcements
   */
  async getAllAnnouncements(): Promise<Announcement[]> {
    const response = await this.request('/superadmin/announcements');
    return response.data.map((announcement: any) => ({
      ...announcement,
      scheduledFor: announcement.scheduledFor ? new Date(announcement.scheduledFor) : undefined,
      sentAt: announcement.sentAt ? new Date(announcement.sentAt) : undefined,
      createdAt: new Date(announcement.createdAt),
    }));
  }

  /**
   * Create platform announcement
   */
  async createAnnouncement(announcementData: Omit<Announcement, 'id' | 'deliveryCount' | 'acknowledgmentCount' | 'createdAt'>): Promise<Announcement> {
    const response = await this.request('/superadmin/announcements', {
      method: 'POST',
      body: JSON.stringify({
        ...announcementData,
        scheduledFor: announcementData.scheduledFor?.toISOString(),
      }),
    });
    return {
      ...response.data,
      scheduledFor: response.data.scheduledFor ? new Date(response.data.scheduledFor) : undefined,
      sentAt: response.data.sentAt ? new Date(response.data.sentAt) : undefined,
      createdAt: new Date(response.data.createdAt),
    };
  }

  /**
   * Send emergency broadcast
   */
  async sendEmergencyBroadcast(message: string, targetSchools?: string[]): Promise<void> {
    await this.request('/superadmin/announcements/emergency', {
      method: 'POST',
      body: JSON.stringify({ message, targetSchools }),
    });
  }

  /**
   * Get announcement delivery status
   */
  async getAnnouncementStatus(announcementId: string): Promise<any> {
    const response = await this.request(`/superadmin/announcements/${announcementId}/status`);
    return response.data;
  }

  // SUPPORT

  /**
   * Get support tickets
   */
  async getSupportTickets(status?: string): Promise<any[]> {
    const endpoint = status 
      ? `/superadmin/support/tickets?status=${status}`
      : '/superadmin/support/tickets';
    const response = await this.request(endpoint);
    return response.data.map((ticket: any) => ({
      ...ticket,
      createdAt: new Date(ticket.createdAt),
      updatedAt: new Date(ticket.updatedAt),
    }));
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, status: string, response?: string): Promise<void> {
    await this.request(`/superadmin/support/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, response }),
    });
  }

  // ANALYTICS

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(period: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    const response = await this.request(`/superadmin/analytics?period=${period}`);
    return response.data;
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(): Promise<any> {
    const response = await this.request('/superadmin/analytics/revenue');
    return response.data;
  }

  /**
   * Export platform report
   */
  async exportPlatformReport(format: 'pdf' | 'excel'): Promise<string> {
    const response = await this.request(`/superadmin/reports/export?format=${format}`);
    return response.data.downloadUrl;
  }
}

export default new SuperAdminService();



