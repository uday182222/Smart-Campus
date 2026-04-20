import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import schoolRoutes from './school.routes';
import classRoutes from './class.routes';
import attendanceRoutes from './attendance.routes';
import homeworkRoutes from './homework.routes';
import marksRoutes from './marks.routes';
import parentRoutes from './parent.routes';
import transportRoutes from './transport.routes';
import galleryRoutes from './gallery.routes';
import calendarRoutes from './calendar.routes';
import appointmentRoutes from './appointment.routes';
import notificationRoutes from './notification.routes';
import announcementRoutes from './announcement.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import supportRoutes from './support.routes';
import whatsappRoutes from './whatsapp.routes';
import emailRoutes from './email.routes';
import systemRoutes from './system.routes';
import feeRoutes from './fee.routes';
import examRoutes from './exam.routes';
import remarksRoutes from './remarks.routes';
import registrationRoutes from './registration.routes';
import superadminRoutes from './superadmin.routes';
import teacherRoutes from './teacher.routes';
import bushelperRoutes from './bushelper.routes';
import eventsRoutes from './events.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modules: [
      'Authentication',
      'User Management',
      'School Management',
      'Class Management',
      'Attendance',
      'Homework',
      'Marks',
      'Parent',
      'Transport',
      'Gallery',
      'Calendar',
      'Appointments',
      'Notifications',
      'Announcements',
      'Analytics',
      'Support',
      'WhatsApp',
      'Email',
      'System'
    ]
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/classes', classRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/homework', homeworkRoutes);
router.use('/marks', marksRoutes);
router.use('/parent', parentRoutes);
router.use('/transport', transportRoutes);
router.use('/gallery', galleryRoutes);
router.use('/calendar', calendarRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/announcements', announcementRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/support', supportRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/email', emailRoutes);
router.use('/system', systemRoutes);
router.use('/fees', feeRoutes);
router.use('/exams', examRoutes);
router.use('/remarks', remarksRoutes);
router.use('/registration', registrationRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/bushelper', bushelperRoutes);
router.use('/events', eventsRoutes);

export default router;