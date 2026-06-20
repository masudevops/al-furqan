# Al-Furqan Quick Reference Guide

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Project Structure at a Glance
```
src/
├── pages/          # Route components (one per page)
├── components/     # Reusable UI components
├── services/       # API calls (quranService, hadithService, tafsirService)
├── context/        # State management (ThemeContext, AudioContext)
├── hooks/          # Custom React hooks
├── data/           # Static JSON data
└── App.tsx         # Routes definition
```

---

## 📍 Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `src/App.tsx` | Route definitions & main app structure |
| `src/main.tsx` | Entry point, providers setup |
| `src/context/ThemeContext.tsx` | Dark/light mode state |
| `src/context/AudioContext.tsx` | Quran audio playback state |
| `src/services/quranService.ts` | Quran API calls |
| `src/services/hadithService.ts` | Hadith API calls |
| `src/services/tafsirService.ts` | Tafsir API calls |
| `tailwind.config.js` | Tailwind theme & colors |
| `src/index.css` | Global styles & animations |

---

## 🎨 Styling Quick Tips

### Dark Mode
```html
<!-- Light mode only -->
<div class="bg-white">

<!-- Dark mode support -->
<div class="bg-white dark:bg-gray-900">

<!-- Always dark -->
<div class="dark:bg-gray-900">
```

### Common Classes
```html
<!-- Containers -->
<div class="max-w-6xl mx-auto px-4 py-8">

<!-- Buttons -->
<button class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">

<!-- Cards -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">

<!-- Text -->
<h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">
<p class="text-gray-600 dark:text-gray-400">
```

### Arabic Text
```html
<!-- Arabic UI text -->
<p class="font-arabic text-right">النص العربي</p>

<!-- Quran text (Mushaf) -->
<p class="font-noto text-3xl leading-loose text-right">النص القرآني</p>

<!-- Right-to-left container -->
<div dir="rtl" lang="ar">
```

---

## 🔄 State Management Patterns

### Using Theme Context
```typescript
import { useTheme } from "../context/ThemeContext";

export default function MyComponent() {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <button onClick={toggleDarkMode}>
      {darkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
```

### Using Audio Context
```typescript
import { useAudio } from "../context/AudioContext";

export default function Player() {
  const { 
    currentAyah, 
    isPlaying, 
    togglePlay, 
    playAyah 
  } = useAudio();
  
  return (
    <button onClick={togglePlay}>
      {isPlaying ? "Pause" : "Play"}
    </button>
  );
}
```

---

## 📡 API Service Patterns

### Fetching Data
```typescript
import { fetchSurahList } from "../services/quranService";

useEffect(() => {
  let cancelled = false;
  
  fetchSurahList()
    .then(data => {
      if (!cancelled) setSurahs(data);
    })
    .catch(err => {
      if (!cancelled) setError(err.message);
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });
  
  return () => { cancelled = true; };
}, []);
```

### Available Services

**Quran**:
- `fetchSurahList()` - All 114 Surahs
- `fetchSurahByIdWithTranslation(id, translation)` - Specific Surah
- `fetchSurahAudio(surahNumber, reciter)` - Audio URLs
- `fetchPage(pageNumber, edition)` - Mushaf page

**Hadith**:
- `fetchBooks(collectionId)` - Books in collection
- `fetchHadithsByBook(collectionId, bookNumber)` - Hadiths in book
- `fetchHadithByNumber(collectionId, hadithNumber)` - Single hadith

**Tafsir**:
- `fetchTafsir(surahNumber, ayahNumber, edition)` - Tafsir for Ayah

---

## 🛣️ Routing Quick Reference

### Adding a New Route

1. **Create page component** in `src/pages/FeaturePage.tsx`
2. **Import in App.tsx**:
   ```typescript
   import FeaturePage from "./pages/FeaturePage";
   ```
3. **Add route**:
   ```typescript
   <Route path="/feature" element={<FeaturePage />} />
   ```
4. **Add to Header navigation** (if needed):
   ```typescript
   { name: "Feature", path: "/feature" }
   ```

### Linking Between Pages
```typescript
import { Link } from "react-router-dom";

<Link to="/quran/1">Read Surah 1</Link>
<Link to="/hadith/bukhari">Bukhari Collection</Link>
```

### Programmatic Navigation
```typescript
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
navigate("/quran/2");
```

---

## 📝 Component Template

### Page Component
```typescript
import { useEffect, useState } from "react";
import SEO from "../components/SEO";

export default function FeaturePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    // Fetch data
    
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <SEO title="Feature" description="Description" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {data && <div>{/* Content */}</div>}
      </div>
    </>
  );
}
```

### Reusable Component
```typescript
interface Props {
  title: string;
  children: React.ReactNode;
}

export default function Card({ title, children }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}
```

---

## 🎯 Common Tasks

### Add Dark Mode Support to Component
```typescript
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

### Create a Loading State
```typescript
{loading && (
  <div className="flex justify-center items-center py-12">
    <p className="text-gray-500">Loading...</p>
  </div>
)}
```

### Create an Error State
```typescript
{error && (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
    <p className="text-red-600 dark:text-red-400">Error: {error}</p>
  </div>
)}
```

### Add SEO to Page
```typescript
import SEO from "../components/SEO";

<SEO 
  title="Page Title" 
  description="Page description for search engines"
/>
```

### Use Custom Hook
```typescript
import { useLocation } from "../hooks/useLocation";

const { latitude, longitude, error } = useLocation();
```

---

## 🔍 Debugging Tips

### Check Component Props
```typescript
console.log("Props:", { title, children });
```

### Monitor State Changes
```typescript
useEffect(() => {
  console.log("Data changed:", data);
}, [data]);
```

### API Response Inspection
```typescript
.then(data => {
  console.log("API Response:", data);
  setData(data);
})
```

### Check Dark Mode
```typescript
console.log("Dark mode:", document.documentElement.classList.contains("dark"));
```

---

## 📦 Adding Dependencies

### Install Package
```bash
npm install package-name
```

### Install Dev Dependency
```bash
npm install --save-dev package-name
```

### Update All Dependencies
```bash
npm update
```

---

## 🚨 Common Issues & Solutions

### Issue: Component not rendering
**Solution**: Check route path in `App.tsx` matches Link `to` prop

### Issue: Dark mode not working
**Solution**: Ensure `ThemeProvider` wraps app in `main.tsx`

### Issue: Audio not playing
**Solution**: Check `AudioProvider` wraps app, verify audio URL is valid

### Issue: API call failing
**Solution**: Check network tab, verify API endpoint, add error logging

### Issue: Tailwind classes not applying
**Solution**: Ensure file is in `content` array in `tailwind.config.js`

---

## 📚 File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `Header.tsx`, `GlobalPlayer.tsx` |
| Pages | PascalCase + "Page" | `AlQuranPage.tsx`, `HadithHome.tsx` |
| Services | camelCase + "Service" | `quranService.ts`, `hadithService.ts` |
| Contexts | PascalCase + "Context" | `ThemeContext.tsx`, `AudioContext.tsx` |
| Hooks | camelCase + "use" prefix | `useLocation.ts`, `useTheme.ts` |
| Data files | kebab-case | `surah-list.json`, `hadith-data.json` |

---

## 🔗 Useful Links

- **Quran API**: https://alquran.cloud/api
- **Hadith API**: https://github.com/fawazahmed0/hadith-api
- **Tailwind Docs**: https://tailwindcss.com/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs/

---

## 💡 Pro Tips

1. **Use `useCallback` for event handlers** to prevent unnecessary re-renders
2. **Extract logic into custom hooks** for reusability
3. **Always add error boundaries** for critical sections
4. **Use `React.lazy()` for code splitting** on large pages
5. **Test in dark mode** during development
6. **Check mobile responsiveness** with DevTools
7. **Use semantic HTML** for better accessibility
8. **Add loading states** for better UX
9. **Cache API responses** when possible
10. **Monitor bundle size** with `npm run build`

---

**Last Updated**: 2024
**Version**: 1.0
