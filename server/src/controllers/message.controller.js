import { catchAsync } from '../utils/catchAsync.js';
import { getIO } from '../sockets/ioAccessor.js';
import * as messageService from '../services/messageService.js';
import { notifyOfflineMembers } from '../services/messageNotify.js';
import { assertMemberChannel } from '../services/channelService.js';

export const listMessages = catchAsync(async (req, res) => {
  const messages = await messageService.listMessages(req.userId, req.params.id, req.query);
  res.json({ messages });
});

// REST fallback for sending a message (used for curl-testing the data layer before
// the socket layer exists, and as a resilience path if a client's socket is down).
// Mirrors messageHandler's socket flow: persist, then broadcast over sockets too.
export const createMessage = catchAsync(async (req, res) => {
  const { message } = await messageService.sendMessage(req.userId, {
    channelId: req.params.id,
    ...req.body,
  });

  const io = getIO();
  io.to(`channel:${req.params.id}`).emit('message:new', { message });

  const channel = await assertMemberChannel(req.userId, req.params.id);
  await notifyOfflineMembers(channel, req.userId, message);

  res.status(201).json({ message });
});
