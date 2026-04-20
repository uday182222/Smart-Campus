import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { schoolController } from '../controllers/school.controller';
import { handleSingleFileUpload } from '../middleware/s3Upload';

const router = Router();

// PUBLIC: get school by code (for registration flow)
router.get('/code/:schoolCode', schoolController.getByCode);
// PUBLIC: get classes for a school code (for registration class selector)
router.get('/code/:schoolCode/classes', schoolController.getClassesByCode);

router.use(authMiddleware.authenticate);

// GET /schools — list all schools (SUPER_ADMIN only)
router.get('/', authMiddleware.requireSuperAdmin, schoolController.list);

// GET /schools/:id — get one school
router.get('/:id', schoolController.getOne);

// POST /schools/:id/logo — upload logo (SUPER_ADMIN or that school's ADMIN)
router.post('/:id/logo', handleSingleFileUpload('logo'), schoolController.uploadLogo);

// POST /schools — create school (SUPER_ADMIN only)
router.post('/', authMiddleware.requireSuperAdmin, schoolController.create);

// PUT /schools/:id — update school
router.put('/:id', schoolController.update);

// DELETE /schools/:id — delete school (SUPER_ADMIN only)
router.delete('/:id', authMiddleware.requireSuperAdmin, schoolController.remove);

export default router;
