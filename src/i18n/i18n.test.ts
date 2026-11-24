import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { messagesFor, setCurrentLocale, t } from ".";
import { LOCALES } from "./locales";

const sourceFiles = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? sourceFiles(full) : /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.") ? [full] : [];
});
const matches = (text: string, pattern: RegExp) => Array.from(text.matchAll(pattern), (match) => match[1]);
const usedKeys = Array.from(new Set(sourceFiles(path.join(process.cwd(), "src")).flatMap((file) => matches(fs.readFileSync(file, "utf8"), /(?<![\w.])t\("((?:[^"\\]|\\.)*)"/g).map((key) => JSON.parse(`"${key}"`) as string))));
const placeholders = (text: string) => matches(text, /\{(\w+)\}/g).sort();

describe("interface translations", () => {
  it("covers every phrase the interface uses, in every language", () => {
    expect(usedKeys.length).toBeGreaterThan(50);
    for (const locale of LOCALES.filter((item) => item.code !== "en")) {
      const missing = usedKeys.filter((key) => !(key in messagesFor(locale.code)));
      expect(missing, `${locale.englishName} is missing translations`).toEqual([]);
    }
  });

  it("keeps every placeholder in every translation", () => {
    for (const locale of LOCALES.filter((item) => item.code !== "en")) {
      for (const [key, value] of Object.entries(messagesFor(locale.code))) expect(placeholders(value), `${locale.code}: ${key}`).toEqual(placeholders(key));
    }
  });

  it("fills placeholders and falls back to English for unknown phrases", () => {
    setCurrentLocale("fr");
    expect(t("Ayah {number}", { number: 5 })).toBe("Verset 5");
    expect(t("A phrase nobody translated")).toBe("A phrase nobody translated");
    setCurrentLocale("en");
    expect(t("Ayah {number}", { number: 5 })).toBe("Ayah 5");
  });
});
