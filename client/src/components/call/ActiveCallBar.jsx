import { useCall } from '../../context/CallContext.jsx';

export function ActiveCallBar() {
  const { status, remoteUser, muted, toggleMute, endCall } = useCall();

  if (status !== 'active') return null;

  return (
    <div className="call-bar">
      <div className="avatar sm">{(remoteUser?.displayName || '?').charAt(0).toUpperCase()}</div>
      <span>Voice call with {remoteUser?.displayName ?? 'user'}</span>
      <button className="btn-icon" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
        {muted ? '🔇' : '🎤'}
      </button>
      <button className="btn btn-danger" onClick={endCall}>
        End call
      </button>
    </div>
  );
}
