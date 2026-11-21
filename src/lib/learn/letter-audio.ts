import type { ArabicLetter } from "./alphabet";

// Self-hosted copies of an MIT-licensed recording set (public/learn/letters, with LICENSE.txt and SOURCE.txt).
// The speaker is unidentified and the recordings have not been reviewed by a qualified teacher, so every play
// button says so. Replace or remove this source once reviewed recordings or a licensed API are available.
export const LETTER_AUDIO_SOURCE = {
  name: "arabic-alphabet-audio",
  url: "https://github.com/razunatmohammed88-cyber/arabic-alphabet-audio",
  license: "MIT",
  licenseUrl: "/learn/letters/LICENSE.txt",
  copyright: "© 2025 razunatmohammed88-cyber",
  speaker: "unidentified",
  review: "awaiting-review" as const,
};

export const letterAudioUrl = (letter: Pick<ArabicLetter, "codePoint">) => `/learn/letters/${letter.codePoint.slice(2)}.mp3`;
