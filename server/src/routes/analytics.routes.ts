import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware.authenticate);

// GET /api/analytics/attendance/:schoolId - Get attendance analytics
router.get('/attendance/:schoolId', analyticsController.getAttendanceAnalytics);

// GET /api/analytics/academic/:schoolId - Get academic analytics
router.get('/academic/:schoolId', analyticsController.getAcademicAnalytics);

// GET /api/analytics/financial/:schoolId - Get financial analytics
router.get('/financial/:schoolId', analyticsController.getFinancialAnalytics);

export default router;
