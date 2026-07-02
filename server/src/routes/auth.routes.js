import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../utils/validators.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authController.logout);

export default router;
