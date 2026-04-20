import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { bushelperController } from '../controllers/bushelper.controller';

const router = Router();

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('BUS_HELPER', 'ADMIN', 'SUPER_ADMIN'));

router.get('/routes', bushelperController.getAssignedRoutes);
router.get('/routes/:routeId', bushelperController.getRouteDetail);
router.post('/trips/start', bushelperController.startTrip);
router.get('/trips/active', bushelperController.getActiveTrip);
router.post('/trips/:tripId/stops/:stopId/reached', bushelperController.markStopReached);
router.post('/trips/:tripId/stops/:stopId/skip', bushelperController.skipStop);
router.post('/trips/:tripId/students/:studentId/boarded', bushelperController.markStudentBoarded);
router.post('/trips/:tripId/end', bushelperController.endTrip);
router.get('/trips/history', bushelperController.getTripHistory);

export default router;
