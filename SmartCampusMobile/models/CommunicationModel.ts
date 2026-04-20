export interface Communication {
  id: string;
  fromId: string;
  fromName: string;
  fromRole: string;
  toId: string;
  toName: string;
  toRole: string;
  subject: string;
  message: string;
  type: CommunicationType;
  priority: CommunicationPriority;
  status: CommunicationStatus;
  attachments?: CommunicationAttachment[];
  responses?: CommunicationResponse[];
  studentId?: string;
  studentName?: string;
  classId?: string;
  className?: string;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  repliedAt?: Date;
}

export interface CommunicationResponse {
  id: string;
  communicationId: string;
  fromId: string;
  fromName: string;
  fromRole: string;
  message: string;
  attachments?: CommunicationAttachment[];
  createdAt: Date;
}

export interface CommunicationAttachment {
  id: string;
  name: string;
  url: string;
  type: AttachmentType;
  size: number;
  uploadedAt: Date;
}

export type CommunicationType = 
  | 'general' 
  | 'attendance' 
  | 'homework' 
  | 'behavior' 
  | 'academic' 
  | 'health' 
  | 'transport' 
  | 'fee' 
  | 'emergency' 
  | 'announcement';

export type CommunicationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CommunicationStatus = 'sent' | 'delivered' | 'read' | 'replied' | 'archived';
export type AttachmentType = 'image' | 'document' | 'audio' | 'video';

export interface CommunicationStats {
  totalMessages: number;
  unreadMessages: number;
  urgentMessages: number;
  responseRate: number;
  averageResponseTime: number; // in hours
}

export interface CommunicationFilters {
  type?: CommunicationType;
  priority?: CommunicationPriority;
  status?: CommunicationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  studentId?: string;
  classId?: string;
}
