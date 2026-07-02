import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createChannelSchema,
  patchChannelSchema,
  startDmSchema,
  addMemberSchema,
  createMessageBodySchema,
  messagesQuerySchema,
} from '../utils/validators.js';
import * as channelController from '../controllers/channel.controller.js';
import * as messageController from '../controllers/message.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', channelController.list);
router.post('/', validateBody(createChannelSchema), channelController.create);
router.post('/dm', validateBody(startDmSchema), channelController.startDm);

router.get('/:id', channelController.getById);
router.patch('/:id', validateBody(patchChannelSchema), channelController.patch);

router.post('/:id/members', validateBody(addMemberSchema), channelController.addMember);
router.delete('/:id/members/:userId', channelController.removeMember);

router.get('/:id/messages', validateQuery(messagesQuerySchema), messageController.listMessages);
router.post('/:id/messages', validateBody(createMessageBodySchema), messageController.createMessage);

export default router;
