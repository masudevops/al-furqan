export interface AudioTrack {
  number: number;
  text: string;
  audio: string;
  surahNumber: number;
  surahName: string;
}

export type AudioPlaybackError =
  | "invalid-source"
  | "playback-failed"
  | "media-unavailable";

export function isValidAudioUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidAudioTrack(track: AudioTrack): boolean {
  return (
    Number.isInteger(track.number) &&
    track.number > 0 &&
    Number.isInteger(track.surahNumber) &&
    track.surahNumber >= 1 &&
    track.surahNumber <= 114 &&
    track.surahName.trim().length > 0 &&
    isValidAudioUrl(track.audio)
  );
}

export function sanitizeAudioPlaylist(tracks: AudioTrack[]): AudioTrack[] {
  return tracks.filter(isValidAudioTrack);
}

export function clampSeekTime(time: number, duration: number): number {
  if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return Math.min(duration, Math.max(0, time));
}

export function normalizeStartIndex(
  requestedIndex: number,
  playlistLength: number,
): number {
  if (playlistLength <= 0) return -1;
  if (!Number.isInteger(requestedIndex)) return 0;
  return Math.min(playlistLength - 1, Math.max(0, requestedIndex));
}
