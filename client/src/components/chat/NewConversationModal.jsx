import { useEffect, useState } from 'react';
import { userApi, channelApi } from '../../api/index.js';

export function NewConversationModal({ onClose, onCreated }) {
  const [mode, setMode] = useState('dm'); // 'dm' | 'group'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return undefined;
    }
    const handle = setTimeout(() => {
      userApi.search(query).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function handlePickDm(user) {
    setBusy(true);
    setError('');
    try {
      const channel = await channelApi.startDm(user.id);
      onCreated(channel);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to start conversation');
    } finally {
      setBusy(false);
    }
  }

  function toggleSelected(user) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (selected.length === 0 || !groupName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const channel = await channelApi.create({
        type: 'group',
        name: groupName.trim(),
        memberIds: selected.map((u) => u.id),
      });
      onCreated(channel);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create group');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={mode === 'dm' ? 'btn' : 'btn btn-secondary'}
            onClick={() => setMode('dm')}
            type="button"
          >
            Direct message
          </button>
          <button
            className={mode === 'group' ? 'btn' : 'btn btn-secondary'}
            onClick={() => setMode('group')}
            type="button"
          >
            New group
          </button>
        </div>

        {mode === 'group' && (
          <input
            className="input"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{ marginBottom: 10 }}
          />
        )}

        {mode === 'group' && selected.length > 0 && (
          <div className="composer-attachments" style={{ marginBottom: 10 }}>
            {selected.map((u) => (
              <span key={u.id} className="composer-attachment-chip">
                {u.displayName}
                <button type="button" className="btn-icon" onClick={() => toggleSelected(u)}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          className="input"
          placeholder="Search by username or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div style={{ maxHeight: 240, overflowY: 'auto', marginTop: 10 }}>
          {results.map((user) => (
            <div
              key={user.id}
              className="search-result"
              onClick={() => (mode === 'dm' ? handlePickDm(user) : toggleSelected(user))}
            >
              <div className="avatar sm">{user.displayName.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user.displayName}</div>
                <div className="channel-item-sub">@{user.username}</div>
              </div>
              {mode === 'group' && selected.some((u) => u.id === user.id) && <span style={{ marginLeft: 'auto' }}>✓</span>}
            </div>
          ))}
        </div>

        {error && <div className="error-text" style={{ marginTop: 10 }}>{error}</div>}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          {mode === 'group' && (
            <button className="btn" onClick={handleCreateGroup} disabled={busy || selected.length === 0 || !groupName.trim()}>
              Create group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
