/**
 * WhatsApp Service
 * WhatsApp Business API integration with templates and rate limiting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

export interface WhatsAppMessage {
  id: string;
  to: string; // Phone number in E.164 format
  templateName: string;
  parameters: Record<string, string>;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
}

export interface WhatsAppTemplate {
  name: string;
  category: 'fee' | 'announcement' | 'emergency' | 'appointment' | 'homework' | 'transport';
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  parameters: string[];
  content: string;
}

export interface OptInStatus {
  userId: string;
  phone: string;
  optedIn: boolean;
  optInDate?: Date;
  optOutDate?: Date;
  consentHistory: ConsentRecord[];
}

export interface ConsentRecord {
  action: 'opt_in' | 'opt_out';
  timestamp: Date;
  source: 'app' | 'web' | 'manual';
}

class WhatsAppService {
  private baseURL: string;
  private token: string | null = null;
  private messageQueue: WhatsAppMessage[] = [];
  private rateLimitWindow = 1000; // 1 second
  private maxMessagesPerWindow = 80; // WhatsApp limit
  private messagesSentInWindow = 0;
  private windowStartTime = Date.now();

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

  /**
   * Check rate limit
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset window if expired
    if (now - this.windowStartTime >= this.rateLimitWindow) {
      this.messagesSentInWindow = 0;
      this.windowStartTime = now;
    }

    // Wait if rate limit exceeded
    if (this.messagesSentInWindow >= this.maxMessagesPerWindow) {
      const waitTime = this.rateLimitWindow - (now - this.windowStartTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Reset after waiting
      this.messagesSentInWindow = 0;
      this.windowStartTime = Date.now();
    }

    this.messagesSentInWindow++;
  }

  // MESSAGE SENDING

  /**
   * Send WhatsApp message using template
   */
  async sendMessage(
    to: string,
    templateName: string,
    parameters: Record<string, string>
  ): Promise<WhatsAppMessage> {
    // Check opt-in status
    const optInStatus = await this.getOptInStatus(to);
    if (!optInStatus.optedIn) {
      throw new Error('User has not opted in to WhatsApp messages');
    }

    // Check rate limit
    await this.checkRateLimit();

    // Send message
    const response = await this.request('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({
        to,
        templateName,
        parameters,
      }),
    });

    return {
      ...response.data,
      sentAt: response.data.sentAt ? new Date(response.data.sentAt) : undefined,
      deliveredAt: response.data.deliveredAt ? new Date(response.data.deliveredAt) : undefined,
      readAt: response.data.readAt ? new Date(response.data.readAt) : undefined,
    };
  }

  /**
   * Send bulk messages with queuing
   */
  async sendBulkMessages(
    messages: Array<{ to: string; templateName: string; parameters: Record<string, string> }>
  ): Promise<WhatsAppMessage[]> {
    const results: WhatsAppMessage[] = [];

    for (const message of messages) {
      try {
        const result = await this.sendMessage(
          message.to,
          message.templateName,
          message.parameters
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to send message to ${message.to}:`, error);
        results.push({
          id: '',
          to: message.to,
          templateName: message.templateName,
          parameters: message.parameters,
          status: 'failed',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  // TEMPLATES

  /**
   * Get all WhatsApp templates
   */
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    const response = await this.request('/whatsapp/templates');
    return response.data;
  }

  /**
   * Send fee reminder
   */
  async sendFeeReminder(
    phone: string,
    studentName: string,
    amount: string,
    dueDate: string
  ): Promise<WhatsAppMessage> {
    return this.sendMessage(phone, 'fee_reminder', {
      student_name: studentName,
      amount,
      due_date: dueDate,
    });
  }

  /**
   * Send announcement
   */
  async sendAnnouncement(
    phone: string,
    title: string,
    message: string
  ): Promise<WhatsAppMessage> {
    return this.sendMessage(phone, 'announcement', {
      title,
      message,
    });
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(
    phone: string,
    message: string
  ): Promise<WhatsAppMessage> {
    return this.sendMessage(phone, 'emergency_alert', {
      message,
    });
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(
    phone: string,
    parentName: string,
    date: string,
    time: string,
    person: string
  ): Promise<WhatsAppMessage> {
    return this.sendMessage(phone, 'appointment_confirmation', {
      parent_name: parentName,
      date,
      time,
      person,
    });
  }

  /**
   * Send homework reminder
   */
  async sendHomeworkReminder(
    phone: string,
    studentName: string,
    subject: string,
    title: string,
    dueDate: string
  ): Promise<WhatsAppMessage> {
    return this.sendMessage(phone, 'homework_reminder', {
      student_name: studentName,
      subject,
      title,
      due_date: dueDate,
    });
  }

  /**
   * Send transport update
   */
  async sendTransportUpdate(
    phone: string,
    studentName: string,
    message: string,
    eta?: string
  ): Promise<WhatsAppMessage> {
    return this.sendMessage(phone, 'transport_update', {
      student_name: studentName,
      message,
      eta: eta || 'N/A',
    });
  }

  // OPT-IN/OPT-OUT MANAGEMENT

  /**
   * Get opt-in status
   */
  async getOptInStatus(phone: string): Promise<OptInStatus> {
    const response = await this.request(`/whatsapp/opt-in/${phone}`);
    return {
      ...response.data,
      optInDate: response.data.optInDate ? new Date(response.data.optInDate) : undefined,
      optOutDate: response.data.optOutDate ? new Date(response.data.optOutDate) : undefined,
      consentHistory: response.data.consentHistory?.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      })) || [],
    };
  }

  /**
   * Opt in to WhatsApp messages
   */
  async optIn(userId: string, phone: string): Promise<void> {
    await this.request('/whatsapp/opt-in', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        phone,
        source: 'app',
      }),
    });
  }

  /**
   * Opt out of WhatsApp messages
   */
  async optOut(userId: string, phone: string): Promise<void> {
    await this.request('/whatsapp/opt-out', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        phone,
        source: 'app',
      }),
    });
  }

  /**
   * Get consent history
   */
  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    const response = await this.request(`/whatsapp/consent-history/${userId}`);
    return response.data.map((record: any) => ({
      ...record,
      timestamp: new Date(record.timestamp),
    }));
  }

  // MESSAGE STATUS TRACKING

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<WhatsAppMessage> {
    const response = await this.request(`/whatsapp/messages/${messageId}/status`);
    return {
      ...response.data,
      sentAt: response.data.sentAt ? new Date(response.data.sentAt) : undefined,
      deliveredAt: response.data.deliveredAt ? new Date(response.data.deliveredAt) : undefined,
      readAt: response.data.readAt ? new Date(response.data.readAt) : undefined,
    };
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(templateName?: string): Promise<any> {
    const endpoint = templateName 
      ? `/whatsapp/stats?template=${templateName}`
      : '/whatsapp/stats';
    const response = await this.request(endpoint);
    return response.data;
  }

  // UTILITY METHODS

  /**
   * Format phone number to E.164
   */
  static formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (!digits.startsWith(countryCode.replace('+', ''))) {
      return `${countryCode}${digits}`;
    }
    
    return `+${digits}`;
  }

  /**
   * Validate phone number
   */
  static isValidPhoneNumber(phone: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Format template with parameters
   */
  static formatTemplate(template: string, parameters: Record<string, string>): string {
    let formatted = template;
    Object.entries(parameters).forEach(([key, value]) => {
      formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return formatted;
  }
}

export default new WhatsAppService();



