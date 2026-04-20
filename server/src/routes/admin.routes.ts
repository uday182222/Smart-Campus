import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminController } from '../controllers/admin.controller';
import { handleSingleFileUpload } from '../middleware/s3Upload';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware.authenticate);

// GET /api/admin/stats - School stats for dashboard
router.get(
  '/stats',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.getSchoolStats
);

// GET /api/admin/reports/attendance
router.get(
  '/reports/attendance',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.getAttendanceReport
);

// GET /api/admin/reports/fees
router.get(
  '/reports/fees',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.getFeeReport
);

// Fee management (GET /admin/fees/management and GET /admin/fees both work)
router.get('/fees/management', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), adminController.getFeeManagement);
router.get('/fees', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), adminController.getFeeManagement);
router.patch('/fees/:feeId', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), adminController.updateFeeStatus);
router.post('/fees', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), adminController.addFeeEntry);
router.post('/fees/class', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), adminController.addClassFee);
router.post('/fees/reminders', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), adminController.sendFeeReminders);
router.get('/fees/export', authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), adminController.exportFeeReport);

// GET /api/admin/announcements
router.get(
  '/announcements',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.getAnnouncements
);

// POST /api/admin/announcements - Send announcement (body: title, message, targetRoles)
router.post(
  '/announcements',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.sendAnnouncement
);

// GET /api/admin/school and GET /api/admin/school/info — school info (includes schoolCodeChangedAt)
router.get(
  '/school/info',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.getSchool
);
router.get(
  '/school',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.getSchool
);

// PATCH /api/admin/school/profile
router.patch(
  '/school/profile',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.updateSchoolProfile
);

// PATCH /api/admin/school/code — change school code (once per week)
router.patch(
  '/school/code',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.updateSchoolCode
);

// POST /api/admin/school/logo - multipart field 'logo'
router.post(
  '/school/logo',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  handleSingleFileUpload('logo'),
  adminController.uploadSchoolLogo
);

// POST /api/admin/user - Create new user (Admin only)
router.post(
  '/user',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.createUser
);

// GET /api/admin/users - Get all users in school (Admin/Staff only)
router.get(
  '/users',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF'),
  adminController.getUsers
);

// PUT /api/admin/user/:userId - Update user details (Admin only)
router.put(
  '/user/:userId',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.updateUser
);

// DELETE /api/admin/user/:userId - Deactivate user (Admin only)
router.delete(
  '/user/:userId',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.deactivateUser
);

// POST /api/admin/user/:userId/reset-password - Reset user password (Admin only)
router.post(
  '/user/:userId/reset-password',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.resetPassword
);

// POST /api/admin/users/bulk-import - Bulk import users from CSV (Admin only)
router.post(
  '/users/bulk-import',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  handleSingleFileUpload('file'),
  adminController.bulkImport
);

// GET /api/admin/analytics/dashboard - Get dashboard analytics (Admin only)
router.get(
  '/analytics/dashboard',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.getDashboardAnalytics
);

// POST /api/admin/announcement - Send school-wide announcement (Admin only)
router.post(
  '/announcement',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'),
  adminController.sendAnnouncement
);

export default router;
