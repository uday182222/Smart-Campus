import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { remarksController } from '../controllers/remarks.controller';

const router = Router();
router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.requireTeacher, remarksController.create);
router.get('/student/:studentId', remarksController.getByStudent);
router.get('/class/:classId', remarksController.getByClass);
router.put('/:id', authMiddleware.requireTeacher, remarksController.update);
router.delete('/:id', authMiddleware.requireTeacher, remarksController.remove);

export default router;
