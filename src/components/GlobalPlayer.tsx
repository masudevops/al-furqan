// src/components/GlobalPlayer.tsx
import React, { useRef } from "react";
import { useAudio } from "../context/AudioContext";
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaTimes } from "react-icons/fa";

export default function GlobalPlayer() {
    const {
        currentAyah,
        isPlaying,
        togglePlay,
        playNext,
        playPrevious,
        stop,
        progress,
        duration,
        currentTime,
        seek
    } = useAudio();

    const progressBarRef = useRef<HTMLDivElement>(null);

    if (!currentAyah) return null;

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (progressBarRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            seek(percentage * duration);
        }
    };

    const formatTime = (t: number) => {
        const min = Math.floor(t / 60);
        const sec = Math.floor(t % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 animate-fadeIn">
            {/* Progress Bar */}
            <div
                className="w-full h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer group"
                ref={progressBarRef}
                onClick={handleProgressClick}
            >
                <div
                    className="h-full bg-emerald-500 relative transition-all duration-100"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform scale-150" />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Info Section */}
                <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {currentAyah.surahName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        Ayah {currentAyah.number}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 flex-1 justify-center">
                    <button
                        onClick={playPrevious}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-emerald-500 transition-colors"
                    >
                        <FaStepBackward size={20} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg transition-transform hover:scale-105"
                    >
                        {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} className="ml-1" />}
                    </button>

                    <button
                        onClick={playNext}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-emerald-500 transition-colors"
                    >
                        <FaStepForward size={20} />
                    </button>
                </div>

                {/* Extra / Time */}
                <div className="flex-1 flex justify-end items-center gap-4 min-w-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono hidden sm:block">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <button
                        onClick={stop}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Close Player"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
