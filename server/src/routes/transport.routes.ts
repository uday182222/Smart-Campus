import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { transportController } from '../controllers/transport.controller';

const router = Router();

// All transport routes require authentication
router.use(authMiddleware.authenticate);

// GET /api/transport/routes - Get all routes for school
router.get('/routes', transportController.getRoutes);

// GET /api/transport/route/:routeId - Get single route details
router.get('/route/:routeId', transportController.getRouteDetails);

// POST /api/transport/route - Create new route (Admin only)
router.post(
  '/route',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  transportController.createRoute
);

// PUT /api/transport/route/:routeId - Update route (Admin only)
router.put(
  '/route/:routeId',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  transportController.updateRoute
);

// DELETE /api/transport/route/:routeId - Delete route (Admin only)
router.delete(
  '/route/:routeId',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  transportController.deleteRoute
);

// POST /api/transport/tracking - Update bus location (Helper only)
router.post(
  '/tracking',
  authMiddleware.authorize('BUS_HELPER', 'ADMIN', 'SUPER_ADMIN'),
  transportController.updateLocation
);

// GET /api/transport/tracking/:routeId/live - Get live tracking for a route
router.get('/tracking/:routeId/live', transportController.getLiveTracking);

// POST /api/transport/stop/:stopId/mark - Mark stop as reached (Helper only)
router.post(
  '/stop/:stopId/mark',
  authMiddleware.authorize('BUS_HELPER', 'ADMIN', 'SUPER_ADMIN'),
  transportController.markStopReached
);

// POST /api/transport/student/:studentId/board - Mark student as boarded (Helper only)
router.post(
  '/student/:studentId/board',
  authMiddleware.authorize('BUS_HELPER', 'ADMIN', 'SUPER_ADMIN'),
  transportController.markStudentBoarded
);

// GET /api/transport/student/:studentId/route - Get assigned route for a student (Parent view)
router.get('/student/:studentId/route', transportController.getStudentRoute);

export default router;
