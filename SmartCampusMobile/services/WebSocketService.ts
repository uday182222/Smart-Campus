/**
 * WebSocket Service
 * Real-time updates for service results
 */

import { io, Socket } from 'socket.io-client';
import { ServiceResult } from './ServiceResultsAPI';

const WS_URL = __DEV__
  ? 'http://localhost:5000'
  : 'https://your-production-api.com';

export interface WebSocketEvents {
  service_result_saved: (result: ServiceResult) => void;
  result_attached: (data: { resultId: string; messageId: string }) => void;
  ai_referenced_result: (data: { resultId: string; messageId: string }) => void;
  result_deleted: (resultId: string) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private listeners: Map<keyof WebSocketEvents, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, token: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;

    this.socket = io(WS_URL, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });

    // Custom events
    this.socket.on('service_result_saved', (result: ServiceResult) => {
      this.emit('service_result_saved', result);
    });

    this.socket.on('result_attached', (data: { resultId: string; messageId: string }) => {
      this.emit('result_attached', data);
    });

    this.socket.on('ai_referenced_result', (data: { resultId: string; messageId: string }) => {
      this.emit('ai_referenced_result', data);
    });

    this.socket.on('result_deleted', (resultId: string) => {
      this.emit('result_deleted', resultId);
    });
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit<K extends keyof WebSocketEvents>(
    event: K,
    ...args: Parameters<WebSocketEvents[K]>
  ) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }
  }

  /**
   * Send a message to the server
   */
  send(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Message not sent.');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }
}

export default new WebSocketService();

