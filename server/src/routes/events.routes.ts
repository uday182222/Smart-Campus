import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { eventsController } from '../controllers/events.controller';

const router = Router();

router.get('/upcoming', authMiddleware.authenticate, eventsController.getUpcomingEvents);
router.get('/date/:date', authMiddleware.authenticate, eventsController.getEventsByDate);
router.get('/', authMiddleware.authenticate, eventsController.getEvents);
router.post('/', authMiddleware.authenticate, authMiddleware.requireAdmin, eventsController.createEvent);
router.patch('/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, eventsController.updateEvent);
router.delete('/:id', authMiddleware.authenticate, authMiddleware.requireAdmin, eventsController.deleteEvent);

export default router;
