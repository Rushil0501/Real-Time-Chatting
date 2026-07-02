import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem.jsx';

export function MessageList({ messages, currentUserId, membersById, onEdit, onDelete }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <p>No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
          senderName={membersById.get(message.senderId)?.displayName ?? 'Unknown'}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
