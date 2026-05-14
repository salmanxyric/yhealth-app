'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface RingtoneOption {
  id: string;
  label: string;
  file: string;
}

export const RINGTONE_OPTIONS: RingtoneOption[] = [
  { id: 'ring1', label: 'Harmony', file: '/ring/ring1.mp3' },
  { id: 'ring2', label: 'Pulse', file: '/ring/ring2.mp3' },
  { id: 'ring3', label: 'Serenity', file: '/ring/ring3.mp3' },
];

const STORAGE_KEY = 'yhealth-call-ringtone';
const DEFAULT_RINGTONE = 'ring1';

function getSavedRingtone(): string {
  if (typeof window === 'undefined') return DEFAULT_RINGTONE;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_RINGTONE;
}

export function useRingtone() {
  const [selectedRingtone, setSelectedRingtone] = useState(DEFAULT_RINGTONE);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    setSelectedRingtone(getSavedRingtone());
  }, []);

  const getAudioFile = useCallback(
    (id?: string) => {
      const ringtoneId = id || selectedRingtone;
      return RINGTONE_OPTIONS.find((r) => r.id === ringtoneId)?.file || RINGTONE_OPTIONS[0].file;
    },
    [selectedRingtone],
  );

  const play = useCallback(
    (loop = true) => {
      stop();
      const audio = new Audio(getAudioFile());
      audio.loop = loop;
      audio.volume = 0.7;
      audioRef.current = audio;
      isPlayingRef.current = true;
      audio.play().catch(() => {});
    },
    [getAudioFile],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audioRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  const preview = useCallback(
    (ringtoneId: string) => {
      stop();
      const file = getAudioFile(ringtoneId);
      const audio = new Audio(file);
      audio.loop = false;
      audio.volume = 0.7;
      audioRef.current = audio;
      isPlayingRef.current = true;
      audio.play().catch(() => {});
      audio.addEventListener('ended', () => {
        isPlayingRef.current = false;
        audioRef.current = null;
      });
    },
    [getAudioFile, stop],
  );

  const select = useCallback(
    (ringtoneId: string) => {
      setSelectedRingtone(ringtoneId);
      localStorage.setItem(STORAGE_KEY, ringtoneId);
    },
    [],
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    selectedRingtone,
    ringtones: RINGTONE_OPTIONS,
    play,
    stop,
    preview,
    select,
    isPlaying: isPlayingRef.current,
  };
}
