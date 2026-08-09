import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Minus, Plus, RotateCcw, Target, MoonStar } from "lucide-react";
import SEO from "../components/SEO";

const PRESETS = ["SubhanAllah", "Alhamdulillah", "Allahu Akbar", "La ilaha illallah"];
const GOAL_KEY = "al-furqan:gentle-goal:v1";
const TASBIH_KEY = "al-furqan:tasbih:v1";
const RAMADAN_KEY = "al-furqan:ramadan-plan:v1";

export default function CompanionPage() {
  const hijri = useMemo(() => new Intl.DateTimeFormat("en-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(new Date()), []);
  const gregorian = useMemo(() => new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()), []);
  const [phrase, setPhrase] = useState(() => localStorage.getItem(`${TASBIH_KEY}:phrase`) || PRESETS[0]);
  const [count, setCount] = useState(() => Number(localStorage.getItem(TASBIH_KEY)) || 0);
  const [goal, setGoal] = useState(() => Number(localStorage.getItem(`${GOAL_KEY}:target`)) || 5);
  const [progress, setProgress] = useState(() => Number(localStorage.getItem(GOAL_KEY)) || 0);
  const [ramadanDays, setRamadanDays] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem(RAMADAN_KEY) || "[]"); } catch { return []; } });
  const [conversion, setConversion] = useState("");

  useEffect(() => { localStorage.setItem(TASBIH_KEY, String(count)); localStorage.setItem(`${TASBIH_KEY}:phrase`, phrase); }, [count, phrase]);
  useEffect(() => { localStorage.setItem(GOAL_KEY, String(progress)); localStorage.setItem(`${GOAL_KEY}:target`, String(goal)); }, [goal, progress]);
  useEffect(() => { localStorage.setItem(RAMADAN_KEY, JSON.stringify(ramadanDays)); }, [ramadanDays]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16">
      <SEO title="Daily Companion" description="Private local tools for remembrance and gentle reading goals." />
      <p className="eyebrow">Saved on this device</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Daily companion</h1>
      <p className="mt-4 max-w-2xl text-stone-600 dark:text-stone-300">Small, private tools for steady worship. No streak pressure, scores, accounts, or notifications.</p>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section className="surface-card" aria-labelledby="calendar-title">
          <div className="section-icon"><CalendarDays /></div>
          <h2 id="calendar-title" className="mt-6 text-2xl font-semibold">Islamic calendar</h2>
          <p className="mt-8 text-4xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-100">{hijri}</p>
          <p className="mt-2 text-stone-500 dark:text-stone-400">{gregorian}</p>
          <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-200/10 dark:text-amber-100">Hijri dates may vary by one day with local moon sighting. Use your local authority for religious observances.</p>
          <div className="mt-5 border-t border-stone-200 pt-5 dark:border-white/10"><h3 className="text-sm font-semibold">Date converter</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><form onSubmit={(event) => { event.preventDefault(); const date = String(new FormData(event.currentTarget).get("gregorian")); const [year, month, day] = date.split("-"); void fetch(`https://api.aladhan.com/v1/gToH/${day}-${month}-${year}`).then((response) => response.json()).then((payload) => setConversion(`${payload.data.hijri.day} ${payload.data.hijri.month.en} ${payload.data.hijri.year} AH`)).catch(() => setConversion("Conversion unavailable")); }}><label className="text-xs font-medium">Gregorian to Hijri<input name="gregorian" type="date" required className="mt-1 w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-white/20" /></label><button className="secondary-action mt-2 !min-h-9 !px-3 !py-1" type="submit">Convert</button></form><form onSubmit={(event) => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("hijri")); void fetch(`https://api.aladhan.com/v1/hToG/${value}`).then((response) => response.json()).then((payload) => setConversion(payload.data.gregorian.date)).catch(() => setConversion("Conversion unavailable")); }}><label className="text-xs font-medium">Hijri to Gregorian<input name="hijri" required pattern="[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}" placeholder="1-9-1448" className="mt-1 w-full rounded-lg border border-stone-300 bg-transparent px-3 py-2 dark:border-white/20" /></label><button className="secondary-action mt-2 !min-h-9 !px-3 !py-1" type="submit">Convert</button></form></div>{conversion && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100" aria-live="polite">{conversion}</p>}</div>
        </section>

        <section className="surface-card" aria-labelledby="goal-title">
          <div className="section-icon"><Target /></div>
          <h2 id="goal-title" className="mt-6 text-2xl font-semibold">Gentle reading goal</h2>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Track pages or portions in the way that feels useful to you.</p>
          <div className="mt-8 flex items-end justify-between"><div><span className="text-5xl font-semibold">{progress}</span><span className="text-stone-500"> / {goal}</span></div><span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{Math.min(100, Math.round((progress / goal) * 100))}%</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${Math.min(100, (progress / goal) * 100)}%` }} /></div>
          <div className="mt-6 flex flex-wrap items-center gap-2"><button className="small-action" onClick={() => setProgress(Math.max(0, progress - 1))} aria-label="Decrease progress"><Minus size={16} /></button><button className="primary-action !px-5 !py-2.5" onClick={() => setProgress(Math.min(goal, progress + 1))}><Check size={16} /> Mark one complete</button><label className="ml-auto text-sm">Goal <input aria-label="Reading goal" className="ml-2 w-16 rounded-lg border border-stone-300 bg-transparent px-2 py-2 dark:border-white/20" type="number" min="1" max="100" value={goal} onChange={(event) => setGoal(Math.max(1, Number(event.target.value)))} /></label></div>
        </section>

        <section className="surface-card lg:col-span-2" aria-labelledby="tasbih-title">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="section-icon"><Plus /></div><h2 id="tasbih-title" className="mt-6 text-2xl font-semibold">Tasbih</h2><p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Tap the count. It remains private on this device.</p></div><select value={phrase} onChange={(event) => { setPhrase(event.target.value); setCount(0); }} className="rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 dark:border-white/10 dark:bg-white/5" aria-label="Dhikr phrase">{PRESETS.map((item) => <option key={item}>{item}</option>)}</select></div>
          <button type="button" onClick={() => setCount((value) => value + 1)} className="tasbih-button" aria-label={`Count ${phrase}. Current count ${count}`}><span className="text-sm font-medium opacity-60">{phrase}</span><span className="block text-7xl font-semibold tabular-nums">{count}</span><span className="text-xs uppercase tracking-widest opacity-50">Tap to count</span></button>
          <button type="button" onClick={() => setCount(0)} className="secondary-action mx-auto mt-5"><RotateCcw size={16} /> Reset</button>
        </section>

        <section className="surface-card lg:col-span-2" aria-labelledby="ramadan-title">
          <div className="section-icon"><MoonStar /></div>
          <h2 id="ramadan-title" className="mt-6 text-2xl font-semibold">Quran in 30 days</h2>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">One juz each day. Available year-round, with progress stored only on this device.</p>
          <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10" aria-label={`${ramadanDays.length} of 30 portions complete`}>
            {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => {
              const done = ramadanDays.includes(day);
              return <button key={day} type="button" aria-pressed={done} aria-label={`Juz ${day}${done ? " complete" : " incomplete"}`} onClick={() => setRamadanDays((current) => done ? current.filter((item) => item !== day) : [...current, day])} className={`aspect-square rounded-xl text-sm font-semibold ${done ? "bg-emerald-700 text-white" : "border border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-white/5"}`}>{done ? <Check className="mx-auto" size={16} /> : day}</button>;
            })}
          </div>
          <div className="mt-5 flex items-center justify-between text-sm"><span>{ramadanDays.length}/30 portions</span><button type="button" onClick={() => setRamadanDays([])} className="text-stone-500 underline">Reset plan</button></div>
        </section>
      </div>
    </div>
  );
}
