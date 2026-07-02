import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/me', userController.getMe);
router.get('/search', userController.search);

export default router;
