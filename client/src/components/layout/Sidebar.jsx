import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePresence } from '../../hooks/usePresence.js';
import { usePushNotifications } from '../../hooks/usePushNotifications.js';
import { ChannelList, otherDmMember } from '../chat/ChannelList.jsx';
import { NewConversationModal } from '../chat/NewConversationModal.jsx';

export function Sidebar({ channels, selectedChannelId, onSelectChannel, onChannelCreated }) {
  const { user, logout } = useAuth();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const { isSupported: pushSupported, subscribed, subscribe, unsubscribe } = usePushNotifications();

  const otherUserIds = useMemo(() => {
    const ids = channels
      .filter((c) => c.type === 'dm')
      .map((c) => otherDmMember(c, user.id)?.id)
      .filter(Boolean);
    return [...new Set(ids)];
  }, [channels, user.id]);

  const onlineUserIds = usePresence(otherUserIds);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {pushSupported && (
            <button
              className="btn-icon"
              onClick={() => (subscribed ? unsubscribe() : subscribe())}
              aria-label={subscribed ? 'Disable notifications' : 'Enable notifications'}
              title={subscribed ? 'Disable push notifications' : 'Enable push notifications'}
            >
              {subscribed ? '🔔' : '🔕'}
            </button>
          )}
          <button className="btn-icon" onClick={() => setShowNewConversation(true)} aria-label="New conversation" title="New conversation">
            ＋
          </button>
        </div>
      </div>

      <ChannelList
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={onSelectChannel}
        currentUserId={user.id}
        onlineUserIds={onlineUserIds}
      />

      <div className="sidebar-footer">
        <div className="me">
          <div className="avatar sm">{user.displayName.charAt(0).toUpperCase()}</div>
          <span className="me-name">{user.displayName}</span>
        </div>
        <button className="btn-icon" onClick={logout} title="Log out" aria-label="Log out">
          ⏻
        </button>
      </div>

      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} onCreated={onChannelCreated} />
      )}
    </div>
  );
}
