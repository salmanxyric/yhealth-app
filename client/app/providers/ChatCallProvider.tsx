'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSocket, initSocket } from '@/lib/socket-client';
import { cn } from '@/lib/utils';
import { ChatCallClient } from '@/lib/webrtc/chat-call-client';
import { useAuth } from '@/app/context/AuthContext';
import { useRingtone } from '@/hooks/use-ringtone';

interface ChatCallPayload {
  id: string;
  callId: string;
  chatId: string;
  chatName: string;
  callType: 'voice' | 'video';
  isGroupCall: boolean;
  initiatorId: string;
  initiatorName: string;
  initiatorAvatar?: string | null;
  status: 'ringing' | 'active' | 'ended' | 'declined' | 'missed' | 'cancelled';
  createdAt: string;
  startedAt?: string | null;
  participantIds: string[];
  acceptedUserIds: string[];
  invitedUserIds: string[];
}

interface CallParticipant {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface ChatCallContextValue {
  startCall: (chatId: string, callType: 'voice' | 'video') => void;
  activeCall: ChatCallPayload | null;
}

const ChatCallContext = createContext<ChatCallContextValue | null>(null);

export function useChatCall(): ChatCallContextValue {
  const value = useContext(ChatCallContext);
  if (!value) {
    throw new Error('useChatCall must be used inside ChatCallProvider');
  }
  return value;
}

function StreamVideo({
  stream,
  muted = false,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
    return () => {
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn('h-full w-full object-cover', className)}
    />
  );
}

export function ChatCallProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const ringtone = useRingtone();
  const [incomingCall, setIncomingCall] = useState<ChatCallPayload | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<ChatCallPayload | null>(null);
  const [activeCall, setActiveCall] = useState<ChatCallPayload | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const clientRef = useRef<ChatCallClient | null>(null);
  const currentCallRef = useRef<ChatCallPayload | null>(null);

  useEffect(() => {
    currentCallRef.current = activeCall || outgoingCall || incomingCall;
  }, [activeCall, outgoingCall, incomingCall]);

  useEffect(() => {
    return () => {
      const call = currentCallRef.current;
      if (call?.status === 'active') {
        getSocket()?.emit('chat:call:end', { callId: call.callId });
      } else if (call?.status === 'ringing') {
        getSocket()?.emit('chat:call:cancel', { callId: call.callId });
      }
      clientRef.current?.stop();
    };
  }, []);

  const stopClient = useCallback(() => {
    clientRef.current?.stop();
    clientRef.current = null;
    setLocalStream(null);
    setRemoteStreams(new Map());
    setAudioEnabled(true);
    setVideoEnabled(true);
    setCallStartedAt(null);
    setElapsedSeconds(0);
  }, []);

  const ensureClient = useCallback(async (call: ChatCallPayload) => {
    if (clientRef.current) return clientRef.current;
    const client = new ChatCallClient(call.callId, call.callType, {
      onRemoteStream: (userId, stream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(userId, stream);
          return next;
        });
      },
      onRemoteStreamRemoved: (userId) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      },
    });
    clientRef.current = client;
    const stream = await client.start();
    setLocalStream(stream);
    setVideoEnabled(call.callType === 'video');
    return client;
  }, []);

  const clearCall = useCallback(() => {
    setIncomingCall(null);
    setOutgoingCall(null);
    setActiveCall(null);
    stopClient();
  }, [stopClient]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const socket = initSocket() || getSocket();
    if (!socket) return;

    const onIncoming = (call: ChatCallPayload) => {
      if (currentCallRef.current) {
        socket.emit('chat:call:decline', { callId: call.callId });
        return;
      }
      setIncomingCall(call);
    };

    const onOutgoing = async (call: ChatCallPayload) => {
      try {
        setOutgoingCall(call);
        await ensureClient(call);
      } catch {
        socket.emit('chat:call:cancel', { callId: call.callId });
        clearCall();
        toast({
          title: 'Camera or microphone blocked',
          description: 'Allow media access to place a call.',
          variant: 'destructive',
        });
      }
    };

    const onParticipantsList = async (data: {
      call: ChatCallPayload;
      participants: CallParticipant[];
      self?: CallParticipant;
    }) => {
      try {
        const client = await ensureClient(data.call);
        setIncomingCall(null);
        setOutgoingCall(null);
        setActiveCall({ ...data.call, status: 'active' });
        setCallStartedAt(Date.now());
        for (const participant of data.participants) {
          await client.connectToPeer(participant.userId);
        }
      } catch {
        socket.emit('chat:call:end', { callId: data.call.callId });
        clearCall();
        toast({
          title: 'Could not join call',
          description: 'Check camera and microphone permissions.',
          variant: 'destructive',
        });
      }
    };

    const onAccepted = (data: { call: ChatCallPayload }) => {
      const current = currentCallRef.current;
      if (!current || current.callId !== data.call.callId) return;
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall({ ...data.call, status: 'active' });
      setCallStartedAt((prev) => prev ?? Date.now());
    };

    const onFinished = () => {
      clearCall();
    };

    const onOffer = (data: { callId: string; fromUserId: string; sdp: string }) => {
      if (currentCallRef.current?.callId !== data.callId) return;
      clientRef.current?.handleOffer(data.fromUserId, data.sdp);
    };

    const onAnswer = (data: { callId: string; fromUserId: string; sdp: string }) => {
      if (currentCallRef.current?.callId !== data.callId) return;
      clientRef.current?.handleAnswer(data.fromUserId, data.sdp);
    };

    const onIceCandidate = (data: {
      callId: string;
      fromUserId: string;
      candidate: { candidate: string; sdpMLineIndex: number | null; sdpMid: string | null };
    }) => {
      if (currentCallRef.current?.callId !== data.callId) return;
      clientRef.current?.handleIceCandidate(data.fromUserId, data.candidate);
    };

    const onParticipantLeft = (data: { callId: string; userId: string }) => {
      if (currentCallRef.current?.callId !== data.callId) return;
      clientRef.current?.removePeer(data.userId);
    };

    const onError = (data: { message?: string }) => {
      toast({
        title: 'Call error',
        description: data.message || 'The call could not be completed.',
        variant: 'destructive',
      });
    };

    socket.on('chat:call:incoming', onIncoming);
    socket.on('chat:call:outgoing', onOutgoing);
    socket.on('chat:call:participants-list', onParticipantsList);
    socket.on('chat:call:accepted', onAccepted);
    socket.on('chat:call:declined', onFinished);
    socket.on('chat:call:cancelled', onFinished);
    socket.on('chat:call:ended', onFinished);
    socket.on('chat:call:offer', onOffer);
    socket.on('chat:call:answer', onAnswer);
    socket.on('chat:call:ice-candidate', onIceCandidate);
    socket.on('chat:call:participant-left', onParticipantLeft);
    socket.on('chat:call:error', onError);

    return () => {
      socket.off('chat:call:incoming', onIncoming);
      socket.off('chat:call:outgoing', onOutgoing);
      socket.off('chat:call:participants-list', onParticipantsList);
      socket.off('chat:call:accepted', onAccepted);
      socket.off('chat:call:declined', onFinished);
      socket.off('chat:call:cancelled', onFinished);
      socket.off('chat:call:ended', onFinished);
      socket.off('chat:call:offer', onOffer);
      socket.off('chat:call:answer', onAnswer);
      socket.off('chat:call:ice-candidate', onIceCandidate);
      socket.off('chat:call:participant-left', onParticipantLeft);
      socket.off('chat:call:error', onError);
    };
  }, [clearCall, ensureClient, isAuthenticated, isLoading, toast]);

  // Play ringtone for incoming/outgoing ringing state, stop on answer/end
  useEffect(() => {
    if (incomingCall || (outgoingCall && !activeCall)) {
      ringtone.play(true);
    } else {
      ringtone.stop();
    }
  }, [incomingCall, outgoingCall, activeCall, ringtone]);

  useEffect(() => {
    if (!callStartedAt) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [callStartedAt]);

  const startCall = useCallback((chatId: string, callType: 'voice' | 'video') => {
    const socket = getSocket();
    if (!socket) {
      toast({
        title: 'Not connected',
        description: 'Realtime connection is unavailable.',
        variant: 'destructive',
      });
      return;
    }
    socket.emit('chat:call:invite', { chatId, callType });
  }, [toast]);

  const acceptIncoming = useCallback(async () => {
    if (!incomingCall) return;
    try {
      await ensureClient(incomingCall);
      getSocket()?.emit('chat:call:accept', { callId: incomingCall.callId });
    } catch {
      getSocket()?.emit('chat:call:decline', { callId: incomingCall.callId });
      clearCall();
      toast({
        title: 'Media permission needed',
        description: 'Allow microphone and camera access to answer.',
        variant: 'destructive',
      });
    }
  }, [clearCall, ensureClient, incomingCall, toast]);

  const declineIncoming = useCallback(() => {
    if (!incomingCall) return;
    getSocket()?.emit('chat:call:decline', { callId: incomingCall.callId });
    clearCall();
  }, [clearCall, incomingCall]);

  const cancelOutgoing = useCallback(() => {
    if (!outgoingCall) return;
    getSocket()?.emit('chat:call:cancel', { callId: outgoingCall.callId });
    clearCall();
  }, [clearCall, outgoingCall]);

  const endActive = useCallback(() => {
    if (!activeCall) return;
    getSocket()?.emit('chat:call:end', { callId: activeCall.callId });
    clearCall();
  }, [activeCall, clearCall]);

  const toggleAudio = useCallback(() => {
    const call = activeCall || outgoingCall;
    if (!call) return;
    const next = !audioEnabled;
    clientRef.current?.setAudioEnabled(next);
    setAudioEnabled(next);
    getSocket()?.emit('chat:call:media-state', {
      callId: call.callId,
      audioEnabled: next,
      videoEnabled,
    });
  }, [activeCall, audioEnabled, outgoingCall, videoEnabled]);

  const toggleVideo = useCallback(() => {
    const call = activeCall || outgoingCall;
    if (!call || call.callType !== 'video') return;
    const next = !videoEnabled;
    clientRef.current?.setVideoEnabled(next);
    setVideoEnabled(next);
    getSocket()?.emit('chat:call:media-state', {
      callId: call.callId,
      audioEnabled,
      videoEnabled: next,
    });
  }, [activeCall, audioEnabled, outgoingCall, videoEnabled]);

  const value = useMemo(() => ({ startCall, activeCall }), [activeCall, startCall]);
  const remoteStream = remoteStreams.values().next().value as MediaStream | undefined;
  const visibleCall = activeCall || outgoingCall || incomingCall;

  // Play remote audio for voice calls via a hidden <audio> element
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !remoteStream) {
      if (audio) audio.srcObject = null;
      return;
    }
    audio.srcObject = remoteStream;
    audio.play().catch(() => {});
    return () => {
      if (audio.srcObject === remoteStream) audio.srcObject = null;
    };
  }, [remoteStream]);

  return (
    <ChatCallContext.Provider value={value}>
      {/* Hidden audio element for playing remote audio in voice calls */}
      <audio ref={audioRef} autoPlay playsInline />
      {children}

      {incomingCall && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0b1020]/95 p-6 text-center shadow-2xl shadow-black/60 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300">
            <div className="relative mx-auto mb-5 flex h-28 w-28 items-center justify-center">
              <span className="absolute h-20 w-20 rounded-full bg-emerald-400/20 motion-safe:animate-ping motion-reduce:hidden" />
              <span className="absolute h-24 w-24 rounded-full border border-emerald-300/25 motion-safe:animate-pulse motion-reduce:hidden" />
              <span className="absolute h-28 w-28 rounded-full border border-emerald-300/10 motion-safe:animate-ping motion-safe:[animation-delay:250ms] motion-reduce:hidden" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 shadow-[0_0_42px_rgba(52,211,153,0.22)] ring-1 ring-emerald-400/30 motion-safe:animate-pulse">
                {incomingCall.callType === 'video' ? <Video className="h-9 w-9 text-emerald-300" /> : <Phone className="h-9 w-9 text-emerald-300" />}
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Incoming {incomingCall.callType} call</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{incomingCall.initiatorName}</h2>
            <p className="mt-1 text-sm text-slate-400">{incomingCall.chatName}</p>
            <div className="mt-7 flex items-center justify-center gap-5">
              <Button onClick={declineIncoming} className="h-14 w-14 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/20 transition-transform hover:scale-105 hover:bg-red-400 active:scale-95" aria-label="Decline call">
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button onClick={acceptIncoming} className="h-14 w-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-transform motion-safe:animate-bounce hover:scale-105 hover:bg-emerald-400 active:scale-95" aria-label="Accept call">
                <Phone className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {outgoingCall && !activeCall && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0b1020]/95 p-6 text-center shadow-2xl shadow-black/60 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300">
            <div className="relative mx-auto mb-5 flex h-28 w-28 items-center justify-center">
              <span className="absolute h-20 w-20 rounded-full bg-sky-400/20 motion-safe:animate-ping motion-reduce:hidden" />
              <span className="absolute h-24 w-24 rounded-full border border-sky-300/25 motion-safe:animate-pulse motion-reduce:hidden" />
              <span className="absolute h-28 w-28 rounded-full border border-sky-300/10 motion-safe:animate-ping motion-safe:[animation-delay:300ms] motion-reduce:hidden" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-sky-500/15 shadow-[0_0_42px_rgba(125,211,252,0.22)] ring-1 ring-sky-400/30 motion-safe:animate-pulse">
                {outgoingCall.callType === 'video' ? <Video className="h-9 w-9 text-sky-300" /> : <Phone className="h-9 w-9 text-sky-300" />}
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">Calling</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{outgoingCall.chatName}</h2>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-slate-400">
              <span>Waiting for answer</span>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 motion-safe:animate-bounce motion-safe:[animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 motion-safe:animate-bounce motion-safe:[animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 motion-safe:animate-bounce motion-safe:[animation-delay:240ms]" />
            </div>
            <Button onClick={cancelOutgoing} className="mt-7 h-14 w-14 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/20 transition-transform hover:scale-105 hover:bg-red-400 active:scale-95" aria-label="Cancel call">
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {activeCall && visibleCall && (
        <div className="fixed inset-0 z-[95] bg-[#030712] text-white">
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{activeCall.callType} call</p>
              <h2 className="text-lg font-semibold">{activeCall.chatName}</h2>
              <p className="text-sm text-slate-400">{Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}</p>
            </div>
            <Button onClick={endActive} variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/15">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {activeCall.callType === 'video' ? (
            <div className="h-full w-full">
              {remoteStream ? (
                <StreamVideo stream={remoteStream} />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-950">
                  <div className="text-center">
                    <Video className="mx-auto h-10 w-10 text-slate-500" />
                    <p className="mt-3 text-sm text-slate-400">Waiting for video...</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-28 right-4 h-40 w-28 overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
                <StreamVideo stream={localStream} muted />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_42%),#030712]">
              <div className="text-center">
                <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
                  <span className="absolute h-28 w-28 rounded-full border border-emerald-300/20 motion-safe:animate-ping motion-reduce:hidden" />
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/15 shadow-[0_0_48px_rgba(52,211,153,0.18)] ring-1 ring-emerald-300/25">
                    <Phone className="h-12 w-12 text-emerald-300" />
                  </div>
                </div>
                <h2 className="mt-5 text-2xl font-semibold">{activeCall.chatName}</h2>
                <p className="mt-2 text-sm text-slate-400">{remoteStreams.size + 1} participant{remoteStreams.size === 0 ? '' : 's'} connected</p>
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black via-black/70 to-transparent px-4 pb-8 pt-16">
            <Button onClick={toggleAudio} className="h-14 w-14 rounded-full bg-white/12 text-white hover:bg-white/20" aria-label="Toggle microphone">
              {audioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6 text-red-300" />}
            </Button>
            {activeCall.callType === 'video' && (
              <Button onClick={toggleVideo} className="h-14 w-14 rounded-full bg-white/12 text-white hover:bg-white/20" aria-label="Toggle camera">
                {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6 text-red-300" />}
              </Button>
            )}
            <Button onClick={endActive} className="h-16 w-16 rounded-full bg-red-500 text-white hover:bg-red-400" aria-label="End call">
              <PhoneOff className="h-7 w-7" />
            </Button>
          </div>
        </div>
      )}
    </ChatCallContext.Provider>
  );
}
