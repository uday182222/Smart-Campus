/**
 * Transport Service
 * Handles all transport-related API calls using apiClient
 */

import apiClient from './apiClient';

export interface TransportRoute {
  id: string;
  name: string;
  routeNumber?: string;
  description?: string;
  stops: Array<{
  id: string;
  name: string;
    address: string;
    latitude: number;
    longitude: number;
    sequence: number;
    estimatedTime?: string;
    actualArrivalTime?: string;
    status?: 'pending' | 'reached' | 'completed';
  }>;
  helper?: {
  id: string;
  name: string;
    phone?: string;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveTrackingData {
  routeId: string;
  latestLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number | null;
    heading?: number | null;
    timestamp: Date;
  };
  currentStop: {
    id: string;
  name: string;
    status: string;
  } | null;
  recentPath: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
  }>;
}

export interface UpdateTrackingData {
  routeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface MarkStopData {
  status: 'reached' | 'completed';
  studentsBoarded?: string[];
}

export interface StudentRoute {
  route: TransportRoute;
  assignedStop: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  eta?: string;
}

class TransportService {
  /**
   * GET /api/transport/routes
   * Get all routes for a school
   */
  async getRoutes(schoolId: string): Promise<{ success: boolean; data?: { routes: TransportRoute[] }; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { routes: any[] } }>(
        `/transport/routes?schoolId=${schoolId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            routes: response.data.routes.map((route: any) => ({
              ...route,
              createdAt: new Date(route.createdAt),
              updatedAt: new Date(route.updatedAt),
              stops: route.stops || [],
            })),
          },
        };
      }
      
      return { success: false, error: 'Failed to get routes' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get routes',
      };
    }
  }

  /**
   * GET /api/transport/route/:routeId
   * Get single route details
   */
  async getRouteDetails(routeId: string): Promise<{ success: boolean; data?: { route: TransportRoute; currentLocation?: any; students?: any[] }; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/transport/route/${routeId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            route: {
              ...response.data.route,
              createdAt: new Date(response.data.route.createdAt),
              updatedAt: new Date(response.data.route.updatedAt),
              stops: response.data.route.stops || [],
            },
            currentLocation: response.data.currentLocation,
            students: response.data.students || [],
          },
        };
      }
      
      return { success: false, error: 'Failed to get route details' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get route details',
      };
    }
  }

  /**
   * GET /api/transport/tracking/:routeId/live
   * Get live tracking data for a route
   */
  async getLiveTracking(routeId: string): Promise<{ success: boolean; data?: LiveTrackingData; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/transport/tracking/${routeId}/live`
      );
      
      if (response.success && response.data) {
    return {
          success: true,
          data: {
            routeId: response.data.routeId || routeId,
            latestLocation: {
              ...response.data.latestLocation,
              timestamp: new Date(response.data.latestLocation.timestamp),
            },
            currentStop: response.data.currentStop || null,
            recentPath: (response.data.recentPath || []).map((point: any) => ({
              ...point,
              timestamp: new Date(point.timestamp),
            })),
          },
        };
      }
      
      return { success: false, error: 'Failed to get live tracking' };
    } catch (error) {
    return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get live tracking',
      };
    }
  }

  /**
   * POST /api/transport/tracking
   * Update bus location (for helper)
   */
  async updateTracking(data: UpdateTrackingData): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(
        '/transport/tracking',
        data
      );
      
      if (response.success) {
    return {
          success: true,
          message: response.message || 'Location updated successfully',
          data: response.data,
        };
      }
      
      return { success: false, error: 'Failed to update location' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update location',
      };
    }
  }

  /**
   * POST /api/transport/stop/:stopId/mark
   * Mark stop as reached or completed (for helper)
   */
  async markStop(stopId: string, data: MarkStopData): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(
        `/transport/stop/${stopId}/mark`,
        data
      );
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Stop marked successfully',
          data: response.data,
        };
      }
      
      return { success: false, error: 'Failed to mark stop' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark stop',
      };
    }
  }

  /**
   * GET /api/transport/student/:studentId/route
   * Get assigned route for a student (for parent)
   */
  async getStudentRoute(studentId: string): Promise<{ success: boolean; data?: StudentRoute; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/transport/student/${studentId}/route`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            route: {
              ...response.data.route,
              createdAt: new Date(response.data.route.createdAt),
              updatedAt: new Date(response.data.route.updatedAt),
              stops: response.data.route.stops || [],
            },
            assignedStop: response.data.assignedStop,
            currentLocation: response.data.currentLocation
              ? {
                  ...response.data.currentLocation,
                  timestamp: new Date(response.data.currentLocation.timestamp),
                }
              : undefined,
            eta: response.data.eta,
          },
        };
      }
      
      return { success: false, error: 'Failed to get student route' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get student route',
      };
    }
  }

  // Legacy methods for backward compatibility
  async getAllRoutes(): Promise<TransportRoute[]> {
    // This would need schoolId - for now return empty array
    return [];
  }

  async getRoute(routeId: string): Promise<TransportRoute> {
    const result = await this.getRouteDetails(routeId);
    if (result.success && result.data) {
      return result.data.route;
    }
    throw new Error(result.error || 'Failed to get route');
  }

  async getTransportStats(): Promise<any> {
    return {
      totalRoutes: 0,
      activeRoutes: 0,
      totalStudents: 0,
      totalVehicles: 0,
      onTimePercentage: 0,
      averageDelay: 0,
    };
  }

  // ============================================================================
  // CONDUCTOR PORTAL METHODS
  // ============================================================================

  /**
   * Get conductor's assigned route
   */
  static async getConductorRoute(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.get('/transport/conductor/route');
      return { success: true, data: response.data?.data || response.data };
    } catch (error: any) {
      console.error('TransportService.getConductorRoute error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start a trip
   */
  static async startTrip(routeId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.post(`/transport/route/${routeId}/start`);
      return { success: true, message: response.data?.message || 'Trip started' };
    } catch (error: any) {
      console.error('TransportService.startTrip error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark a stop as reached
   */
  static async markStopReached(routeId: string, stopId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.post(`/transport/stop/${stopId}/mark`, {
        routeId,
        arrivedAt: new Date().toISOString(),
      });
      return { success: true, message: response.data?.message || 'Stop marked as reached' };
    } catch (error: any) {
      console.error('TransportService.markStopReached error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * End a trip
   */
  static async endTrip(routeId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.post(`/transport/route/${routeId}/end`);
      return { success: true, message: response.data?.message || 'Trip ended' };
    } catch (error: any) {
      console.error('TransportService.endTrip error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get child's bus status (for parent view)
   */
  static async getChildBusStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.get('/transport/child/status');
      return { success: true, data: response.data?.data || response.data };
    } catch (error: any) {
      console.error('TransportService.getChildBusStatus error:', error);
      return { success: false, error: error.message };
    }
  }
}

export { TransportService };
export default new TransportService();
