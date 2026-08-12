import { describe, expect, it } from "vitest";

import { preferredRecitation, preferredTranslation } from "@/components/app-shell";

describe("Quran reader defaults", () => {
  it("discovers Saheeh International without relying on a fixed resource id", () => {
    const selected = preferredTranslation([
      { authorName: null, id: 131, languageName: "English", name: "The Clear Quran" },
      { authorName: null, id: 20, languageName: "English", name: "Saheeh International" },
    ]);

    expect(selected?.id).toBe(20);
  });

  it("prefers Al-Minshawi Murattal when multiple styles are available", () => {
    const selected = preferredRecitation([
      { id: 9, name: "Mohamed Siddiq al-Minshawi", style: "Mujawwad" },
      { id: 10, name: "Mohamed Siddiq al-Minshawi", style: "Murattal" },
    ]);

    expect(selected?.id).toBe(10);
  });
});
