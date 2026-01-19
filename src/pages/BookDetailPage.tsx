import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../components/SEO";
import { 
  getBookById, 
  fetchBookChaptersList, 
  fetchBookChapter,
  formatReadingTime,
  type IslamicBook, 
  type BookChapter
} from "../services/islamicBooksService";

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<IslamicBook | null>(null);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<BookChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookId) {
      loadBookData();
    }
  }, [bookId]);

  const loadBookData = async () => {
    setLoading(true);
    setError(null);

    try {
      const bookData = await getBookById(bookId!);
      if (!bookData) {
        setError("Book not found");
        return;
      }

      setBook(bookData);
      
      // Load chapters list
      const chaptersData = await fetchBookChaptersList(bookId!);
      setChapters(chaptersData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load book");
    } finally {
      setLoading(false);
    }
  };

  const loadChapter = async (chapterNumber: number) => {
    if (!bookId) return;
    
    setChapterLoading(true);
    try {
      const chapterData = await fetchBookChapter(bookId, chapterNumber);
      setSelectedChapter(chapterData);
    } catch (err) {
      console.error("Error loading chapter:", err);
    } finally {
      setChapterLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "advanced": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "scholar": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getCategoryColor = (color: string) => {
    const colors = {
      emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
      green: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      rose: "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400",
      indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
      teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400"
    };
    return colors[color as keyof typeof colors] || colors.emerald;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading book...</span>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || "Book not found"}</p>
          <Link 
            to="/library" 
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${book.title} - Islamic Library`}
        description={book.description}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            to="/library" 
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ← Islamic Library
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-8">
              {/* Book Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(book.category.color || 'emerald')}`}>
                    {book.category.icon} {book.category.name}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(book.difficulty)}`}>
                    {book.difficulty}
                  </span>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {book.title}
                </h1>
                {book.titleArabic && (
                  <p className="text-right font-arabic text-xl text-gray-600 dark:text-gray-400 mb-4">
                    {book.titleArabic}
                  </p>
                )}
                
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  by {book.author}
                </p>
                {book.authorArabic && (
                  <p className="text-right font-arabic text-gray-500 dark:text-gray-500 mb-4">
                    {book.authorArabic}
                  </p>
                )}
              </div>

              {/* Book Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  About this Collection
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Book Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-500">Hadiths:</span>
                  <span className="text-gray-900 dark:text-gray-100">{book.totalChapters}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-500">Language:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {book.language === 'ar' ? 'Arabic' : 'English'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-500">Difficulty:</span>
                  <span className="text-gray-900 dark:text-gray-100 capitalize">{book.difficulty}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-500">Source:</span>
                  <span className="text-gray-900 dark:text-gray-100">API-powered</span>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* API Info */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-2">
                  📡 Live Content
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  This collection is powered by authentic Hadith APIs, providing real-time access to verified Islamic texts.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Chapters List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Hadiths ({chapters.length} available)
              </h2>
              
              {chapters.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-500">
                    Loading hadiths from API...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map(chapter => (
                    <div 
                      key={chapter.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {chapter.title}
                          </h3>
                          {chapter.titleArabic && (
                            <p className="text-right font-arabic text-gray-600 dark:text-gray-400 mt-1">
                              {chapter.titleArabic}
                            </p>
                          )}
                          {chapter.estimatedReadingTime && chapter.estimatedReadingTime > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              {formatReadingTime(chapter.estimatedReadingTime)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => loadChapter(chapter.chapterNumber)}
                          disabled={chapterLoading}
                          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {chapterLoading && selectedChapter?.chapterNumber === chapter.chapterNumber 
                            ? "Loading..." 
                            : "Read"
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter Content */}
            {selectedChapter && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedChapter.title}
                  </h2>
                  {selectedChapter.titleArabic && (
                    <p className="text-right font-arabic text-xl text-gray-600 dark:text-gray-400 mt-2">
                      {selectedChapter.titleArabic}
                    </p>
                  )}
                  {selectedChapter.estimatedReadingTime && selectedChapter.estimatedReadingTime > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      {formatReadingTime(selectedChapter.estimatedReadingTime)}
                    </p>
                  )}
                </div>
                
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <div className="leading-relaxed whitespace-pre-line">
                    {selectedChapter.content}
                  </div>
                </div>

                {/* API Attribution */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Content provided by authentic Hadith API • {book.title}
                  </p>
                </div>
              </div>
            )}

            {/* Getting Started Guide */}
            {!selectedChapter && chapters.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  📚 How to Use This Collection
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Click "Read" on any hadith above to view the full Arabic text and content</p>
                  <p>• Each hadith is fetched live from authentic Islamic sources</p>
                  <p>• Content includes proper Arabic text with translations where available</p>
                  <p>• All hadiths are from verified collections used by Islamic scholars</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}