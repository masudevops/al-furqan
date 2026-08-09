import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GlobalPlayer from "../src/components/GlobalPlayer";
import type { AudioTrack } from "../src/core/audio/contracts";

const audioState = {
  currentAyah: {
    number: 2,
    text: "text",
    audio: "https://audio.example/2.mp3",
    surahNumber: 1,
    surahName: "Al-Faatiha",
  },
  isPlaying: false,
  isLoading: false,
  error: null,
  playlist: [] as AudioTrack[],
  currentIndex: 0,
  playbackSpeed: 1,
  repeatMode: "off",
  repeatRange: null,
  sleepTimerMinutes: null,
  playAyah: vi.fn(),
  playPlaylist: vi.fn(),
  playAtIndex: vi.fn(),
  togglePlay: vi.fn(),
  stop: vi.fn(),
  seek: vi.fn(),
  clearError: vi.fn(),
  currentTime: 30,
  duration: 120,
  progress: 25,
  canPlayNext: true,
  canPlayPrevious: false,
  playNext: vi.fn(),
  playPrevious: vi.fn(),
  setPlaybackSpeed: vi.fn(),
  setRepeatMode: vi.fn(),
  setRepeatRange: vi.fn(),
  setSleepTimer: vi.fn(),
};

vi.mock("../src/context/AudioContext", () => ({
  useAudio: () => audioState,
}));

describe("GlobalPlayer", () => {
  it("exposes accessible playback and seek controls", () => {
    render(<GlobalPlayer />);

    expect(
      screen.getByRole("region", { name: /quran audio player/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /audio progress/i })).toHaveValue(
      "30",
    );
    expect(
      screen.getByRole("button", { name: /previous ayah/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /next ayah/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /play audio/i })).toBeEnabled();
    expect(screen.getByText("0:30 / 2:00")).toBeInTheDocument();
  });

  it("opens audio experience controls", async () => {
    const user = userEvent.setup();
    audioState.playlist = [
      audioState.currentAyah,
      { ...audioState.currentAyah, number: 3 },
    ];
    render(<GlobalPlayer />);

    await user.click(
      screen.getByRole("button", { name: /audio options and queue/i }),
    );
    expect(
      screen.getByRole("combobox", { name: /playback speed/i }),
    ).toHaveValue("1");
    expect(screen.getByRole("combobox", { name: /^repeat$/i })).toHaveValue(
      "off",
    );
    expect(
      screen.getByRole("combobox", { name: /sleep timer/i }),
    ).toHaveValue("");
    expect(screen.getByText(/queue · 2 ayahs/i)).toBeInTheDocument();
  });
});
