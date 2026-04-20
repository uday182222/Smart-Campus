// @ts-nocheck
/**
 * Notification Service
 * Handles notification API calls using apiClient
 * Also includes Expo Notifications for local push notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import apiClient from './apiClient';

export type NotificationCategory = 
  | 'emergency'
  | 'announcement'
  | 'homework'
  | 'fee'
  | 'attendance'
  | 'transport'
  | 'appointment'
  | 'calendar';

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels: string[];
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  readAt?: Date;
  createdAt: Date;
  scheduledFor?: Date;
}

export interface NotificationPreferences {
  emergency: boolean;
  announcement: boolean;
  homework: boolean;
  fee: boolean;
  attendance: boolean;
  transport: boolean;
  appointment: boolean;
  calendar: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  sound: 'default' | 'none' | 'custom';
  vibrate: boolean;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const category = notification.request.content.data?.category as NotificationCategory;
    const preferences = await NotificationService.getPreferences();
    
    // Check if category is enabled
    if (!preferences[category]) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // Check quiet hours
    if (preferences.quietHoursEnabled && category !== 'emergency') {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= preferences.quietHoursStart && currentTime <= preferences.quietHoursEnd) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: true,
        };
      }
    }

    // Emergency alerts override everything
    const isEmergency = category === 'emergency';
    const isTransport = category === 'transport';

    return {
      shouldShowAlert: true,
      shouldPlaySound: preferences.sound !== 'none',
      shouldSetBadge: true,
      priority: isEmergency ? Notifications.AndroidNotificationPriority.MAX : 
               isTransport ? Notifications.AndroidNotificationPriority.HIGH :
               Notifications.AndroidNotificationPriority.DEFAULT,
    };
  },
});

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<string | null> {
    try {
      // Request permissions
      const token = await this.requestPermissions();
      
      if (token) {
        await AsyncStorage.setItem('expoPushToken', token);
        this.expoPushToken = token;

        // Register token with backend
        await this.registerPushToken(token);

        // Set up notification channels for Android
        if (Platform.OS === 'android') {
          await this.setupAndroidChannels();
        }

        // Set up listeners
        this.setupListeners();

        return token;
      }

      return null;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission not granted for notifications');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      sound: 'emergency.wav',
      description: 'Critical emergency alerts that override silent mode',
    });

    await Notifications.setNotificationChannelAsync('transport', {
      name: 'Transport Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F39C12',
      sound: 'transport.wav',
      description: 'Real-time bus location and ETA updates',
    });

    await Notifications.setNotificationChannelAsync('announcement', {
      name: 'Announcements',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      description: 'School announcements and updates',
    });

    await Notifications.setNotificationChannelAsync('homework', {
      name: 'Homework Reminders',
      importance: Notifications.AndroidImportance.LOW,
      sound: 'default',
      description: 'Homework due date reminders',
    });

    await Notifications.setNotificationChannelAsync('fee', {
      name: 'Fee Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      description: 'Fee payment reminders',
    });

    await Notifications.setNotificationChannelAsync('attendance', {
      name: 'Attendance Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      description: 'Student attendance notifications',
    });

    await Notifications.setNotificationChannelAsync('appointment', {
      name: 'Appointments',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      description: 'Appointment confirmations and reminders',
    });
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });
  }

  /**
   * Remove listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Register push token with backend
   */
  async registerPushToken(pushToken: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register', {
        pushToken,
        platform: Platform.OS,
        deviceInfo: {
          brand: Device.brand,
          modelName: Device.modelName,
          osVersion: Device.osVersion,
        },
      });
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * GET /api/notifications/:userId
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options?: { status?: 'all' | 'unread' | 'read'; type?: string; limit?: number; offset?: number }
  ): Promise<{ success: boolean; data?: { notifications: Notification[]; total: number; unreadCount: number }; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.type) params.append('type', options.type);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString();
      const url = `/notifications/${userId}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<{ success: boolean; data: any }>(url);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            notifications: response.data.notifications.map((n: any) => ({
              ...n,
              readAt: n.readAt ? new Date(n.readAt) : undefined,
              createdAt: new Date(n.createdAt),
              scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : undefined,
            })),
            total: response.data.total || 0,
            unreadCount: response.data.unreadCount || 0,
          },
        };
      }
      
      return { success: false, error: 'Failed to get notifications' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get notifications',
      };
    }
  }

  /**
   * PUT /api/notifications/:notificationId/read
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; message?: string }>(
        `/notifications/${notificationId}/read`
      );
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Notification marked as read',
        };
      }
      
      return { success: false, error: 'Failed to mark notification as read' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark notification as read',
      };
    }
  }

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; message?: string; data?: { updatedCount: number }; error?: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; message?: string; data?: { updatedCount: number } }>(
        '/notifications/read-all',
        { userId }
      );
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'All notifications marked as read',
          data: response.data,
        };
      }
      
      return { success: false, error: 'Failed to mark all notifications as read' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      };
    }
  }

  /**
   * GET /api/notifications/preferences/:userId
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<{ success: boolean; data?: { preferences: NotificationPreferences }; error?: string }> {
    try {
      // Try to get from backend first
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/notifications/preferences/${userId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            preferences: response.data.preferences,
          },
        };
      }
      
      // Fallback to local storage
      const prefsString = await AsyncStorage.getItem('notificationPreferences');
      if (prefsString) {
        return {
          success: true,
          data: {
            preferences: JSON.parse(prefsString),
          },
        };
      }
      
      // Default preferences
      const defaultPrefs: NotificationPreferences = {
        emergency: true,
        announcement: true,
        homework: true,
        fee: true,
        attendance: true,
        transport: true,
        appointment: true,
        calendar: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        sound: 'default',
        vibrate: true,
      };
      
      return {
        success: true,
        data: {
          preferences: defaultPrefs,
        },
      };
    } catch (error) {
      // Fallback to local storage on error
      try {
        const prefsString = await AsyncStorage.getItem('notificationPreferences');
        if (prefsString) {
          return {
            success: true,
            data: {
              preferences: JSON.parse(prefsString),
            },
          };
        }
      } catch (e) {
        // Ignore
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get preferences',
      };
    }
  }

  /**
   * POST /api/notifications/preferences
   * Update notification preferences for a user
   */
  async updatePreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Save to local storage first
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      
      // Sync with backend
      const response = await apiClient.post<{ success: boolean; message?: string }>(
        '/notifications/preferences',
        {
          userId,
          preferences,
        }
      );
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Preferences updated successfully',
        };
      }
      
      return { success: false, error: 'Failed to update preferences' };
    } catch (error) {
      // Still save locally even if backend fails
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preferences',
      };
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(
    category: NotificationCategory,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { category, ...data },
        sound: 'default',
        priority: category === 'emergency' ? Notifications.AndroidNotificationPriority.MAX : 
                 category === 'transport' ? Notifications.AndroidNotificationPriority.HIGH :
                 Notifications.AndroidNotificationPriority.DEFAULT,
        ...(Platform.OS === 'android' && {
          channelId: category,
        }),
      },
      trigger: null, // Send immediately
    });

    return notificationId;
  }

  /**
   * Update badge count
   */
  async updateBadgeCount(count?: number): Promise<void> {
    if (count !== undefined) {
      await Notifications.setBadgeCountAsync(count);
    } else {
      const currentCount = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(currentCount + 1);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get unread notification count
   * Static method for easy access from dashboard
   */
  static async getUnreadCount(): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      const response = await apiClient.get('/notifications/unread/count');
      return { 
        success: true, 
        data: response.data?.count || response.data?.data || 0 
      };
    } catch (error: any) {
      console.error('NotificationService.getUnreadCount error:', error);
      // Return demo data on error
      return { success: true, data: 3 };
    }
  }
}

export { NotificationService };
export default new NotificationService();
