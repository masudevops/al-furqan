import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { 
  getAllBooks, 
  getBookCategories, 
  searchBooksAdvanced, 
  getFeaturedBooks,
  type IslamicBook, 
  type BookCategory,
  type BookDifficulty,
  type BookSearchResult
} from "../services/islamicBooksService";

export default function IslamicLibraryPage() {
  const [allBooks, setAllBooks] = useState<IslamicBook[]>([]);
  const [categories] = useState<BookCategory[]>(getBookCategories());
  const [featuredBooks, setFeaturedBooks] = useState<IslamicBook[]>([]);
  const [searchResults, setSearchResults] = useState<BookSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<BookDifficulty | "">("");
  const [showFilters, setShowFilters] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [books, featured] = await Promise.all([
        getAllBooks(),
        getFeaturedBooks(6)
      ]);
      setAllBooks(books);
      setFeaturedBooks(featured);
    } catch (error) {
      console.error("Error loading books:", error);
    } finally {
      setLoading(false);
    }
  };

  // Perform search when filters change
  useEffect(() => {
    if (searchQuery || selectedCategory || selectedLanguage || selectedDifficulty) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, selectedCategory, selectedLanguage, selectedDifficulty]);

  const performSearch = async () => {
    setSearchLoading(true);
    
    try {
      const results = await searchBooksAdvanced(
        searchQuery || undefined,
        selectedCategory || undefined,
        selectedLanguage || undefined,
        selectedDifficulty || undefined
      );
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching books:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLanguage("");
    setSelectedDifficulty("");
    setSearchResults(null);
  };

  const displayBooks = searchResults ? searchResults.books : allBooks;
  const hasActiveFilters = searchQuery || selectedCategory || selectedLanguage || selectedDifficulty;

  const getDifficultyColor = (difficulty: BookDifficulty) => {
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading Islamic books...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Islamic Library - Books Collection" 
        description="Explore authentic Islamic books including Sahih Bukhari, Sahih Muslim, and other major Hadith collections"
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Islamic Library
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Access authentic Islamic knowledge through major Hadith collections including Sahih Bukhari, Sahih Muslim, and other renowned sources.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search books by title, author, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">All Languages</option>
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as BookDifficulty | "")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="scholar">Scholar</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Featured Books (only show when no search/filters) */}
        {!hasActiveFilters && featuredBooks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Featured Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBooks.map(book => (
                <div key={book.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(book.category.color || 'emerald')}`}>
                      {book.category.icon} {book.category.name}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(book.difficulty)}`}>
                      {book.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {book.title}
                  </h3>
                  {book.titleArabic && (
                    <p className="text-right font-arabic text-gray-600 dark:text-gray-400 mb-2">
                      {book.titleArabic}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    by {book.author}
                  </p>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 line-clamp-3">
                    {book.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500 mb-4">
                    <span>{book.totalChapters} hadiths</span>
                    <span>API-powered</span>
                  </div>

                  <Link
                    to={`/library/${book.id}`}
                    className="block w-full text-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Read Collection
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results or All Books */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {hasActiveFilters ? 'Search Results' : 'All Collections'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-500">
              {displayBooks.length} collection{displayBooks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Loading State */}
          {searchLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          )}

          {/* Books Grid */}
          {!searchLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayBooks.map(book => (
                <div key={book.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(book.category.color || 'emerald')}`}>
                      {book.category.icon} {book.category.name}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(book.difficulty)}`}>
                      {book.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {book.title}
                  </h3>
                  {book.titleArabic && (
                    <p className="text-right font-arabic text-gray-600 dark:text-gray-400 mb-2">
                      {book.titleArabic}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    by {book.author}
                  </p>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 line-clamp-3">
                    {book.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500 mb-4">
                    <span>{book.totalChapters} hadiths</span>
                    <span>API-powered</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {book.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                    {book.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        +{book.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/library/${book.id}`}
                    className="block w-full text-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Read Collection
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!searchLoading && displayBooks.length === 0 && hasActiveFilters && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No collections found matching your criteria.
              </p>
              <button
                onClick={clearFilters}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Clear filters to see all collections
              </button>
            </div>
          )}

          {/* No Books Available */}
          {!searchLoading && displayBooks.length === 0 && !hasActiveFilters && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No Islamic books are currently available. Please check back later.
              </p>
            </div>
          )}
        </div>

        {/* Categories Overview */}
        <div className="mt-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setShowFilters(true);
                }}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow text-center"
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {category.nameArabic}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}