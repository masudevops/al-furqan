import { useState } from "react";
import type { QuranWord, VerseWords } from "../../core/quran/wordByWord";
import { fetchVerseWords } from "../../services/quranFoundationService";

interface WordByWordViewProps {
  surahNumber: number;
  ayahNumber: number;
}

export default function WordByWordView({
  surahNumber,
  ayahNumber,
}: WordByWordViewProps) {
  const [data, setData] = useState<VerseWords | null>(null);
  const [selected, setSelected] = useState<QuranWord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchVerseWords(surahNumber, ayahNumber));
    } catch {
      setError(
        "Word meanings are unavailable. The Quran Foundation connection may need configuration, or you may be offline before this verse was saved.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="border-t border-stone-200 pt-4 dark:border-white/10">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="secondary-action !min-h-10 !px-4 !py-2"
        >
          {loading ? "Loading word meanings…" : "Explore word by word"}
        </button>
        {error && <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-300">{error}</p>}
      </div>
    );
  }

  return (
    <section className="border-t border-stone-200 pt-4 dark:border-white/10" aria-label={`Word-by-word meanings for ${data.verseKey}`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Tap a word for its meaning</p>
      <div className="flex flex-row-reverse flex-wrap justify-start gap-2" dir="rtl" translate="no">
        {data.words.map((word) => (
          <button
            key={word.id}
            type="button"
            aria-pressed={selected?.id === word.id}
            onClick={() => setSelected((current) => current?.id === word.id ? null : word)}
            className={`min-h-14 rounded-xl border px-4 py-2 font-noto text-2xl transition ${selected?.id === word.id ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100" : "border-stone-200 bg-stone-50 hover:border-emerald-400 dark:border-white/10 dark:bg-white/5"}`}
            lang="ar"
          >
            {word.arabic}
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-3 rounded-xl bg-emerald-50 p-4 text-left dark:bg-emerald-950/30" role="status">
          <p className="text-base font-semibold text-emerald-950 dark:text-emerald-100">{selected.translation || "Meaning not supplied"}</p>
          {selected.transliteration && <p className="mt-1 text-sm italic text-emerald-800 dark:text-emerald-200">{selected.transliteration}</p>}
          <p className="mt-2 text-xs text-stone-500">Root morphology is not included in Quran Foundation’s documented Content API response.</p>
        </div>
      )}
      <p className="mt-3 text-xs text-stone-500">Source: Quran Foundation · Saved offline for up to six days.</p>
    </section>
  );
}
