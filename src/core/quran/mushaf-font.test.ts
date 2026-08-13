import { describe, expect, it, vi } from "vitest";

import { createMushafFontLoader, mushafFontFamily, mushafFontUrl } from "./mushaf-font";

describe("Mushaf page font loading", () => {
  it("registers and activates the official page font before reporting success", async () => {
    const loadedFont = { load: vi.fn() } as unknown as FontFace;
    const load = vi.fn(async () => loadedFont);
    const add = vi.fn();
    const activate = vi.fn(async () => [loadedFont]);
    const createFontFace = vi.fn(() => ({ load }) as unknown as FontFace & { load: () => Promise<FontFace> });
    const loadPageFont = createMushafFontLoader({ createFontFace, fonts: { add, load: activate } });

    await expect(loadPageFont(1)).resolves.toBe(true);
    expect(createFontFace).toHaveBeenCalledWith(mushafFontFamily(1), `url(${mushafFontUrl(1)})`);
    expect(add).toHaveBeenCalledWith(loadedFont);
    expect(activate).toHaveBeenCalledWith('1em "qcf-p1-v4"');
  });

  it("deduplicates page loads and reports a safe failure", async () => {
    const load = vi.fn(async () => { throw new Error("font unavailable"); });
    const loadPageFont = createMushafFontLoader({
      createFontFace: () => ({ load }) as unknown as FontFace & { load: () => Promise<FontFace> },
      fonts: { add: vi.fn(), load: vi.fn() },
    });

    const first = loadPageFont(2);
    const second = loadPageFont(2);
    expect(first).toBe(second);
    await expect(first).resolves.toBe(false);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
