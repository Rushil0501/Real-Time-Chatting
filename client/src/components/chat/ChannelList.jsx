import { PresenceDot } from './PresenceDot.jsx';

function otherDmMember(channel, currentUserId) {
  return channel.members.find((m) => m.user.id !== currentUserId)?.user ?? null;
}

function channelDisplayName(channel, currentUserId) {
  if (channel.type === 'dm') {
    return otherDmMember(channel, currentUserId)?.displayName ?? 'Unknown user';
  }
  return channel.name || 'Untitled';
}

function formatTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ChannelList({ channels, selectedChannelId, onSelectChannel, currentUserId, onlineUserIds }) {
  if (channels.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 24 }}>
        <p>No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="channel-list">
      {channels.map((channel) => {
        const isDm = channel.type === 'dm';
        const other = isDm ? otherDmMember(channel, currentUserId) : null;
        const online = other ? onlineUserIds.has(other.id) : false;
        const name = channelDisplayName(channel, currentUserId);

        return (
          <div
            key={channel.id}
            className={`channel-item${channel.id === selectedChannelId ? ' active' : ''}`}
            onClick={() => onSelectChannel(channel.id)}
          >
            <div className="avatar">
              {name.charAt(0).toUpperCase()}
              {isDm && <PresenceDot online={online} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="channel-item-name">{name}</div>
              <div className="channel-item-sub">
                {isDm ? (online ? 'Online' : 'Offline') : `${channel.members.length} members`}
              </div>
            </div>
            <div className="channel-item-sub">{formatTime(channel.lastMessageAt)}</div>
          </div>
        );
      })}
    </div>
  );
}

export { otherDmMember, channelDisplayName };
