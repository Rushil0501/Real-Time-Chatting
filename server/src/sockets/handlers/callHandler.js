import { z } from 'zod';
import { nanoid } from 'nanoid';
import { createSocketAction } from '../socketAction.js';
import * as presenceService from '../../services/presenceService.js';
import * as userService from '../../services/userService.js';
import { AppError } from '../../utils/AppError.js';

const inviteSchema = z.object({ toUserId: z.string().min(1) });

// callId/toUserId are required for every relay event; the rest (sdp, candidate, etc.)
// is passed through untouched — the server relays WebRTC signaling, it never inspects it.
const relaySchema = z
  .object({ callId: z.string().min(1), toUserId: z.string().min(1) })
  .passthrough();

const RELAY_EVENTS = [
  'call:accept',
  'call:reject',
  'call:cancel',
  'call:end',
  'call:offer',
  'call:answer',
  'call:ice-candidate',
];

export function registerCallHandlers(io, socket) {
  socket.on(
    'call:invite',
    createSocketAction(socket, inviteSchema, async ({ toUserId }) => {
      if (toUserId === socket.data.userId) {
        throw AppError.badRequest('Cannot call yourself');
      }

      const online = await presenceService.isOnline(toUserId);
      if (!online) {
        throw AppError.badRequest('User is offline');
      }

      const callId = nanoid(16);
      const fromUser = await userService.getUserById(socket.data.userId);

      io.to(`user:${toUserId}`).emit('call:incoming', {
        callId,
        fromUserId: socket.data.userId,
        fromUser,
      });

      return { callId };
    })
  );

  RELAY_EVENTS.forEach((event) => {
    socket.on(
      event,
      createSocketAction(socket, relaySchema, async (data) => {
        const { toUserId, ...rest } = data;
        io.to(`user:${toUserId}`).emit(event, { ...rest, fromUserId: socket.data.userId });
        return {};
      })
    );
  });
}
