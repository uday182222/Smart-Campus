/**
 * Unit Tests for Services
 * Tests individual service methods
 */

import apiClient from '../../services/apiClient';
import TransportService from '../../services/TransportService';
import NotificationService from '../../services/NotificationService';
import GalleryService from '../../services/GalleryService';
import CalendarService from '../../services/CalendarService';
import AdminService from '../../services/AdminService';
import { createSuccessResponse, mockTransportRoute } from '../factories/mockData';

jest.mock('../../services/apiClient');

describe('Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TransportService', () => {
    it('should get routes for a school', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ routes: [mockTransportRoute] })
      );

      const result = await TransportService.getRoutes('school-1');

      expect(result.success).toBe(true);
      expect(result.data?.routes).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/transport/routes?schoolId=school-1');
    });

    it('should handle transport service errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await TransportService.getRoutes('school-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should update tracking location', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ nextStop: { eta: '5 minutes' } }, 'Location updated')
      );

      const result = await TransportService.updateTracking({
        routeId: 'route-1',
        latitude: 40.7128,
        longitude: -74.006,
        speed: 30,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Location updated');
    });
  });

  describe('NotificationService', () => {
    it('should get user notifications', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          notifications: [
            {
              id: 'notif-1',
              title: 'Test',
              body: 'Test notification',
              category: 'announcement',
              status: 'sent',
              createdAt: new Date(),
            },
          ],
          total: 1,
          unreadCount: 1,
        })
      );

      const result = await NotificationService.getUserNotifications('user-1');

      expect(result.success).toBe(true);
      expect(result.data?.notifications).toHaveLength(1);
    });

    it('should mark notification as read', async () => {
      (apiClient.put as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({}, 'Notification marked as read')
      );

      const result = await NotificationService.markAsRead('notif-1');

      expect(result.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith('/notifications/notif-1/read');
    });

    it('should update notification preferences', async () => {
      const preferences = {
        emergency: true,
        announcement: true,
        homework: false,
        fee: true,
        attendance: true,
        transport: true,
        appointment: true,
        calendar: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        sound: 'default' as const,
        vibrate: true,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({}, 'Preferences updated')
      );

      const result = await NotificationService.updatePreferences('user-1', preferences);

      expect(result.success).toBe(true);
    });
  });

  describe('GalleryService', () => {
    it('should get gallery items for a school', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          items: [
            {
              id: 'gallery-1',
              title: 'Sports Day',
              type: 'image',
              fileUrl: 'https://example.com/image.jpg',
              visibility: 'public',
              createdAt: new Date(),
            },
          ],
          total: 1,
        })
      );

      const result = await GalleryService.getGalleryItems('school-1');

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(1);
    });

    it('should upload gallery item', async () => {
      const formData = new FormData();
      formData.append('file', { uri: 'file://image.jpg', type: 'image/jpeg', name: 'image.jpg' } as any);

      (apiClient.postFormData as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          itemId: 'gallery-2',
          url: 'https://example.com/uploaded.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        })
      );

      const result = await GalleryService.uploadGalleryItem(
        'file://image.jpg',
        {
          title: 'New Photo',
          visibility: 'public',
        }
      );

      expect(result.success).toBe(true);
      expect(result.data?.itemId).toBeDefined();
    });

    it('should create album', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ albumId: 'album-1' }, 'Album created')
      );

      const result = await GalleryService.createAlbum({
        name: 'Sports Day 2024',
        description: 'Annual sports day photos',
      });

      expect(result.success).toBe(true);
      expect(result.data?.albumId).toBeDefined();
    });
  });

  describe('CalendarService', () => {
    it('should create event', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          eventId: 'event-1',
          event: {
            id: 'event-1',
            title: 'Sports Day',
            eventType: 'sports',
            startDate: new Date('2024-12-10'),
            endDate: new Date('2024-12-10'),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );

      const result = await CalendarService.createEvent({
        title: 'Sports Day',
        eventType: 'sports',
        startDate: '2024-12-10',
        targetAudience: ['all'],
        isAllDay: true,
        attendanceRequired: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.eventId).toBeDefined();
    });

    it('should get events for a school', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          events: [
            {
              id: 'event-1',
              title: 'Sports Day',
              eventType: 'sports',
              startDate: new Date('2024-12-10'),
              endDate: new Date('2024-12-10'),
              targetAudience: ['all'],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          total: 1,
        })
      );

      const result = await CalendarService.getEvents('school-1');

      expect(result.success).toBe(true);
      expect(result.data?.events).toHaveLength(1);
    });

    it('should RSVP to event', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse(
          {
            rsvp: {
              id: 'rsvp-1',
              status: 'confirmed',
              responseDate: new Date(),
            },
          },
          'RSVP recorded successfully'
        )
      );

      const result = await CalendarService.rsvpEvent('event-1', {
        attending: true,
        notes: 'Looking forward to it',
      });

      expect(result.success).toBe(true);
      expect(result.data?.rsvp.status).toBe('confirmed');
    });
  });

  describe('AdminService', () => {
    it('should create user', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          userId: 'teacher-2',
          temporaryPassword: 'TempPass123!',
          user: {
            id: 'teacher-2',
            email: 'newteacher@school.com',
            role: 'TEACHER',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );

      const result = await AdminService.createUser({
        email: 'newteacher@school.com',
        name: 'New Teacher',
        role: 'TEACHER',
        schoolId: 'school-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.temporaryPassword).toBeDefined();
    });

    it('should get dashboard analytics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          analytics: {
            users: { total: 980, active: 975 },
            attendance: { todayPercentage: 92.5 },
            homework: { pending: 15 },
            events: { upcoming: 3 },
            activities: { recent: [] },
          },
        },
      });

      const result = await AdminService.getDashboardAnalytics('school-1');

      expect(result.success).toBe(true);
      expect(result.data?.analytics.users.total).toBe(980);
    });
  });
});

