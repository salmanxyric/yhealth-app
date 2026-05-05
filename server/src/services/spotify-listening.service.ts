/**
 * @file Spotify Listening Service
 * @description Fetches recently played tracks, extracts audio features, derives mood tags,
 *              and stores listening history for mood–music correlation analysis.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

interface SpotifyPlayHistoryItem {
  track: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
  };
  played_at: string;
}

interface SpotifyAudioFeature {
  id: string;
  valence: number;
  energy: number;
  tempo: number;
}

type MoodTag = 'happy' | 'calm' | 'aggressive' | 'melancholic' | 'energetic';

interface ListeningRecord {
  listened_at: string;
  track_name: string;
  artist_name: string;
  valence: number;
  energy: number;
  tempo: number;
  mood_tag: MoodTag;
}

// ============================================
// SERVICE
// ============================================

class SpotifyListeningService {
  private static readonly RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=50';
  private static readonly AUDIO_FEATURES_URL = 'https://api.spotify.com/v1/audio-features';
  private static readonly MAX_RETRIES = 3;

  // ------------------------------------------
  // Spotify API helpers
  // ------------------------------------------

  private async spotifyFetch<T>(url: string, accessToken: string, attempt = 0): Promise<T> {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '1', 10);
      if (attempt < SpotifyListeningService.MAX_RETRIES) {
        logger.warn('[SpotifyListening] Rate limited, retrying', { retryAfter, attempt });
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return this.spotifyFetch<T>(url, accessToken, attempt + 1);
      }
      throw new Error(`Spotify rate limit exceeded after ${SpotifyListeningService.MAX_RETRIES} retries`);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Spotify API ${res.status}: ${body.slice(0, 200)}`);
    }

    return res.json() as Promise<T>;
  }

  // ------------------------------------------
  // Mood derivation
  // ------------------------------------------

  private deriveMoodTag(valence: number, energy: number): MoodTag {
    if (valence > 0.6 && energy > 0.6) return 'happy';
    if (valence > 0.6 && energy <= 0.6) return 'calm';
    if (valence <= 0.4 && energy > 0.6) return 'aggressive';
    if (valence <= 0.4 && energy <= 0.4) return 'melancholic';
    return 'energetic';
  }

  // ------------------------------------------
  // Public methods
  // ------------------------------------------

  /**
   * Fetch recently played tracks from Spotify, enrich with audio features,
   * derive mood tags, and persist to spotify_listening_history.
   */
  async syncListeningHistory(userId: string, accessToken: string): Promise<number> {
    const { items } = await this.spotifyFetch<{ items: SpotifyPlayHistoryItem[] }>(
      SpotifyListeningService.RECENTLY_PLAYED_URL,
      accessToken,
    );

    if (!items || items.length === 0) {
      logger.debug('[SpotifyListening] No recently played tracks', { userId: userId.slice(0, 8) });
      return 0;
    }

    // Batch-fetch audio features (API supports up to 100 IDs per call)
    const trackIds = [...new Set(items.map((i) => i.track.id).filter(Boolean))];
    const featureMap = new Map<string, SpotifyAudioFeature>();

    for (let i = 0; i < trackIds.length; i += 100) {
      const batch = trackIds.slice(i, i + 100);
      try {
        const { audio_features } = await this.spotifyFetch<{ audio_features: (SpotifyAudioFeature | null)[] }>(
          `${SpotifyListeningService.AUDIO_FEATURES_URL}?ids=${batch.join(',')}`,
          accessToken,
        );
        for (const af of audio_features) {
          if (af) featureMap.set(af.id, af);
        }
      } catch (err) {
        logger.warn('[SpotifyListening] Audio features batch failed, skipping', {
          error: err instanceof Error ? err.message : String(err),
          batchSize: batch.length,
        });
      }
    }

    // Build insert records
    const records: ListeningRecord[] = [];
    for (const item of items) {
      const af = featureMap.get(item.track.id);
      if (!af) continue;

      records.push({
        listened_at: item.played_at,
        track_name: item.track.name,
        artist_name: item.track.artists.map((a) => a.name).join(', '),
        valence: af.valence,
        energy: af.energy,
        tempo: af.tempo,
        mood_tag: this.deriveMoodTag(af.valence, af.energy),
      });
    }

    if (records.length === 0) return 0;

    // Batch INSERT with ON CONFLICT DO NOTHING
    const placeholders = records
      .map(
        (_, idx) =>
          `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`,
      )
      .join(', ');

    const values = records.flatMap((r) => [
      userId,
      r.listened_at,
      r.track_name,
      r.artist_name,
      r.valence,
      r.energy,
      r.tempo,
      r.mood_tag,
    ]);

    const result = await query(
      `INSERT INTO spotify_listening_history
         (user_id, listened_at, track_name, artist_name, valence, energy, tempo, mood_tag)
       VALUES ${placeholders}
       ON CONFLICT (user_id, listened_at, track_name) DO NOTHING`,
      values,
    );

    logger.info('[SpotifyListening] Synced listening history', {
      userId: userId.slice(0, 8),
      fetched: items.length,
      stored: result.rowCount,
    });

    return result.rowCount ?? 0;
  }

  /**
   * Return the most frequently occurring mood tag for a given date.
   */
  async getDominantMood(userId: string, date: string): Promise<string | null> {
    const result = await query<{ mood_tag: string; cnt: string }>(
      `SELECT mood_tag, COUNT(*) AS cnt
       FROM spotify_listening_history
       WHERE user_id = $1 AND listened_at::date = $2::date
       GROUP BY mood_tag
       ORDER BY cnt DESC
       LIMIT 1`,
      [userId, date],
    );

    return result.rows.length > 0 ? result.rows[0].mood_tag : null;
  }

  /**
   * Return average valence, energy, and tempo for a given date.
   */
  async getAverageFeatures(
    userId: string,
    date: string,
  ): Promise<{ avgValence: number; avgEnergy: number; avgTempo: number } | null> {
    const result = await query<{
      avg_valence: string;
      avg_energy: string;
      avg_tempo: string;
      cnt: string;
    }>(
      `SELECT AVG(valence) AS avg_valence,
              AVG(energy)  AS avg_energy,
              AVG(tempo)   AS avg_tempo,
              COUNT(*)     AS cnt
       FROM spotify_listening_history
       WHERE user_id = $1 AND listened_at::date = $2::date`,
      [userId, date],
    );

    const row = result.rows[0];
    if (!row || parseInt(row.cnt, 10) === 0) return null;

    return {
      avgValence: parseFloat(parseFloat(row.avg_valence).toFixed(3)),
      avgEnergy: parseFloat(parseFloat(row.avg_energy).toFixed(3)),
      avgTempo: parseFloat(parseFloat(row.avg_tempo).toFixed(1)),
    };
  }

  /**
   * Compute dominant mood & average features for the date, then insert
   * normalised data_source_signals for the correlation engine.
   */
  async emitSignals(userId: string, date: string): Promise<void> {
    const [dominantMood, avgFeatures] = await Promise.all([
      this.getDominantMood(userId, date),
      this.getAverageFeatures(userId, date),
    ]);

    if (!dominantMood && !avgFeatures) {
      logger.debug('[SpotifyListening] No listening data for signal emission', {
        userId: userId.slice(0, 8),
        date,
      });
      return;
    }

    const signals: Array<{ signalType: string; value: Record<string, unknown> }> = [];

    if (dominantMood) {
      signals.push({
        signalType: 'music_mood',
        value: { mood: dominantMood },
      });
    }

    if (avgFeatures) {
      signals.push({
        signalType: 'music_energy',
        value: {
          avgValence: avgFeatures.avgValence,
          avgEnergy: avgFeatures.avgEnergy,
          avgTempo: avgFeatures.avgTempo,
        },
      });
    }

    for (const sig of signals) {
      await query(
        `INSERT INTO data_source_signals
           (user_id, source_type, signal_type, signal_date, value)
         VALUES ($1, 'spotify', $2, $3::date, $4)
         ON CONFLICT DO NOTHING`,
        [userId, sig.signalType, date, JSON.stringify(sig.value)],
      );
    }

    logger.info('[SpotifyListening] Emitted signals', {
      userId: userId.slice(0, 8),
      date,
      signals: signals.map((s) => s.signalType),
    });
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const spotifyListeningService = new SpotifyListeningService();
export default spotifyListeningService;
