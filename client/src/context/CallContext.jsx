import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket.js';

const CallContext = createContext(null);

// Public STUN only, no TURN — calls between peers behind symmetric NAT/restrictive
// firewalls may fail to connect. Acceptable tradeoff at this project's scope; see README.
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export function CallProvider({ children }) {
  const { socket, emitAck } = useSocket();
  const [status, setStatus] = useState('idle'); // idle | calling | ringing | active
  const [remoteUser, setRemoteUser] = useState(null);
  const [endedReason, setEndedReason] = useState('');
  const [muted, setMuted] = useState(false);

  const statusRef = useRef('idle');
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const callIdRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
    callIdRef.current = null;
    remoteUserIdRef.current = null;
    setStatus('idle');
    setRemoteUser(null);
    setMuted(false);
  }, []);

  const endWithReason = useCallback(
    (reason) => {
      setEndedReason(reason);
      cleanup();
    },
    [cleanup]
  );

  const createPeerConnection = useCallback(
    (toUserId) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call:ice-candidate', {
            callId: callIdRef.current,
            toUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [socket]
  );

  const attachLocalStream = useCallback(async (pc) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  }, []);

  const flushPendingCandidates = useCallback(async () => {
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const startCall = useCallback(
    async (user) => {
      if (statusRef.current !== 'idle') return;
      setEndedReason('');
      try {
        const ack = await emitAck('call:invite', { toUserId: user.id });
        callIdRef.current = ack.callId;
        remoteUserIdRef.current = user.id;
        setRemoteUser(user);
        setStatus('calling');
      } catch (err) {
        setEndedReason(err.message);
      }
    },
    [emitAck]
  );

  const cancelCall = useCallback(() => {
    if (callIdRef.current && remoteUserIdRef.current) {
      socket.emit('call:cancel', { callId: callIdRef.current, toUserId: remoteUserIdRef.current });
    }
    cleanup();
  }, [socket, cleanup]);

  // The callee never creates an offer — only the caller does (in handleAccept below).
  // The callee just gets its peer connection + local stream ready and then waits for
  // the caller's offer to arrive via handleOffer. Both sides offering ("glare") leaves
  // the connections in mismatched signaling states and breaks the handshake.
  const acceptCall = useCallback(async () => {
    if (statusRef.current !== 'ringing') return;
    try {
      await emitAck('call:accept', { callId: callIdRef.current, toUserId: remoteUserIdRef.current });
      const pc = createPeerConnection(remoteUserIdRef.current);
      await attachLocalStream(pc);
      setStatus('active');
    } catch (err) {
      endWithReason(err.message);
    }
  }, [emitAck, createPeerConnection, attachLocalStream, endWithReason]);

  const rejectCall = useCallback(() => {
    if (callIdRef.current && remoteUserIdRef.current) {
      socket.emit('call:reject', { callId: callIdRef.current, toUserId: remoteUserIdRef.current });
    }
    cleanup();
  }, [socket, cleanup]);

  const endCall = useCallback(() => {
    if (callIdRef.current && remoteUserIdRef.current) {
      socket.emit('call:end', { callId: callIdRef.current, toUserId: remoteUserIdRef.current });
    }
    cleanup();
  }, [socket, cleanup]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !muted;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !nextMuted;
    });
    setMuted(nextMuted);
  }, [muted]);

  useEffect(() => {
    if (!socket) return undefined;

    function handleIncoming({ callId, fromUserId, fromUser }) {
      if (statusRef.current !== 'idle') {
        socket.emit('call:reject', { callId, toUserId: fromUserId });
        return;
      }
      callIdRef.current = callId;
      remoteUserIdRef.current = fromUserId;
      setEndedReason('');
      setRemoteUser(fromUser);
      setStatus('ringing');
    }

    // Caller receives this once the callee accepts: create our peer connection and offer.
    async function handleAccept({ callId, fromUserId }) {
      if (callIdRef.current !== callId || statusRef.current !== 'calling') return;
      try {
        const pc = createPeerConnection(fromUserId);
        await attachLocalStream(pc);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', { callId, toUserId: fromUserId, sdp: offer });
        setStatus('active');
      } catch (err) {
        endWithReason(err.message);
      }
    }

    async function handleOffer({ callId, fromUserId, sdp }) {
      if (callIdRef.current !== callId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingCandidates();
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('call:answer', { callId, toUserId: fromUserId, sdp: answer });
    }

    async function handleAnswer({ callId, sdp }) {
      if (callIdRef.current !== callId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingCandidates();
    }

    async function handleIceCandidate({ callId, candidate }) {
      if (callIdRef.current !== callId || !pcRef.current) return;
      if (pcRef.current.remoteDescription?.type) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    }

    function handleReject({ callId }) {
      if (callIdRef.current !== callId) return;
      endWithReason('Call declined');
    }

    function handleCancel({ callId }) {
      if (callIdRef.current !== callId) return;
      endWithReason('Call cancelled');
    }

    function handleEnd({ callId }) {
      if (callIdRef.current !== callId) return;
      endWithReason('Call ended');
    }

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accept', handleAccept);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:reject', handleReject);
    socket.on('call:cancel', handleCancel);
    socket.on('call:end', handleEnd);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accept', handleAccept);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:reject', handleReject);
      socket.off('call:cancel', handleCancel);
      socket.off('call:end', handleEnd);
    };
  }, [socket, createPeerConnection, attachLocalStream, flushPendingCandidates, endWithReason]);

  const value = {
    status,
    remoteUser,
    endedReason,
    muted,
    startCall,
    cancelCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    clearEndedReason: () => setEndedReason(''),
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      <audio ref={remoteAudioRef} autoPlay />
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}
