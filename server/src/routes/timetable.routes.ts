import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { timetableController } from '../controllers/timetable.controller';

const router = Router();

router.use(authMiddleware.authenticate);

// GET /timetable/teacher/me — must be before /class/:classId if we add /teacher/:id later
router.get('/teacher/me', authMiddleware.requireTeacher, timetableController.getMyTimetable);

// GET /timetable/student/:studentId — parent timetable (A7)
router.get(
  '/student/:studentId',
  authMiddleware.requireRole('PARENT', 'ADMIN', 'PRINCIPAL'),
  timetableController.getStudentTimetable,
);

// GET /timetable/class/:classId
router.get('/class/:classId', timetableController.getClassTimetable);

// PUT /timetable/class/:classId — teacher upload / admin edit
router.put('/class/:classId', authMiddleware.requireTeacher, timetableController.upsertClassTimetable);

export default router;
