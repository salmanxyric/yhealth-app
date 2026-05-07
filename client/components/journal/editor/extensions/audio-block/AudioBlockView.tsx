"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2, FileText } from "lucide-react";
import { useVoiceRecorder } from "../../../voice/useVoiceRecorder";

export function AudioBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { audioUrl, duration, transcription, isRecording } = node.attrs;
  const recorder = useVoiceRecorder();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(audioUrl);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-create blob URL when recording stops; revoke previous to avoid memory leaks
  useEffect(() => {
    if (recorder.state === "stopped" && recorder.audioBlob) {
      const url = URL.createObjectURL(recorder.audioBlob);
      setLocalAudioUrl((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      updateAttributes({
        audioUrl: url,
        duration: recorder.durationMs,
        isRecording: false,
      });
    }
  }, [recorder.state, recorder.audioBlob]); // eslint-disable-line react-hooks/exhaustive-deps

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (localAudioUrl && localAudioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localAudioUrl);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track recording elapsed time with a local timer
  useEffect(() => {
    if (recorder.state === "recording") {
      setRecordingElapsed(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingElapsed((prev) => prev + 1000);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [recorder.state]);

  // Start recording on mount if isRecording is true
  useEffect(() => {
    if (isRecording && recorder.state === "idle") {
      recorder.startRecording();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime * 1000);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [localAudioUrl]);

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const durationMs = duration || recorder.durationMs;
  const progress = durationMs > 0 ? (currentTime / durationMs) * 100 : 0;

  return (
    <NodeViewWrapper className="my-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {/* Recording state */}
        {recorder.state === "recording" && (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
              <Mic className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-white/60 text-sm">Recording...</div>
              <div className="text-white/30 text-xs">{formatMs(recordingElapsed)}</div>
            </div>
            <button
              onClick={() => recorder.stopRecording()}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Playback state */}
        {localAudioUrl && recorder.state !== "recording" && (
          <>
            <audio ref={audioRef} src={localAudioUrl} preload="metadata" />
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500/50 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-white/20 text-xs">{formatMs(currentTime)}</span>
                  <span className="text-white/20 text-xs">{formatMs(durationMs)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    updateAttributes({ transcription: "Transcribing..." });
                    // TODO: Wire to transcription API
                  }}
                  title="Transcribe"
                  className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={deleteNode}
                  title="Delete"
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Transcription */}
            {transcription && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="text-white/20 text-xs mb-1 observatory-font-display" style={{ letterSpacing: "0.1em" }}>
                  TRANSCRIPTION
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{transcription}</p>
              </div>
            )}
          </>
        )}

        {/* Permission denied */}
        {recorder.permission === "denied" && (
          <div className="text-amber-400/60 text-sm text-center py-2">
            Microphone access denied. Check browser permissions.
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
