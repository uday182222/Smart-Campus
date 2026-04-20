import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { examController } from '../controllers/exam.controller';

const router = Router();
router.use(authMiddleware.authenticate);

router.get('/', examController.list);
router.post('/', authMiddleware.requireTeacher, examController.create);

export default router;
