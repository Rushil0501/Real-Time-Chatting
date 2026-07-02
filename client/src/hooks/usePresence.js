import { useEffect, useState } from 'react';
import { useSocket } from './useSocket.js';

// presence:online/offline events only fire on state transitions, so a freshly
// mounted component needs an initial snapshot via presence:query before it can
// trust those transition events.
export function usePresence(userIds) {
  const { socket, connected, emitAck } = useSocket();
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const key = userIds.join(',');

  useEffect(() => {
    if (!socket || !connected || userIds.length === 0) return undefined;

    let cancelled = false;
    emitAck('presence:query', { userIds })
      .then((ack) => {
        if (!cancelled) setOnlineUserIds(new Set(ack.onlineUserIds));
      })
      .catch(() => {});

    function handleOnline({ userId }) {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    }
    function handleOffline({ userId }) {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }

    socket.on('presence:online', handleOnline);
    socket.on('presence:offline', handleOffline);

    return () => {
      cancelled = true;
      socket.off('presence:online', handleOnline);
      socket.off('presence:offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected, key, emitAck]);

  return onlineUserIds;
}
