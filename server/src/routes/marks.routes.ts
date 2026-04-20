import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { marksController } from '../controllers/marks.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/marks - Enter marks
router.post('/', authMiddleware.requireTeacher, marksController.enterMarks);

// PUT /api/marks/:id - Update marks (with audit trail)
router.put('/:id', authMiddleware.requireTeacher, marksController.updateMarks);

// GET /api/marks/:examId - Get all marks for an exam
router.get('/:examId', marksController.getExamMarks);

// GET /api/marks/student/:studentId - Get all marks for a student
router.get('/student/:studentId', marksController.getStudentMarks);

export default router;



