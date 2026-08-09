import { describe, expect, it } from "vitest";
import { createPersonalStudyRepository } from "../src/core/quran/personalStudy";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
}

describe("personal Quran study repository", () => {
  it("stores private notes with normalized tags and removes empty notes", () => {
    const repo = createPersonalStudyRepository(storage(), () => "2026-08-08T00:00:00.000Z");
    const ref = { surahNumber: 2, ayahNumber: 255 };
    expect(repo.saveNote(ref, " Reflection ", ["faith", " faith "]).notes[0]).toMatchObject({ text: "Reflection", tags: ["faith"], ref });
    expect(repo.saveNote(ref, "").notes).toEqual([]);
  });

  it("toggles memorized ayahs without duplicating them", () => {
    const repo = createPersonalStudyRepository(storage());
    const ref = { surahNumber: 1, ayahNumber: 1 };
    expect(repo.toggleMemorized(ref).memorized).toEqual(["1:1"]);
    expect(repo.toggleMemorized(ref).memorized).toEqual([]);
  });
});
