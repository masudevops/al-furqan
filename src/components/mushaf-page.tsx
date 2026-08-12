"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import type { MushafPayload } from "@/lib/types";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
});

function TajweedLegend() {
  return <aside className={styles.tajweedLegend} aria-label="Tajweed color legend">
    <strong>Tajweed colors</strong>
    <span><i className={styles.tjMadd} />Madd</span>
    <span><i className={styles.tjGhunnah} />Ghunnah</span>
    <span><i className={styles.tjIkhfa} />Ikhfa</span>
    <span><i className={styles.tjIdgham} />Idgham</span>
    <span><i className={styles.tjQalqalah} />Qalqalah</span>
    <span><i className={styles.tjSilent} />Silent letters</span>
  </aside>;
}

export default function MushafPage({ pageNumber }: { pageNumber: number }) {
  const { data, error, isLoading } = useSWR<MushafPayload>(`/api/quran/mushaf/${pageNumber}`, fetcher);
  const [tajweedEnabled, setTajweedEnabled] = useState(true);

  useEffect(() => setTajweedEnabled(localStorage.getItem("af-tajweed") !== "false"), []);
  useEffect(() => {
    if (!data) return;
    const font = new FontFace(
      `qcf-p${pageNumber}`,
      `url(https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${pageNumber}.woff2)`,
      { display: "block" },
    );
    font.load().then((loaded) => document.fonts.add(loaded)).catch(() => undefined);
  }, [data, pageNumber]);

  const changeTajweed = (enabled: boolean) => {
    setTajweedEnabled(enabled);
    localStorage.setItem("af-tajweed", String(enabled));
  };

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
        <div className={styles.readingModes} role="group" aria-label="Mushaf reading style">
          <button type="button" aria-pressed={!tajweedEnabled} onClick={() => changeTajweed(false)}>Mushaf font</button>
          <button type="button" aria-pressed={tajweedEnabled} onClick={() => changeTajweed(true)}>Tajweed</button>
        </div>
        <form className={styles.tools} action="/quran/mushaf/1" onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("page");
          location.href = `/quran/mushaf/${value}`;
        }}>
          <input name="page" aria-label="Mushaf page" type="number" min="1" max="604" defaultValue={pageNumber} />
          <button>Go</button>
        </form>
      </div>
    </header>
    {isLoading ? <p>Loading official Mushaf page…</p> : null}
    {error ? <p className={styles.error}>This Mushaf page is unavailable. No substitute Quran text has been used.</p> : null}
    {data && tajweedEnabled ? <>
      <TajweedLegend />
      <section className={`${styles.mushaf} ${styles.tajweedPage}`} lang="ar" dir="rtl" translate="no">
        <div className={`${styles.tajweedFlow} ${styles.tajweed}`}>
          {data.tajweedVerses.map((verse) => verse.tajweedHtml
            ? <Link className={styles.tajweedAyah} href={`/quran/${verse.verseKey.replace(":", "/")}`} aria-label={`Open Ayah ${verse.verseKey}`} dangerouslySetInnerHTML={{ __html: verse.tajweedHtml }} key={verse.verseKey} />
            : <Link className={styles.tajweedAyah} href={`/quran/${verse.verseKey.replace(":", "/")}`} aria-label={`Open Ayah ${verse.verseKey}`} key={verse.verseKey}>{verse.arabicText}</Link>)}
        </div>
        <footer className={styles.mushafFooter}><span>{data.verseKeys[0]}</span><span>{pageNumber} / 604</span><span>{data.verseKeys.at(-1)}</span></footer>
      </section>
    </> : null}
    {data && !tajweedEnabled ? <section className={styles.mushaf} lang="ar" dir="rtl" translate="no">
      {data.lines.map((line) => <div className={styles.line} key={line.lineNumber} data-line={line.lineNumber}>
        {line.words.map((word, index) => <span className={styles.word} style={{ fontFamily: word.charType === "end" ? "UthmanicHafs, serif" : `qcf-p${pageNumber}` }} title={word.verseKey} key={`${word.verseKey}-${word.position}-${index}`}>{word.charType === "end" ? word.arabicText : word.qcfCode || word.arabicText}</span>)}
      </div>)}
      <footer className={styles.mushafFooter}><span>{data.verseKeys[0]}</span><span>{pageNumber} / 604</span><span>{data.verseKeys.at(-1)}</span></footer>
    </section> : null}
    <nav className={styles.tools}>{pageNumber > 1 ? <Link href={`/quran/mushaf/${pageNumber - 1}`}>← Previous page</Link> : <span />}{pageNumber < 604 ? <Link href={`/quran/mushaf/${pageNumber + 1}`}>Next page →</Link> : null}</nav>
  </main>;
}
