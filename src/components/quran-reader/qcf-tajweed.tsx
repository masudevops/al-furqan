"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { loadBrowserMushafFont, mushafFontFamily } from "@/core/quran/mushaf-font";
import type { TajweedGlyphWord } from "@/lib/types";
import { whenNearViewport } from "./near-viewport";
import { toArabicIndicDigits } from "./reader-position";
import styles from "./quran-reader.module.css";

// Every word must carry its glyph and page, or the Ayah is shown as plain verified text instead.
export const hasCompleteGlyphs = (words: readonly TajweedGlyphWord[]) =>
  words.length > 0 && words.every((word) => word.charType === "end" || (word.code && word.pageNumber));

export const glyphPages = (words: readonly TajweedGlyphWord[]) =>
  Array.from(new Set(words.flatMap((word) => word.charType !== "end" && word.pageNumber ? [word.pageNumber] : [])));

// @font-palette-values binds to one font family, so each QCF page font gets its own theme palette.
export const tajweedPaletteCss = (pages: readonly number[], theme: string) => {
  const basePalette = theme === "dark" ? 1 : theme === "sepia" ? 2 : 0;
  return pages.map((page) => `@font-palette-values --qcf-p${page}{font-family:"${mushafFontFamily(page)}";base-palette:${basePalette}}`).join("");
};

// Follows <html data-theme> for views outside the app shell's theme state.
export function useDocumentTheme() {
  const [theme, setTheme] = useState("sepia");
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setTheme(root.dataset.theme ?? "sepia");
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

type QcfTajweedTextProps = { words: TajweedGlyphWord[]; verseNumber: number | null; plainText: string; plainClassName: string };

// Official QCF V4 Tajweed rendering (the Mushaf view's glyphs and fonts), loaded as the Ayah nears the viewport.
// Until the page fonts load — or if any fails — the verified plain text is shown, never raw glyph codes.
export default function QcfTajweedText({ words, verseNumber, plainText, plainClassName }: QcfTajweedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const pages = useMemo(() => glyphPages(words), [words]);
  const [fontsReady, setFontsReady] = useState(false);
  const endMarker = verseNumber ? toArabicIndicDigits(verseNumber) : null;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let active = true;
    setFontsReady(false);
    const stop = whenNearViewport(element, () => {
      void Promise.all(pages.map(loadBrowserMushafFont)).then((loaded) => { if (active) setFontsReady(loaded.every(Boolean)); });
    });
    return () => { active = false; stop(); };
  }, [pages]);

  if (!fontsReady) {
    return <p ref={ref} className={plainClassName} lang="ar" dir="rtl" translate="no">{plainText}{endMarker ? <> <span className={styles.ayahEnd}>{endMarker}</span></> : null}</p>;
  }
  return <p ref={ref} className={`${styles.arabic} ${styles.quranFont} ${styles.qcfTajweed}`} lang="ar" dir="rtl" translate="no">
    <span className={styles.srOnly}>{plainText}</span>
    <span aria-hidden="true">{words.map((word, index) => <Fragment key={index}>
      {index ? " " : null}
      {word.charType === "end"
        ? <span className={styles.ayahEnd}>{endMarker}</span>
        : <span className={styles.qcfWord} style={{ fontFamily: `"${mushafFontFamily(word.pageNumber ?? 0)}"`, fontPalette: `--qcf-p${word.pageNumber}` } as React.CSSProperties}>{word.code}</span>}
    </Fragment>)}</span>
  </p>;
}
