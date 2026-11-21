"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { preload } from "swr";
import { loadBrowserMushafFont, mushafFontFamily } from "@/core/quran/mushaf-font";
import { ReaderIcon } from "@/components/quran-reader/icons";
import readerStyles from "@/components/quran-reader/quran-reader.module.css";
import { saveMushafPage, saveReadingMode, versesHrefForMushafPage } from "@/lib/reading-mode";
import type { MushafPayload } from "@/lib/types";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
});

const mushafApiUrl = (pageNumber: number) => `/api/quran/mushaf/${pageNumber}?layout=qcf-v4`;

export default function MushafPage({ pageNumber }: { pageNumber: number }) {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<MushafPayload>(mushafApiUrl(pageNumber), fetcher, { revalidateOnFocus: false });
  const [readingTheme, setReadingTheme] = useState("sepia");
  const [fontPageReady, setFontPageReady] = useState<number | null>(null);
  const [fontPageFailed, setFontPageFailed] = useState<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setReadingTheme(root.dataset.theme ?? "sepia");
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root,{attributes:true,attributeFilter:["data-theme"]});
    return () => observer.disconnect();
  },[]);
  useEffect(() => {
    let active = true;
    setFontPageReady(null);
    setFontPageFailed(null);
    void loadBrowserMushafFont(pageNumber).then((loaded) => {
      if (!active) return;
      if (loaded) setFontPageReady(pageNumber);
      else setFontPageFailed(pageNumber);
    });
    for (const adjacentPage of [pageNumber - 1, pageNumber + 1]) {
      if (adjacentPage < 1 || adjacentPage > 604) continue;
      void preload(mushafApiUrl(adjacentPage), fetcher);
      void loadBrowserMushafFont(adjacentPage);
      router.prefetch(`/quran/mushaf/${adjacentPage}`);
    }
    return () => { active = false; };
  }, [pageNumber, router]);

  useEffect(() => saveMushafPage(pageNumber), [pageNumber]);

  const fontReady = fontPageReady === pageNumber;
  const fontFailed = fontPageFailed === pageNumber;

  return <main className={styles.page}>
    <header className={styles.header}>
      <div className={styles.mushafHeading}>
        <Link href="/quran">← Quran</Link>
        {data ? <>
          <h1>{data.chapterNames.join(" · ") || "Mushaf"}</h1>
          <p>{[
            data.juzNumbers.length ? `Juz ${data.juzNumbers.join("–")}` : null,
            data.hizbNumbers.length ? `Hizb ${data.hizbNumbers.join("–")}` : null,
            `Page ${pageNumber}`,
          ].filter(Boolean).join(" · ")}</p>
        </> : <><h1>Mushaf</h1><p>Page {pageNumber}</p></>}
      </div>
      <div className={styles.mushafControls}>
        <nav className={readerStyles.modeSwitch} aria-label="Reading mode">
          <Link href={versesHrefForMushafPage(data?.verseKeys[0])} prefetch={false} onClick={() => saveReadingMode("verses")}><ReaderIcon name="verses" /><span className={readerStyles.modeLabel}>Verse by Verse</span></Link>
          <span aria-current="page"><ReaderIcon name="page" /><span className={readerStyles.modeLabel}>Mushaf</span></span>
        </nav>
        <form className={styles.tools} action="/quran/mushaf/1" onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("page");
          const requestedPage = Number(value);
          if (Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 604) router.push(`/quran/mushaf/${requestedPage}`);
        }}>
          <input name="page" aria-label="Mushaf page" type="number" min="1" max="604" defaultValue={pageNumber} />
          <button>Go</button>
        </form>
      </div>
    </header>
    {isLoading ? <p>Loading official Mushaf page…</p> : null}
    {error ? <p className={styles.error}>This Mushaf page is unavailable. No substitute Quran text has been used.</p> : null}
    {data ? <>
      <section className={`${styles.mushaf} ${styles.tajweedPage}`} lang="ar" dir="rtl" translate="no">
        <style>{`@font-palette-values --mushaf-tajweed-palette { font-family: "${mushafFontFamily(pageNumber)}"; base-palette: ${readingTheme==="dark"?1:readingTheme==="sepia"?2:0}; }`}</style>
        {!fontReady && !fontFailed && data.tajweedLines?.length ? <div className={styles.mushafFontLoading} role="status"><span />Preparing Mushaf page…</div> : null}
        {fontReady && data.tajweedLines?.length ? data.tajweedLines.map((line) => <div className={`${styles.line} ${styles.tajweedGlyphLine}`} key={line.lineNumber} data-line={line.lineNumber}>
          {line.words.map((word,index) => <span className={styles.word} style={{fontFamily:word.charType==="end"?"UthmanicHafs, serif":mushafFontFamily(pageNumber)}} title={word.verseKey} key={`${word.verseKey}-${word.position}-${index}`}>{word.charType==="end"?word.arabicText:word.qcfCode||word.arabicText}</span>)}
        </div>) : fontFailed || !data.tajweedLines?.length ? <div className={styles.tajweedFlow}>
          {/* Plain Uthmani text: text_uthmani_tajweed encodes marks (e.g. U+0672) that platform fonts render as the wrong letter. */}
          {data.tajweedVerses.map((verse) => <Link className={styles.tajweedAyah} href={`/quran/${verse.verseKey.replace(":", "/")}`} aria-label={`Open Ayah ${verse.verseKey}`} key={verse.verseKey}>{verse.arabicText}</Link>)}
        </div> : null}
        {fontFailed ? <p className={styles.fontUnavailable} role="status">The Mushaf page font could not load. Verified Quran text without Tajweed colors is shown instead.</p> : null}
        <footer className={styles.mushafFooter}><span>{data.verseKeys[0]}</span>{/* The footer sits inside the RTL Quran section; keep the page counter left-to-right so it reads "2 / 604". */}<span dir="ltr" aria-label={`Page ${pageNumber} of 604`}>{pageNumber} / 604</span><span>{data.verseKeys.at(-1)}</span></footer>
      </section>
    </> : null}
    <nav className={styles.tools}>{pageNumber > 1 ? <Link href={`/quran/mushaf/${pageNumber - 1}`}>← Previous page</Link> : <span />}{pageNumber < 604 ? <Link href={`/quran/mushaf/${pageNumber + 1}`}>Next page →</Link> : null}</nav>
  </main>;
}
