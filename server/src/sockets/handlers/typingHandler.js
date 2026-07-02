import { typingSchema } from '../../utils/validators.js';

// Ephemeral, fire-and-forget — no persistence, no ack. The only authorization check
// is that the socket has actually joined the channel room (cheap, in-memory), since
// a full DB membership check on every keystroke would be wasteful.
function emitTyping(socket, payload, isTyping) {
  const parsed = typingSchema.safeParse(payload);
  if (!parsed.success) return;

  const room = `channel:${parsed.data.channelId}`;
  if (!socket.rooms.has(room)) return;

  socket.to(room).emit('typing:update', {
    channelId: parsed.data.channelId,
    userId: socket.data.userId,
    isTyping,
  });
}

export function registerTypingHandlers(io, socket) {
  socket.on('typing:start', (payload) => emitTyping(socket, payload, true));
  socket.on('typing:stop', (payload) => emitTyping(socket, payload, false));
}
