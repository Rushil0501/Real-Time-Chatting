import { createSocketAction } from '../socketAction.js';
import {
  sendMessageSchema,
  editMessageSchema,
  deleteMessageSchema,
  readMessageSchema,
} from '../../utils/validators.js';
import * as messageService from '../../services/messageService.js';
import * as channelService from '../../services/channelService.js';
import { notifyOfflineMembers } from '../../services/messageNotify.js';

export function registerMessageHandlers(io, socket) {
  socket.on(
    'message:send',
    createSocketAction(socket, sendMessageSchema, async (data) => {
      const { message, clientTempId } = await messageService.sendMessage(socket.data.userId, data);
      io.to(`channel:${data.channelId}`).emit('message:new', { message, clientTempId });

      // Fire-and-forget: push notifications shouldn't block the ack/broadcast.
      channelService
        .assertMemberChannel(socket.data.userId, data.channelId)
        .then((channel) => notifyOfflineMembers(channel, socket.data.userId, message))
        .catch((err) => console.error('[push] notify failed:', err.message));

      return { message, clientTempId };
    })
  );

  socket.on(
    'message:edit',
    createSocketAction(socket, editMessageSchema, async (data) => {
      const message = await messageService.editMessage(socket.data.userId, data);
      io.to(`channel:${message.channelId}`).emit('message:updated', {
        messageId: message.id,
        content: message.content,
        editedAt: message.editedAt,
      });
      return { message };
    })
  );

  socket.on(
    'message:delete',
    createSocketAction(socket, deleteMessageSchema, async (data) => {
      const message = await messageService.deleteMessage(socket.data.userId, data);
      io.to(`channel:${message.channelId}`).emit('message:deleted', {
        messageId: message.id,
        channelId: message.channelId,
        deletedAt: message.deletedAt,
      });
      return { message };
    })
  );

  socket.on(
    'message:read',
    createSocketAction(socket, readMessageSchema, async (data) => {
      const readState = await messageService.markRead(socket.data.userId, data);
      socket.to(`channel:${data.channelId}`).emit('message:read', readState);
      return readState;
    })
  );
}
