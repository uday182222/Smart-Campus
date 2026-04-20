import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { registrationController } from '../controllers/registration.controller';

const router = Router();

// PUBLIC routes (no auth)
router.post('/request', registrationController.submitRequest);
router.get('/status/:email/:schoolCode', registrationController.getRequestStatus);

// Protected routes (admin/principal only)
router.get('/requests', authMiddleware.authenticate, authMiddleware.requireAdmin, registrationController.getPendingRequests);
router.get('/requests/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, registrationController.getRequestDetail);
router.post('/requests/:id/approve', authMiddleware.authenticate, authMiddleware.requireAdmin, registrationController.approveRequest);
router.post('/requests/:id/reject', authMiddleware.authenticate, authMiddleware.requireAdmin, registrationController.rejectRequest);

export default router;
