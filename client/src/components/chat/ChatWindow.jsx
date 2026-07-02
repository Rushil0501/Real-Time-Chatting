import { useCallback, useEffect, useMemo, useState } from 'react';
import { messageApi } from '../../api/index.js';
import { useSocket } from '../../hooks/useSocket.js';
import { useTyping } from '../../hooks/useTyping.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCall } from '../../context/CallContext.jsx';
import { MessageList } from './MessageList.jsx';
import { MessageInput } from './MessageInput.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';
import { otherDmMember, channelDisplayName } from './ChannelList.jsx';

export function ChatWindow({ channel }) {
  const { user } = useAuth();
  const { socket, emitAck } = useSocket();
  const { typingUserIds, notifyTyping } = useTyping(channel.id);
  const { status: callStatus, startCall } = useCall();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const membersById = useMemo(() => {
    const map = new Map();
    channel.members.forEach((m) => map.set(m.user.id, m.user));
    return map;
  }, [channel.members]);

  const otherUser = channel.type === 'dm' ? otherDmMember(channel, user.id) : null;
  const title = channelDisplayName(channel, user.id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    messageApi
      .list(channel.id)
      .then((list) => {
        if (!cancelled) setMessages(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [channel.id]);

  useEffect(() => {
    if (!socket) return undefined;

    function handleNew({ message, clientTempId }) {
      if (message.channelId !== channel.id) return;
      setMessages((prev) => {
        if (clientTempId && prev.some((m) => m.id === clientTempId)) {
          return prev.map((m) => (m.id === clientTempId ? message : m));
        }
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }

    function handleUpdated(payload) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, content: payload.content, editedAt: payload.editedAt } : m
        )
      );
    }

    function handleDeleted(payload) {
      if (payload.channelId !== channel.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, content: '', attachments: [], deletedAt: payload.deletedAt } : m
        )
      );
    }

    socket.on('message:new', handleNew);
    socket.on('message:updated', handleUpdated);
    socket.on('message:deleted', handleDeleted);

    return () => {
      socket.off('message:new', handleNew);
      socket.off('message:updated', handleUpdated);
      socket.off('message:deleted', handleDeleted);
    };
  }, [socket, channel.id]);

  // Mark the latest message read whenever the list changes while this channel is open.
  useEffect(() => {
    if (!socket || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.id.startsWith('tmp-')) return;
    socket.emit('message:read', { channelId: channel.id, lastReadMessageId: last.id });
  }, [socket, channel.id, messages]);

  const handleSend = useCallback(
    ({ content, attachments }) => {
      const clientTempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticMessage = {
        id: clientTempId,
        channelId: channel.id,
        senderId: user.id,
        content,
        attachments,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      emitAck('message:send', { channelId: channel.id, content, attachments, clientTempId }).catch((err) => {
        console.error('send failed', err);
        setMessages((prev) => prev.filter((m) => m.id !== clientTempId));
      });
    },
    [channel.id, user.id, emitAck]
  );

  const handleEdit = useCallback(
    (messageId, content) => {
      emitAck('message:edit', { messageId, content }).catch((err) => console.error('edit failed', err));
    },
    [emitAck]
  );

  const handleDelete = useCallback(
    (messageId) => {
      emitAck('message:delete', { messageId }).catch((err) => console.error('delete failed', err));
    },
    [emitAck]
  );

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <div className="chat-header-title">{title}</div>
          <div className="chat-header-sub">
            {channel.type === 'dm' ? `@${otherUser?.username ?? ''}` : `${channel.members.length} members`}
          </div>
        </div>
        {channel.type === 'dm' && otherUser && (
          <div className="chat-header-actions">
            <button
              className="btn-icon"
              onClick={() => startCall(otherUser)}
              disabled={callStatus !== 'idle'}
              title="Start voice call"
              aria-label="Start voice call"
            >
              📞
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="center-loading">Loading messages…</div>
      ) : (
        <MessageList
          messages={messages}
          currentUserId={user.id}
          membersById={membersById}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <TypingIndicator typingUserIds={typingUserIds} membersById={membersById} />
      <MessageInput onSend={handleSend} onTyping={notifyTyping} disabled={loading} />
    </div>
  );
}
