/**
 * Appointment Service
 * Handles all appointment-related API calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

export interface AppointmentRequest {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentSection: string;
  requestedDate: Date;
  requestedTime: string;
  duration: number; // minutes
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'completed' | 'cancelled';
  assignedTo: 'principal' | 'teacher' | 'counselor' | 'admin';
  assignedPersonId?: string;
  assignedPersonName?: string;
  approvedDate?: Date;
  approvedTime?: string;
  rejectionReason?: string;
  rescheduleReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreateAppointmentData {
  parentId: string;
  studentId: string;
  requestedDate: Date;
  requestedTime: string;
  duration: number;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: 'principal' | 'teacher' | 'counselor' | 'admin';
  assignedPersonId?: string;
}

export interface ProcessAppointmentData {
  action: 'approve' | 'reject' | 'reschedule';
  approvedDate?: Date;
  approvedTime?: string;
  rejectionReason?: string;
  rescheduleReason?: string;
  notes?: string;
}

export interface AvailabilitySlot {
  id: string;
  personId: string;
  personName: string;
  personType: 'principal' | 'teacher' | 'counselor' | 'admin';
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

class AppointmentService {
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

  // APPOINTMENT MANAGEMENT

  /**
   * Get all appointments
   */
  async getAllAppointments(): Promise<AppointmentRequest[]> {
    const response = await this.request('/appointments');
    return response.data.map((appointment: any) => ({
      ...appointment,
      requestedDate: new Date(appointment.requestedDate),
      approvedDate: appointment.approvedDate ? new Date(appointment.approvedDate) : undefined,
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.updatedAt),
      completedAt: appointment.completedAt ? new Date(appointment.completedAt) : undefined,
    }));
  }

  /**
   * Get appointments by status
   */
  async getAppointmentsByStatus(status: string): Promise<AppointmentRequest[]> {
    const response = await this.request(`/appointments/status/${status}`);
    return response.data.map((appointment: any) => ({
      ...appointment,
      requestedDate: new Date(appointment.requestedDate),
      approvedDate: appointment.approvedDate ? new Date(appointment.approvedDate) : undefined,
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.updatedAt),
      completedAt: appointment.completedAt ? new Date(appointment.completedAt) : undefined,
    }));
  }

  /**
   * Get appointments by priority
   */
  async getAppointmentsByPriority(priority: string): Promise<AppointmentRequest[]> {
    const response = await this.request(`/appointments/priority/${priority}`);
    return response.data.map((appointment: any) => ({
      ...appointment,
      requestedDate: new Date(appointment.requestedDate),
      approvedDate: appointment.approvedDate ? new Date(appointment.approvedDate) : undefined,
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.updatedAt),
      completedAt: appointment.completedAt ? new Date(appointment.completedAt) : undefined,
    }));
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<AppointmentRequest> {
    const response = await this.request(`/appointments/${appointmentId}`);
    return {
      ...response.data,
      requestedDate: new Date(response.data.requestedDate),
      approvedDate: response.data.approvedDate ? new Date(response.data.approvedDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
      completedAt: response.data.completedAt ? new Date(response.data.completedAt) : undefined,
    };
  }

  /**
   * Create new appointment request
   */
  async createAppointment(appointmentData: CreateAppointmentData): Promise<AppointmentRequest> {
    const response = await this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        ...appointmentData,
        requestedDate: appointmentData.requestedDate.toISOString(),
      }),
    });
    return {
      ...response.data,
      requestedDate: new Date(response.data.requestedDate),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Process appointment (approve/reject/reschedule)
   */
  async processAppointment(
    appointmentId: string,
    processData: ProcessAppointmentData
  ): Promise<AppointmentRequest> {
    const response = await this.request(`/appointments/${appointmentId}/process`, {
      method: 'PUT',
      body: JSON.stringify({
        ...processData,
        approvedDate: processData.approvedDate?.toISOString(),
      }),
    });
    return {
      ...response.data,
      requestedDate: new Date(response.data.requestedDate),
      approvedDate: response.data.approvedDate ? new Date(response.data.approvedDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
      completedAt: response.data.completedAt ? new Date(response.data.completedAt) : undefined,
    };
  }

  /**
   * Approve appointment
   */
  async approveAppointment(
    appointmentId: string,
    approvedDate: Date,
    approvedTime: string,
    notes?: string
  ): Promise<AppointmentRequest> {
    return this.processAppointment(appointmentId, {
      action: 'approve',
      approvedDate,
      approvedTime,
      notes,
    });
  }

  /**
   * Reject appointment
   */
  async rejectAppointment(
    appointmentId: string,
    rejectionReason: string,
    notes?: string
  ): Promise<AppointmentRequest> {
    return this.processAppointment(appointmentId, {
      action: 'reject',
      rejectionReason,
      notes,
    });
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDate: Date,
    newTime: string,
    rescheduleReason: string,
    notes?: string
  ): Promise<AppointmentRequest> {
    return this.processAppointment(appointmentId, {
      action: 'reschedule',
      approvedDate: newDate,
      approvedTime: newTime,
      rescheduleReason,
      notes,
    });
  }

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string, notes?: string): Promise<AppointmentRequest> {
    const response = await this.request(`/appointments/${appointmentId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
    return {
      ...response.data,
      requestedDate: new Date(response.data.requestedDate),
      approvedDate: response.data.approvedDate ? new Date(response.data.approvedDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
      completedAt: new Date(response.data.completedAt),
    };
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, reason: string): Promise<AppointmentRequest> {
    const response = await this.request(`/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    return {
      ...response.data,
      requestedDate: new Date(response.data.requestedDate),
      approvedDate: response.data.approvedDate ? new Date(response.data.approvedDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(appointmentId: string): Promise<void> {
    await this.request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
  }

  // BULK OPERATIONS

  /**
   * Bulk approve appointments
   */
  async bulkApproveAppointments(
    appointmentIds: string[],
    data: { approvedDate: Date; approvedTime: string; notes?: string }
  ): Promise<void> {
    await this.request('/appointments/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({
        appointmentIds,
        approvedDate: data.approvedDate.toISOString(),
        approvedTime: data.approvedTime,
        notes: data.notes,
      }),
    });
  }

  /**
   * Bulk reject appointments
   */
  async bulkRejectAppointments(
    appointmentIds: string[],
    rejectionReason: string
  ): Promise<void> {
    await this.request('/appointments/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({
        appointmentIds,
        rejectionReason,
      }),
    });
  }

  /**
   * Bulk reschedule appointments
   */
  async bulkRescheduleAppointments(
    appointmentIds: string[],
    data: { newDate: Date; newTime: string; rescheduleReason: string; notes?: string }
  ): Promise<void> {
    await this.request('/appointments/bulk-reschedule', {
      method: 'POST',
      body: JSON.stringify({
        appointmentIds,
        newDate: data.newDate.toISOString(),
        newTime: data.newTime,
        rescheduleReason: data.rescheduleReason,
        notes: data.notes,
      }),
    });
  }

  // AVAILABILITY MANAGEMENT

  /**
   * Get availability slots
   */
  async getAvailabilitySlots(
    personType: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilitySlot[]> {
    const response = await this.request(
      `/appointments/availability?personType=${personType}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
    );
    return response.data.map((slot: any) => ({
      ...slot,
      date: new Date(slot.date),
    }));
  }

  /**
   * Create availability slot
   */
  async createAvailabilitySlot(slotData: Omit<AvailabilitySlot, 'id'>): Promise<AvailabilitySlot> {
    const response = await this.request('/appointments/availability', {
      method: 'POST',
      body: JSON.stringify({
        ...slotData,
        date: slotData.date.toISOString(),
      }),
    });
    return {
      ...response.data,
      date: new Date(response.data.date),
    };
  }

  /**
   * Update availability slot
   */
  async updateAvailabilitySlot(
    slotId: string,
    updates: Partial<AvailabilitySlot>
  ): Promise<AvailabilitySlot> {
    const response = await this.request(`/appointments/availability/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updates,
        date: updates.date?.toISOString(),
      }),
    });
    return {
      ...response.data,
      date: new Date(response.data.date),
    };
  }

  /**
   * Delete availability slot
   */
  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    await this.request(`/appointments/availability/${slotId}`, {
      method: 'DELETE',
    });
  }

  // SEARCH AND FILTERS

  /**
   * Search appointments
   */
  async searchAppointments(query: string): Promise<AppointmentRequest[]> {
    const response = await this.request(`/appointments/search?q=${encodeURIComponent(query)}`);
    return response.data.map((appointment: any) => ({
      ...appointment,
      requestedDate: new Date(appointment.requestedDate),
      approvedDate: appointment.approvedDate ? new Date(appointment.approvedDate) : undefined,
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.updatedAt),
      completedAt: appointment.completedAt ? new Date(appointment.completedAt) : undefined,
    }));
  }

  /**
   * Get appointments by date range
   */
  async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentRequest[]> {
    const response = await this.request(
      `/appointments/date-range?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
    );
    return response.data.map((appointment: any) => ({
      ...appointment,
      requestedDate: new Date(appointment.requestedDate),
      approvedDate: appointment.approvedDate ? new Date(appointment.approvedDate) : undefined,
      createdAt: new Date(appointment.createdAt),
      updatedAt: new Date(appointment.updatedAt),
      completedAt: appointment.completedAt ? new Date(appointment.completedAt) : undefined,
    }));
  }

  // NOTIFICATIONS

  /**
   * Send appointment notification
   */
  async sendAppointmentNotification(
    appointmentId: string,
    message: string,
    channels: ('push' | 'email' | 'whatsapp')[]
  ): Promise<void> {
    await this.request(`/appointments/${appointmentId}/notify`, {
      method: 'POST',
      body: JSON.stringify({ message, channels }),
    });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    appointmentId: string,
    timing: number // minutes before appointment
  ): Promise<void> {
    await this.request(`/appointments/${appointmentId}/remind`, {
      method: 'POST',
      body: JSON.stringify({ timing }),
    });
  }

  // ANALYTICS

  /**
   * Get appointment analytics
   */
  async getAppointmentAnalytics(): Promise<any> {
    const response = await this.request('/appointments/analytics');
    return response.data;
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStatistics(): Promise<any> {
    const response = await this.request('/appointments/statistics');
    return response.data;
  }

  // UTILITY METHODS

  /**
   * Format date for display
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format time for display
   */
  static formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  /**
   * Get priority color
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#E74C3C';
      case 'high': return '#F39C12';
      case 'medium': return '#3498DB';
      case 'low': return '#2ECC71';
      default: return '#95A5A6';
    }
  }

  /**
   * Get status color
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'approved': return '#2ECC71';
      case 'rejected': return '#E74C3C';
      case 'rescheduled': return '#3498DB';
      case 'completed': return '#9B59B6';
      case 'cancelled': return '#95A5A6';
      default: return '#95A5A6';
    }
  }

  /**
   * Check if appointment is urgent
   */
  static isUrgent(appointment: AppointmentRequest): boolean {
    return appointment.priority === 'urgent' && appointment.status === 'pending';
  }

  /**
   * Check if appointment is overdue
   */
  static isOverdue(appointment: AppointmentRequest): boolean {
    if (appointment.status !== 'approved') return false;
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.approvedDate?.toISOString().split('T')[0]}T${appointment.approvedTime}`);
    return appointmentDateTime < now;
  }

  /**
   * Get time until appointment
   */
  static getTimeUntilAppointment(appointment: AppointmentRequest): string {
    if (!appointment.approvedDate || !appointment.approvedTime) return 'Not scheduled';
    
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.approvedDate.toISOString().split('T')[0]}T${appointment.approvedTime}`);
    const diff = appointmentDateTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  /**
   * Validate appointment data
   */
  static validateAppointmentData(appointmentData: CreateAppointmentData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!appointmentData.parentId || appointmentData.parentId.trim().length === 0) {
      errors.push('Parent ID is required');
    }

    if (!appointmentData.studentId || appointmentData.studentId.trim().length === 0) {
      errors.push('Student ID is required');
    }

    if (!appointmentData.requestedDate) {
      errors.push('Requested date is required');
    } else if (appointmentData.requestedDate < new Date()) {
      errors.push('Requested date cannot be in the past');
    }

    if (!appointmentData.requestedTime || appointmentData.requestedTime.trim().length === 0) {
      errors.push('Requested time is required');
    }

    if (!appointmentData.duration || appointmentData.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (!appointmentData.reason || appointmentData.reason.trim().length === 0) {
      errors.push('Reason is required');
    }

    if (!appointmentData.assignedTo) {
      errors.push('Assigned to is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new AppointmentService();