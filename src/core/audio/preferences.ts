import type { KeyValueStorage } from "../quran/readerPreferences";

export const AUDIO_PREFERENCES_KEY = "alFurqan.audio.preferences";

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
export type RepeatMode = "off" | "ayah" | "range";

export interface AudioPreferences {
  playbackSpeed: PlaybackSpeed;
  repeatMode: RepeatMode;
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  playbackSpeed: 1,
  repeatMode: "off",
};

export function isPlaybackSpeed(value: unknown): value is PlaybackSpeed {
  return PLAYBACK_SPEEDS.some((speed) => speed === value);
}

export function loadAudioPreferences(
  storage: KeyValueStorage,
): AudioPreferences {
  const raw = storage.getItem(AUDIO_PREFERENCES_KEY);
  if (!raw) return DEFAULT_AUDIO_PREFERENCES;

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return DEFAULT_AUDIO_PREFERENCES;
    }
    const preferences = value as Partial<AudioPreferences>;
    return {
      playbackSpeed: isPlaybackSpeed(preferences.playbackSpeed)
        ? preferences.playbackSpeed
        : DEFAULT_AUDIO_PREFERENCES.playbackSpeed,
      repeatMode:
        preferences.repeatMode === "ayah" ||
        preferences.repeatMode === "range" ||
        preferences.repeatMode === "off"
          ? preferences.repeatMode
          : DEFAULT_AUDIO_PREFERENCES.repeatMode,
    };
  } catch {
    return DEFAULT_AUDIO_PREFERENCES;
  }
}

export function saveAudioPreferences(
  storage: KeyValueStorage,
  preferences: AudioPreferences,
): void {
  storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(preferences));
}

export function normalizeRepeatRange(
  startIndex: number,
  endIndex: number,
  playlistLength: number,
): { startIndex: number; endIndex: number } | null {
  if (playlistLength <= 0) return null;
  const start = Math.min(
    playlistLength - 1,
    Math.max(0, Math.floor(startIndex)),
  );
  const end = Math.min(
    playlistLength - 1,
    Math.max(0, Math.floor(endIndex)),
  );
  return {
    startIndex: Math.min(start, end),
    endIndex: Math.max(start, end),
  };
}
