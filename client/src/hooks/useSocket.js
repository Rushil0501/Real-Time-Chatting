import { useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext.jsx';

// Wraps socket.io's ack-callback pattern in a promise so call sites can await it,
// matching the {ok, ...} / {ok:false, error} contract used by every mutating event.
export function useSocket() {
  const { socket, connected } = useSocketContext();

  const emitAck = useCallback(
    (event, payload) =>
      new Promise((resolve, reject) => {
        if (!socket) return reject(new Error('Socket not connected'));
        socket.emit(event, payload, (ack) => {
          if (ack?.ok) resolve(ack);
          else reject(new Error(ack?.error?.message || 'Request failed'));
        });
      }),
    [socket]
  );

  return { socket, connected, emitAck };
}
