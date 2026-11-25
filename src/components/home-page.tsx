import Link from "next/link";

import DailyContent from "@/components/daily-content";
import PrayerTimes from "@/components/prayer-times";
import { ButtonLink, Icon, type IconName } from "@/components/ui";
import { englishMeaning } from "@/components/quran-reader/reader-position";
import { publicFeatures } from "@/lib/features";
import type { ContentPreviewItem } from "@/lib/types";
import styles from "./home-page.module.css";

type LastRead = { chapterId: number; chapterName: string; verseNumber: number } | null;
type WarmProps = { onFocus: () => void; onPointerEnter: () => void; onTouchStart: () => void };

type HomePageProps = {
  lastRead: LastRead;
  resumeHref: string;
  resumeInMushaf: boolean;
  chapters?: ContentPreviewItem[];
  warmReaderProps: (id: number) => WarmProps;
};

type Section = { href: string; icon: IconName; title: string; description: string };

export default function HomePage({ lastRead, resumeHref, resumeInMushaf, chapters, warmReaderProps }: HomePageProps) {
  const chapter = chapters?.find((item) => item.id === (lastRead?.chapterId ?? 1));
  const meaning = englishMeaning(chapter?.translatedName);
  const sections: Section[] = [
    { href: "/quran", icon: "quran", title: "Quran", description: "All 114 Surahs with translation, Tafsir, Tajweed and recitation." },
    ...(publicFeatures.learn ? [{ href: "/learn", icon: "learn" as const, title: "Learn", description: "Learn to read the Quran, starting with the Arabic letters." }] : []),
    { href: "/sunnah", icon: "scroll", title: "Sunnah", description: "Major Hadith collections in Arabic, with English and other translations and reported grades." },
    ...(publicFeatures.salahTimes ? [{ href: "/salah-times", icon: "salah" as const, title: "Salah Times", description: "Your next prayer, today's schedule and a monthly timetable." }] : []),
    ...(publicFeatures.dua ? [{ href: "/dua", icon: "dua" as const, title: "Dua", description: "Morning and evening dhikr and daily duas, with their sources." }] : []),
    ...(publicFeatures.masjidFinder ? [{ href: "/masjid-finder", icon: "masjid" as const, title: "Masjid Finder", description: "Masjids around you, how far they are, and directions." }] : []),
    ...(publicFeatures.qibla ? [{ href: "/qibla", icon: "compass" as const, title: "Qibla", description: "The direction of prayer from where you are." }] : []),
  ];

  return <main className={styles.main}>
    <section className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.basmala} lang="ar" dir="rtl" translate="no">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        <h1>A quiet place<br />to meet the Quran.</h1>
        <p className={styles.lede}>Read with trusted translations, Tafsir and recitation, then carry the Sunnah, your prayers and daily remembrance through the day.</p>
        <div className={styles.actions}>
          <ButtonLink variant="primary" href={resumeHref} trailingIcon="arrowRight" {...warmReaderProps(lastRead?.chapterId ?? 1)}>{lastRead ? "Continue reading" : "Begin reading"}</ButtonLink>
          <ButtonLink href="/quran">Browse Surahs</ButtonLink>
        </div>
      </div>
      <Link className={styles.resume} href={resumeHref} {...warmReaderProps(lastRead?.chapterId ?? 1)}>
        <span className={styles.resumeLabel}><Icon name="bookmark" />{lastRead ? "Continue where you left off" : "Start with"}</span>
        <span className={styles.resumeBody}>
          <span>
            <strong>{lastRead?.chapterName ?? chapter?.nameSimple ?? "Al-Fatihah"}</strong>
            <span className={styles.resumeMeta}>{[lastRead ? `Ayah ${lastRead.verseNumber}` : null, meaning, resumeInMushaf ? "Mushaf" : null].filter(Boolean).join(" · ")}</span>
          </span>
          {chapter?.nameArabic ? <span className={styles.resumeArabic} lang="ar" dir="rtl" translate="no">{chapter.nameArabic}</span> : null}
        </span>
        <span className={styles.resumeAction}>{lastRead ? "Resume" : "Open"}<Icon name="arrowRight" /></span>
      </Link>
    </section>

    <DailyContent />
    {publicFeatures.salahTimes ? <PrayerTimes /> : null}

    <section className={styles.sections} aria-labelledby="explore-title">
      <h2 id="explore-title">Explore</h2>
      <div className={styles.sectionGrid}>{sections.map((section) => <Link className={styles.section} href={section.href} key={section.href}>
        <span className={styles.sectionIcon} aria-hidden="true"><Icon name={section.icon} /></span>
        <span><strong>{section.title}</strong><span>{section.description}</span></span>
        <Icon name="arrowRight" />
      </Link>)}</div>
    </section>

    <ul className={styles.promises} aria-label="Our promises">
      <li><Icon name="check" />Free and ad-free</li>
      <li><Icon name="check" />No account needed to read</li>
      <li><Icon name="check" />Every text from an identified source</li>
    </ul>
  </main>;
}
