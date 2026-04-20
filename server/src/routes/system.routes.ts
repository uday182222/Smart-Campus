import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware.authenticate);
router.get('/', (_req, res) => { res.json({ message: 'System routes - coming soon' }); });
export default router;



