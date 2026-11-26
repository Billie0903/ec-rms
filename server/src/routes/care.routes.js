import { Router } from 'express';
import { careNoteController, medicationController, scheduleController, vitalsController } from '../controllers/care.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../validators/common.js';
import {
  careNoteListQuery, careNoteSchema, medicationListQuery, medicationSchema,
  scheduleListQuery, scheduleSchema, vitalsListQuery, vitalsSchema,
} from '../validators/care.validator.js';

const staff = [authenticate, requireRole('admin', 'operator')];

/** Nested under /api/residents/:id/... */
export const residentCareRoutes = Router({ mergeParams: true });
residentCareRoutes.use(...staff);
residentCareRoutes.get('/:id/medications', validate({ params: idParam, query: medicationListQuery }), medicationController.list);
residentCareRoutes.post('/:id/medications', validate({ params: idParam, body: medicationSchema }), medicationController.create);
residentCareRoutes.get('/:id/vitals', validate({ params: idParam, query: vitalsListQuery }), vitalsController.list);
residentCareRoutes.post('/:id/vitals', validate({ params: idParam, body: vitalsSchema }), vitalsController.create);
residentCareRoutes.get('/:id/care-notes', validate({ params: idParam, query: careNoteListQuery }), careNoteController.list);
residentCareRoutes.post('/:id/care-notes', validate({ params: idParam, body: careNoteSchema }), careNoteController.create);
residentCareRoutes.get('/:id/schedules', validate({ params: idParam, query: scheduleListQuery }), scheduleController.list);
residentCareRoutes.post('/:id/schedules', validate({ params: idParam, body: scheduleSchema }), scheduleController.create);

/** Single records: /api/medications/:id, /api/care-notes/:id, /api/schedules/:id */
export const medicationRoutes = Router();
medicationRoutes.use(...staff);
medicationRoutes.put('/:id', validate({ params: idParam, body: medicationSchema }), medicationController.update);
medicationRoutes.patch('/:id/stop', validate({ params: idParam }), medicationController.stop);

export const careNoteRoutes = Router();
careNoteRoutes.use(...staff);
careNoteRoutes.put('/:id', validate({ params: idParam, body: careNoteSchema }), careNoteController.update);
careNoteRoutes.delete('/:id', requireRole('admin'), validate({ params: idParam }), careNoteController.remove);

export const scheduleRoutes = Router();
scheduleRoutes.use(...staff);
scheduleRoutes.put('/:id', validate({ params: idParam, body: scheduleSchema }), scheduleController.update);
scheduleRoutes.delete('/:id', validate({ params: idParam }), scheduleController.remove);
