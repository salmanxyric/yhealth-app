// ============================================================
// Spotify Integration — Shared Types
// ============================================================

/** Activity categories for music matching */
export type SpotifyActivityCategory =
  | 'workout'
  | 'running'
  | 'meditation'
  | 'sleep'
  | 'focus'
  | 'recovery'
  | 'stretching'
  | 'yoga';

/** Simplified Spotify track */
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  external_urls: { spotify: string };
  is_playable?: boolean;
}

/** Simplified Spotify playlist */
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: { url: string; width: number; height: number }[];
  tracks: { total: number };
  owner: { id: string; display_name: string };
  uri: string;
  external_urls: { spotify: string };
}

/** Spotify playback state */
export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  device: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  } | null;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
}

/** Playback control actions */
export type SpotifyPlaybackAction =
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'seek'
  | 'volume'
  | 'shuffle'
  | 'repeat';

/** Spotify connection status */
export interface SpotifyConnectionStatus {
  isConnected: boolean;
  displayName?: string;
  accountType?: 'premium' | 'free' | 'open';
  connectedAt?: string;
  avatarUrl?: string;
}

/** Audio feature profile for activity-based recommendations */
export interface AudioFeatureProfile {
  min_energy?: number;
  max_energy?: number;
  min_tempo?: number;
  max_tempo?: number;
  target_valence?: number;
  min_danceability?: number;
  max_danceability?: number;
  target_instrumentalness?: number;
}

/** Cached playlist row */
export interface CachedPlaylist {
  id: string;
  category: SpotifyActivityCategory;
  spotify_playlist_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  track_count: number;
  cached_tracks: SpotifyTrack[] | null;
  last_refreshed_at: string;
}
