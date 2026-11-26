import { Router } from 'express';
import * as requests from '../controllers/archiveRequest.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../validators/common.js';
import { archiveRequestsQuery, reviewArchiveRequestSchema } from '../validators/resident.validator.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/', validate({ query: archiveRequestsQuery }), requests.list);
router.patch('/:id', validate({ params: idParam, body: reviewArchiveRequestSchema }), requests.review);

export default router;
