export function TypingIndicator({ typingUserIds, membersById }) {
  if (typingUserIds.length === 0) return <div className="typing-indicator" />;

  const names = typingUserIds.map((id) => membersById.get(id)?.displayName ?? 'Someone');
  const text = names.length === 1 ? `${names[0]} is typing…` : `${names.join(', ')} are typing…`;

  return <div className="typing-indicator">{text}</div>;
}
