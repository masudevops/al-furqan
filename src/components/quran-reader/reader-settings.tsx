"use client";

import Link from "next/link";
import { FormEvent, ReactNode, RefObject, useId } from "react";

import type { ReadingMode } from "@/lib/reading-mode";
import type { QuranScript, RecitationResource, ReaderPayload, TafsirResource, TranslationResource } from "@/lib/types";
import { ReaderIcon, type ReaderIconName } from "./icons";
import type { WordDisplay } from "./verse-card";
import { useInstallApp } from "@/components/install-app";
import styles from "./reader-settings.module.css";
import { t } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/locales";

export type Theme = "light" | "dark" | "sepia";

// "Saheeh International — Saheeh International" reads as a typo; only add the author when it says something new.
export const resourceLabel = (name: string, detail?: string | null) =>
  detail && !name.toLowerCase().includes(detail.toLowerCase()) ? `${name} — ${detail}` : name;

const SCRIPTS: Array<[QuranScript, string]> = [["uthmani", "Uthmani"], ["uthmani_simple", "Uthmani Simple"], ["imlaei", "Imlaei"], ["indopak", "IndoPak"], ["indopak_nastaleeq", "IndoPak Nastaleeq"]];
const THEMES: Array<[Theme, string]> = [["light", "Light"], ["dark", "Dark"], ["sepia", "Sepia"]];

type ReaderContext = {
  reader: ReaderPayload;
  verseNumber: number;
  translationGroups: Array<[string, TranslationResource[]]>;
  selectedTranslation: number | null;
  onTranslation: (id: number) => void;
  recitations: RecitationResource[];
  selectedRecitation: number | null;
  onRecitation: (id: number) => void;
  script: QuranScript;
  onScript: (script: QuranScript) => void;
  tafsirs: TafsirResource[];
  selectedTafsir: number | null;
  onTafsir: (id: number) => void;
  wordMode: boolean;
  onWordMode: (value: boolean) => void;
  wordDisplay: WordDisplay;
  onWordDisplay: (value: WordDisplay) => void;
  tafsirEverywhere: boolean;
  onTafsirEverywhere: (value: boolean) => void;
  memorizationOpen: boolean;
  onMemorization: () => void;
  introductionOpen: boolean;
  onIntroduction: () => void;
  onJump: (event: FormEvent<HTMLFormElement>) => void;
};

type ReaderSettingsProps = {
  dialogRef: RefObject<HTMLElement>;
  locale: Locale;
  onLocale: (locale: Locale) => void;
  onClose: () => void;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  readingMode: ReadingMode;
  onReadingMode: (mode: ReadingMode) => void;
  tajweedEnabled: boolean;
  onTajweed: (value: boolean) => void;
  followRecitation: boolean;
  onFollowRecitation: () => void;
  arabicSize: number;
  translationSize: number;
  onSize: (kind: "arabic" | "translation", value: number) => void;
  quran?: ReaderContext;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <section className={styles.section} aria-labelledby={id}><h3 id={id}>{title}</h3><div className={styles.card}>{children}</div></section>;
}

function InstallSection() {
  const { state, install } = useInstallApp();
  if (state === "unknown" || state === "unavailable") return null;
  return <Section title={t("App")}>
    <div className={styles.row}>
      <span className={styles.rowText}><strong>{state === "installed" ? t("Installed") : t("Install Al-Furqan")}</strong><small>{state === "installed" ? t("You're using the installed app") : state === "ios" ? t("In Safari, tap Share, then Add to Home Screen") : t("Open it from your home screen like an app")}</small></span>
      {state === "prompt" ? <button type="button" className={styles.installButton} onClick={() => void install()}>{t("Install")}</button> : null}
    </div>
  </Section>;
}

function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={styles.row}>
    <span className={styles.rowText}><strong>{label}</strong>{hint ? <small>{hint}</small> : null}</span>
    <input className={styles.switch} type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>;
}

function SizeControl({ label, value, min, max, onChange, preview }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void; preview?: ReactNode }) {
  const id = useId();
  return <div className={styles.sizeControl}>
    <div className={styles.sizeHeader}><label htmlFor={id}>{label}</label><output htmlFor={id}>{value}px</output></div>
    <div className={styles.sizeInput}>
      <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 2))}><ReaderIcon name="minus" /></button>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ "--fill": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties} />
      <button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 2))}><ReaderIcon name="plus" /></button>
    </div>
    {preview}
  </div>;
}

function Select({ label, value, onChange, children }: { label: string; value: string | number; onChange: (value: string) => void; children: ReactNode }) {
  const id = useId();
  return <div className={styles.field}>
    <label htmlFor={id}>{label}</label>
    <div className={styles.select}><select id={id} aria-label={`Quran ${label.toLowerCase()}`} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select><ReaderIcon name="chevron" /></div>
  </div>;
}

function ToolButton({ icon, label, active, onClick }: { icon: ReaderIconName; label: string; active?: boolean; onClick: () => void }) {
  return <button type="button" className={styles.tool} aria-pressed={active} onClick={onClick}><ReaderIcon name={icon} /><span>{label}</span></button>;
}

export default function ReaderSettings({ dialogRef, locale, onLocale, onClose, theme, onTheme, readingMode, onReadingMode, tajweedEnabled, onTajweed, followRecitation, onFollowRecitation, arabicSize, translationSize, onSize, quran }: ReaderSettingsProps) {
  const sample = quran?.reader.verses[0];
  return <div className={styles.scrim} onMouseDown={onClose}>
    <aside ref={dialogRef} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="reader-settings" onMouseDown={(event) => event.stopPropagation()}>
      <header className={styles.header}>
        <div><p>Al-Furqan</p><h2 id="reader-settings">{t("Settings")}</h2></div>
        <button type="button" className={styles.close} aria-label={t("Close settings")} onClick={onClose}><ReaderIcon name="close" /></button>
      </header>
      <div className={styles.body}>
        <Section title={t("Language")}>
          <div className={styles.field}>
            <div className={styles.select}><select aria-label={t("Language")} value={locale} onChange={(event) => onLocale(event.target.value as Locale)}>{LOCALES.map((item) => <option key={item.code} value={item.code} lang={item.code}>{item.name}{item.code === "en" ? "" : ` · ${item.englishName}`}</option>)}</select><ReaderIcon name="chevron" /></div>
            <p className={styles.note}>{t("Quran translation, Tafsir and word meanings switch to sourced versions in this language where available. Interface translations are a preview awaiting native-speaker review.")}</p>
          </div>
        </Section>

        <Section title={t("Theme")}>
          <div className={styles.themes} role="radiogroup" aria-label={t("Reading theme")}>
            {THEMES.map(([value, label]) => <button type="button" role="radio" aria-checked={theme === value} className={styles.theme} data-swatch={value} onClick={() => onTheme(value)} key={value}>
              <span className={styles.swatch} aria-hidden="true"><i /><i /><i /></span>
              <span>{t(label)}</span>
              {theme === value ? <span className={styles.themeCheck} aria-hidden="true"><ReaderIcon name="check" /></span> : null}
            </button>)}
          </div>
        </Section>

        <Section title={t("Text size")}>
          <SizeControl label={t("Arabic text size")} value={arabicSize} min={30} max={64} onChange={(value) => onSize("arabic", value)}
            preview={sample ? <p className={`${styles.arabicPreview} ${quran?.script.startsWith("uthmani") ? styles.quranPreview : ""}`} lang="ar" dir="rtl" translate="no" style={{ fontSize: `${arabicSize}px` }}>{sample.arabicText}</p> : null} />
          <SizeControl label={t("Translation size")} value={translationSize} min={14} max={26} onChange={(value) => onSize("translation", value)}
            preview={sample?.translationText ? <div className={styles.translationPreview} lang="en" translate="no" style={{ fontSize: `${translationSize}px` }} dangerouslySetInnerHTML={{ __html: sample.translationText }} /> : null} />
        </Section>

        <Section title={t("Reading")}>
          <div className={styles.row}>
            <span className={styles.rowText}><strong>{t("Reading mode")}</strong><small>{t("Used for Begin reading and Resume")}</small></span>
            <div className={styles.segmented} role="radiogroup" aria-label={t("Preferred reading mode")}>
              {([["verses", "Verses", "verses"], ["mushaf", "Mushaf", "page"]] as Array<[ReadingMode, string, ReaderIconName]>).map(([value, label, icon]) => <button type="button" role="radio" aria-checked={readingMode === value} onClick={() => onReadingMode(value)} key={value}><ReaderIcon name={icon} />{t(label)}</button>)}
            </div>
          </div>
          <Switch label={t("Tajweed colors")} hint={t("Official QCF V4 colour-coded text")} checked={tajweedEnabled} onChange={onTajweed} />
          {quran ? <Switch label={t("Word by word")} hint={t("Tap a word to hear it recited")} checked={quran.wordMode} onChange={quran.onWordMode} /> : null}
          {quran?.wordMode ? <div className={styles.nested}>
            <Switch label={t("Word meaning")} checked={quran.wordDisplay.meaning} onChange={(meaning) => quran.onWordDisplay({ ...quran.wordDisplay, meaning })} />
            <Switch label={t("Transliteration")} checked={quran.wordDisplay.transliteration} onChange={(transliteration) => quran.onWordDisplay({ ...quran.wordDisplay, transliteration })} />
          </div> : null}
          {quran && quran.tafsirs.length ? <Switch label={t("Tafsir under every Ayah")} hint={t("Otherwise open Tafsir per Ayah")} checked={quran.tafsirEverywhere} onChange={quran.onTafsirEverywhere} /> : null}
          <Switch label={t("Follow recitation")} hint={t("Scroll to the Ayah being recited")} checked={followRecitation} onChange={() => onFollowRecitation()} />
        </Section>

        {quran ? <>
          <Section title={t("Quran content")}>
            <Select label={t("Translation")} value={quran.selectedTranslation ?? ""} onChange={(value) => quran.onTranslation(Number(value))}>
              {quran.translationGroups.map(([language, items]) => <optgroup label={language} key={language}>{items.map((item) => <option key={item.id} value={item.id}>{resourceLabel(item.name, item.authorName)}</option>)}</optgroup>)}
            </Select>
            <Select label={t("Reciter")} value={quran.selectedRecitation ?? ""} onChange={(value) => quran.onRecitation(Number(value))}>
              {quran.recitations.map((item) => <option key={item.id} value={item.id}>{resourceLabel(item.name, item.style)}</option>)}
            </Select>
            <Select label={t("Arabic script")} value={quran.script} onChange={(value) => quran.onScript(value as QuranScript)}>
              {SCRIPTS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </Select>
            {quran.tafsirs.length ? <Select label={t("Tafsir source")} value={quran.selectedTafsir ?? ""} onChange={(value) => quran.onTafsir(Number(value))}>
              {quran.tafsirs.map((item) => <option value={item.id} key={item.id}>{resourceLabel(item.name, item.authorName)}</option>)}
            </Select> : null}
          </Section>

          <Section title={t("Study tools")}>
            <form className={styles.jump} onSubmit={(event) => { quran.onJump(event); onClose(); }}>
              <label htmlFor="settings-jump">{t("Jump to Ayah")}</label>
              <div><input id="settings-jump" aria-label={t("Ayah number")} inputMode="numeric" name="verse" type="number" min="1" max={quran.reader.chapter.versesCount ?? undefined} defaultValue={quran.verseNumber} /><button>Go</button></div>
            </form>
            <div className={styles.tools}>
              <ToolButton icon="play" label={t("Memorize")} active={quran.memorizationOpen} onClick={() => { quran.onMemorization(); onClose(); }} />
              <ToolButton icon="info" label={t("Surah introduction")} active={quran.introductionOpen} onClick={() => { quran.onIntroduction(); onClose(); }} />
            </div>
            <nav className={styles.links} aria-label={t("Explore the Quran")}>
              <Link href="/quran/structure" onClick={onClose}><ReaderIcon name="tools" /><span>{t("Quran structure")}</span><ReaderIcon name="arrowRight" /></Link>
              <Link href="/reflect" onClick={onClose}><ReaderIcon name="answer" /><span>{t("Lessons & reflections")}</span><ReaderIcon name="arrowRight" /></Link>
            </nav>
          </Section>
        </> : null}
        <InstallSection />
      </div>
    </aside>
  </div>;
}
