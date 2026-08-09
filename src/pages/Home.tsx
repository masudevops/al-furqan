import { Link } from "react-router-dom";
import { FaBookOpen, FaClock, FaHands, FaBookmark, FaScroll, FaBook } from "react-icons/fa";
import SEO from "../components/SEO";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SEO title="Al Furqan - Your Spiritual Companion" description="Your spiritual companion for Quran, Prayer, and Reflection" />

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center py-20 md:py-32 px-4 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-3xl bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="text-center max-w-4xl mx-auto relative z-10">
          {/* Main Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Al</span> Furqan
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-10 font-light">
            Your spiritual companion for Quran, Prayer, and Reflection
          </p>

          {/* Arabic Text */}
          <div className="mb-10 hover:scale-105 transition-transform duration-500">
            <div className="inline-block bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl px-10 py-6 shadow-2xl">
              <p className="text-3xl md:text-4xl font-arabic text-emerald-400 leading-relaxed" dir="rtl">
                بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          </div>

          {/* Hadith Quote */}
          <div className="mb-8 opacity-80 hover:opacity-100 transition-opacity">
            <p className="text-lg md:text-xl text-gray-300 italic mb-3 font-serif">
              "The best among you are those who learn the Quran and teach it."
            </p>
            <p className="text-sm text-emerald-500/80 uppercase tracking-widest font-semibold">
              — Prophet Muhammad ﷺ
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Holy Quran */}
          <Link to="/al-quran" className="group">
            <div className="bg-gray-800 hover:bg-gray-700 rounded-xl p-8 text-center transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-emerald-500">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-400 transition-colors">
                <FaBookOpen size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Holy Quran</h3>
              <p className="text-gray-400 text-sm">
                Read with translations
              </p>
            </div>
          </Link>

          {/* Prayer Times */}
          <Link to="/salah" className="group">
            <div className="bg-gray-800 hover:bg-gray-700 rounded-xl p-8 text-center transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-emerald-500">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-400 transition-colors">
                <FaClock size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Prayer Times</h3>
              <p className="text-gray-400 text-sm">
                Accurate salah times
              </p>
            </div>
          </Link>

          {/* Hisnul Muslim */}
          <Link to="/hisnul" className="group">
            <div className="bg-gray-800 hover:bg-gray-700 rounded-xl p-8 text-center transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-emerald-500">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-400 transition-colors">
                <FaHands size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Hisnul Muslim</h3>
              <p className="text-gray-400 text-sm">
                Daily du'as and adhkar
              </p>
            </div>
          </Link>

          {/* Bookmarks */}
          <Link to="/bookmarks" className="group">
            <div className="bg-gray-800 hover:bg-gray-700 rounded-xl p-8 text-center transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-emerald-500">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-400 transition-colors">
                <FaBookmark size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Bookmarks</h3>
              <p className="text-gray-400 text-sm">
                Save your favorite verses
              </p>
            </div>
          </Link>

          {/* Tafseer - NEW */}
          <Link to="/tafseer" className="group">
            <div className="bg-gray-800 hover:bg-gray-700 rounded-xl p-8 text-center transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-emerald-500">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-400 transition-colors">
                <FaScroll size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tafseer</h3>
              <p className="text-gray-400 text-sm">
                Quranic commentary
              </p>
            </div>
          </Link>

          {/* Islamic Books - NEW */}
          <Link to="/library" className="group">
            <div className="bg-gray-800 hover:bg-gray-700 rounded-xl p-8 text-center transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-emerald-500">
              <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-400 transition-colors">
                <FaBook size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Islamic Books</h3>
              <p className="text-gray-400 text-sm">
                Authentic Islamic books
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}