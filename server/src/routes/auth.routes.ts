import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authValidator } from '../validators/auth.validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// Public routes
router.post('/register', validate(authValidator.register.body), authController.register);
router.post('/login', validate(authValidator.login.body), authController.login);
router.post('/forgot-password', validate(authValidator.forgotPassword.body), authController.forgotPassword);
router.post('/reset-password', validate(authValidator.resetPassword.body), authController.resetPassword);
router.post('/verify-email', validate(authValidator.verifyEmail.body), authController.verifyEmail);
router.post('/resend-verification', validate(authValidator.resendVerification.body), authController.resendVerification);

// Protected routes
router.use(authMiddleware.authenticate);
router.get('/profile', authController.getProfile);
router.put('/profile', validate(authValidator.updateProfile.body), authController.updateProfile);
router.post('/change-password', validate(authValidator.changePassword.body), authController.changePassword);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

export default router;
