'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  CHAT_WALLPAPERS,
  DEFAULT_WALLPAPER_ID,
  type ChatWallpaper,
  type ChatWallpaperId,
} from '../constants/wallpapers';

const STORAGE_KEY = 'chat.wallpaperId';
const SAME_TAB_EVENT = 'chat:wallpaper-change';

function readFromStorage(): ChatWallpaperId {
  if (typeof window === 'undefined') return DEFAULT_WALLPAPER_ID;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw && CHAT_WALLPAPERS.some((w) => w.id === raw)) {
    return raw as ChatWallpaperId;
  }
  return DEFAULT_WALLPAPER_ID;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(SAME_TAB_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(SAME_TAB_EVENT, onChange);
  };
}

export function useChatWallpaper(): {
  id: ChatWallpaperId;
  current: ChatWallpaper;
  setWallpaper: (id: ChatWallpaperId) => void;
} {
  const id = useSyncExternalStore(
    subscribe,
    readFromStorage,
    () => DEFAULT_WALLPAPER_ID,
  );

  const setWallpaper = useCallback((next: ChatWallpaperId) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(SAME_TAB_EVENT));
  }, []);

  const current = CHAT_WALLPAPERS.find((w) => w.id === id) ?? CHAT_WALLPAPERS[0];

  return { id, current, setWallpaper };
}
