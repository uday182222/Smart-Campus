export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  relatedEntityTitle?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: NotificationMetadata;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationMetadata {
  schoolId?: string;
  classId?: string;
  studentId?: string;
  subjectId?: string;
  customData?: Record<string, any>;
}

export type NotificationType = 
  | 'general' 
  | 'attendance' 
  | 'homework' 
  | 'fee' 
  | 'transport' 
  | 'academic' 
  | 'behavior' 
  | 'achievement' 
  | 'emergency' 
  | 'announcement' 
  | 'reminder' 
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
export type RelatedEntityType = 'student' | 'class' | 'homework' | 'fee' | 'transport' | 'announcement' | 'event';

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  urgentCount: number;
  todayCount: number;
  deliveryRate: number;
  responseRate: number;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  senderId?: string;
  recipientId?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
