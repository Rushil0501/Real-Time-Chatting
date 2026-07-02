import { useState } from 'react';

function AttachmentView({ attachment }) {
  const url = `${import.meta.env.VITE_API_URL}${attachment.url}`;

  if (attachment.kind === 'image') {
    return (
      <div className="attachment">
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={attachment.fileName} />
        </a>
      </div>
    );
  }
  if (attachment.kind === 'video') {
    return (
      <div className="attachment">
        <video src={url} controls />
      </div>
    );
  }
  if (attachment.kind === 'audio') {
    return (
      <div className="attachment">
        <audio src={url} controls />
      </div>
    );
  }
  return (
    <div className="attachment">
      <a className="attachment-file" href={url} target="_blank" rel="noreferrer" download={attachment.fileName}>
        📎 {attachment.fileName}
      </a>
    </div>
  );
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function MessageItem({ message, isOwn, senderName, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const isDeleted = Boolean(message.deletedAt);
  const isPending = message.id.startsWith('tmp-');

  function submitEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft(message.content);
  }

  return (
    <div className="message-row">
      <div className="avatar sm">{senderName.charAt(0).toUpperCase()}</div>
      <div className="message-content-col">
        <div className="message-meta">
          <span className="message-sender">{senderName}</span>
          <span className="message-time">{isPending ? 'Sending…' : formatTime(message.createdAt)}</span>
          {message.editedAt && !isDeleted && <span className="message-edited-tag">(edited)</span>}
        </div>

        {isEditing ? (
          <div>
            <textarea
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitEdit();
                } else if (e.key === 'Escape') {
                  cancelEdit();
                }
              }}
              autoFocus
              rows={2}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button className="btn" onClick={submitEdit}>
                Save
              </button>
              <button className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`message-text${isDeleted ? ' deleted' : ''}`}>
              {isDeleted ? 'This message was deleted' : message.content}
            </div>
            {!isDeleted && message.attachments?.map((a) => <AttachmentView key={a.url} attachment={a} />)}
          </>
        )}
      </div>

      {isOwn && !isDeleted && !isEditing && !isPending && (
        <div className="message-actions">
          <button className="btn-icon" onClick={() => setIsEditing(true)} title="Edit">
            ✏️
          </button>
          <button className="btn-icon" onClick={() => onDelete(message.id)} title="Delete">
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
