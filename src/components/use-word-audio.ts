"use client";

import { useEffect, useRef, useState } from "react";

// One shared player for Quran.Foundation word recitations (Learn and the reader), so starting a word stops the previous one.
export function useWordAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => () => audioRef.current?.pause(), []);
  const play = (url: string | null) => {
    if (!url) return;
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    setFailed(null);
    setPlaying(url);
    audio.onended = () => setPlaying((current) => current === url ? null : current);
    audio.onerror = () => { setPlaying(null); setFailed(url); };
    void audio.play().catch(() => { setPlaying(null); setFailed(url); });
  };
  return { play, playing, failed };
}
