import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { feeController } from '../controllers/fee.controller';

const router = Router();
router.use(authMiddleware.authenticate);

// GET /fees/student/:studentId — get fees for a student (before /:schoolId)
router.get('/student/:studentId', feeController.getByStudent);

// GET /fees/dues/:schoolId — get overdue fee structures
router.get('/dues/:schoolId', feeController.getDues);

// POST /fees/payment — record a payment
router.post('/payment', feeController.recordPayment);

// GET /fees/:schoolId — list fee structures for school
router.get('/:schoolId', feeController.listBySchool);

// POST /fees — create fee structure (ADMIN)
router.post('/', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), feeController.createStructure);

export default router;
