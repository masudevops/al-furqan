import type {
  ReaderDensity,
  ReaderPreferences,
} from "../../core/quran/readerPreferences";

interface QuranReaderControlsProps {
  preferences: ReaderPreferences;
  onChange: (preferences: ReaderPreferences) => void;
}

export default function QuranReaderControls({
  preferences,
  onChange,
}: QuranReaderControlsProps) {
  const setDensity = (density: ReaderDensity) => {
    onChange({ ...preferences, density });
  };

  return (
    <section
      aria-label="Reader settings"
      className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/60"
    >
      <span className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Reader
      </span>
      <button
        type="button"
        aria-label="Decrease Arabic font size"
        onClick={() =>
          onChange({
            ...preferences,
            arabicFontSize: preferences.arabicFontSize - 2,
          })
        }
        className="min-h-10 min-w-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        A−
      </button>
      <span
        aria-label={`Arabic font size ${preferences.arabicFontSize}`}
        className="min-w-12 text-center text-xs text-gray-500 dark:text-gray-400"
      >
        {preferences.arabicFontSize}px
      </span>
      <button
        type="button"
        aria-label="Increase Arabic font size"
        onClick={() =>
          onChange({
            ...preferences,
            arabicFontSize: preferences.arabicFontSize + 2,
          })
        }
        className="min-h-10 min-w-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        A+
      </button>
      <button
        type="button"
        aria-pressed={preferences.showTranslation}
        onClick={() =>
          onChange({
            ...preferences,
            showTranslation: !preferences.showTranslation,
          })
        }
        className={`min-h-10 rounded-lg px-3 text-sm font-medium transition-colors ${
          preferences.showTranslation
            ? "bg-emerald-600 text-white"
            : "border border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        }`}
      >
        Translation
      </button>
      <label className="sr-only" htmlFor="reader-density">
        Reading spacing
      </label>
      <select
        id="reader-density"
        value={preferences.density}
        onChange={(event) => setDensity(event.target.value as ReaderDensity)}
        className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        <option value="comfortable">Comfortable</option>
        <option value="compact">Compact</option>
      </select>
    </section>
  );
}
