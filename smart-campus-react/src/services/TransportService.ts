import { apiClient } from './apiClient';

export interface TransportRoute {
  id: string;
  name: string;
  busNumber: string;
  helperId?: string;
  helperName?: string;
  helperPhone?: string;
  startTime: string;
  endTime: string;
  status: string;
  stops: any; // JSON array
  school: {
    id: string;
    name: string;
  };
  latestLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveTrackingData {
  route: {
    id: string;
    name: string;
    busNumber: string;
    helperName?: string;
    helperPhone?: string;
    startTime: string;
    endTime: string;
    stops: any;
    school: {
      id: string;
      name: string;
    };
  };
  latestLocation: {
    id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
    stopId?: string;
    stopStatus?: string;
    studentsBoarded?: string[];
  } | null;
  recentPath: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
  }>;
}

export interface TrackingUpdate {
  routeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  stopId?: string;
  stopStatus?: 'reached' | 'completed';
  studentsBoarded?: string[];
}

class TransportService {
  async getRoutes(): Promise<{ success: boolean; data: { routes: TransportRoute[]; total: number } }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { routes: TransportRoute[]; total: number };
      }>('/transport/routes');

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            routes: response.data.routes.map((route) => ({
              ...route,
              latestLocation: route.latestLocation
                ? {
                    ...route.latestLocation,
                    timestamp: new Date(route.latestLocation.timestamp),
                  }
                : null,
              createdAt: new Date(route.createdAt),
              updatedAt: new Date(route.updatedAt),
            })),
            total: response.data.total,
          },
        };
      }

      throw new Error(response.message || 'Failed to get routes');
    } catch (error: any) {
      console.error('Error getting routes:', error);
      throw error;
    }
  }

  async getLiveTracking(routeId: string): Promise<LiveTrackingData> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: LiveTrackingData;
      }>(`/transport/route/${routeId}/live`);

      if (response.success && response.data) {
        const data = response.data;
        return {
          ...data,
          latestLocation: data.latestLocation
            ? {
                ...data.latestLocation,
                timestamp: new Date(data.latestLocation.timestamp),
              }
            : null,
          recentPath: data.recentPath.map((point) => ({
            ...point,
            timestamp: new Date(point.timestamp),
          })),
        };
      }

      throw new Error(response.message || 'Failed to get live tracking');
    } catch (error: any) {
      console.error('Error getting live tracking:', error);
      throw error;
    }
  }

  async updateTracking(data: TrackingUpdate): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: any;
      }>('/transport/tracking', data);

      if (response.success) {
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      throw new Error(response.message || 'Failed to update tracking');
    } catch (error: any) {
      console.error('Error updating tracking:', error);
      throw error;
    }
  }

  async markStop(stopId: string, status: 'reached' | 'completed', studentsBoarded?: string[]): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: any;
      }>(`/transport/stop/${stopId}/mark`, { status, studentsBoarded });

      if (response.success) {
        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      throw new Error(response.message || 'Failed to mark stop');
    } catch (error: any) {
      console.error('Error marking stop:', error);
      throw error;
    }
  }
}

export const transportService = new TransportService();

