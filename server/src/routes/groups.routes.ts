import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { groupsController } from '../controllers/groups.controller';

const router = Router();

router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('TEACHER', 'ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'));

router.post('/', groupsController.createGroup);
router.get('/', groupsController.getGroups);
router.get('/:id', groupsController.getGroup);
router.post('/:id/members', groupsController.addMembers);
router.delete('/:id/members/:userId', groupsController.removeMember);
router.post('/:id/message', groupsController.sendGroupMessage);
router.delete('/:id', groupsController.deleteGroup);

export default router;
