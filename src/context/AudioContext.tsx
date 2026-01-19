// src/context/AudioContext.tsx
import {
    createContext,
    useContext,
    useState,
    useRef,
    type ReactNode,
    useEffect
} from "react";


export interface AudioAyah {
    number: number; // Global ayah number or Surah-relative? Usually relative in this app context
    text: string;
    audio: string;
    surahNumber: number;
    surahName: string;
}

interface AudioContextType {
    currentAyah: AudioAyah | null;
    isPlaying: boolean;
    isLoading: boolean;
    playlist: AudioAyah[];
    playAyah: (ayah: AudioAyah) => void;
    playPlaylist: (playlist: AudioAyah[], startIndex?: number) => void;
    togglePlay: () => void;
    stop: () => void;
    seek: (time: number) => void;
    currentTime: number;
    duration: number;
    progress: number;
    playNext: () => void;
    playPrevious: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentAyah, setCurrentAyah] = useState<AudioAyah | null>(null);
    const [playlist, setPlaylist] = useState<AudioAyah[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio Object
    useEffect(() => {
        const audio = new Audio();
        audio.preload = "auto";
        audioRef.current = audio;

        const handleEnded = () => {
            setIsPlaying(false);
            playNextAuto();
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            if (audio.duration) {
                setDuration(audio.duration);
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleError = (e: any) => {
            console.error("Audio Error", e);
            setIsLoading(false);
            setIsPlaying(false);
        };

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("waiting", handleWaiting);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("waiting", handleWaiting);
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("error", handleError);
            audio.pause();
        };
    }, []);

    // Sync internal index with currentAyah
    useEffect(() => {
        if (currentIndex >= 0 && currentIndex < playlist.length) {
            setCurrentAyah(playlist[currentIndex]);
        }
    }, [currentIndex, playlist]);

    // Effect to load and play source when currentAyah changes
    useEffect(() => {
        if (!currentAyah || !audioRef.current) return;

        const audio = audioRef.current;

        // Check if source is already set to avoid reload
        if (audio.src !== currentAyah.audio) {
            audio.src = currentAyah.audio;
            audio.load();
            audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Play failed", e));
        } else {
            if (audio.paused) {
                audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Resume failed", e));
            }
        }

        // Update Media Session Metadata (Mobile/Lock Screen controls)
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `Ayah ${currentAyah.number}`,
                artist: currentAyah.surahName,
                album: 'Al-Furqan',
                // artwork: [{ src: '/logo.png', sizes: '512x512', type: 'image/png' }]
            });

            navigator.mediaSession.setActionHandler('play', togglePlay);
            navigator.mediaSession.setActionHandler('pause', togglePlay);
            navigator.mediaSession.setActionHandler('nexttrack', playNext);
            navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
        }

    }, [currentAyah]);

    // Auto-play logic for playlist
    const playNextAuto = () => {
        setCurrentIndex((prev) => {
            if (prev + 1 < playlist.length) {
                return prev + 1;
            } else {
                return -1; // End of playlist
            }
        });
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error(e));
            setIsPlaying(true);
        }
    };

    const playAyah = (ayah: AudioAyah) => {
        // If playing just one ayah, we treat it as a playlist of size 1
        // or append to start? Convention: Usually "click to play" means play specific.
        // We'll replace playlist with just this one, unless we support "queueing".
        // For simplicity: Replace playlist with this single item (or surah context).
        // Actually, usually users want to play from this ayah onwards in the Surah.

        // For now: Just play this single one. 
        // Ideally, the caller should provide the full list if they want continuous playback.
        // We will support a simple "Play single" mode by making a 1-item playlist.
        setPlaylist([ayah]);
        setCurrentIndex(0);
        setIsPlaying(true);
    };

    const playPlaylist = (ayahs: AudioAyah[], startIndex = 0) => {
        setPlaylist(ayahs);
        setCurrentIndex(startIndex);
        setIsPlaying(true);
    };

    const playNext = () => {
        if (currentIndex + 1 < playlist.length) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const playPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const stop = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentAyah(null);
        setPlaylist([]);
        setCurrentIndex(-1);
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }

    return (
        <AudioContext.Provider
            value={{
                isPlaying,
                isLoading,
                currentAyah,
                playlist,
                togglePlay,
                playAyah,
                playPlaylist,
                playNext,
                playPrevious,
                stop,
                progress,
                duration,
                currentTime,
                seek
            }}
        >
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
};
