import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';

const STOP_DELAY_MS = 3000;

export function useTyping(channelId) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [typingUserIds, setTypingUserIds] = useState([]);
  const stopTimerRef = useRef(null);

  useEffect(() => {
    if (!socket || !channelId) return undefined;

    function handleUpdate(payload) {
      if (payload.channelId !== channelId || payload.userId === user?.id) return;
      setTypingUserIds((prev) => {
        const withoutUser = prev.filter((id) => id !== payload.userId);
        return payload.isTyping ? [...withoutUser, payload.userId] : withoutUser;
      });
    }

    socket.on('typing:update', handleUpdate);
    return () => {
      socket.off('typing:update', handleUpdate);
      setTypingUserIds([]);
    };
  }, [socket, channelId, user?.id]);

  const notifyTyping = useCallback(() => {
    if (!socket || !channelId) return;
    socket.emit('typing:start', { channelId });
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', { channelId });
    }, STOP_DELAY_MS);
  }, [socket, channelId]);

  useEffect(() => () => clearTimeout(stopTimerRef.current), []);

  return { typingUserIds, notifyTyping };
}
