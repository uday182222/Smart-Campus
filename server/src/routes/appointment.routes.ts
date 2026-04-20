import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { appointmentsController } from '../controllers/appointments.controller';

const router = Router();

// All appointment routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/appointments - Book new appointment
router.post('/', appointmentsController.bookAppointment);

// PUT /api/appointments/:id/approve - Approve appointment
router.put('/:id/approve', appointmentsController.approveAppointment);

// GET /api/appointments/:userId - Get appointments for a user
router.get('/:userId', appointmentsController.getUserAppointments);

export default router;
