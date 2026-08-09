import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Bookmark, Clock3, Compass, Heart, Library, MoonStar, Sparkles } from "lucide-react";
import SEO from "../components/SEO";
import { getWebReadingContinuityRepository } from "../platform/web/readingContinuity";
import { useSettings } from "../context/SettingsContext";

const tools = [
  { title: "Prayer times", copy: "Location-aware daily schedule", path: "/salah", icon: Clock3 },
  { title: "Duas & adhkar", copy: "Authentic daily remembrance", path: "/hisnul", icon: Heart },
  { title: "Qibla", copy: "Private on-device direction", path: "/qibla", icon: Compass },
  { title: "Companion", copy: "Calendar, goals and tasbih", path: "/companion", icon: Sparkles },
  { title: "Tafseer", copy: "Read verse commentary", path: "/tafseer", icon: Library },
  { title: "Bookmarks", copy: "Saved only on this device", path: "/bookmarks", icon: Bookmark },
];

export default function Home() {
  const { uiLanguage } = useSettings();
  const ar = uiLanguage === "ar";
  const continuity = getWebReadingContinuityRepository().getState();
  const resumePath = continuity.lastRead ? `/quran/${continuity.lastRead.ref.surahNumber}#ayah-${continuity.lastRead.ref.ayahNumber}` : "/quran/1";

  return (
    <div>
      <SEO title="Al-Furqan — Quran, prayer and daily worship" description="A free, private and ad-free Quran companion." />
      <section className="relative overflow-hidden border-b border-stone-200 dark:border-white/10">
        <div className="hero-orb" aria-hidden="true" />
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_.95fr] md:px-8">
          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow"><MoonStar size={15} /> {ar ? "مجاني · خاص · بلا إعلانات" : "Free · private · ad-free"}</p>
            <h1 aria-label="Al Furqan — a quieter place to return to the Quran" className="mt-6 text-5xl font-semibold leading-[1.05] tracking-[-.045em] text-stone-950 dark:text-white sm:text-6xl lg:text-7xl">{ar ? "مكان هادئ للعودة إلى القرآن." : "A quieter place to return to the Quran."}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600 dark:text-stone-300">{ar ? "اقرأ واستمع وتدبّر واحفظ موضعك—دون حساب أو إعلانات أو تشتيت." : "Read, listen, reflect and keep your place—without an account, advertisements, or attention traps."}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/al-quran" aria-label="Holy Quran — start reading" className="primary-action"><BookOpen size={18} /> {ar ? "القرآن الكريم" : "Holy Quran"} <ArrowRight size={17} /></Link>
              <Link to={resumePath} className="secondary-action">{continuity.lastRead ? (ar ? `متابعة ${continuity.lastRead.ref.surahNumber}:${continuity.lastRead.ref.ayahNumber}` : `Resume ${continuity.lastRead.ref.surahNumber}:${continuity.lastRead.ref.ayahNumber}`) : ar ? "ابدأ بالفاتحة" : "Begin with Al-Fatihah"}</Link>
            </div>
            <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">{ar ? "تبقى محفوظاتك وإعداداتك وموضع القراءة على هذا الجهاز." : "Your bookmarks, preferences and reading position stay on this device."}</p>
          </div>

          <div className="quran-hero-card relative z-10" dir="rtl">
            <div className="mb-8 flex items-center justify-between text-xs text-emerald-900/60 dark:text-emerald-100/60" dir="ltr"><span>Al-Fatihah · 1</span><span>Makki · 7 ayahs</span></div>
            <p className="quran-hero-arabic" lang="ar">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ</p>
            <p className="mt-7 text-left font-serif text-xl leading-8 text-emerald-950 dark:text-emerald-50" dir="ltr">All praise is for Allah—Lord of all worlds.</p>
            <div className="mt-8 h-px bg-emerald-900/10 dark:bg-white/10" />
            <p className="mt-5 text-left text-xs uppercase tracking-[.18em] text-emerald-900/50 dark:text-emerald-100/50" dir="ltr">Saheeh International · 1:2</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div><p className="eyebrow">Everything in one calm space</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Worship, without the noise.</h2></div>
          <Link to="/companion" className="hidden text-sm font-semibold text-emerald-800 hover:underline dark:text-emerald-200 sm:block">Explore all tools</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(({ title, copy, path, icon: Icon }) => <Link key={path} to={path} className="tool-card group"><span className="tool-icon"><Icon size={21} /></span><span><strong className="block text-base">{title}</strong><span className="mt-1 block text-sm text-stone-500 dark:text-stone-400">{copy}</span></span><ArrowRight className="ml-auto opacity-40 transition group-hover:translate-x-1 group-hover:opacity-100" size={18} /></Link>)}
        </div>
      </section>
    </div>
  );
}
