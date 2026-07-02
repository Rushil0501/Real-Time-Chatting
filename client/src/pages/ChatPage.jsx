import { useCallback, useEffect, useState } from 'react';
import { channelApi } from '../api/index.js';
import { useSocket } from '../hooks/useSocket.js';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { ChatWindow } from '../components/chat/ChatWindow.jsx';
import { CallLayer } from '../components/call/CallLayer.jsx';

function sortByRecent(channels) {
  return [...channels].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}

export function ChatPage() {
  const { socket } = useSocket();
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadChannels = useCallback(() => {
    return channelApi.list().then((list) => {
      setChannels(sortByRecent(list));
      return list;
    });
  }, []);

  useEffect(() => {
    loadChannels()
      .then((list) => {
        setSelectedChannelId((prev) => prev ?? list[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [loadChannels]);

  const upsertChannel = useCallback((channel) => {
    setChannels((prev) => {
      const exists = prev.some((c) => c.id === channel.id);
      const next = exists ? prev.map((c) => (c.id === channel.id ? channel : c)) : [channel, ...prev];
      return sortByRecent(next);
    });
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    function handleCreated({ channel }) {
      upsertChannel(channel);
      socket.emit('channel:join', { channelId: channel.id });
    }

    function handleUpdated({ channel }) {
      upsertChannel(channel);
    }

    function handleNewMessage({ message }) {
      setChannels((prev) =>
        sortByRecent(prev.map((c) => (c.id === message.channelId ? { ...c, lastMessageAt: message.createdAt } : c)))
      );
    }

    socket.on('channel:created', handleCreated);
    socket.on('channel:updated', handleUpdated);
    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('channel:created', handleCreated);
      socket.off('channel:updated', handleUpdated);
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, upsertChannel]);

  // A push-notification click posts a message from the service worker so we can
  // deep-link straight into the relevant channel once the tab regains focus.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    function handleMessage(event) {
      if (event.data?.type === 'notification-click' && event.data.channelId) {
        setSelectedChannelId(event.data.channelId);
      }
    }
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  const handleChannelCreated = useCallback(
    (channel) => {
      upsertChannel(channel);
      setSelectedChannelId(channel.id);
    },
    [upsertChannel]
  );

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null;

  if (loading) {
    return <div className="center-loading">Loading…</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onChannelCreated={handleChannelCreated}
      />
      {selectedChannel ? (
        <ChatWindow key={selectedChannel.id} channel={selectedChannel} />
      ) : (
        <div className="empty-state">
          <h2>No conversations yet</h2>
          <p>Start a direct message or create a group to get chatting.</p>
        </div>
      )}
      <CallLayer />
    </div>
  );
}
