/**
 * Calendar Service
 * Handles all calendar and event-related API calls using apiClient
 */

import apiClient from './apiClient';

export interface Event {
  id: string;
  title: string;
  description?: string;
  eventType: 'holiday' | 'exam' | 'sports' | 'meeting' | 'celebration';
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location?: string;
  targetAudience: string[];
  classIds?: string[];
  isAllDay: boolean;
  reminderSettings?: {
    enabled: boolean;
    reminderBefore?: number;
  };
  attendanceRequired: boolean;
  maxAttendees?: number;
  currentAttendees: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  attendees?: Attendee[];
  userReminder?: {
    id: string;
    timing: number;
    sent: boolean;
    sentAt?: Date;
  };
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'declined';
  responseDate?: Date;
}

export interface CreateEventData {
  title: string;
  description?: string;
  eventType: 'holiday' | 'exam' | 'sports' | 'meeting' | 'celebration';
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  location?: string;
  targetAudience: string | string[];
  reminderBefore?: number; // minutes
  classIds?: string[];
  isAllDay?: boolean;
  attendanceRequired?: boolean;
  maxAttendees?: number;
}

export interface RSVPData {
  attending: boolean;
  notes?: string;
}

class CalendarService {
  /**
   * POST /api/calendar/event
   * Create new event
   */
  async createEvent(data: CreateEventData): Promise<{ success: boolean; data?: { eventId: string; event: Event }; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: any; message?: string }>(
        '/calendar/event',
        data
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            eventId: response.data.eventId || response.data.event?.id,
            event: {
              ...response.data.event,
              startDate: new Date(response.data.event.startDate),
              endDate: new Date(response.data.event.endDate),
              createdAt: new Date(response.data.event.createdAt),
              updatedAt: new Date(response.data.event.updatedAt),
              targetAudience: Array.isArray(response.data.event.targetAudience)
                ? response.data.event.targetAudience
                : [response.data.event.targetAudience],
            },
          },
          message: response.message || 'Event created successfully',
        };
      }
      
      return { success: false, error: 'Failed to create event' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create event',
      };
    }
  }

  /**
   * GET /api/calendar/events
   * Get events for a school
   */
  async getEvents(
    schoolId: string,
    options?: { startDate?: string; endDate?: string; eventType?: string; targetAudience?: string }
  ): Promise<{ success: boolean; data?: { events: Event[]; total: number }; error?: string }> {
    try {
      const params = new URLSearchParams();
      params.append('schoolId', schoolId);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      if (options?.eventType) params.append('eventType', options.eventType);
      if (options?.targetAudience) params.append('targetAudience', options.targetAudience);

      const url = `/calendar/events?${params.toString()}`;
      const response = await apiClient.get<{ success: boolean; data: any }>(url);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            events: response.data.events.map((event: any) => ({
              ...event,
              startDate: new Date(event.startDate),
              endDate: new Date(event.endDate),
              createdAt: new Date(event.createdAt),
              updatedAt: new Date(event.updatedAt),
              targetAudience: Array.isArray(event.targetAudience)
                ? event.targetAudience
                : [event.targetAudience],
              attendees: event.attendees?.map((attendee: any) => ({
                ...attendee,
                responseDate: attendee.responseDate ? new Date(attendee.responseDate) : undefined,
              })),
            })),
            total: response.data.total || 0,
          },
        };
      }
      
      return { success: false, error: 'Failed to get events' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get events',
      };
    }
  }

  /**
   * GET /api/calendar/event/:eventId
   * Get single event details
   */
  async getEventDetails(eventId: string): Promise<{ success: boolean; data?: { event: Event }; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/calendar/event/${eventId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            event: {
              ...response.data.event,
              startDate: new Date(response.data.event.startDate),
              endDate: new Date(response.data.event.endDate),
              createdAt: new Date(response.data.event.createdAt),
              updatedAt: new Date(response.data.event.updatedAt),
              targetAudience: Array.isArray(response.data.event.targetAudience)
                ? response.data.event.targetAudience
                : [response.data.event.targetAudience],
              attendees: response.data.event.attendees?.map((attendee: any) => ({
                ...attendee,
                responseDate: attendee.responseDate ? new Date(attendee.responseDate) : undefined,
              })),
              userReminder: response.data.event.userReminder
                ? {
                    ...response.data.event.userReminder,
                    sentAt: response.data.event.userReminder.sentAt
                      ? new Date(response.data.event.userReminder.sentAt)
                      : undefined,
                  }
                : undefined,
            },
          },
        };
      }
      
      return { success: false, error: 'Failed to get event details' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get event details',
      };
    }
  }

  /**
   * POST /api/calendar/event/:eventId/rsvp
   * RSVP to an event
   */
  async rsvpEvent(eventId: string, data: RSVPData): Promise<{ success: boolean; message?: string; data?: { rsvp: any }; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(
        `/calendar/event/${eventId}/rsvp`,
        data
      );
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'RSVP recorded successfully',
          data: response.data
            ? {
                rsvp: {
                  ...response.data.rsvp,
                  responseDate: response.data.rsvp.responseDate
                    ? new Date(response.data.rsvp.responseDate)
                    : undefined,
                },
              }
            : undefined,
        };
      }
      
      return { success: false, error: 'Failed to record RSVP' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record RSVP',
      };
    }
  }

  /**
   * GET /api/calendar/upcoming
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(userId: string): Promise<{ success: boolean; data?: { events: Event[]; total: number; dateRange: { start: string; end: string } }; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/calendar/upcoming?userId=${userId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            events: response.data.events.map((event: any) => ({
              ...event,
              startDate: new Date(event.startDate),
              endDate: new Date(event.endDate),
              targetAudience: Array.isArray(event.targetAudience)
                ? event.targetAudience
                : [event.targetAudience],
              userRSVP: event.userRSVP
                ? {
                    ...event.userRSVP,
                    responseDate: event.userRSVP.responseDate
                      ? new Date(event.userRSVP.responseDate)
                      : undefined,
                  }
                : null,
            })),
            total: response.data.total || 0,
            dateRange: response.data.dateRange,
          },
        };
      }
      
      return { success: false, error: 'Failed to get upcoming events' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upcoming events',
      };
    }
  }

  // Utility methods
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  static formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  static getTimeUntilEvent(eventDate: Date): string {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Past';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}

export default new CalendarService();
