import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { classController } from '../controllers/class.controller';

const router = Router();
router.use(authMiddleware.authenticate);

// GET /classes/today — must be before /:id
router.get('/today', authMiddleware.requireTeacher, classController.today);

// GET /classes — list classes (by schoolId from JWT)
router.get('/', classController.list);

// GET /classes/:id — get one class with teachers and students
router.get('/:id', classController.getOne);

// POST /classes — create class (ADMIN/PRINCIPAL)
router.post('/', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), classController.create);

// PUT /classes/:id — update class
router.put('/:id', classController.update);

// DELETE /classes/:id — delete class
router.delete('/:id', classController.remove);

export default router;
