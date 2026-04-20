/**
 * Service Results API Client
 * Connects to the backend API for managing service results
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

export enum ServiceType {
  PALM = 'PALM',
  ASTROLOGY = 'ASTROLOGY',
  VASTU = 'VASTU',
  NUMEROLOGY = 'NUMEROLOGY',
  TAROT = 'TAROT',
}

export interface ServiceResult {
  id: string;
  userId: string;
  conversationId?: string;
  serviceType: ServiceType;
  resultData: any;
  summary: string;
  attachmentPosition?: number;
  createdAt: Date;
  lastReferencedAt?: Date;
}

export interface SearchResult extends ServiceResult {
  relevanceScore: number;
}

export interface ContextResult {
  context: string;
  relevantResults: SearchResult[];
}

class ServiceResultsAPI {
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

  /**
   * Save a new service result
   */
  async saveResult(data: {
    serviceType: ServiceType;
    resultData: any;
    conversationId?: string;
    attachmentPosition?: number;
  }): Promise<ServiceResult> {
    const response = await this.request('/service-results/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
    };
  }

  /**
   * Get all results for current user
   */
  async getUserResults(options?: {
    serviceType?: ServiceType;
    limit?: number;
    offset?: number;
  }): Promise<ServiceResult[]> {
    const userId = await this.getUserId();
    const params = new URLSearchParams();
    
    if (options?.serviceType) params.append('serviceType', options.serviceType);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const endpoint = `/service-results/user/${userId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request(endpoint);
    
    return response.data.map((result: any) => ({
      ...result,
      createdAt: new Date(result.createdAt),
      lastReferencedAt: result.lastReferencedAt ? new Date(result.lastReferencedAt) : undefined,
    }));
  }

  /**
   * Get a specific result by ID
   */
  async getResult(resultId: string): Promise<ServiceResult> {
    const response = await this.request(`/service-results/${resultId}`);
    
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      lastReferencedAt: response.data.lastReferencedAt 
        ? new Date(response.data.lastReferencedAt) 
        : undefined,
    };
  }

  /**
   * Get all results for a conversation
   */
  async getConversationResults(conversationId: string): Promise<ServiceResult[]> {
    const response = await this.request(
      `/service-results/conversation/${conversationId}`
    );
    
    return response.data.map((result: any) => ({
      ...result,
      createdAt: new Date(result.createdAt),
    }));
  }

  /**
   * Delete a result
   */
  async deleteResult(resultId: string): Promise<void> {
    await this.request(`/service-results/${resultId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search for relevant results using semantic search
   */
  async searchResults(query: string, limit: number = 3): Promise<SearchResult[]> {
    const response = await this.request('/service-results/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });

    return response.data.map((result: any) => ({
      ...result,
      createdAt: new Date(result.createdAt),
      lastReferencedAt: result.lastReferencedAt 
        ? new Date(result.lastReferencedAt) 
        : undefined,
    }));
  }

  /**
   * Build enhanced AI context with relevant results
   */
  async buildContext(
    message: string,
    conversationId?: string
  ): Promise<ContextResult> {
    const response = await this.request('/service-results/context', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });

    return {
      context: response.data.context,
      relevantResults: response.data.relevantResults.map((result: any) => ({
        ...result,
        createdAt: new Date(result.createdAt),
      })),
    };
  }

  /**
   * Attach a result to a message
   */
  async attachToMessage(resultId: string, messageId: string): Promise<void> {
    await this.request(`/service-results/${resultId}/attach`, {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    });
  }

  /**
   * Get current user ID from storage
   */
  private async getUserId(): Promise<string> {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return userId;
  }

  /**
   * Format time ago string
   */
  static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return date.toLocaleDateString();
  }

  /**
   * Get service type icon/emoji
   */
  static getServiceIcon(serviceType: ServiceType): string {
    const icons = {
      [ServiceType.PALM]: '🤚',
      [ServiceType.ASTROLOGY]: '⭐',
      [ServiceType.VASTU]: '🏠',
      [ServiceType.NUMEROLOGY]: '🔢',
      [ServiceType.TAROT]: '🃏',
    };
    return icons[serviceType] || '📄';
  }

  /**
   * Get service type color
   */
  static getServiceColor(serviceType: ServiceType): string {
    const colors = {
      [ServiceType.PALM]: '#FF6B6B',
      [ServiceType.ASTROLOGY]: '#4ECDC4',
      [ServiceType.VASTU]: '#45B7D1',
      [ServiceType.NUMEROLOGY]: '#FFA07A',
      [ServiceType.TAROT]: '#9B59B6',
    };
    return colors[serviceType] || '#95A5A6';
  }

  /**
   * Get service type name
   */
  static getServiceName(serviceType: ServiceType): string {
    const names = {
      [ServiceType.PALM]: 'Palm Reading',
      [ServiceType.ASTROLOGY]: 'Astrology',
      [ServiceType.VASTU]: 'Vastu',
      [ServiceType.NUMEROLOGY]: 'Numerology',
      [ServiceType.TAROT]: 'Tarot',
    };
    return names[serviceType] || serviceType;
  }
}

export { ServiceResultsAPI };
export default new ServiceResultsAPI();

