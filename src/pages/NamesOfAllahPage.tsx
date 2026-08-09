import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import SEO from "../components/SEO";

interface DivineName { number: number; name: string; transliteration: string; en: { meaning: string } }

export default function NamesOfAllahPage() {
  const [names, setNames] = useState<DivineName[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => { const controller = new AbortController(); void fetch("https://api.aladhan.com/v1/asmaAlHusna", { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((payload: { data?: DivineName[] }) => { if (!Array.isArray(payload.data) || payload.data.length !== 99) throw new Error(); setNames(payload.data); }).catch((reason) => { if (reason?.name !== "AbortError") setError(true); }); return () => controller.abort(); }, []);
  return <div className="mx-auto max-w-6xl px-5 py-12"><SEO title="99 Names of Allah" description="The beautiful Names with transliteration and concise meanings." /><p className="eyebrow"><Sparkles size={15} /> Asma ul-Husna</p><h1 className="mt-3 text-4xl font-semibold sm:text-5xl">The 99 Names of Allah</h1><p className="mt-4 max-w-2xl text-stone-500">Read and reflect at your own pace. Meanings are concise translations, not exhaustive theological definitions.</p>{error ? <div role="alert" className="surface-card mt-8">The Names could not be loaded. Reopen this page while online to make it available offline.</div> : names.length === 0 ? <p className="mt-10" aria-live="polite">Loading the Names…</p> : <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{names.map((item) => <li key={item.number} className="surface-card relative"><span className="absolute right-5 top-5 text-xs text-stone-400">{item.number}</span><p dir="rtl" lang="ar" className="quran-arabic-text text-4xl text-emerald-900 dark:text-emerald-100">{item.name}</p><h2 className="mt-3 text-lg font-semibold">{item.transliteration}</h2><p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{item.en.meaning}</p></li>)}</ol>}</div>;
}
