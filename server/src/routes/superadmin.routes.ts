import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { superadminController } from '../controllers/superadmin.controller';

const router = Router();

router.use(authMiddleware.authenticate, authMiddleware.requireSuperAdmin);

router.get('/stats', superadminController.getDashboardStats);
router.get('/schools', superadminController.getAllSchools);
router.post('/schools', superadminController.createSchool);
router.get('/schools/:id', superadminController.getSchoolDetail);
router.patch('/schools/:id/status', superadminController.toggleSchoolStatus);
router.delete('/schools/:id', superadminController.deleteSchool);
router.post('/schools/:id/reset-admin-password', superadminController.resetAdminPassword);
router.delete('/schools/:id/admin', superadminController.deleteAdminCredentials);
router.get('/schools/:id/users', superadminController.getSchoolUsers);

export default router;
