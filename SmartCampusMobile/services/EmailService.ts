/**
 * Email Service
 * AWS SES integration for sending transactional and marketing emails
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

export interface EmailMessage {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateData?: Record<string, any>;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  bouncedAt?: Date;
  failureReason?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
  size: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'transactional' | 'marketing' | 'system';
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface BounceInfo {
  email: string;
  bounceType: 'hard' | 'soft' | 'complaint';
  timestamp: Date;
  reason: string;
}

class EmailService {
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

  // EMAIL SENDING

  /**
   * Send simple email
   */
  async sendEmail(
    to: string[],
    subject: string,
    body: string,
    isHtml: boolean = true,
    attachments?: EmailAttachment[]
  ): Promise<EmailMessage> {
    const response = await this.request('/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to,
        subject,
        body,
        isHtml,
        attachments,
      }),
    });

    return {
      ...response.data,
      sentAt: response.data.sentAt ? new Date(response.data.sentAt) : undefined,
      deliveredAt: response.data.deliveredAt ? new Date(response.data.deliveredAt) : undefined,
      bouncedAt: response.data.bouncedAt ? new Date(response.data.bouncedAt) : undefined,
    };
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(
    to: string[],
    templateId: string,
    templateData: Record<string, any>,
    attachments?: EmailAttachment[]
  ): Promise<EmailMessage> {
    const response = await this.request('/email/send-template', {
      method: 'POST',
      body: JSON.stringify({
        to,
        templateId,
        templateData,
        attachments,
      }),
    });

    return {
      ...response.data,
      sentAt: response.data.sentAt ? new Date(response.data.sentAt) : undefined,
      deliveredAt: response.data.deliveredAt ? new Date(response.data.deliveredAt) : undefined,
      bouncedAt: response.data.bouncedAt ? new Date(response.data.bouncedAt) : undefined,
    };
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    emails: Array<{
      to: string[];
      subject: string;
      body: string;
      isHtml?: boolean;
    }>
  ): Promise<EmailMessage[]> {
    const response = await this.request('/email/send-bulk', {
      method: 'POST',
      body: JSON.stringify({ emails }),
    });

    return response.data.map((email: any) => ({
      ...email,
      sentAt: email.sentAt ? new Date(email.sentAt) : undefined,
      deliveredAt: email.deliveredAt ? new Date(email.deliveredAt) : undefined,
      bouncedAt: email.bouncedAt ? new Date(email.bouncedAt) : undefined,
    }));
  }

  // TEMPLATES

  /**
   * Get all email templates
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    const response = await this.request('/email/templates');
    return response.data.map((template: any) => ({
      ...template,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt),
    }));
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<EmailTemplate> {
    const response = await this.request(`/email/templates/${templateId}`);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Preview template with data
   */
  async previewTemplate(
    templateId: string,
    templateData: Record<string, any>
  ): Promise<{ subject: string; htmlBody: string; textBody: string }> {
    const response = await this.request(`/email/templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify({ templateData }),
    });
    return response.data;
  }

  // COMMON EMAIL TEMPLATES

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    name: string,
    role: string,
    credentials: { username: string; tempPassword: string }
  ): Promise<EmailMessage> {
    return this.sendTemplateEmail(
      [email],
      'welcome_email',
      {
        name,
        role,
        username: credentials.username,
        temp_password: credentials.tempPassword,
        login_url: 'https://smartcampus.com/login',
      }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<EmailMessage> {
    return this.sendTemplateEmail(
      [email],
      'password_reset',
      {
        reset_url: `https://smartcampus.com/reset-password?token=${resetToken}`,
        expiry_hours: 24,
      }
    );
  }

  /**
   * Send fee reminder email
   */
  async sendFeeReminderEmail(
    email: string,
    parentName: string,
    studentName: string,
    amount: number,
    dueDate: string
  ): Promise<EmailMessage> {
    return this.sendTemplateEmail(
      [email],
      'fee_reminder',
      {
        parent_name: parentName,
        student_name: studentName,
        amount: amount.toFixed(2),
        due_date: dueDate,
        payment_url: 'https://smartcampus.com/pay',
      }
    );
  }

  /**
   * Send homework notification email
   */
  async sendHomeworkNotificationEmail(
    email: string,
    parentName: string,
    studentName: string,
    subject: string,
    title: string,
    dueDate: string
  ): Promise<EmailMessage> {
    return this.sendTemplateEmail(
      [email],
      'homework_notification',
      {
        parent_name: parentName,
        student_name: studentName,
        subject,
        homework_title: title,
        due_date: dueDate,
      }
    );
  }

  /**
   * Send exam report email
   */
  async sendExamReportEmail(
    email: string,
    parentName: string,
    studentName: string,
    examName: string,
    reportUrl: string
  ): Promise<EmailMessage> {
    return this.sendTemplateEmail(
      [email],
      'exam_report',
      {
        parent_name: parentName,
        student_name: studentName,
        exam_name: examName,
        report_url: reportUrl,
      }
    );
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmationEmail(
    email: string,
    parentName: string,
    date: string,
    time: string,
    person: string,
    location: string
  ): Promise<EmailMessage> {
    return this.sendTemplateEmail(
      [email],
      'appointment_confirmation',
      {
        parent_name: parentName,
        date,
        time,
        person,
        location,
        calendar_link: 'https://smartcampus.com/calendar',
      }
    );
  }

  // STATUS TRACKING

  /**
   * Get email status
   */
  async getEmailStatus(emailId: string): Promise<EmailMessage> {
    const response = await this.request(`/email/${emailId}/status`);
    return {
      ...response.data,
      sentAt: response.data.sentAt ? new Date(response.data.sentAt) : undefined,
      deliveredAt: response.data.deliveredAt ? new Date(response.data.deliveredAt) : undefined,
      bouncedAt: response.data.bouncedAt ? new Date(response.data.bouncedAt) : undefined,
    };
  }

  /**
   * Get bounce list
   */
  async getBounceList(): Promise<BounceInfo[]> {
    const response = await this.request('/email/bounces');
    return response.data.map((bounce: any) => ({
      ...bounce,
      timestamp: new Date(bounce.timestamp),
    }));
  }

  /**
   * Get email statistics
   */
  async getEmailStatistics(): Promise<any> {
    const response = await this.request('/email/statistics');
    return response.data;
  }

  // UTILITY METHODS

  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate email list
   */
  static validateEmailList(emails: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    emails.forEach(email => {
      if (this.validateEmail(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    });

    return { valid, invalid };
  }

  /**
   * Format email template
   */
  static formatTemplate(template: string, data: Record<string, any>): string {
    let formatted = template;
    Object.entries(data).forEach(([key, value]) => {
      formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value?.toString() || '');
    });
    return formatted;
  }

  /**
   * Create text version from HTML
   */
  static htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}

export default new EmailService();



