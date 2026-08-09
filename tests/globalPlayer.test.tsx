import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GlobalPlayer from "../src/components/GlobalPlayer";

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
  playlist: [],
  playAyah: vi.fn(),
  playPlaylist: vi.fn(),
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
});
