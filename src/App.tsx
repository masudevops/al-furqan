import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import GlobalPlayer from "./components/GlobalPlayer";
import FeatureFlagDebugger from "./components/FeatureFlagDebugger";
import { AudioProvider } from "./context/AudioContext";
import { SettingsProvider } from "./context/SettingsContext";
import { useFeatureFlags } from "./hooks/useFeatureFlags";

// Pages
import Home from "./pages/Home";
const AlQuranPage = lazy(() => import("./pages/AlQuranPage"));
const SurahDetail = lazy(() => import("./pages/SurahDetail"));
const MushafPage = lazy(() => import("./pages/MushafPage"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));

// New Pages (We will create these next, placeholders for now so build fails safely if not found, 
// so I will create them empty first or just comment out/inline component)
// Ideally I should create them first. 
// I will assume they will exist in next steps.
// To avoid build error NOW, I will define simple types or imports
const HadithHome = lazy(() => import("./pages/HadithHome"));
const HadithCollection = lazy(() => import("./pages/HadithCollection"));
const HadithBook = lazy(() => import("./pages/HadithBook"));

// Placeholder imports for new files I haven't written yet
const TafseerPage = lazy(() => import("./pages/TafseerPage"));
const IslamicLibraryPage = lazy(() => import("./pages/IslamicLibraryPage"));
const BookDetailPage = lazy(() => import("./pages/BookDetailPage"));
const SalahTimesPage = lazy(() => import("./pages/SalahTimesPage"));
const HisnulMuslim = lazy(() => import("./pages/HisnulMuslim"));
const NotFound = lazy(() => import("./pages/NotFound"));
const QiblaPage = lazy(() => import("./pages/Qibla"));
const CompanionPage = lazy(() => import("./pages/CompanionPage"));
const OfflineAudioPage = lazy(() => import("./pages/OfflineAudioPage"));
const NamesOfAllahPage = lazy(() => import("./pages/NamesOfAllahPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));

function AppRoutes() {
  const { mushafView } = useFeatureFlags();

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Al Quran Section */}
      <Route path="/al-quran" element={<AlQuranPage />} />
      <Route path="/quran" element={<AlQuranPage />} /> {/* Alias */}
      <Route path="/quran/:surahId" element={<SurahDetail />} />

      {/* Mushaf Direct Link - Only if feature is enabled */}
      {mushafView && <Route path="/mushaf" element={<MushafPage />} />}

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
      <Route path="/companion" element={<CompanionPage />} />
      <Route path="/qibla" element={<QiblaPage />} />
      <Route path="/offline-audio" element={<OfflineAudioPage />} />
      <Route path="/names" element={<NamesOfAllahPage />} />
      <Route path="/legal" element={<LegalPage />} />

      <Route path="/bookmarks" element={<Bookmarks />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AudioProvider>
      <SettingsProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-[#071713] dark:text-stone-100 transition-colors duration-300 font-sans">
            <Header />
            <main id="main-content" className="flex-grow pb-20 md:pb-0 animate-fadeIn">
              <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-20 text-center text-stone-500" role="status">Opening…</div>}><AppRoutes /></Suspense>
            </main>
            <GlobalPlayer />
            <Footer />
            <FeatureFlagDebugger />
          </div>
        </Router>
      </SettingsProvider>
    </AudioProvider>
  );
}

export default App;
