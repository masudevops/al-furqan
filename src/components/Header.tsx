import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookOpen, Bookmark, Clock3, Heart, Home, Menu, Search, Settings, X } from "lucide-react";
import SearchModal from "./SearchModal";
import SettingsModal from "./SettingsModal";
import { useSettings } from "../context/SettingsContext";

const primaryLinks = [
  { name: "Quran", path: "/al-quran", icon: BookOpen },
  { name: "Prayer Times", path: "/salah", icon: Clock3 },
  { name: "Hisnul Muslim", path: "/hisnul", icon: Heart },
  { name: "Bookmarks", path: "/bookmarks", icon: Bookmark },
];

const moreLinks = [
  { name: "Tafseer", path: "/tafseer" },
  { name: "Hadith", path: "/hadith" },
  { name: "Islamic Books", path: "/library" },
  { name: "Qibla", path: "/qibla" },
  { name: "Companion", path: "/companion" },
  { name: "Offline Audio", path: "/offline-audio" },
  { name: "99 Names", path: "/names" },
];

export default function Header() {
  const { uiLanguage } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("q")) setSearchOpen(true);
  }, [searchParams]);

  const active = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const label = (english: string) => uiLanguage === "ar" ? ({ "Quran": "القرآن", "Prayer Times": "الصلاة", "Hisnul Muslim": "الأذكار", "Bookmarks": "المحفوظات", "Tafseer": "التفسير", "Hadith": "الحديث", "Islamic Books": "المكتبة", "Qibla": "القبلة", "Companion": "الرفيق", "Offline Audio": "الصوت دون اتصال", "99 Names": "أسماء الله الحسنى", "Home": "الرئيسية" }[english] || english) : english;

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/92 backdrop-blur-xl dark:border-white/10 dark:bg-[#071713]/92">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Al-Furqan home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-900 text-lg text-amber-200 shadow-sm" aria-hidden="true">ف</span>
            <span className="text-lg font-semibold tracking-tight">Al-Furqan</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Primary navigation">
            {[...primaryLinks, ...moreLinks].map((link) => (
              <Link key={link.path} to={link.path} className={`rounded-full px-3 py-2 text-sm font-medium transition ${active(link.path) ? "bg-emerald-900 text-white dark:bg-emerald-200 dark:text-emerald-950" : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-white/10"}`}>
                {label(link.name)}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setSearchOpen(true)} className="icon-button" aria-label="Search Quran"><Search size={19} /></button>
            <button type="button" onClick={() => setSettingsOpen(true)} className="icon-button" aria-label="Open settings"><Settings size={19} /></button>
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="icon-button lg:hidden" aria-expanded={menuOpen} aria-label="Open navigation menu">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-[#071713] lg:hidden" aria-label="Expanded navigation">
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2">
              {[...primaryLinks, ...moreLinks].map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)} className={`rounded-xl px-4 py-3 text-sm font-medium ${active(link.path) ? "bg-emerald-900 text-white" : "bg-white text-stone-700 dark:bg-white/5 dark:text-stone-200"}`}>{label(link.name)}</Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-200 bg-stone-50/95 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl dark:border-white/10 dark:bg-[#071713]/95 md:hidden" aria-label="Mobile navigation">
        {[{ name: "Home", path: "/", icon: Home }, ...primaryLinks].map(({ name, path, icon: Icon }) => (
          <Link key={path} to={path} aria-label={`${name} mobile navigation`} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[.68rem] font-medium ${active(path) ? "text-emerald-800 dark:text-emerald-200" : "text-stone-500 dark:text-stone-400"}`}><Icon size={19} aria-hidden="true" /><span aria-hidden="true">{uiLanguage === "ar" ? label(name) : name === "Prayer Times" ? "Prayer" : name === "Hisnul Muslim" ? "Duas" : name}</span></Link>
        ))}
      </nav>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
