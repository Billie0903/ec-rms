import { Router } from 'express';
import * as residents from '../controllers/resident.controller.js';
import { allergyController, conditionController } from '../controllers/health.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../validators/common.js';
import { createResidentSchema, listResidentsQuery, reasonSchema, updateResidentSchema } from '../validators/resident.validator.js';
import { allergySchema, conditionSchema } from '../validators/health.validator.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'operator'));

router.get('/', validate({ query: listResidentsQuery }), residents.list);
router.post('/', validate({ body: createResidentSchema }), residents.create);
router.get('/:id', validate({ params: idParam }), residents.get);
router.put('/:id', validate({ params: idParam, body: updateResidentSchema }), residents.update);

router.post('/:id/archive-requests', requireRole('operator'), validate({ params: idParam, body: reasonSchema }), residents.requestArchive);
router.post('/:id/archive', requireRole('admin'), validate({ params: idParam, body: reasonSchema }), residents.archive);
router.post('/:id/restore', requireRole('admin'), validate({ params: idParam }), residents.restore);

router.get('/:id/allergies', validate({ params: idParam }), allergyController.list);
router.post('/:id/allergies', validate({ params: idParam, body: allergySchema }), allergyController.create);
router.get('/:id/conditions', validate({ params: idParam }), conditionController.list);
router.post('/:id/conditions', validate({ params: idParam, body: conditionSchema }), conditionController.create);

export default router;
