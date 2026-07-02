import { z } from 'zod';
import { createSocketAction } from '../socketAction.js';
import { assertMemberChannel } from '../../services/channelService.js';

const channelIdSchema = z.object({ channelId: z.string().min(1) });

export function registerChannelHandlers(io, socket) {
  socket.on(
    'channel:join',
    createSocketAction(socket, channelIdSchema, async ({ channelId }) => {
      await assertMemberChannel(socket.data.userId, channelId);
      socket.join(`channel:${channelId}`);
      return { channelId };
    })
  );

  socket.on(
    'channel:leave',
    createSocketAction(socket, channelIdSchema, async ({ channelId }) => {
      socket.leave(`channel:${channelId}`);
      return { channelId };
    })
  );
}
