export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  category: EventCategory;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  organizerId: string;
  organizerName: string;
  attendees: EventAttendee[];
  visibility: EventVisibility;
  status: EventStatus;
  recurring?: RecurringEvent;
  reminders: EventReminder[];
  attachments: EventAttachment[];
  tags: string[];
  schoolId: string;
  classId?: string;
  subjectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendee {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'pending';
  responseDate?: Date;
  notes?: string;
}

export interface RecurringEvent {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
  exceptions: Date[];
}

export interface EventReminder {
  id: string;
  type: ReminderType;
  timeBefore: number; // minutes
  sent: boolean;
  sentAt?: Date;
}

export interface EventAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  isPublic: boolean;
  ownerId: string;
  ownerRole: string;
  permissions: CalendarPermission[];
  events: CalendarEvent[];
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarPermission {
  userId: string;
  userName: string;
  permission: 'read' | 'write' | 'admin';
  grantedBy: string;
  grantedAt: Date;
}

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  type: EventType;
  category: EventCategory;
  defaultDuration: number; // minutes
  defaultLocation?: string;
  defaultReminders: EventReminder[];
  defaultAttendees: string[]; // role-based
  isActive: boolean;
  createdBy: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventConflict {
  eventId: string;
  conflictType: 'time' | 'location' | 'attendee';
  conflictingEventId: string;
  severity: 'warning' | 'error';
  description: string;
}

export type EventType = 
  | 'class' 
  | 'exam' 
  | 'meeting' 
  | 'event' 
  | 'holiday' 
  | 'assignment_due' 
  | 'parent_conference' 
  | 'sports' 
  | 'cultural' 
  | 'field_trip' 
  | 'maintenance' 
  | 'other';

export type EventCategory = 
  | 'academic' 
  | 'administrative' 
  | 'sports' 
  | 'cultural' 
  | 'social' 
  | 'maintenance' 
  | 'holiday' 
  | 'emergency' 
  | 'other';

export type EventVisibility = 'public' | 'private' | 'school_only' | 'class_only';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ReminderType = 'push' | 'email' | 'sms' | 'popup';

export interface CalendarFilters {
  dateFrom?: Date;
  dateTo?: Date;
  type?: EventType;
  category?: EventCategory;
  organizerId?: string;
  attendeeId?: string;
  classId?: string;
  subjectId?: string;
  status?: EventStatus;
  visibility?: EventVisibility;
}

export interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  overdueEvents: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  attendanceRate: number;
  eventTypes: { type: EventType; count: number }[];
  popularTimes: { hour: number; count: number }[];
}

export interface EventBooking {
  id: string;
  eventId: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'room' | 'equipment' | 'vehicle' | 'other';
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}
