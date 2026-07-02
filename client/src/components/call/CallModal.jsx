import { useCall } from '../../context/CallContext.jsx';

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

export function CallModal() {
  const { status, remoteUser, acceptCall, rejectCall, cancelCall } = useCall();

  if (status !== 'ringing' && status !== 'calling') return null;

  const isRinging = status === 'ringing';

  return (
    <div className="modal-backdrop">
      <div className="modal call-modal">
        <div className="call-avatar-lg">{initials(remoteUser?.displayName)}</div>
        <h3>{remoteUser?.displayName ?? 'Unknown user'}</h3>
        <div className="call-status">{isRinging ? 'Incoming voice call…' : 'Calling…'}</div>
        <div className="call-actions">
          {isRinging ? (
            <>
              <button className="call-btn reject" onClick={rejectCall} aria-label="Decline call">
                ✕
              </button>
              <button className="call-btn accept" onClick={acceptCall} aria-label="Accept call">
                ✓
              </button>
            </>
          ) : (
            <button className="call-btn reject" onClick={cancelCall} aria-label="Cancel call">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
