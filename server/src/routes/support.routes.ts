import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supportController } from '../controllers/support.controller';

const router = Router();
router.use(authMiddleware.authenticate);

router.post('/concerns', supportController.createConcern);
router.get(
  '/concerns',
  authMiddleware.requireRole('ADMIN', 'PRINCIPAL'),
  supportController.getConcerns,
);

export default router;
