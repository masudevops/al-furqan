import { describe, expect, it } from "vitest";

import { resourceLabel } from "./reader-settings";

describe("reader settings resource labels", () => {
  it("adds an author or style only when it says something new", () => {
    expect(resourceLabel("Saheeh International", "Saheeh International")).toBe("Saheeh International");
    expect(resourceLabel("Tafsir al-Tabari", "Tabari")).toBe("Tafsir al-Tabari");
    expect(resourceLabel("Mohamed Siddiq al-Minshawi", "Murattal")).toBe("Mohamed Siddiq al-Minshawi — Murattal");
    expect(resourceLabel("The Clear Quran", null)).toBe("The Clear Quran");
  });
});
