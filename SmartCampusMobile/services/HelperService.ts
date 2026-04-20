/**
 * Helper Service
 * Handles all bus helper operations including real-time tracking,
 * stop marking, and student boarding with WebSocket support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

const WS_URL = __DEV__
  ? 'ws://localhost:5000/ws'
  : 'wss://your-production-api.com/ws';

export interface HelperLoginResponse {
  helperId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  token: string;
  assignedRouteId: string;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface StopMarking {
  latitude: number;
  longitude: number;
  timestamp: Date;
  helperId: string;
}

export interface StudentBoardingUpdate {
  status: 'boarded' | 'absent';
  boardingTime: Date;
  notes?: string;
  helperId: string;
}

export interface ETAData {
  stopId: string;
  estimatedArrival: Date;
  distanceRemaining: number; // in meters
  trafficDelay: number; // in minutes
  confidence: number; // percentage
}

class HelperService {
  private baseURL: string;
  private wsURL: string;
  private token: string | null = null;
  private ws: WebSocket | null = null;
  private locationHistory: LocationUpdate[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private locationUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.wsURL = WS_URL;
    this.loadToken();
  }

  /**
   * Load JWT token from storage
   */
  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('helperToken');
    } catch (error) {
      console.error('Error loading helper token:', error);
    }
  }

  /**
   * Set authentication token
   */
  public async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('helperToken', token);
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

  // AUTHENTICATION

  /**
   * Helper login with Cognito
   */
  async login(email: string, password: string): Promise<HelperLoginResponse> {
    const response = await this.request('/auth/helper/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await this.setToken(response.data.token);
    return response.data;
  }

  /**
   * Logout helper
   */
  async logout(): Promise<void> {
    await this.request('/auth/helper/logout', {
      method: 'POST',
    });

    // Clear local data
    await AsyncStorage.multiRemove(['helperToken', 'helperData', 'helperOfflineData']);
    
    // Close WebSocket
    this.disconnectWebSocket();
    
    // Stop location tracking
    this.stopLocationTracking();
  }

  // ROUTE MANAGEMENT

  /**
   * Get assigned route
   */
  async getAssignedRoute(helperId: string): Promise<any> {
    const response = await this.request(`/helper/${helperId}/route`);
    return response.data;
  }

  /**
   * Get today's schedule
   */
  async getTodaySchedule(routeId: string): Promise<any> {
    const response = await this.request(`/helper/routes/${routeId}/today`);
    return response.data;
  }

  /**
   * Start route
   */
  async startRoute(routeId: string, helperId: string): Promise<void> {
    await this.request(`/helper/routes/${routeId}/start`, {
      method: 'POST',
      body: JSON.stringify({ helperId, startTime: new Date().toISOString() }),
    });
  }

  /**
   * Complete route
   */
  async completeRoute(routeId: string): Promise<void> {
    await this.request(`/helper/routes/${routeId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completionTime: new Date().toISOString() }),
    });
  }

  // STOP MANAGEMENT

  /**
   * Mark stop as reached
   */
  async markStopReached(
    routeId: string,
    stopId: string,
    marking: StopMarking
  ): Promise<void> {
    const response = await this.request(`/helper/routes/${routeId}/stops/${stopId}/mark`, {
      method: 'POST',
      body: JSON.stringify(marking),
    });

    // Broadcast to WebSocket for real-time updates
    this.broadcastStopUpdate(routeId, stopId, 'reached', marking);

    return response.data;
  }

  /**
   * Undo stop marking (within 5 minutes)
   */
  async undoStopMarking(routeId: string, stopId: string): Promise<void> {
    await this.request(`/helper/routes/${routeId}/stops/${stopId}/undo`, {
      method: 'POST',
    });

    // Broadcast undo to WebSocket
    this.broadcastStopUpdate(routeId, stopId, 'pending', null);
  }

  /**
   * Complete stop
   */
  async completeStop(routeId: string, stopId: string): Promise<void> {
    await this.request(`/helper/routes/${routeId}/stops/${stopId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completionTime: new Date().toISOString() }),
    });

    // Broadcast completion to WebSocket
    this.broadcastStopUpdate(routeId, stopId, 'completed', null);
  }

  // STUDENT BOARDING

  /**
   * Update student boarding status
   */
  async updateStudentBoarding(
    routeId: string,
    stopId: string,
    studentId: string,
    update: StudentBoardingUpdate
  ): Promise<void> {
    const response = await this.request(
      `/helper/routes/${routeId}/stops/${stopId}/students/${studentId}/board`,
      {
        method: 'POST',
        body: JSON.stringify(update),
      }
    );

    // Broadcast to WebSocket
    this.broadcastStudentBoardingUpdate(routeId, stopId, studentId, update.status);

    return response.data;
  }

  /**
   * Notify parent of student boarding
   */
  async notifyParentBoarding(
    studentId: string,
    status: 'boarded' | 'absent',
    stopName: string
  ): Promise<void> {
    await this.request(`/helper/students/${studentId}/notify-boarding`, {
      method: 'POST',
      body: JSON.stringify({ status, stopName, timestamp: new Date().toISOString() }),
    });
  }

  // LOCATION TRACKING

  /**
   * Update helper location
   */
  async updateLocation(
    helperId: string,
    routeId: string,
    location: LocationUpdate
  ): Promise<void> {
    // Store in history
    this.locationHistory.push(location);
    
    // Keep only last 100 locations
    if (this.locationHistory.length > 100) {
      this.locationHistory.shift();
    }

    // Send to server
    try {
      await this.request(`/helper/${helperId}/location`, {
        method: 'POST',
        body: JSON.stringify({
          routeId,
          ...location,
          timestamp: location.timestamp.toISOString(),
        }),
      });

      // Broadcast via WebSocket
      this.broadcastLocationUpdate(routeId, location);
    } catch (error) {
      console.error('Error updating location:', error);
      // Store offline for later sync
      await this.storeOfflineLocation(helperId, routeId, location);
    }
  }

  /**
   * Store location update for offline sync
   */
  private async storeOfflineLocation(
    helperId: string,
    routeId: string,
    location: LocationUpdate
  ): Promise<void> {
    try {
      const offlineKey = `offline_locations_${helperId}_${routeId}`;
      const existing = await AsyncStorage.getItem(offlineKey);
      const locations = existing ? JSON.parse(existing) : [];
      
      locations.push({
        ...location,
        timestamp: location.timestamp.toISOString(),
      });

      await AsyncStorage.setItem(offlineKey, JSON.stringify(locations));
    } catch (error) {
      console.error('Error storing offline location:', error);
    }
  }

  /**
   * Sync offline locations when back online
   */
  async syncOfflineLocations(helperId: string, routeId: string): Promise<void> {
    try {
      const offlineKey = `offline_locations_${helperId}_${routeId}`;
      const existing = await AsyncStorage.getItem(offlineKey);
      
      if (existing) {
        const locations = JSON.parse(existing);
        
        for (const location of locations) {
          await this.updateLocation(helperId, routeId, {
            ...location,
            timestamp: new Date(location.timestamp),
          });
        }

        // Clear offline data after successful sync
        await AsyncStorage.removeItem(offlineKey);
      }
    } catch (error) {
      console.error('Error syncing offline locations:', error);
    }
  }

  /**
   * Get location history
   */
  getLocationHistory(): LocationUpdate[] {
    return this.locationHistory;
  }

  /**
   * Start automatic location tracking
   */
  startLocationTracking(helperId: string, routeId: string, intervalSeconds: number = 30): void {
    if (this.locationUpdateInterval) {
      this.stopLocationTracking();
    }

    this.locationUpdateInterval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        await this.updateLocation(helperId, routeId, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date(location.timestamp),
          accuracy: location.coords.accuracy || undefined,
          speed: location.coords.speed || undefined,
          heading: location.coords.heading || undefined,
        });
      } catch (error) {
        console.error('Error in location tracking:', error);
      }
    }, intervalSeconds * 1000);
  }

  /**
   * Stop automatic location tracking
   */
  stopLocationTracking(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  // ETA CALCULATION

  /**
   * Calculate ETA for remaining stops
   */
  async calculateETAs(
    routeId: string,
    currentLocation: LocationUpdate
  ): Promise<ETAData[]> {
    const response = await this.request(`/helper/routes/${routeId}/eta`, {
      method: 'POST',
      body: JSON.stringify({
        currentLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        timestamp: currentLocation.timestamp.toISOString(),
      }),
    });

    return response.data.map((eta: any) => ({
      ...eta,
      estimatedArrival: new Date(eta.estimatedArrival),
    }));
  }

  /**
   * Get ETA for specific stop
   */
  async getStopETA(
    routeId: string,
    stopId: string,
    currentLocation: LocationUpdate
  ): Promise<ETAData> {
    const response = await this.request(`/helper/routes/${routeId}/stops/${stopId}/eta`, {
      method: 'POST',
      body: JSON.stringify({
        currentLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        timestamp: currentLocation.timestamp.toISOString(),
      }),
    });

    return {
      ...response.data,
      estimatedArrival: new Date(response.data.estimatedArrival),
    };
  }

  // WEBSOCKET REAL-TIME UPDATES

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(routeId: string): void {
    if (this.ws) {
      this.disconnectWebSocket();
    }

    try {
      this.ws = new WebSocket(`${this.wsURL}?token=${this.token}&route=${routeId}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to route updates
        this.sendWebSocketMessage({
          type: 'subscribe',
          channel: `route:${routeId}`,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.attemptReconnect(routeId);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(routeId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket(routeId);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Send message via WebSocket
   */
  private sendWebSocketMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'stop_update':
        // Handle stop status update from other sources
        console.log('Stop update received:', data);
        break;
      case 'student_boarding':
        // Handle student boarding update
        console.log('Student boarding update:', data);
        break;
      case 'eta_update':
        // Handle ETA update
        console.log('ETA update received:', data);
        break;
      case 'parent_notification':
        // Confirmation that parent was notified
        console.log('Parent notified:', data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  /**
   * Broadcast location update via WebSocket
   */
  private broadcastLocationUpdate(routeId: string, location: LocationUpdate): void {
    this.sendWebSocketMessage({
      type: 'location_update',
      channel: `route:${routeId}`,
      data: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp.toISOString(),
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
      },
    });
  }

  /**
   * Broadcast stop update via WebSocket
   */
  private broadcastStopUpdate(
    routeId: string,
    stopId: string,
    status: string,
    marking: StopMarking | null
  ): void {
    this.sendWebSocketMessage({
      type: 'stop_update',
      channel: `route:${routeId}`,
      data: {
        stopId,
        status,
        marking: marking ? {
          ...marking,
          timestamp: marking.timestamp.toISOString(),
        } : null,
      },
    });
  }

  /**
   * Broadcast student boarding update via WebSocket
   */
  private broadcastStudentBoardingUpdate(
    routeId: string,
    stopId: string,
    studentId: string,
    status: string
  ): void {
    this.sendWebSocketMessage({
      type: 'student_boarding',
      channel: `route:${routeId}`,
      data: {
        stopId,
        studentId,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // UTILITY METHODS

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Format ETA for display
   */
  static formatETA(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  /**
   * Check if location is within stop radius
   */
  static isWithinStopRadius(
    currentLat: number,
    currentLon: number,
    stopLat: number,
    stopLon: number,
    radiusMeters: number = 100
  ): boolean {
    const distance = this.calculateDistance(currentLat, currentLon, stopLat, stopLon);
    return distance <= radiusMeters;
  }
}

export default new HelperService();



