import { useEffect, useMemo, useState, type JSX } from "react";
import { BookmarkX, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { QuranBookmark } from "../core/quran/readingContinuity";
import type { SurahMetadata } from "../core/quran/contracts";
import { getWebReadingContinuityRepository } from "../platform/web/readingContinuity";
import { fetchSurahList } from "../services/quranService";

export default function Bookmarks(): JSX.Element {
  const repository = useMemo(getWebReadingContinuityRepository, []);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>(() =>
    repository.getState().bookmarks,
  );
  const [surahs, setSurahs] = useState<Map<number, SurahMetadata>>(new Map());

  useEffect(() => {
    void fetchSurahList().then((items) => {
      setSurahs(new Map(items.map((item) => [item.number, item])));
    });
  }, []);

  const removeBookmark = (bookmark: QuranBookmark) => {
    const state = repository.removeBookmark(bookmark.ref);
    setBookmarks(state.bookmarks);
  };

  return (
    <div className="mx-auto min-h-[60vh] max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bookmarked Ayahs
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Saved privately on this device.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <p className="font-medium text-gray-700 dark:text-gray-200">
            No bookmarks yet.
          </p>
          <Link
            to="/al-quran"
            className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            Browse the Quran
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookmarks.map((bookmark) => {
            const metadata = surahs.get(bookmark.ref.surahNumber);
            const destination = `/quran/${bookmark.ref.surahNumber}#ayah-${bookmark.ref.ayahNumber}`;

            return (
              <li
                key={`${bookmark.ref.surahNumber}:${bookmark.ref.ayahNumber}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Surah {bookmark.ref.surahNumber}, Ayah{" "}
                      {bookmark.ref.ayahNumber}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {metadata?.transliteratedName ??
                        `Surah ${bookmark.ref.surahNumber}`}
                    </h2>
                    {metadata && (
                      <p
                        className="mt-1 font-noto text-xl text-gray-700 dark:text-gray-200"
                        lang="ar"
                        dir="rtl"
                      >
                        {metadata.arabicName}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Saved {new Date(bookmark.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBookmark(bookmark)}
                    aria-label={`Remove bookmark for Surah ${bookmark.ref.surahNumber}, Ayah ${bookmark.ref.ayahNumber}`}
                    className="min-h-11 min-w-11 rounded-full p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <BookmarkX aria-hidden="true" />
                  </button>
                </div>
                <Link
                  to={destination}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-700 dark:border-gray-600 dark:text-gray-200"
                >
                  Open ayah <ExternalLink size={15} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
