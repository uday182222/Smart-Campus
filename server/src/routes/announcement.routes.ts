import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { announcementsController } from '../controllers/announcements.controller';

const router = Router();

// All announcement routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/announcements - Create new announcement
router.post('/', announcementsController.createAnnouncement);

// GET /api/announcements/:schoolId - Get announcements for a school
router.get('/:schoolId', announcementsController.getAnnouncements);

export default router;
