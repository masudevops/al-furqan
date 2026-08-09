import {
  FaPause,
  FaPlay,
  FaStepBackward,
  FaStepForward,
  FaTimes,
} from "react-icons/fa";
import { useAudio } from "../context/AudioContext";

function formatTime(time: number): string {
  if (!Number.isFinite(time) || time < 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const ERROR_MESSAGES = {
  "invalid-source": "Audio is not available for this selection.",
  "playback-failed": "Playback could not start. Try again.",
  "media-unavailable": "This audio source could not be loaded.",
} as const;

export default function GlobalPlayer() {
  const {
    currentAyah,
    isPlaying,
    isLoading,
    error,
    clearError,
    togglePlay,
    playNext,
    playPrevious,
    canPlayNext,
    canPlayPrevious,
    stop,
    duration,
    currentTime,
    seek,
  } = useAudio();

  if (!currentAyah && !error) return null;

  return (
    <section
      aria-label="Quran audio player"
      className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:border-gray-700 dark:bg-gray-800"
    >
      {error && (
        <div
          role="alert"
          className="flex items-center justify-center gap-3 border-b border-red-100 bg-red-50 px-4 py-2 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
        >
          <span>{ERROR_MESSAGES[error]}</span>
          {!currentAyah && (
            <button
              type="button"
              onClick={clearError}
              className="rounded px-2 py-1 font-medium underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {currentAyah && (
        <>
          <label className="sr-only" htmlFor="audio-progress">
            Audio progress
          </label>
          <input
            id="audio-progress"
            type="range"
            min="0"
            max={duration || 0}
            step="1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={duration <= 0}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className="block h-2 w-full cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
          />

          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                {currentAyah.surahName}
              </p>
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                Ayah {currentAyah.number}
                {isLoading ? " • Loading…" : ""}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={playPrevious}
                disabled={!canPlayPrevious}
                aria-label="Previous ayah"
                className="min-h-11 min-w-11 rounded-full p-2 text-gray-600 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300"
              >
                <FaStepBackward aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                disabled={isLoading}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
              >
                {isPlaying ? (
                  <FaPause aria-hidden="true" />
                ) : (
                  <FaPlay className="ml-0.5" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={playNext}
                disabled={!canPlayNext}
                aria-label="Next ayah"
                className="min-h-11 min-w-11 rounded-full p-2 text-gray-600 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300"
              >
                <FaStepForward aria-hidden="true" />
              </button>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4">
              <span className="hidden font-mono text-xs text-gray-500 dark:text-gray-400 sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                type="button"
                onClick={stop}
                aria-label="Close audio player"
                className="min-h-11 min-w-11 rounded-full p-2 text-gray-400 hover:text-red-500"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
