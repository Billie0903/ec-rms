import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { activateSchema, loginSchema, tokenParamSchema } from '../validators/auth.validator.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please wait 15 minutes and try again.' } },
});

router.post('/login', loginLimiter, validate({ body: loginSchema }), auth.login);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.me);
router.get('/invites/:token', validate({ params: tokenParamSchema }), auth.checkInvite);
router.post('/activate', loginLimiter, validate({ body: activateSchema }), auth.activate);

export default router;
