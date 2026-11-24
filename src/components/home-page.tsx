import Link from "next/link";

import DailyContent from "@/components/daily-content";
import PrayerTimes from "@/components/prayer-times";
import { ButtonLink, Icon, type IconName } from "@/components/ui";
import { englishMeaning } from "@/components/quran-reader/reader-position";
import { publicFeatures } from "@/lib/features";
import type { ContentPreviewItem } from "@/lib/types";
import styles from "./home-page.module.css";
import { t } from "@/i18n";

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
    { href: "/quran", icon: "quran", title: t("Quran"), description: t("All 114 Surahs with translation, Tafsir, Tajweed and recitation.") },
    ...(publicFeatures.learn ? [{ href: "/learn", icon: "learn" as const, title: t("Learn"), description: t("Learn to read the Quran, starting with the Arabic letters.") }] : []),
    { href: "/sunnah", icon: "scroll", title: t("Sunnah"), description: t("Major Hadith collections in Arabic and English, with reported grades.") },
    ...(publicFeatures.salahTimes ? [{ href: "/salah-times", icon: "salah" as const, title: t("Salah Times"), description: t("Your next prayer, today's schedule and a monthly timetable.") }] : []),
    ...(publicFeatures.dua ? [{ href: "/dua", icon: "dua" as const, title: t("Dua"), description: t("Morning and evening dhikr and daily duas, with their sources.") }] : []),
    ...(publicFeatures.masjidFinder ? [{ href: "/masjid-finder", icon: "masjid" as const, title: t("Masjid Finder"), description: t("Masjids around you, how far they are, and directions.") }] : []),
    ...(publicFeatures.qibla ? [{ href: "/qibla", icon: "compass" as const, title: t("Qibla"), description: t("The direction of prayer from where you are.") }] : []),
  ];

  return <main className={styles.main}>
    <section className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.basmala} lang="ar" dir="rtl" translate="no">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        <h1>{t("A quiet place")}<br />{t("to meet the Quran.")}</h1>
        <p className={styles.lede}>{t("Read with trusted translations, Tafsir and recitation, then carry the Sunnah, your prayers and daily remembrance through the day.")}</p>
        <div className={styles.actions}>
          <ButtonLink variant="primary" href={resumeHref} trailingIcon="arrowRight" {...warmReaderProps(lastRead?.chapterId ?? 1)}>{lastRead ? t("Continue reading") : t("Begin reading")}</ButtonLink>
          <ButtonLink href="/quran">{t("Browse Surahs")}</ButtonLink>
        </div>
      </div>
      <Link className={styles.resume} href={resumeHref} {...warmReaderProps(lastRead?.chapterId ?? 1)}>
        <span className={styles.resumeLabel}><Icon name="bookmark" />{lastRead ? t("Continue where you left off") : t("Start with")}</span>
        <span className={styles.resumeBody}>
          <span>
            <strong>{lastRead?.chapterName ?? chapter?.nameSimple ?? "Al-Fatihah"}</strong>
            <span className={styles.resumeMeta}>{[lastRead ? t("Ayah {number}", { number: lastRead.verseNumber }) : null, meaning, resumeInMushaf ? t("Mushaf") : null].filter(Boolean).join(" · ")}</span>
          </span>
          {chapter?.nameArabic ? <span className={styles.resumeArabic} lang="ar" dir="rtl" translate="no">{chapter.nameArabic}</span> : null}
        </span>
        <span className={styles.resumeAction}>{lastRead ? t("Resume") : t("Open")}<Icon name="arrowRight" /></span>
      </Link>
    </section>

    <DailyContent />
    {publicFeatures.salahTimes ? <PrayerTimes /> : null}

    <section className={styles.sections} aria-labelledby="explore-title">
      <h2 id="explore-title">{t("Explore")}</h2>
      <div className={styles.sectionGrid}>{sections.map((section) => <Link className={styles.section} href={section.href} key={section.href}>
        <span className={styles.sectionIcon} aria-hidden="true"><Icon name={section.icon} /></span>
        <span><strong>{section.title}</strong><span>{section.description}</span></span>
        <Icon name="arrowRight" />
      </Link>)}</div>
    </section>

    <ul className={styles.promises} aria-label={t("Our promises")}>
      <li><Icon name="check" />{t("Free and ad-free")}</li>
      <li><Icon name="check" />{t("No account needed to read")}</li>
      <li><Icon name="check" />{t("Every text from an identified source")}</li>
    </ul>
  </main>;
}
