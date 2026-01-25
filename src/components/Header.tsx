import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes, FaSearch, FaCog } from "react-icons/fa";
import SearchModal from "./SearchModal";
import SettingsModal from "./SettingsModal";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: "Quran", path: "/al-quran" },
    { name: "Hadith", path: "/hadith" },
    { name: "Tafseer", path: "/tafseer" },
    { name: "Prayer Times", path: "/salah" },
    { name: "Hisnul Muslim", path: "/hisnul" },
    { name: "Bookmarks", path: "/bookmarks" },
    { name: "Islamic Books", path: "/library" },
  ];

  /* New State for Search & Settings */
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleLinkClick = () => setIsOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-arabic"
            onClick={handleLinkClick}
          >
            Al-Furqan
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-emerald-500 ${isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-600 dark:text-gray-300"
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Search Trigger (Desktop) */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FaSearch size={14} />
              <span className="opacity-70">Search...</span>
            </button>

            {/* Settings Trigger (Desktop) */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Settings"
            >
              <FaCog size={18} />
            </button>
          </nav>

          {/* Mobile Actions */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="text-gray-600 dark:text-gray-300 p-2"
            >
              <FaSearch size={20} />
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-gray-600 dark:text-gray-300 p-2"
            >
              <FaCog size={20} />
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 animate-fadeIn absolute w-full left-0 top-16 shadow-lg">
            <div className="flex flex-col p-4 space-y-4">
              {links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={handleLinkClick}
                    className={`text-base font-medium transition-colors hover:text-emerald-500 ${isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300"
                      }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />

      {/* Settings Modal (New) */}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  );
}
