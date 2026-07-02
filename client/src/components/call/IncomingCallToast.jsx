import { useEffect } from 'react';
import { useCall } from '../../context/CallContext.jsx';

const AUTO_DISMISS_MS = 4000;

// Shows a brief toast for terminal call outcomes (declined/cancelled/ended/failed)
// that happen without the user taking an action, so they get feedback either way.
export function IncomingCallToast() {
  const { endedReason, clearEndedReason } = useCall();

  useEffect(() => {
    if (!endedReason) return undefined;
    const timer = setTimeout(clearEndedReason, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [endedReason, clearEndedReason]);

  if (!endedReason) return null;

  return (
    <div className="toast">
      <strong>Call ended</strong>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{endedReason}</div>
    </div>
  );
}
