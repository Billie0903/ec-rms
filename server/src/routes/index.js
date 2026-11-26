import { Router } from 'express';
import authRoutes from './auth.routes.js';
import residentRoutes from './resident.routes.js';
import archiveRequestRoutes from './archiveRequest.routes.js';
import { allergyRoutes, conditionRoutes } from './health.routes.js';
import { auditRoutes, familyRoutes, linkRoutes, residentRelativeRoutes, userRoutes } from './admin.routes.js';
import { careNoteRoutes, medicationRoutes, residentCareRoutes, scheduleRoutes } from './care.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/residents', residentRoutes);
router.use('/residents', residentCareRoutes);
router.use('/residents', residentRelativeRoutes);
router.use('/resident-relatives', linkRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/family', familyRoutes);
router.use('/medications', medicationRoutes);
router.use('/care-notes', careNoteRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/allergies', allergyRoutes);
router.use('/conditions', conditionRoutes);
router.use('/archive-requests', archiveRequestRoutes);

export default router;
