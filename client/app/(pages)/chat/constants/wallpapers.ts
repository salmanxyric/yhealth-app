export type ChatWallpaperId = 'doodle' | 'cw1' | 'cw2' | 'cw3' | 'cw4' | 'cw5';

export interface ChatWallpaper {
  id: ChatWallpaperId;
  name: string;
  preview: string | null;
  src: string | null;
}

export const CHAT_WALLPAPERS: readonly ChatWallpaper[] = [
  { id: 'doodle', name: 'Default', preview: null, src: null },
  { id: 'cw1', name: 'Wallpaper 1', preview: '/chatwallpaper/cw1.jpg', src: '/chatwallpaper/cw1.jpg' },
  { id: 'cw2', name: 'Wallpaper 2', preview: '/chatwallpaper/cw2.jpg', src: '/chatwallpaper/cw2.jpg' },
  { id: 'cw3', name: 'Wallpaper 3', preview: '/chatwallpaper/cw3.jpg', src: '/chatwallpaper/cw3.jpg' },
  { id: 'cw4', name: 'Wallpaper 4', preview: '/chatwallpaper/cw4.jpg', src: '/chatwallpaper/cw4.jpg' },
  { id: 'cw5', name: 'Wallpaper 5', preview: '/chatwallpaper/cw5.jpg', src: '/chatwallpaper/cw5.jpg' },
];

export const DEFAULT_WALLPAPER_ID: ChatWallpaperId = 'doodle';
