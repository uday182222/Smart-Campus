import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { attendanceController } from '../controllers/attendance.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

// GET /api/attendance/:classId/:date - Get attendance for a class on a specific date
router.get('/:classId/:date', attendanceController.getClassAttendance);

// POST /api/attendance - Mark attendance (single or bulk)
router.post('/', authMiddleware.requireTeacher, attendanceController.markAttendance);

// PUT /api/attendance/:id - Edit existing attendance
router.put('/:id', authMiddleware.requireTeacher, attendanceController.editAttendance);

// GET /api/attendance/history/:studentId - Get student attendance history
router.get('/history/:studentId', attendanceController.getStudentHistory);

// GET /api/attendance/analytics/:classId - Get class attendance analytics
router.get('/analytics/:classId', attendanceController.getClassAnalytics);

export default router;



