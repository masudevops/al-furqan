import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEO from "../components/SEO";
import { type IslamicBook } from "../services/islamicBooksService";
import { ArrowLeft, Download, FileText, BookOpen } from "lucide-react";

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<IslamicBook | null>(null);
  const [loading, setLoading] = useState(true);
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
      // Fetch the specific book from IslamHouse API
      const API_KEY = "paV29H2gm56kvLP";
      const API_BASE = `https://api3.islamhouse.com/v3/${API_KEY}`;
      const url = `${API_BASE}/main/get-item/id/${bookId}/json`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawData = await res.json();
      const item = rawData.data;

      if (!item) {
        setError("Book not found");
        return;
      }

      // Map to IslamicBook format
      const downloads = item.attachments?.map((att: any) => ({
        url: att.url,
        label: att.extension.toUpperCase(),
        size: att.size
      })) || [];

      const author = item.w_authors?.map((a: any) => a.title).join(", ") || "Unknown Author";

      setBook({
        id: item.id.toString(),
        title: item.title,
        description: item.description,
        author: author,
        language: item.source_lang,
        coverImage: item.image,
        downloads,
        type: "book"
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load book");
    } finally {
      setLoading(false);
    }
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            to="/library"
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Islamic Library
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover & Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-8">
              {/* Cover Image */}
              {book.coverImage && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Book Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full uppercase">
                    {book.type}
                  </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {book.title}
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  by <span className="font-semibold text-emerald-600">{book.author}</span>
                </p>
              </div>

              {/* Book Stats */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-500">Language:</span>
                  <span className="text-gray-900 dark:text-gray-100 uppercase">{book.language}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-500">Downloads:</span>
                  <span className="text-gray-900 dark:text-gray-100">{book.downloads.length} formats</span>
                </div>
              </div>

              {/* Download Links */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Download Options
                </h3>
                {book.downloads.length > 0 ? (
                  book.downloads.map((dl, idx) => (
                    <a
                      key={idx}
                      href={dl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{dl.label}</div>
                          {dl.size && <div className="text-xs text-gray-500">{dl.size}</div>}
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                    </a>
                  ))
                ) : (
                  <div className="text-sm text-center text-gray-400 py-4">No downloads available</div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                About this Book
              </h2>

              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6">
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Authentic Islamic Content
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    This book is provided by IslamHouse.com, a trusted source for authentic Islamic literature and resources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}