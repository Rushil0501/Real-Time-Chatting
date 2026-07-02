import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { pushSubscribeSchema } from '../utils/validators.js';
import * as pushController from '../controllers/push.controller.js';

const router = Router();

router.get('/vapidPublicKey', pushController.getVapidPublicKey);
router.post('/subscribe', requireAuth, validateBody(pushSubscribeSchema), pushController.subscribe);
router.delete('/subscribe', requireAuth, pushController.unsubscribe);

export default router;
