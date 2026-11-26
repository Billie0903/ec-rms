import { Router } from 'express';
import { auditController, familyController, relativeController, userController } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../validators/common.js';
import { auditQuery, createLinkSchema, createUserSchema, listUsersQuery, updateLinkSchema, updateUserSchema } from '../validators/user.validator.js';

const adminOnly = [authenticate, requireRole('admin')];

export const userRoutes = Router();
userRoutes.use(...adminOnly);
userRoutes.get('/', validate({ query: listUsersQuery }), userController.list);
userRoutes.post('/', validate({ body: createUserSchema }), userController.create);
userRoutes.patch('/:id', validate({ params: idParam, body: updateUserSchema }), userController.update);
userRoutes.post('/:id/resend-invite', validate({ params: idParam }), userController.resendInvite);

/** /api/residents/:id/relatives: staff can see who is linked; only Admins change links. */
export const residentRelativeRoutes = Router();
residentRelativeRoutes.get('/:id/relatives', authenticate, requireRole('admin', 'operator'), validate({ params: idParam }), relativeController.list);
residentRelativeRoutes.post('/:id/relatives', ...adminOnly, validate({ params: idParam, body: createLinkSchema }), relativeController.link);

export const linkRoutes = Router();
linkRoutes.patch('/:id', ...adminOnly, validate({ params: idParam, body: updateLinkSchema }), relativeController.update);

export const auditRoutes = Router();
auditRoutes.get('/', ...adminOnly, validate({ query: auditQuery }), auditController.list);

export const familyRoutes = Router();
familyRoutes.use(authenticate, requireRole('relative'));
familyRoutes.get('/residents', familyController.list);
familyRoutes.get('/residents/:id', validate({ params: idParam }), familyController.get);
