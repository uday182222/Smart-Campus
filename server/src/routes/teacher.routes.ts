import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { teacherController } from '../controllers/teacher.controller';

const router = Router();

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('TEACHER', 'ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'));

router.get('/dashboard', teacherController.getTeacherDashboard);
router.get('/classes', teacherController.getMyClasses);
router.get('/classes/:classId/students', teacherController.getClassStudents);
router.get('/parents', teacherController.getParents);
router.get('/messages', teacherController.getMessages);
router.post('/messages', teacherController.sendMessage);
router.get('/calendar', teacherController.getCalendarEvents);

export default router;
