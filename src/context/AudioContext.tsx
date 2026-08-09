import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clampSeekTime,
  normalizeStartIndex,
  sanitizeAudioPlaylist,
  type AudioPlaybackError,
  type AudioTrack,
} from "../core/audio/contracts";
import {
  loadAudioPreferences,
  normalizeRepeatRange,
  saveAudioPreferences,
  type PlaybackSpeed,
  type RepeatMode,
} from "../core/audio/preferences";
import { getDownloadedAudio } from "../platform/web/audioDownloads";

export type AudioAyah = AudioTrack;

interface AudioContextType {
  currentAyah: AudioAyah | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: AudioPlaybackError | null;
  playlist: AudioAyah[];
  currentIndex: number;
  playbackSpeed: PlaybackSpeed;
  repeatMode: RepeatMode;
  repeatRange: { startIndex: number; endIndex: number } | null;
  sleepTimerMinutes: number | null;
  playAyah: (ayah: AudioAyah) => void;
  playPlaylist: (playlist: AudioAyah[], startIndex?: number) => void;
  playAtIndex: (index: number) => void;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
  clearError: () => void;
  currentTime: number;
  duration: number;
  progress: number;
  canPlayNext: boolean;
  canPlayPrevious: boolean;
  playNext: () => void;
  playPrevious: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setRepeatRange: (startIndex: number, endIndex: number) => void;
  setSleepTimer: (minutes: number | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AudioPlaybackError | null>(null);
  const [playlist, setPlaylist] = useState<AudioAyah[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [preferences, setPreferences] = useState(() =>
    loadAudioPreferences(localStorage),
  );
  const [repeatRange, setRepeatRangeState] = useState<{
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(
    null,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldAutoPlayRef = useRef(false);
  const playlistLengthRef = useRef(0);
  const currentIndexRef = useRef(-1);
  const repeatModeRef = useRef<RepeatMode>(preferences.repeatMode);
  const repeatRangeRef = useRef(repeatRange);

  const currentAyah =
    currentIndex >= 0 && currentIndex < playlist.length
      ? playlist[currentIndex]
      : null;
  const canPlayPrevious = currentIndex > 0;
  const canPlayNext =
    currentIndex >= 0 && currentIndex + 1 < playlist.length;
  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  useEffect(() => {
    playlistLengthRef.current = playlist.length;
  }, [playlist.length]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    repeatModeRef.current = preferences.repeatMode;
    saveAudioPreferences(localStorage, preferences);
  }, [preferences]);

  useEffect(() => {
    repeatRangeRef.current = repeatRange;
  }, [repeatRange]);

  const resetProgress = useCallback(() => {
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const playNext = useCallback(() => {
    setCurrentIndex((index) => {
      if (index + 1 < playlistLengthRef.current) {
        shouldAutoPlayRef.current = true;
        return index + 1;
      }
      shouldAutoPlayRef.current = false;
      setIsPlaying(false);
      return index;
    });
  }, []);

  const handleTrackEnded = useCallback(() => {
    const audio = audioRef.current;
    const index = currentIndexRef.current;

    if (repeatModeRef.current === "ayah" && audio) {
      audio.currentTime = 0;
      shouldAutoPlayRef.current = true;
      void audio.play().catch(() => {
        setError("playback-failed");
        setIsLoading(false);
        setIsPlaying(false);
      });
      return;
    }

    const range = repeatRangeRef.current;
    if (repeatModeRef.current === "range" && range) {
      const nextIndex =
        index < range.startIndex || index >= range.endIndex
          ? range.startIndex
          : index + 1;
      shouldAutoPlayRef.current = true;
      setCurrentIndex(nextIndex);
      return;
    }

    playNext();
  }, [playNext]);

  const playPrevious = useCallback(() => {
    setCurrentIndex((index) => {
      if (index > 0) {
        shouldAutoPlayRef.current = true;
        return index - 1;
      }
      return index;
    });
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => handleTrackEnded();
    const handleError = () => {
      setError("media-unavailable");
      setIsLoading(false);
      setIsPlaying(false);
      shouldAutoPlayRef.current = false;
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [handleTrackEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAyah) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    const loadSource = async () => {
      audio.pause(); resetProgress(); setError(null); setIsLoading(true);
      const downloaded = await getDownloadedAudio(currentAyah).catch(() => null);
      if (cancelled) return;
      objectUrl = downloaded ? URL.createObjectURL(downloaded) : null;
      audio.src = objectUrl || currentAyah.audio; audio.load();
      if (shouldAutoPlayRef.current) void audio.play().catch(() => { setError("playback-failed"); setIsLoading(false); setIsPlaying(false); shouldAutoPlayRef.current = false; });
    };
    void loadSource();

    if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Ayah ${currentAyah.number}`,
        artist: currentAyah.surahName,
        album: "Al-Furqan",
      });
    }
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currentAyah, resetProgress]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = preferences.playbackSpeed;
    }
  }, [preferences.playbackSpeed]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => {
      void audioRef.current?.play().catch(() => {
        setError("playback-failed");
        setIsLoading(false);
        setIsPlaying(false);
      });
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("previoustrack", playPrevious);

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [playNext, playPrevious]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentAyah) return;
    setError(null);
    if (audio.paused) {
      setIsLoading(true);
      void audio.play().catch(() => {
        setError("playback-failed");
        setIsLoading(false);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [currentAyah]);

  const playPlaylist = useCallback(
    (tracks: AudioAyah[], startIndex = 0) => {
      const validTracks = sanitizeAudioPlaylist(tracks);
      if (validTracks.length === 0) {
        const audio = audioRef.current;
        shouldAutoPlayRef.current = false;
        if (audio) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        }
        setPlaylist([]);
        setCurrentIndex(-1);
        resetProgress();
        setError("invalid-source");
        setIsLoading(false);
        setIsPlaying(false);
        return;
      }
      setError(null);
      setPlaylist(validTracks);
      const normalizedIndex = normalizeStartIndex(
        startIndex,
        validTracks.length,
      );
      setCurrentIndex(normalizedIndex);
      setRepeatRangeState(
        normalizeRepeatRange(
          normalizedIndex,
          validTracks.length - 1,
          validTracks.length,
        ),
      );
      shouldAutoPlayRef.current = true;
    },
    [resetProgress],
  );

  const playAtIndex = useCallback(
    (index: number) => {
      const normalizedIndex = normalizeStartIndex(index, playlist.length);
      if (normalizedIndex < 0) return;
      if (normalizedIndex === currentIndexRef.current) {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        shouldAutoPlayRef.current = true;
        void audio.play().catch(() => {
          setError("playback-failed");
          setIsLoading(false);
          setIsPlaying(false);
        });
        return;
      }
      shouldAutoPlayRef.current = true;
      setCurrentIndex(normalizedIndex);
    },
    [playlist.length],
  );

  const playAyah = useCallback(
    (ayah: AudioAyah) => playPlaylist([ayah]),
    [playPlaylist],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    shouldAutoPlayRef.current = false;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    setPlaylist([]);
    setCurrentIndex(-1);
    setRepeatRangeState(null);
    setSleepTimerMinutes(null);
    resetProgress();
  }, [resetProgress]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const nextTime = clampSeekTime(time, duration);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration],
  );

  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    setPreferences((current) => ({ ...current, playbackSpeed: speed }));
  }, []);

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    setPreferences((current) => ({ ...current, repeatMode: mode }));
  }, []);

  const setRepeatRange = useCallback(
    (startIndex: number, endIndex: number) => {
      const nextRange = normalizeRepeatRange(
        startIndex,
        endIndex,
        playlist.length,
      );
      setRepeatRangeState(nextRange);
      if (nextRange) {
        setPreferences((current) => ({ ...current, repeatMode: "range" }));
      }
    },
    [playlist.length],
  );

  const setSleepTimer = useCallback((minutes: number | null) => {
    setSleepTimerMinutes(
      minutes && Number.isFinite(minutes) && minutes > 0 ? minutes : null,
    );
  }, []);

  useEffect(() => {
    if (!sleepTimerMinutes) return;
    const timeout = window.setTimeout(() => {
      audioRef.current?.pause();
      shouldAutoPlayRef.current = false;
      setIsPlaying(false);
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60_000);
    return () => window.clearTimeout(timeout);
  }, [sleepTimerMinutes]);

  const value = useMemo<AudioContextType>(
    () => ({
      currentAyah,
      isPlaying,
      isLoading,
      error,
      playlist,
      currentIndex,
      playbackSpeed: preferences.playbackSpeed,
      repeatMode: preferences.repeatMode,
      repeatRange,
      sleepTimerMinutes,
      playAyah,
      playPlaylist,
      playAtIndex,
      togglePlay,
      stop,
      seek,
      clearError,
      currentTime,
      duration,
      progress,
      canPlayNext,
      canPlayPrevious,
      playNext,
      playPrevious,
      setPlaybackSpeed,
      setRepeatMode,
      setRepeatRange,
      setSleepTimer,
    }),
    [
      canPlayNext,
      canPlayPrevious,
      clearError,
      currentAyah,
      currentTime,
      currentIndex,
      duration,
      error,
      isLoading,
      isPlaying,
      playAyah,
      playAtIndex,
      playNext,
      playPlaylist,
      playPrevious,
      playlist,
      preferences.playbackSpeed,
      preferences.repeatMode,
      progress,
      repeatRange,
      seek,
      stop,
      sleepTimerMinutes,
      setPlaybackSpeed,
      setRepeatMode,
      setRepeatRange,
      setSleepTimer,
      togglePlay,
    ],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
