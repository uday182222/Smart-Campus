import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';

type StopInput = { id?: string; name?: string; order?: number; lat?: number; lng?: number; expectedTime?: string };

export const bushelperController = {
  async getAssignedRoutes(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const routes = await prisma.route.findMany({
        where: { helperId },
        orderBy: { name: 'asc' },
      });
      const stopsByRoute = routes.map((r) => {
        const stops = (r.stops as StopInput[] | null) || [];
        return { id: r.id, stopCount: stops.length };
      });
      const list = routes.map((r, i) => {
        const stopCount = stopsByRoute[i]?.stopCount ?? 0;
        return {
          id: r.id,
          name: r.name,
          busNumber: r.busNumber,
          startTime: r.startTime,
          endTime: r.endTime,
          stopCount,
          studentCount: 0,
        };
      });
      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('getAssignedRoutes error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getRouteDetail(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const { routeId } = req.params;
      const route = await prisma.route.findFirst({
        where: { id: routeId, helperId },
      });
      if (!route) throw new NotFoundError('Route not found');
      const stopsRaw = (route.stops as StopInput[] | null) || [];
      const stops = stopsRaw.map((s, i) => ({
        id: s.id ?? `stop-${i + 1}`,
        name: s.name ?? `Stop ${i + 1}`,
        order: s.order ?? i + 1,
        lat: s.lat ?? 0,
        lng: s.lng ?? 0,
        expectedTime: s.expectedTime ?? '',
        students: [] as { id: string; name: string; className: string; parentPhone: string | null }[],
      }));
      return res.json({
        success: true,
        data: {
          id: route.id,
          name: route.name,
          busNumber: route.busNumber,
          startTime: route.startTime,
          endTime: route.endTime,
          stops,
        },
      });
    } catch (error) {
      logger.error('getRouteDetail error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async startTrip(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const { routeId } = req.body as { routeId: string };
      if (!routeId) return res.status(400).json({ success: false, message: 'routeId required' });
      const route = await prisma.route.findFirst({
        where: { id: routeId, helperId },
      });
      if (!route) throw new ForbiddenError('Route not assigned to you');
      const existing = await prisma.trip.findFirst({
        where: { driverId: helperId, status: 'ACTIVE' },
      });
      if (existing) return res.status(400).json({ success: false, message: 'You already have an active trip' });
      const stopsRaw = (route.stops as StopInput[] | null) || [];
      const trip = await prisma.trip.create({
        data: {
          routeId,
          driverId: helperId,
          status: 'ACTIVE',
          stopRecords: {
            create: stopsRaw.map((s: StopInput, i: number) => ({
              stopId: s.id ?? `stop-${i + 1}`,
              status: 'PENDING',
            })),
          },
        },
        include: { stopRecords: true },
      });
      logger.info(`Trip started: ${trip.id} by helper ${helperId}`);
      return res.status(201).json({ success: true, data: { tripId: trip.id, routeId, status: trip.status } });
    } catch (error) {
      logger.error('startTrip error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getActiveTrip(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const trip = await prisma.trip.findFirst({
        where: { driverId: helperId, status: 'ACTIVE' },
        include: {
          route: true,
          stopRecords: { orderBy: { createdAt: 'asc' } },
          boardings: true,
        },
      });
      if (!trip) return res.json({ success: true, data: null });
      const stopsRaw = ((trip.route as any).stops as StopInput[] | null) || [];
      const stopRecords = trip.stopRecords;
      const currentIndex = stopRecords.findIndex((sr) => sr.status === 'PENDING');
      const stops = stopsRaw.map((s, i) => {
        const rec = stopRecords.find((r) => r.stopId === ((s as any).id ?? `stop-${i + 1}`));
        return {
          id: (s as any).id ?? `stop-${i + 1}`,
          name: (s as any).name ?? `Stop ${i + 1}`,
          order: (s as any).order ?? i + 1,
          expectedTime: (s as any).expectedTime ?? '',
          status: rec?.status ?? 'PENDING',
          reachedAt: rec?.reachedAt?.toISOString() ?? null,
        };
      });
      return res.json({
        success: true,
        data: {
          id: trip.id,
          routeId: trip.routeId,
          status: trip.status,
          startedAt: trip.startedAt.toISOString(),
          route: {
            id: trip.route.id,
            name: trip.route.name,
            busNumber: trip.route.busNumber,
            startTime: trip.route.startTime,
            endTime: trip.route.endTime,
          },
          stops,
          currentStopIndex: currentIndex >= 0 ? currentIndex : stops.length,
          boardings: trip.boardings.map((b) => ({ studentId: b.studentId, stopId: b.stopId, boardedAt: b.boardedAt.toISOString() })),
        },
      });
    } catch (error) {
      logger.error('getActiveTrip error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async markStopReached(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const { tripId, stopId } = req.params;
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, driverId: helperId, status: 'ACTIVE' },
      });
      if (!trip) throw new NotFoundError('Active trip not found');
      const updated = await prisma.stopRecord.updateMany({
        where: { tripId, stopId },
        data: { status: 'REACHED', reachedAt: new Date() },
      });
      if (updated.count === 0) throw new NotFoundError('Stop not found in trip');
      const rec = await prisma.stopRecord.findFirst({ where: { tripId, stopId } });
      return res.json({ success: true, data: rec });
    } catch (error) {
      logger.error('markStopReached error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async skipStop(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const { tripId, stopId } = req.params;
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, driverId: helperId, status: 'ACTIVE' },
      });
      if (!trip) throw new NotFoundError('Active trip not found');
      await prisma.stopRecord.updateMany({
        where: { tripId, stopId },
        data: { status: 'SKIPPED' },
      });
      const rec = await prisma.stopRecord.findFirst({ where: { tripId, stopId } });
      return res.json({ success: true, data: rec });
    } catch (error) {
      logger.error('skipStop error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async markStudentBoarded(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const { tripId, studentId } = req.params;
      const { stopId } = (req.body as { stopId?: string }) || {};
      if (!stopId) return res.status(400).json({ success: false, message: 'stopId required' });
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, driverId: helperId, status: 'ACTIVE' },
      });
      if (!trip) throw new NotFoundError('Active trip not found');
      const existing = await prisma.boarding.findFirst({
        where: { tripId, studentId },
      });
      if (existing) return res.json({ success: true, data: existing });
      const boarding = await prisma.boarding.create({
        data: { tripId, studentId, stopId },
      });
      return res.status(201).json({ success: true, data: boarding });
    } catch (error) {
      logger.error('markStudentBoarded error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async endTrip(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const { tripId } = req.params;
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, driverId: helperId, status: 'ACTIVE' },
        include: { stopRecords: true, boardings: true, route: true },
      });
      if (!trip) throw new NotFoundError('Active trip not found');
      await prisma.trip.update({
        where: { id: tripId },
        data: { status: 'COMPLETED', endedAt: new Date() },
      });
      const durationMs = Date.now() - trip.startedAt.getTime();
      const durationMins = Math.round(durationMs / 60000);
      const stopsReached = trip.stopRecords.filter((r) => r.status === 'REACHED').length;
      const stopsSkipped = trip.stopRecords.filter((r) => r.status === 'SKIPPED').length;
      const studentsBoarded = trip.boardings.length;
      return res.json({
        success: true,
        data: {
          duration: durationMins,
          stopsReached,
          stopsSkipped,
          studentsBoarded,
          routeName: trip.route.name,
          startedAt: trip.startedAt.toISOString(),
          endedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('endTrip error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getTripHistory(req: AuthRequest, res: Response) {
    try {
      const helperId = req.user!.id;
      const trips = await prisma.trip.findMany({
        where: { driverId: helperId, status: 'COMPLETED' },
        include: { route: true, boardings: true },
        orderBy: { endedAt: 'desc' },
        take: 10,
      });
      const list = trips.map((t) => ({
        id: t.id,
        routeName: t.route.name,
        date: t.endedAt ? t.endedAt.toISOString().split('T')[0] : '',
        duration: t.endedAt ? Math.round((t.endedAt.getTime() - t.startedAt.getTime()) / 60000) : 0,
        studentsBoarded: t.boardings.length,
        status: t.status,
      }));
      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('getTripHistory error:', error);
      if (error instanceof AppError) throw error;
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};
