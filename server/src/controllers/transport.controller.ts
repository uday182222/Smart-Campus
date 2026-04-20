import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

/**
 * Transport Controller
 * Complete bus tracking system with real-time location updates, ETA calculations, and student boarding management
 */

// TypeScript interfaces
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Stop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  sequence: number;
  estimatedTime?: string;
  students?: Array<{
    id: string;
    name: string;
    parentId?: string;
  }>;
}

interface CreateRouteBody {
  name: string;
  routeNumber: string;
  schoolId: string;
  helperId?: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  stops: Array<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    sequence: number;
    estimatedTime?: string;
  }>;
}

interface UpdateRouteBody {
  name?: string;
  routeNumber?: string;
  helperId?: string;
  startTime?: string;
  endTime?: string;
  stops?: Array<{
    id?: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    sequence: number;
    estimatedTime?: string;
  }>;
}

interface UpdateLocationBody {
  routeId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

interface MarkStopBody {
  arrivedAt: string; // ISO date string
}

interface MarkBoardedBody {
  stopId: string;
  boardedAt: string; // ISO date string
}

/**
 * Haversine formula to calculate distance between two coordinates in kilometers
 */
function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate ETA in minutes based on distance and speed
 */
function calculateETA(distanceKm: number, speedKmh?: number | null): number {
  // Default speed: 30 km/h if not provided
  const effectiveSpeed = speedKmh && speedKmh > 0 ? speedKmh : 30;
  // Calculate time in hours, then convert to minutes
  const timeHours = distanceKm / effectiveSpeed;
  return Math.ceil(timeHours * 60); // Round up to nearest minute
}

/**
 * Find the next stop based on current location and route stops
 */
function findNextStop(
  currentLocation: Coordinate,
  stops: Stop[],
  completedStopIds: string[] = []
): { stop: Stop; distance: number; eta: number } | null {
  // Filter out completed stops and sort by sequence
  const remainingStops = stops
    .filter((stop) => !completedStopIds.includes(stop.id))
    .sort((a, b) => a.sequence - b.sequence);

  if (remainingStops.length === 0) return null;

  // Find closest remaining stop
  let closestStop: Stop | null = null;
  let minDistance = Infinity;

  for (const stop of remainingStops) {
    const distance = calculateDistance(currentLocation, {
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
    if (distance < minDistance) {
      minDistance = distance;
      closestStop = stop;
    }
  }

  if (!closestStop) return null;

  // Calculate ETA (will be refined with speed in updateLocation)
  const eta = calculateETA(minDistance);

  return {
    stop: closestStop,
    distance: minDistance,
    eta,
  };
}

export const transportController = {
  /**
   * GET /api/transport/routes
   * Get all routes for a school
   * Query params: schoolId (optional, uses authenticated user's schoolId if not provided)
   */
  async getRoutes(req: AuthRequest, res: Response) {
    try {
      const querySchoolId = req.query.schoolId as string | undefined;
      const userSchoolId = req.user?.schoolId;
      const schoolId = querySchoolId || userSchoolId;

      if (!schoolId) {
        throw new ForbiddenError('School ID is required');
      }

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        throw new NotFoundError('School not found');
      }

      // Verify access (user must be from same school or super admin)
      if (userSchoolId && userSchoolId !== schoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      // Get all active routes
      const routes = await prisma.route.findMany({
        where: {
          schoolId,
          status: 'active',
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          tracking: {
            take: 1,
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Get helper details for routes
      const routesWithHelpers = await Promise.all(
        routes.map(async (route) => {
          let helperDetails = null;
          if (route.helperId) {
            const helper = await prisma.user.findUnique({
              where: { id: route.helperId },
              select: {
                id: true,
                name: true,
                phone: true,
              },
            });
            helperDetails = helper;
          }

          const stops = (route.stops as any) || [];
          const latestTracking = route.tracking[0] || null;

          return {
            id: route.id,
            name: route.name,
            routeNumber: route.busNumber,
            schoolId: route.schoolId,
            school: route.school,
            helperId: route.helperId,
            helper: helperDetails || {
              name: route.helperName,
              phone: route.helperPhone,
            },
            startTime: route.startTime,
            endTime: route.endTime,
            status: route.status,
            stops: stops.map((stop: any) => ({
              id: stop.id || `stop-${stop.sequence}`,
              name: stop.name,
              address: stop.address,
              latitude: stop.latitude,
              longitude: stop.longitude,
              sequence: stop.sequence,
              estimatedTime: stop.estimatedTime,
            })),
            latestLocation: latestTracking
              ? {
                  latitude: latestTracking.latitude,
                  longitude: latestTracking.longitude,
                  timestamp: latestTracking.timestamp,
                  speed: latestTracking.speed,
                  heading: latestTracking.heading,
                }
              : null,
            createdAt: route.createdAt,
            updatedAt: route.updatedAt,
          };
        })
      );

      logger.info(`Retrieved ${routesWithHelpers.length} routes for school ${schoolId}`);

      res.json({
        success: true,
        data: {
          routes: routesWithHelpers,
          total: routesWithHelpers.length,
        },
      });
    } catch (error) {
      logger.error('Error getting routes:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * GET /api/transport/route/:routeId
   * Get single route details with all stops and current location
   */
  async getRouteDetails(req: AuthRequest, res: Response) {
    try {
      const { routeId } = req.params;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get route with all details
      const route = await prisma.route.findFirst({
        where: {
          id: routeId,
          schoolId,
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          tracking: {
            take: 1,
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      });

      if (!route) {
        throw new NotFoundError('Route not found');
      }

      // Get helper details
      let helperDetails = null;
      if (route.helperId) {
        helperDetails = await prisma.user.findUnique({
          where: { id: route.helperId },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        });
      }

      const stops = ((route.stops as any) || []) as Stop[];
      const sortedStops = stops.sort((a, b) => a.sequence - b.sequence);

      // Get latest tracking data
      const latestTracking = route.tracking[0] || null;
      let currentLocation = null;
      let nextStop = null;

      if (latestTracking) {
        currentLocation = {
          latitude: latestTracking.latitude,
          longitude: latestTracking.longitude,
          timestamp: latestTracking.timestamp,
          speed: latestTracking.speed,
          heading: latestTracking.heading,
        };

        // Find next stop based on current location
        const completedStops = latestTracking.stopStatus === 'completed' ? [latestTracking.stopId] : [];
        const nextStopData = findNextStop(
          {
            latitude: latestTracking.latitude,
            longitude: latestTracking.longitude,
          },
          sortedStops,
          completedStops.filter(Boolean) as string[]
        );

        if (nextStopData) {
          nextStop = {
            ...nextStopData.stop,
            distance: nextStopData.distance,
            eta: nextStopData.eta,
          };
        }
      }

      // Get students assigned to each stop (if stored in stops JSON)
      const stopsWithStudents = sortedStops.map((stop) => ({
        ...stop,
        students: stop.students || [],
      }));

      logger.info(`Retrieved route details for ${routeId}`);

      res.json({
        success: true,
        data: {
          route: {
            id: route.id,
            name: route.name,
            routeNumber: route.busNumber,
            schoolId: route.schoolId,
            school: route.school,
            helperId: route.helperId,
            helper: helperDetails || {
              name: route.helperName,
              phone: route.helperPhone,
            },
            startTime: route.startTime,
            endTime: route.endTime,
            status: route.status,
            createdAt: route.createdAt,
            updatedAt: route.updatedAt,
          },
          stops: stopsWithStudents,
          currentLocation,
          nextStop,
        },
      });
    } catch (error) {
      logger.error('Error getting route details:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * POST /api/transport/route
   * Create new route (Admin only)
   */
  async createRoute(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const {
        name,
        routeNumber,
        schoolId: bodySchoolId,
        helperId,
        startTime,
        endTime,
        stops,
      }: CreateRouteBody = req.body;

      // Authorization check - only admins, principals, or super admins can create routes
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can create routes');
      }

      const targetSchoolId = bodySchoolId || schoolId;
      if (!targetSchoolId) {
        throw new ValidationError('schoolId is required');
      }

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id: targetSchoolId },
      });

      if (!school) {
        throw new NotFoundError('School not found');
      }

      // Validate required fields
      if (!name || !routeNumber || !startTime || !endTime) {
        throw new ValidationError('name, routeNumber, startTime, and endTime are required');
      }

      if (!stops || stops.length === 0) {
        throw new ValidationError('At least one stop is required');
      }

      // Validate stops
      for (const stop of stops) {
        if (!stop.name || !stop.address || stop.latitude === undefined || stop.longitude === undefined) {
          throw new ValidationError('Each stop must have name, address, latitude, and longitude');
        }
        if (stop.latitude < -90 || stop.latitude > 90 || stop.longitude < -180 || stop.longitude > 180) {
          throw new ValidationError('Invalid coordinates in stops');
        }
      }

      // Verify helper exists if provided
      let helperDetails = null;
      if (helperId) {
        const helper = await prisma.user.findFirst({
          where: {
            id: helperId,
            schoolId: targetSchoolId,
            role: 'BUS_HELPER',
          },
        });

        if (!helper) {
          throw new NotFoundError('Helper not found or not assigned to this school');
        }

        helperDetails = {
          name: helper.name,
          phone: helper.phone,
        };
      }

      // Create route with stops (stops stored as JSON)
      const route = await prisma.route.create({
        data: {
          schoolId: targetSchoolId,
          name,
          busNumber: routeNumber,
          helperId: helperId || null,
          helperName: helperDetails?.name || null,
          helperPhone: helperDetails?.phone || null,
          startTime,
          endTime,
          status: 'active',
          stops: stops.map((stop, index) => ({
            id: `stop-${Date.now()}-${index}`,
            name: stop.name,
            address: stop.address,
            latitude: stop.latitude,
            longitude: stop.longitude,
            sequence: stop.sequence || index + 1,
            estimatedTime: stop.estimatedTime || null,
            students: [],
          })) as any,
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'ROUTE_CREATED',
          resource: 'Route',
          resourceId: route.id,
          details: {
            name,
            routeNumber,
            stopsCount: stops.length,
          },
        },
      });

      logger.info(`Route created: ${route.id} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: {
          routeId: route.id,
          route: {
            id: route.id,
            name: route.name,
            routeNumber: route.busNumber,
            schoolId: route.schoolId,
            helperId: route.helperId,
            startTime: route.startTime,
            endTime: route.endTime,
            status: route.status,
            stops: route.stops,
          },
        },
      });
    } catch (error) {
      logger.error('Error creating route:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * PUT /api/transport/route/:routeId
   * Update route details
   */
  async updateRoute(req: AuthRequest, res: Response) {
    try {
      const { routeId } = req.params;
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { name, routeNumber, helperId, startTime, endTime, stops }: UpdateRouteBody = req.body;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can update routes');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get existing route
      const existingRoute = await prisma.route.findFirst({
        where: {
          id: routeId,
          schoolId,
        },
      });

      if (!existingRoute) {
        throw new NotFoundError('Route not found');
      }

      // Prepare update data
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (routeNumber !== undefined) updateData.busNumber = routeNumber;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;

      // Handle helper update
      if (helperId !== undefined) {
        if (helperId) {
          const helper = await prisma.user.findFirst({
            where: {
              id: helperId,
              schoolId,
              role: 'BUS_HELPER',
            },
          });

          if (!helper) {
            throw new NotFoundError('Helper not found');
          }

          updateData.helperId = helperId;
          updateData.helperName = helper.name;
          updateData.helperPhone = helper.phone;
        } else {
          updateData.helperId = null;
          updateData.helperName = null;
          updateData.helperPhone = null;
        }
      }

      // Handle stops update
      if (stops !== undefined) {
        // Validate stops
        for (const stop of stops) {
          if (!stop.name || !stop.address || stop.latitude === undefined || stop.longitude === undefined) {
            throw new ValidationError('Each stop must have name, address, latitude, and longitude');
          }
        }

        // Preserve existing students if stops have IDs
        const existingStops = (existingRoute.stops as any) || [];
        const updatedStops = stops.map((stop, index) => {
          const existingStop = existingStops.find((s: any) => s.id === stop.id);
          return {
            id: stop.id || `stop-${Date.now()}-${index}`,
            name: stop.name,
            address: stop.address,
            latitude: stop.latitude,
            longitude: stop.longitude,
            sequence: stop.sequence || index + 1,
            estimatedTime: stop.estimatedTime || null,
            students: existingStop?.students || [],
          };
        });

        updateData.stops = updatedStops as any;
      }

      // Update route
      const updatedRoute = await prisma.route.update({
        where: { id: routeId },
        data: updateData,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'ROUTE_UPDATED',
          resource: 'Route',
          resourceId: routeId,
          details: {
            changes: Object.keys(updateData),
          },
        },
      });

      logger.info(`Route updated: ${routeId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Route updated successfully',
        data: {
          route: {
            id: updatedRoute.id,
            name: updatedRoute.name,
            routeNumber: updatedRoute.busNumber,
            helperId: updatedRoute.helperId,
            startTime: updatedRoute.startTime,
            endTime: updatedRoute.endTime,
            status: updatedRoute.status,
            stops: updatedRoute.stops,
          },
        },
      });
    } catch (error) {
      logger.error('Error updating route:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * DELETE /api/transport/route/:routeId
   * Delete route (soft delete)
   */
  async deleteRoute(req: AuthRequest, res: Response) {
    try {
      const { routeId } = req.params;
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can delete routes');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get route
      const route = await prisma.route.findFirst({
        where: {
          id: routeId,
          schoolId,
        },
      });

      if (!route) {
        throw new NotFoundError('Route not found');
      }

      // Check if route has active tracking (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentTracking = await prisma.routeTracking.findFirst({
        where: {
          routeId,
          timestamp: {
            gte: oneDayAgo,
          },
        },
      });

      if (recentTracking) {
        throw new ValidationError('Cannot delete route with recent tracking data. Please wait 24 hours or contact support.');
      }

      // Soft delete by setting status to inactive
      await prisma.route.update({
        where: { id: routeId },
        data: {
          status: 'inactive',
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'ROUTE_DELETED',
          resource: 'Route',
          resourceId: routeId,
          details: {
            name: route.name,
          },
        },
      });

      logger.info(`Route deleted (soft): ${routeId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Route deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting route:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * POST /api/transport/tracking
   * Update bus location (Helper only)
   */
  async updateLocation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { routeId, latitude, longitude, speed, heading, accuracy }: UpdateLocationBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Authorization check - only bus helpers can update location
      if (req.user?.role !== 'BUS_HELPER' && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Only bus helpers can update location');
      }

      // Validate required fields
      if (!routeId || latitude === undefined || longitude === undefined) {
        throw new ValidationError('routeId, latitude, and longitude are required');
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new ValidationError('Invalid coordinates');
      }

      // Verify route exists and helper is assigned
      const route = await prisma.route.findFirst({
        where: {
          id: routeId,
          schoolId,
          status: 'active',
        },
      });

      if (!route) {
        throw new NotFoundError('Route not found or inactive');
      }

      // Verify helper is assigned to this route
      if (route.helperId !== userId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You are not assigned to this route');
      }

      // Get route stops
      const stops = ((route.stops as any) || []) as Stop[];
      const sortedStops = stops.sort((a, b) => a.sequence - b.sequence);

      // Get latest tracking to determine completed stops
      const latestTracking = await prisma.routeTracking.findFirst({
        where: { routeId },
        orderBy: { timestamp: 'desc' },
      });

      const completedStopIds: string[] = [];
      if (latestTracking?.stopStatus === 'completed' && latestTracking.stopId) {
        completedStopIds.push(latestTracking.stopId);
      }

      // Find next stop and calculate ETA
      const currentLocation: Coordinate = { latitude, longitude };
      const nextStopData = findNextStop(currentLocation, sortedStops, completedStopIds);

      // Create tracking record
      const tracking = await prisma.routeTracking.create({
        data: {
          routeId,
          helperId: userId!,
          latitude,
          longitude,
          accuracy: accuracy || null,
          speed: speed || null,
          heading: heading || null,
          timestamp: new Date(),
        },
        include: {
          route: {
            select: {
              id: true,
              name: true,
              busNumber: true,
            },
          },
        },
      });

      // Calculate ETA to next stop (refined with actual speed)
      let etaMinutes = 0;
      if (nextStopData) {
        etaMinutes = calculateETA(nextStopData.distance, speed);
        // Add 2 minutes buffer per remaining stop
        const remainingStops = sortedStops.filter(
          (s) => !completedStopIds.includes(s.id) && s.sequence >= nextStopData.stop.sequence
        );
        etaMinutes += remainingStops.length * 2;
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'BUS_LOCATION_UPDATED',
          resource: 'RouteTracking',
          resourceId: tracking.id,
          details: {
            routeId,
            latitude,
            longitude,
            speed,
            nextStop: nextStopData?.stop.name,
          },
        },
      });

      logger.info(`Bus location updated for route ${routeId} by helper ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Location updated successfully',
        data: {
          tracking: {
            id: tracking.id,
            routeId: tracking.routeId,
            route: tracking.route,
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            speed: tracking.speed,
            heading: tracking.heading,
            timestamp: tracking.timestamp,
          },
          nextStop: nextStopData
            ? {
                ...nextStopData.stop,
                distance: `${nextStopData.distance.toFixed(2)} km`,
                eta: `${etaMinutes} minutes`,
                etaMinutes,
              }
            : null,
        },
      });
    } catch (error) {
      logger.error('Error updating location:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * GET /api/transport/tracking/:routeId/live
   * Get live tracking data for a route (Parent view)
   */
  async getLiveTracking(req: AuthRequest, res: Response) {
    try {
      const { routeId } = req.params;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify route exists
      const route = await prisma.route.findFirst({
        where: {
          id: routeId,
          schoolId,
        },
      });

      if (!route) {
        throw new NotFoundError('Route not found');
      }

      // Get latest tracking data (last 2 minutes)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const latestTracking = await prisma.routeTracking.findFirst({
        where: {
          routeId,
          timestamp: {
            gte: twoMinutesAgo,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      // Get recent path (last 30 minutes, last 50 points)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentPath = await prisma.routeTracking.findMany({
        where: {
          routeId,
          timestamp: {
            gte: thirtyMinutesAgo,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50,
      });

      // Get all stops
      const stops = ((route.stops as any) || []) as Stop[];
      const sortedStops = stops.sort((a, b) => a.sequence - b.sequence);

      // Calculate current stop and ETAs
      let currentLocation = null;
      let nextStop = null;
      let estimatedArrivals: Array<{ stop: Stop; eta: string; etaMinutes: number }> = [];

      if (latestTracking) {
        currentLocation = {
          latitude: latestTracking.latitude,
          longitude: latestTracking.longitude,
          timestamp: latestTracking.timestamp,
          speed: latestTracking.speed,
          heading: latestTracking.heading,
        };

        // Find next stop
        const completedStops = latestTracking.stopStatus === 'completed' && latestTracking.stopId
          ? [latestTracking.stopId]
          : [];
        const nextStopData = findNextStop(
          {
            latitude: latestTracking.latitude,
            longitude: latestTracking.longitude,
          },
          sortedStops,
          completedStops
        );

        if (nextStopData) {
          nextStop = {
            ...nextStopData.stop,
            distance: `${nextStopData.distance.toFixed(2)} km`,
            eta: `${nextStopData.eta} minutes`,
            etaMinutes: nextStopData.eta,
          };

          // Calculate ETAs for all remaining stops
          const remainingStops = sortedStops.filter(
            (s) => !completedStops.includes(s.id) && s.sequence >= nextStopData.stop.sequence
          );

          estimatedArrivals = remainingStops.map((stop) => {
            const distance = calculateDistance(
              { latitude: latestTracking.latitude, longitude: latestTracking.longitude },
              { latitude: stop.latitude, longitude: stop.longitude }
            );
            const etaMinutes = calculateETA(distance, latestTracking.speed);
            return {
              stop,
              eta: `${etaMinutes} minutes`,
              etaMinutes,
            };
          });
        }
      }

      logger.info(`Retrieved live tracking for route ${routeId}`);

      res.json({
        success: true,
        data: {
          route: {
            id: route.id,
            name: route.name,
            routeNumber: route.busNumber,
            helperName: route.helperName,
            helperPhone: route.helperPhone,
          },
          currentLocation,
          nextStop,
          allStops: sortedStops,
          estimatedArrivals,
          recentPath: recentPath.map((t) => ({
            latitude: t.latitude,
            longitude: t.longitude,
            timestamp: t.timestamp,
            speed: t.speed,
            heading: t.heading,
          })),
        },
      });
    } catch (error) {
      logger.error('Error getting live tracking:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * POST /api/transport/stop/:stopId/mark
   * Mark stop as reached (Helper only)
   */
  async markStopReached(req: AuthRequest, res: Response) {
    try {
      const { stopId } = req.params;
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { arrivedAt }: MarkStopBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Authorization check
      if (req.user?.role !== 'BUS_HELPER' && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Only bus helpers can mark stops');
      }

      // Find route containing this stop
      const routes = await prisma.route.findMany({
        where: {
          schoolId,
          status: 'active',
        },
      });

      let targetRoute = null;
      let targetStop: Stop | null = null;

      for (const route of routes) {
        const stops = (route.stops as any) || [];
        const stop = stops.find((s: any) => s.id === stopId);
        if (stop) {
          targetRoute = route;
          targetStop = stop as Stop;
          break;
        }
      }

      if (!targetRoute || !targetStop) {
        throw new NotFoundError('Stop not found in any active route');
      }

      // Verify helper is assigned to this route
      if (targetRoute.helperId !== userId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You are not assigned to this route');
      }

      // Get current location (from latest tracking or use stop coordinates)
      const latestTracking = await prisma.routeTracking.findFirst({
        where: { routeId: targetRoute.id },
        orderBy: { timestamp: 'desc' },
      });

      const latitude = latestTracking?.latitude || targetStop.latitude;
      const longitude = latestTracking?.longitude || targetStop.longitude;

      // Create tracking record for stop arrival
      const tracking = await prisma.routeTracking.create({
        data: {
          routeId: targetRoute.id,
          helperId: userId!,
          latitude,
          longitude,
          timestamp: new Date(arrivedAt || new Date()),
          stopId,
          stopStatus: 'reached',
        },
      });

      // Get students assigned to this stop
      const studentsToBoard = (targetStop.students || []) as Array<{
        id: string;
        name: string;
        parentId?: string;
      }>;

      // Send notifications to parents
      if (studentsToBoard.length > 0) {
        const notificationPromises = studentsToBoard
          .filter((s) => s.parentId)
          .map((student) =>
            NotificationService.sendNotification({
              userId: student.parentId!,
              category: 'transport',
              title: 'Bus Arriving',
              body: `The bus is arriving at ${targetStop.name}. Please have your child ready.`,
              data: {
                routeId: targetRoute.id,
                stopId,
                stopName: targetStop.name,
                type: 'bus_arriving',
              },
              channels: ['push', 'in_app'],
              priority: 'high',
            })
          );

        await Promise.all(notificationPromises);
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'STOP_REACHED',
          resource: 'RouteTracking',
          resourceId: tracking.id,
          details: {
            routeId: targetRoute.id,
            stopId,
            stopName: targetStop.name,
            studentsCount: studentsToBoard.length,
          },
        },
      });

      logger.info(`Stop ${stopId} marked as reached for route ${targetRoute.id}`);

      res.status(201).json({
        success: true,
        message: 'Stop marked as reached successfully',
        data: {
          tracking: {
            id: tracking.id,
            routeId: tracking.routeId,
            stopId: tracking.stopId,
            stopStatus: tracking.stopStatus,
            timestamp: tracking.timestamp,
          },
          stop: {
            id: targetStop.id,
            name: targetStop.name,
            address: targetStop.address,
          },
          studentsToBoard,
        },
      });
    } catch (error) {
      logger.error('Error marking stop:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * POST /api/transport/student/:studentId/board
   * Mark student as boarded (Helper confirmation)
   */
  async markStudentBoarded(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { stopId, boardedAt }: MarkBoardedBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Authorization check
      if (req.user?.role !== 'BUS_HELPER' && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Only bus helpers can mark students as boarded');
      }

      if (!stopId) {
        throw new ValidationError('stopId is required');
      }

      // Verify student exists
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          schoolId,
          role: 'STUDENT',
        },
        include: {
          studentParents: {
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Find route containing this stop
      const routes = await prisma.route.findMany({
        where: {
          schoolId,
          status: 'active',
        },
      });

      let targetRoute = null;
      let targetStop: Stop | null = null;

      for (const route of routes) {
        const stops = (route.stops as any) || [];
        const stop = stops.find((s: any) => s.id === stopId);
        if (stop) {
          targetRoute = route;
          targetStop = stop as Stop;
          break;
        }
      }

      if (!targetRoute || !targetStop) {
        throw new NotFoundError('Stop not found');
      }

      // Verify helper is assigned to this route
      if (targetRoute.helperId !== userId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You are not assigned to this route');
      }

      // Create tracking record for boarding
      const tracking = await prisma.routeTracking.create({
        data: {
          routeId: targetRoute.id,
          helperId: userId!,
          latitude: targetStop.latitude,
          longitude: targetStop.longitude,
          timestamp: new Date(boardedAt || new Date()),
          stopId,
          stopStatus: 'completed',
          studentsBoarded: [studentId] as any,
        },
      });

      // Send notification to parent
      const parents = student.studentParents.map((ps) => ps.parent);
      if (parents.length > 0) {
        const notificationPromises = parents.map((parent) =>
          NotificationService.sendNotification({
            userId: parent.id,
            category: 'transport',
            title: 'Child Boarded Bus',
            body: `${student.name} has boarded the bus at ${targetStop.name}.`,
            data: {
              studentId,
              routeId: targetRoute.id,
              stopId,
              stopName: targetStop.name,
              type: 'student_boarded',
            },
            channels: ['push', 'in_app'],
            priority: 'normal',
          })
        );

        await Promise.all(notificationPromises);
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'STUDENT_BOARDED',
          resource: 'RouteTracking',
          resourceId: tracking.id,
          details: {
            studentId,
            routeId: targetRoute.id,
            stopId,
          },
        },
      });

      logger.info(`Student ${studentId} marked as boarded by helper ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Student marked as boarded successfully',
        data: {
          tracking: {
            id: tracking.id,
            routeId: tracking.routeId,
            stopId: tracking.stopId,
            stopStatus: tracking.stopStatus,
            studentsBoarded: tracking.studentsBoarded,
            timestamp: tracking.timestamp,
          },
          student: {
            id: student.id,
            name: student.name,
          },
          stop: {
            id: targetStop.id,
            name: targetStop.name,
          },
        },
      });
    } catch (error) {
      logger.error('Error marking student as boarded:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * GET /api/transport/student/:studentId/route
   * Get assigned route for a student (Parent view)
   */
  async getStudentRoute(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify student exists
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          schoolId,
          role: 'STUDENT',
        },
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Authorization: Parent can only view their own child's route
      if (req.user?.role === 'PARENT') {
        const parentStudent = await prisma.parentStudent.findFirst({
          where: {
            parentId: req.user.id,
            studentId,
          },
        });

        if (!parentStudent) {
          throw new ForbiddenError('You can only view your own child\'s route');
        }
      }

      // Find route containing this student
      const routes = await prisma.route.findMany({
        where: {
          schoolId,
          status: 'active',
        },
        include: {
          tracking: {
            take: 1,
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      });

      let assignedRoute = null;
      let assignedStop: Stop | null = null;

      for (const route of routes) {
        const stops = (route.stops as any) || [];
        const stop = stops.find((s: any) => {
          const students = s.students || [];
          return students.some((st: any) => st.id === studentId);
        });

        if (stop) {
          assignedRoute = route;
          assignedStop = stop as Stop;
          break;
        }
      }

      if (!assignedRoute || !assignedStop) {
        throw new NotFoundError('Student is not assigned to any route');
      }

      // Get current location if bus is active
      const latestTracking = assignedRoute.tracking[0] || null;
      let currentLocation = null;
      let eta = null;

      if (latestTracking) {
        currentLocation = {
          latitude: latestTracking.latitude,
          longitude: latestTracking.longitude,
          timestamp: latestTracking.timestamp,
          speed: latestTracking.speed,
          heading: latestTracking.heading,
        };

        // Calculate ETA to student's stop
        const distance = calculateDistance(
          {
            latitude: latestTracking.latitude,
            longitude: latestTracking.longitude,
          },
          {
            latitude: assignedStop.latitude,
            longitude: assignedStop.longitude,
          }
        );

        const etaMinutes = calculateETA(distance, latestTracking.speed);
        eta = {
          minutes: etaMinutes,
          formatted: `${etaMinutes} minutes`,
          distance: `${distance.toFixed(2)} km`,
        };
      }

      logger.info(`Retrieved route for student ${studentId}`);

      res.json({
        success: true,
        data: {
          route: {
            id: assignedRoute.id,
            name: assignedRoute.name,
            routeNumber: assignedRoute.busNumber,
            helperName: assignedRoute.helperName,
            helperPhone: assignedRoute.helperPhone,
            startTime: assignedRoute.startTime,
            endTime: assignedRoute.endTime,
          },
          assignedStop: {
            id: assignedStop.id,
            name: assignedStop.name,
            address: assignedStop.address,
            latitude: assignedStop.latitude,
            longitude: assignedStop.longitude,
            sequence: assignedStop.sequence,
            estimatedTime: assignedStop.estimatedTime,
          },
          currentLocation,
          eta,
        },
      });
    } catch (error) {
      logger.error('Error getting student route:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },
};
