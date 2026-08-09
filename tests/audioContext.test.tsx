import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AudioProvider,
  useAudio,
  type AudioAyah,
} from "../src/context/AudioContext";

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  src = "";
  preload = "";
  currentTime = 0;
  duration = 120;
  playbackRate = 1;
  paused = true;
  failPlay = false;

  constructor() {
    super();
    FakeAudio.instances.push(this);
  }

  load() {
    return undefined;
  }

  play() {
    if (this.failPlay) return Promise.reject(new Error("blocked"));
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }

  removeAttribute(name: string) {
    if (name === "src") this.src = "";
  }
}

const firstTrack: AudioAyah = {
  number: 1,
  text: "one",
  audio: "https://audio.example/1.mp3",
  surahNumber: 1,
  surahName: "Al-Faatiha",
};
const secondTrack: AudioAyah = {
  ...firstTrack,
  number: 2,
  text: "two",
  audio: "https://audio.example/2.mp3",
};

function AudioHarness() {
  const audio = useAudio();
  return (
    <>
      <output data-testid="track">{audio.currentAyah?.number ?? "none"}</output>
      <output data-testid="playing">{String(audio.isPlaying)}</output>
      <output data-testid="error">{audio.error ?? "none"}</output>
      <output data-testid="speed">{audio.playbackSpeed}</output>
      <output data-testid="repeat">{audio.repeatMode}</output>
      <output data-testid="sleep">{audio.sleepTimerMinutes ?? "off"}</output>
      <button
        onClick={() => audio.playPlaylist([firstTrack, secondTrack])}
      >
        Start
      </button>
      <button
        onClick={() =>
          audio.playPlaylist([{ ...firstTrack, audio: "http://unsafe" }])
        }
      >
        Invalid
      </button>
      <button onClick={audio.playNext}>Next</button>
      <button onClick={audio.togglePlay}>Toggle</button>
      <button onClick={() => audio.setPlaybackSpeed(1.5)}>Speed</button>
      <button onClick={() => audio.setRepeatMode("ayah")}>Repeat ayah</button>
      <button onClick={() => audio.setRepeatRange(0, 1)}>Repeat range</button>
      <button onClick={() => audio.setSleepTimer(5)}>Sleep</button>
    </>
  );
}

describe("AudioProvider", () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    localStorage.clear();
    vi.stubGlobal("Audio", FakeAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects invalid playlists with a visible state", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider>
        <AudioHarness />
      </AudioProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Invalid" }));
    expect(screen.getByTestId("track")).toHaveTextContent("none");
    expect(screen.getByTestId("error")).toHaveTextContent("invalid-source");
  });

  it("plays valid tracks and advances on ended", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider>
        <AudioHarness />
      </AudioProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByTestId("track")).toHaveTextContent("1");
    expect(screen.getByTestId("playing")).toHaveTextContent("true");

    act(() => {
      FakeAudio.instances[0].dispatchEvent(new Event("ended"));
    });
    expect(screen.getByTestId("track")).toHaveTextContent("2");
  });

  it("reports rejected playback promises", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider>
        <AudioHarness />
      </AudioProvider>,
    );
    FakeAudio.instances[0].failPlay = true;

    await user.click(screen.getByRole("button", { name: "Start" }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("playing")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("playback-failed");
  });

  it("persists playback preferences and applies speed", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider>
        <AudioHarness />
      </AudioProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Speed" }));
    await user.click(screen.getByRole("button", { name: "Repeat ayah" }));

    expect(screen.getByTestId("speed")).toHaveTextContent("1.5");
    expect(screen.getByTestId("repeat")).toHaveTextContent("ayah");
    expect(FakeAudio.instances[0].playbackRate).toBe(1.5);
    expect(localStorage.getItem("alFurqan.audio.preferences")).toContain(
      '"repeatMode":"ayah"',
    );
  });

  it("replays the current ayah when repeat ayah is enabled", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider>
        <AudioHarness />
      </AudioProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Repeat ayah" }));

    act(() => {
      FakeAudio.instances[0].currentTime = 90;
      FakeAudio.instances[0].dispatchEvent(new Event("ended"));
    });

    expect(screen.getByTestId("track")).toHaveTextContent("1");
    expect(FakeAudio.instances[0].currentTime).toBe(0);
  });

  it("wraps within a selected repeat range", async () => {
    const user = userEvent.setup();
    render(
      <AudioProvider>
        <AudioHarness />
      </AudioProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Repeat range" }));

    act(() => {
      FakeAudio.instances[0].dispatchEvent(new Event("ended"));
    });
    expect(screen.getByTestId("track")).toHaveTextContent("2");

    act(() => {
      FakeAudio.instances[0].dispatchEvent(new Event("ended"));
    });
    expect(screen.getByTestId("track")).toHaveTextContent("1");
  });

  it("stops playback when the sleep timer expires", () => {
    vi.useFakeTimers();
    render(
      <AudioProvider>
        <AudioHarness />
      </AudioProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "Start" }).click();
      screen.getByRole("button", { name: "Sleep" }).click();
    });
    expect(screen.getByTestId("sleep")).toHaveTextContent("5");

    act(() => {
      vi.advanceTimersByTime(5 * 60_000);
    });
    expect(screen.getByTestId("playing")).toHaveTextContent("false");
    expect(screen.getByTestId("sleep")).toHaveTextContent("off");
    vi.useRealTimers();
  });
});
