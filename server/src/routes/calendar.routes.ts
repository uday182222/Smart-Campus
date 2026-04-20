import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { calendarController } from '../controllers/calendar.controller';

const router = Router();

// All calendar routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/calendar/event - Create new event (Admin/Staff only)
router.post(
  '/event',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF'),
  calendarController.createEvent
);

// GET /api/calendar/events - Get events for a school
router.get('/events', calendarController.getEvents);

// GET /api/calendar/event/:eventId - Get single event details
router.get('/event/:eventId', calendarController.getEventDetails);

// PUT /api/calendar/event/:eventId - Update event (Admin/Staff/Creator only)
router.put(
  '/event/:eventId',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF'),
  calendarController.updateEvent
);

// DELETE /api/calendar/event/:eventId - Delete event (Admin/Staff/Creator only)
router.delete(
  '/event/:eventId',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF'),
  calendarController.deleteEvent
);

// POST /api/calendar/event/:eventId/rsvp - RSVP to an event (All authenticated users)
router.post('/event/:eventId/rsvp', calendarController.rsvpEvent);

// GET /api/calendar/upcoming - Get upcoming events (next 7 days)
router.get('/upcoming', calendarController.getUpcomingEvents);

export default router;
