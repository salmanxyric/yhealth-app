/**
 * Chat call WebRTC client.
 *
 * Uses Socket.IO only for signaling. Media stays peer-to-peer.
 */

import { getSocket } from '@/lib/socket-client';

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function mediaConstraints(callType: 'voice' | 'video'): MediaStreamConstraints {
  return {
    video: callType === 'video'
      ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user',
        }
      : false,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  };
}

export class ChatCallClient {
  private callId: string;
  private callType: 'voice' | 'video';
  private localStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private iceServers: RTCIceServer[];
  private onRemoteStream: (userId: string, stream: MediaStream) => void;
  private onRemoteStreamRemoved: (userId: string) => void;

  constructor(
    callId: string,
    callType: 'voice' | 'video',
    callbacks: {
      onRemoteStream: (userId: string, stream: MediaStream) => void;
      onRemoteStreamRemoved: (userId: string) => void;
    },
    iceServers?: RTCIceServer[],
  ) {
    this.callId = callId;
    this.callType = callType;
    this.iceServers = iceServers ?? DEFAULT_ICE_SERVERS;
    this.onRemoteStream = callbacks.onRemoteStream;
    this.onRemoteStreamRemoved = callbacks.onRemoteStreamRemoved;
  }

  async start(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia(
      mediaConstraints(this.callType),
    );
    return this.localStream;
  }

  async connectToPeer(peerId: string): Promise<void> {
    if (!this.localStream || this.peerConnections.has(peerId)) return;

    const pc = this.createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    getSocket()?.emit('chat:call:offer', {
      callId: this.callId,
      targetUserId: peerId,
      sdp: offer.sdp,
    });
  }

  async handleOffer(fromUserId: string, sdp: string): Promise<void> {
    if (!this.localStream) return;

    if (this.peerConnections.has(fromUserId)) {
      this.peerConnections.get(fromUserId)?.close();
      this.peerConnections.delete(fromUserId);
    }

    const pc = this.createPeerConnection(fromUserId);
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    getSocket()?.emit('chat:call:answer', {
      callId: this.callId,
      targetUserId: fromUserId,
      sdp: answer.sdp,
    });
  }

  async handleAnswer(fromUserId: string, sdp: string): Promise<void> {
    const pc = this.peerConnections.get(fromUserId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
  }

  async handleIceCandidate(
    fromUserId: string,
    candidate: {
      candidate: string;
      sdpMLineIndex: number | null;
      sdpMid: string | null;
    },
  ): Promise<void> {
    const pc = this.peerConnections.get(fromUserId);
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  removePeer(peerId: string): void {
    this.peerConnections.get(peerId)?.close();
    this.peerConnections.delete(peerId);
    this.onRemoteStreamRemoved(peerId);
  }

  setAudioEnabled(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  setVideoEnabled(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  stop(): void {
    for (const [, pc] of this.peerConnections) {
      pc.close();
    }
    this.peerConnections.clear();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(peerId, pc);

    this.localStream?.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream!);
    });

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      getSocket()?.emit('chat:call:ice-candidate', {
        callId: this.callId,
        targetUserId: peerId,
        candidate: {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
        },
      });
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      this.onRemoteStream(peerId, stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.removePeer(peerId);
      }
    };

    return pc;
  }
}
