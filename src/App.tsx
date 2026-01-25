import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import GlobalPlayer from "./components/GlobalPlayer";
import { AudioProvider } from "./context/AudioContext";
import { SettingsProvider } from "./context/SettingsContext";

// Pages
import Home from "./pages/Home";
import AlQuranPage from "./pages/AlQuranPage";
import SurahDetail from "./pages/SurahDetail";
import MushafPage from "./pages/MushafPage";
import Bookmarks from "./pages/Bookmarks";

// New Pages (We will create these next, placeholders for now so build fails safely if not found, 
// so I will create them empty first or just comment out/inline component)
// Ideally I should create them first. 
// I will assume they will exist in next steps.
// To avoid build error NOW, I will define simple types or imports
import HadithHome from "./pages/HadithHome";
import HadithCollection from "./pages/HadithCollection";
import HadithBook from "./pages/HadithBook";

// Placeholder imports for new files I haven't written yet
import TafseerPage from "./pages/TafseerPage";
import IslamicLibraryPage from "./pages/IslamicLibraryPage";
import BookDetailPage from "./pages/BookDetailPage";
import SalahTimesPage from "./pages/SalahTimesPage";
import HisnulMuslim from "./pages/HisnulMuslim";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AudioProvider>
      <SettingsProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 font-sans">
            <Header />
            <main className="flex-grow animate-fadeIn">
              <Routes>
                <Route path="/" element={<Home />} />

                {/* Al Quran Section */}
                <Route path="/al-quran" element={<AlQuranPage />} />
                <Route path="/quran" element={<AlQuranPage />} /> {/* Alias */}
                <Route path="/quran/:surahId" element={<SurahDetail />} />

                {/* Mushaf Direct Link */}
                <Route path="/mushaf" element={<MushafPage />} />

                {/* Hadith Section */}
                <Route path="/hadith" element={<HadithHome />} />
                <Route path="/hadith/:collectionId" element={<HadithCollection />} />
                <Route path="/hadith/:collectionId/:bookNumber" element={<HadithBook />} />

                {/* Tafseer */}
                <Route path="/tafseer" element={<TafseerPage />} />

                {/* Islamic Books */}
                <Route path="/library" element={<IslamicLibraryPage />} />
                <Route path="/library/:bookId" element={<BookDetailPage />} />
                <Route path="/books" element={<IslamicLibraryPage />} /> {/* Alias */}

                {/* Salah Times */}
                <Route path="/salah" element={<SalahTimesPage />} />
                <Route path="/prayer" element={<SalahTimesPage />} /> {/* Backward compat */}

                {/* Hisnul Muslim */}
                <Route path="/hisnul" element={<HisnulMuslim />} />

                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <GlobalPlayer />
            <Footer />
          </div>
        </Router>
      </SettingsProvider>
    </AudioProvider>
  );
}

export default App;