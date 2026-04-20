import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { parentController } from '../controllers/parent.controller';

const router = Router();

// All parent routes require authentication and parent role
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireParent);

router.get('/children', parentController.getChildren);
router.get('/dashboard/:studentId', parentController.getDashboard);
router.get('/attendance/:studentId', parentController.getAttendanceHistory);
router.get('/homework/:studentId', parentController.getHomework);
router.get('/marks/:studentId', parentController.getMarks);
router.get('/fees/:studentId', parentController.getFeeStatus);
router.get('/appointments', parentController.getAppointments);
router.post('/appointments', parentController.bookAppointment);
router.get('/notifications', parentController.getNotifications);
router.put('/notifications/:id/read', parentController.markNotificationRead);
router.get('/teachers', parentController.getTeachersForParent);

export default router;

