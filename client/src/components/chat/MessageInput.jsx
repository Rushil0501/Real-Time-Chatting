import { useRef, useState } from 'react';
import { uploadApi } from '../../api/index.js';

export function MessageInput({ onSend, onTyping, disabled }) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await uploadApi.uploadFile(file);
      setAttachments((prev) => [...prev, attachment]);
    } catch (err) {
      console.error('upload failed', err);
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(url) {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend({ content: trimmed, attachments });
    setContent('');
    setAttachments([]);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="composer">
      {attachments.length > 0 && (
        <div className="composer-attachments">
          {attachments.map((a) => (
            <span key={a.url} className="composer-attachment-chip">
              📎 {a.fileName}
              <button className="btn-icon" onClick={() => removeAttachment(a.url)} type="button">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="composer-row">
        <button
          className="btn-icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          title="Attach file"
          type="button"
        >
          📎
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        <textarea
          className="input"
          placeholder="Type a message…"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <button
          className="btn"
          onClick={handleSend}
          disabled={disabled || uploading || (!content.trim() && attachments.length === 0)}
        >
          {uploading ? 'Uploading…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
