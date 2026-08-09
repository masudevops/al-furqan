import SEO from "../components/SEO";

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <SEO title="Privacy & Terms — Al-Furqan" description="Al-Furqan privacy commitments and content terms." />
      <h1 className="text-4xl font-semibold tracking-tight">Privacy & terms</h1>
      <div className="mt-8 space-y-8 leading-8 text-stone-700 dark:text-stone-300">
        <section>
          <h2 className="text-2xl font-semibold text-stone-950 dark:text-white">Privacy</h2>
          <p className="mt-3">Al-Furqan requires no account for its core features and contains no advertising or behavioral tracking. Bookmarks, private notes, reading progress, goals, tasbih state, settings, and downloaded audio remain in your browser storage unless you clear them. Precise location is used on-device to calculate prayer and Qibla information and is not intentionally logged by Al-Furqan.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-stone-950 dark:text-white">Quran content</h2>
          <p className="mt-3">Quran text, translations, recitations, tafsir, and word meanings are supplied by the providers identified in the interface and project documentation. Quran Foundation word-level content is displayed as part of the reading experience, is cached only temporarily, and may not be extracted, resold, or redistributed independently.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-stone-950 dark:text-white">Use and availability</h2>
          <p className="mt-3">The app is provided free of charge for personal reading and worship. Provider availability, browser notification behavior, device sensors, and location accuracy can affect individual features. Prayer times should be checked against a trusted local authority.</p>
        </section>
      </div>
    </div>
  );
}
