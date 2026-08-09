import {
  FaClock,
  FaList,
  FaPause,
  FaPlay,
  FaRedo,
  FaStepBackward,
  FaStepForward,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import { useState } from "react";
import { useAudio } from "../context/AudioContext";
import {
  PLAYBACK_SPEEDS,
  type PlaybackSpeed,
  type RepeatMode,
} from "../core/audio/preferences";
import { downloadAudioTrack } from "../platform/web/audioDownloads";

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
  const [showDetails, setShowDetails] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const {
    currentAyah,
    isPlaying,
    isLoading,
    error,
    clearError,
    playlist,
    currentIndex,
    playbackSpeed,
    repeatMode,
    repeatRange,
    sleepTimerMinutes,
    playAtIndex,
    togglePlay,
    playNext,
    playPrevious,
    canPlayNext,
    canPlayPrevious,
    stop,
    duration,
    currentTime,
    seek,
    setPlaybackSpeed,
    setRepeatMode,
    setRepeatRange,
    setSleepTimer,
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
          {showDetails && (
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_1fr_2fr]">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Playback speed
                  <select
                    value={playbackSpeed}
                    onChange={(event) =>
                      setPlaybackSpeed(
                        Number(event.target.value) as PlaybackSpeed,
                      )
                    }
                    className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <option key={speed} value={speed}>
                        {speed}×
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Repeat
                  <select
                    value={repeatMode}
                    onChange={(event) =>
                      setRepeatMode(event.target.value as RepeatMode)
                    }
                    className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="off">Off</option>
                    <option value="ayah">Current ayah</option>
                    <option value="range">Ayah range</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Sleep timer
                  <select
                    value={sleepTimerMinutes ?? ""}
                    onChange={(event) =>
                      setSleepTimer(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="">Off</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </label>
              </div>

              {repeatMode === "range" && repeatRange && (
                <fieldset className="mx-auto mt-4 grid max-w-5xl gap-3 sm:grid-cols-2">
                  <legend className="sr-only">Repeat ayah range</legend>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Range start
                    <select
                      value={repeatRange.startIndex}
                      onChange={(event) =>
                        setRepeatRange(
                          Number(event.target.value),
                          repeatRange.endIndex,
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                    >
                      {playlist.map((track, index) => (
                        <option key={`${track.surahNumber}:${track.number}`} value={index}>
                          Ayah {track.number}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Range end
                    <select
                      value={repeatRange.endIndex}
                      onChange={(event) =>
                        setRepeatRange(
                          repeatRange.startIndex,
                          Number(event.target.value),
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                    >
                      {playlist.map((track, index) => (
                        <option key={`${track.surahNumber}:${track.number}`} value={index}>
                          Ayah {track.number}
                        </option>
                      ))}
                    </select>
                  </label>
                </fieldset>
              )}

              <div className="mx-auto mt-4 max-h-44 max-w-5xl overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <p className="sticky top-0 border-b border-gray-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  Queue · {playlist.length} ayahs
                </p>
                <ol>
                  {playlist.map((track, index) => (
                    <li key={`${track.surahNumber}:${track.number}`}>
                      <button
                        type="button"
                        onClick={() => playAtIndex(index)}
                        aria-current={index === currentIndex ? "true" : undefined}
                        className={`block min-h-11 w-full px-3 py-2 text-left text-sm ${
                          index === currentIndex
                            ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {track.surahName} · Ayah {track.number}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

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
              <button type="button" onClick={() => { if (!currentAyah) return; setDownloadState("saving"); void downloadAudioTrack(currentAyah).then(() => setDownloadState("saved")).catch(() => setDownloadState("error")); }} disabled={downloadState === "saving"} aria-label="Download current ayah for offline listening" className="min-h-11 min-w-11 rounded-full p-2 text-gray-400 hover:text-emerald-600 disabled:opacity-50" title={downloadState === "saved" ? "Saved offline" : downloadState === "error" ? "Download failed" : "Save offline"}><FaDownload aria-hidden="true" /></button>

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
              <button
                type="button"
                onClick={() => setShowDetails((value) => !value)}
                aria-expanded={showDetails}
                aria-label="Audio options and queue"
                className={`min-h-11 min-w-11 rounded-full p-2 ${
                  showDetails
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                    : "text-gray-400 hover:text-emerald-600"
                }`}
              >
                {repeatMode !== "off" ? (
                  <FaRedo aria-hidden="true" />
                ) : sleepTimerMinutes ? (
                  <FaClock aria-hidden="true" />
                ) : (
                  <FaList aria-hidden="true" />
                )}
              </button>
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
