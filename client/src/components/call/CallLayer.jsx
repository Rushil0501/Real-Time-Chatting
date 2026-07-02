import { CallModal } from './CallModal.jsx';
import { ActiveCallBar } from './ActiveCallBar.jsx';
import { IncomingCallToast } from './IncomingCallToast.jsx';

export function CallLayer() {
  return (
    <>
      <CallModal />
      <ActiveCallBar />
      <IncomingCallToast />
    </>
  );
}
