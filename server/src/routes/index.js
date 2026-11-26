import { Router } from 'express';
import authRoutes from './auth.routes.js';
import residentRoutes from './resident.routes.js';
import archiveRequestRoutes from './archiveRequest.routes.js';
import { allergyRoutes, conditionRoutes } from './health.routes.js';
import { careNoteRoutes, medicationRoutes, residentCareRoutes, scheduleRoutes } from './care.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/residents', residentRoutes);
router.use('/residents', residentCareRoutes);
router.use('/medications', medicationRoutes);
router.use('/care-notes', careNoteRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/allergies', allergyRoutes);
router.use('/conditions', conditionRoutes);
router.use('/archive-requests', archiveRequestRoutes);

export default router;
