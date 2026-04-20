import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { homeworkController } from '../controllers/homework.controller';
import { handleFileUpload } from '../middleware/s3Upload';

const router = Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

// GET /api/homework/:classId - Get all homework for a class
router.get('/:classId', homeworkController.getClassHomework);

// POST /api/homework - Create homework (with file upload)
router.post('/', authMiddleware.requireTeacher, handleFileUpload('attachments', 5), homeworkController.createHomework);

// PUT /api/homework/:id - Update homework (with optional file upload)
router.put('/:id', authMiddleware.requireTeacher, handleFileUpload('attachments', 5), homeworkController.updateHomework);

// DELETE /api/homework/:id - Delete homework
router.delete('/:id', authMiddleware.requireTeacher, homeworkController.deleteHomework);

// POST /api/homework/:id/submit - Submit homework (student submission with file upload)
router.post('/:id/submit', handleFileUpload('attachments', 5), homeworkController.submitHomework);

// GET /api/homework/:id/submissions - Get all submissions for a homework
router.get('/:id/submissions', authMiddleware.requireTeacher, homeworkController.getHomeworkSubmissions);

export default router;



