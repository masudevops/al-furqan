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
    </>
  );
}

describe("AudioProvider", () => {
  beforeEach(() => {
    FakeAudio.instances = [];
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
});
