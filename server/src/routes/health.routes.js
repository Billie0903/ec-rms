import { Router } from 'express';
import { allergyController, conditionController } from '../controllers/health.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../validators/common.js';
import { allergySchema, conditionSchema } from '../validators/health.validator.js';

/** Routes on a single child record: /api/allergies/:id, /api/conditions/:id */
export const allergyRoutes = Router();
allergyRoutes.use(authenticate, requireRole('admin', 'operator'));
allergyRoutes.put('/:id', validate({ params: idParam, body: allergySchema }), allergyController.update);
allergyRoutes.delete('/:id', validate({ params: idParam }), allergyController.remove);

export const conditionRoutes = Router();
conditionRoutes.use(authenticate, requireRole('admin', 'operator'));
conditionRoutes.put('/:id', validate({ params: idParam, body: conditionSchema }), conditionController.update);
conditionRoutes.delete('/:id', validate({ params: idParam }), conditionController.remove);
