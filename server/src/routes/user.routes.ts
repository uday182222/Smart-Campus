import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { usersController } from '../controllers/users.controller';

const router = Router();

// All user routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/users - Create new user
router.post('/', usersController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', usersController.updateUser);

// DELETE /api/users/:id - Deactivate user
router.delete('/:id', usersController.deleteUser);

// POST /api/users/bulk-import - Bulk import users
router.post('/bulk-import', usersController.bulkImportUsers);

export default router;
