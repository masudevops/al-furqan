import { describe, expect, it } from "vitest";
import {
  encodeSearchPathSegment,
  highlightLiteralText,
} from "../src/core/quran/search";

describe("Quran search highlighting", () => {
  it("treats regular-expression characters as literal text", () => {
    expect(highlightLiteralText("Before (.*) after", "(.*)")).toEqual([
      { text: "Before ", highlighted: false },
      { text: "(.*)", highlighted: true },
      { text: " after", highlighted: false },
    ]);
  });

  it("preserves HTML-like provider text as plain text segments", () => {
    expect(
      highlightLiteralText('<img src=x onerror="alert(1)"> Mercy', "mercy"),
    ).toEqual([
      {
        text: '<img src=x onerror="alert(1)"> ',
        highlighted: false,
      },
      { text: "Mercy", highlighted: true },
    ]);
  });

  it("supports case-insensitive Arabic and translated text matches", () => {
    expect(highlightLiteralText("Patience and patience", "PATIENCE")).toEqual([
      { text: "Patience", highlighted: true },
      { text: " and ", highlighted: false },
      { text: "patience", highlighted: true },
    ]);
    expect(highlightLiteralText("الصبر جميل", "الصبر")).toEqual([
      { text: "الصبر", highlighted: true },
      { text: " جميل", highlighted: false },
    ]);
  });

  it("returns unchanged text for an empty query", () => {
    expect(highlightLiteralText("Mercy", "   ")).toEqual([
      { text: "Mercy", highlighted: false },
    ]);
  });

  it("encodes metacharacters as a single provider path segment", () => {
    expect(encodeSearchPathSegment("(.* / mercy")).toBe(
      "%28.%2A%20%2F%20mercy",
    );
  });
});
