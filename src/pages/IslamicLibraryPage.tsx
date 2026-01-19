import { useEffect, useState } from "react";
import SEO from "../components/SEO";
import {
  fetchBooks,
  searchBooks,
  type IslamicBook
} from "../services/islamicBooksService";
import { BookOpen, Search, Filter, ChevronRight, FileText, Download } from "lucide-react";

export default function IslamicLibraryPage() {
  const [books, setBooks] = useState<IslamicBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("en");

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Initial Load
  useEffect(() => {
    loadBooks();
  }, [page, language]);

  // Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        performSearch();
      } else {
        // Reset to initial load if search cleared
        if (books.length === 0 && !loading) {
          setPage(1);
          loadBooks();
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      // If page 1, fetch fresh. If page > 1, append.
      const result = await fetchBooks(page, 20, language);

      if (page === 1) {
        setBooks(result.books);
      } else {
        setBooks(prev => [...prev, ...result.books]);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await searchBooks(searchQuery, 1, language);
      setBooks(results);
      setHasMore(false); // Search doesn't support pagination in this simple impl yet
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    setPage(1);
    setBooks([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO
        title="Islamic Library"
        description="Access authentic Islamic books, articles, and resources powered by IslamHouse."
      />

      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Islamic Library</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Discover a vast collection of authentic Islamic books and resources powered by IslamHouse.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for books, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={language}
              onChange={handleLanguageChange}
              className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 w-full"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="ur">Urdu</option>
              <option value="bn">Bengali</option>
              <option value="fr">French</option>
              <option value="id">Indonesian</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading && books.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {books.map(book => (
                <div key={book.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                        {book.type}
                      </span>
                      {book.language && (
                        <span className="text-xs text-gray-500 uppercase">{book.language}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2" title={book.title}>
                      {book.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      By <span className="font-semibold text-emerald-600">{book.author}</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm line-clamp-3 mb-4">
                      {book.description}
                    </p>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <div className="space-y-2">
                      {book.downloads.length > 0 ? (
                        book.downloads.slice(0, 2).map((dl, idx) => (
                          <a
                            key={idx}
                            href={dl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />
                              <span className="text-sm font-medium">{dl.label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              {dl.size && <span>{dl.size}</span>}
                              <Download className="w-4 h-4" />
                            </div>
                          </a>
                        ))
                      ) : (
                        <div className="text-sm text-center text-gray-400 py-2">No downloads available</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && !searchQuery && (
              <div className="text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Load More Books <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}