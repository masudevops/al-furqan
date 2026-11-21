import { describe, expect, it } from "vitest";

import { glyphPages, hasCompleteGlyphs, tajweedPaletteCss } from "./qcf-tajweed";

const word = (code: string | null, pageNumber: number | null, charType = "word") => ({ charType, code, pageNumber });

describe("QCF V4 Tajweed glyphs", () => {
  it("only renders glyphs when every word has its code and page", () => {
    expect(hasCompleteGlyphs([word("ﱃ", 2), word("ﱌ", null, "end")])).toBe(true);
    expect(hasCompleteGlyphs([word("ﱃ", 2), word(null, 2)])).toBe(false);
    expect(hasCompleteGlyphs([word("ﱃ", null)])).toBe(false);
    expect(hasCompleteGlyphs([])).toBe(false);
  });

  it("collects each Mushaf page whose font an Ayah needs, including Ayahs that cross pages", () => {
    expect(glyphPages([word("a", 21), word("b", 21), word("c", 22), word("d", 22, "end")])).toEqual([21, 22]);
  });

  it("binds a theme palette to each page font", () => {
    expect(tajweedPaletteCss([2], "dark")).toBe('@font-palette-values --qcf-p2{font-family:"qcf-p2-v4";base-palette:1}');
    expect(tajweedPaletteCss([2, 3], "sepia")).toContain("--qcf-p3{font-family:\"qcf-p3-v4\";base-palette:2}");
    expect(tajweedPaletteCss([2], "light")).toContain("base-palette:0");
  });
});
