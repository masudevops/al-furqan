// Al-Furqan - Islamic Books Service (API-based with English translations)
// Serves authentic Islamic books and Hadith collections via fawazahmed0 API

const HADITH_API_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

// Book Data Types
export interface IslamicBook {
  id: string;
  title: string;
  titleArabic?: string;
  author: string;
  authorArabic?: string;
  category: BookCategory;
  language: string;
  description: string;
  totalChapters: number;
  totalPages?: number;
  publishedYear?: number;
  translator?: string;
  publisher?: string;
  isbn?: string;
  coverImage?: string;
  difficulty: BookDifficulty;
  tags: string[];
  apiSource?: string;
  apiId?: string;
}

export interface BookChapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  titleArabic?: string;
  content: string;
  pageStart?: number;
  pageEnd?: number;
  wordCount?: number;
  estimatedReadingTime?: number;
}

export interface BookCategory {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  icon?: string;
  color?: string;
}

export interface BookSearchResult {
  books: IslamicBook[];
  totalCount: number;
  categories: BookCategory[];
  languages: string[];
}

export type BookDifficulty = "beginner" | "intermediate" | "advanced" | "scholar";

// Hadith API Response Types
interface HadithApiResponse {
  metadata: {
    name: string;
    section: Record<string, string>;
    section_detail: Record<string, any>;
  };
  hadiths: Array<{
    hadithnumber: number;
    arabicnumber: number;
    text: string;
    grades: string[];
    reference: {
      book: number;
      hadith: number;
    };
  }>;
}

// Book Categories
export const BOOK_CATEGORIES: BookCategory[] = [
  {
    id: "hadith",
    name: "Hadith",
    nameArabic: "الحديث",
    description: "Prophetic traditions and their sciences",
    icon: "📜",
    color: "amber"
  },
  {
    id: "aqeedah",
    name: "Aqeedah",
    nameArabic: "العقيدة",
    description: "Islamic creed and theology",
    icon: "🕌",
    color: "emerald"
  },
  {
    id: "fiqh",
    name: "Fiqh",
    nameArabic: "الفقه",
    description: "Islamic jurisprudence and law",
    icon: "⚖️",
    color: "blue"
  },
  {
    id: "seerah",
    name: "Seerah",
    nameArabic: "السيرة",
    description: "Biography of Prophet Muhammad (ﷺ)",
    icon: "🌟",
    color: "green"
  },
  {
    id: "tafseer",
    name: "Tafseer",
    nameArabic: "التفسير",
    description: "Quranic exegesis and commentary",
    icon: "📖",
    color: "purple"
  },
  {
    id: "akhlaq",
    name: "Akhlaq",
    nameArabic: "الأخلاق",
    description: "Islamic ethics and character",
    icon: "💎",
    color: "rose"
  },
  {
    id: "history",
    name: "Islamic History",
    nameArabic: "التاريخ الإسلامي",
    description: "History of Islam and Muslim civilization",
    icon: "🏛️",
    color: "indigo"
  },
  {
    id: "dua",
    name: "Dua & Dhikr",
    nameArabic: "الدعاء والذكر",
    description: "Supplications and remembrance of Allah",
    icon: "🤲",
    color: "teal"
  }
];

// Available English Hadith Books
const ENGLISH_HADITH_BOOKS_CONFIG = [
  {
    apiId: "eng-bukhari",
    title: "Sahih al-Bukhari",
    titleArabic: "صحيح البخاري",
    author: "Imam al-Bukhari",
    authorArabic: "الإمام البخاري",
    translator: "Muhsin Khan",
    description: "The most authentic collection of Hadith, considered the most reliable source after the Quran. Translated by Muhsin Khan.",
    difficulty: "beginner" as BookDifficulty,
    tags: ["hadith", "sahih", "bukhari", "authentic", "six-books", "most-reliable"]
  },
  {
    apiId: "eng-muslim",
    title: "Sahih Muslim",
    titleArabic: "صحيح مسلم",
    author: "Imam Muslim",
    authorArabic: "الإمام مسلم",
    translator: "Abdul Hamid Siddiqui",
    description: "Second most authentic Hadith collection after Bukhari, known for its rigorous authentication. Translated by Abdul Hamid Siddiqui.",
    difficulty: "beginner" as BookDifficulty,
    tags: ["hadith", "sahih", "muslim", "authentic", "six-books", "rigorous"]
  },
  {
    apiId: "eng-abudawud",
    title: "Sunan Abu Dawud",
    titleArabic: "سنن أبي داود",
    author: "Abu Dawud",
    authorArabic: "أبو داود",
    translator: "Ahmad Hasan",
    description: "One of the six major Hadith collections, focusing on legal matters and practical guidance for daily life.",
    difficulty: "intermediate" as BookDifficulty,
    tags: ["hadith", "sunan", "abu-dawud", "fiqh", "daily-life", "six-books"]
  },
  {
    apiId: "eng-tirmidhi",
    title: "Jami' at-Tirmidhi",
    titleArabic: "جامع الترمذي",
    author: "At-Tirmidhi",
    authorArabic: "الترمذي",
    translator: "Abu Khaliyl",
    description: "One of the six major Hadith collections, known for its commentary on the authenticity of narrations.",
    difficulty: "intermediate" as BookDifficulty,
    tags: ["hadith", "jami", "tirmidhi", "six-books", "commentary", "authenticity"]
  },
  {
    apiId: "eng-nasai",
    title: "Sunan an-Nasa'i",
    titleArabic: "سنن النسائي",
    author: "An-Nasa'i",
    authorArabic: "النسائي",
    translator: "Nasiruddin al-Khattab",
    description: "One of the six major Hadith collections, particularly focused on matters of worship and ritual.",
    difficulty: "intermediate" as BookDifficulty,
    tags: ["hadith", "sunan", "nasai", "six-books", "worship", "ritual"]
  },
  {
    apiId: "eng-ibnmajah",
    title: "Sunan Ibn Majah",
    titleArabic: "سنن ابن ماجه",
    author: "Ibn Majah",
    authorArabic: "ابن ماجه",
    translator: "Nasiruddin al-Khattab",
    description: "One of the six major Hadith collections, containing many unique narrations not found elsewhere.",
    difficulty: "intermediate" as BookDifficulty,
    tags: ["hadith", "sunan", "ibn-majah", "six-books", "unique-narrations"]
  },
  {
    apiId: "eng-malik",
    title: "Muwatta Malik",
    titleArabic: "موطأ مالك",
    author: "Imam Malik",
    authorArabic: "الإمام مالك",
    translator: "Aisha Abdurrahman Bewley",
    description: "Early compilation of Hadith and legal opinions, foundational to the Maliki school of jurisprudence.",
    difficulty: "intermediate" as BookDifficulty,
    tags: ["hadith", "muwatta", "malik", "maliki", "early", "jurisprudence"]
  },
  {
    apiId: "eng-nawawi",
    title: "40 Hadith Nawawi",
    titleArabic: "الأربعون النووية",
    author: "Imam An-Nawawi",
    authorArabic: "الإمام النووي",
    translator: "Ezzeddin Ibrahim",
    description: "Collection of 40 essential hadiths covering fundamental aspects of Islam, compiled by Imam An-Nawawi.",
    difficulty: "beginner" as BookDifficulty,
    tags: ["hadith", "nawawi", "forty-hadith", "essential", "fundamental"]
  }
];

// Islamic Books Collection
let ISLAMIC_BOOKS_COLLECTION: IslamicBook[] = [];

// Initialize books collection
async function initializeBooksCollection(): Promise<void> {
  try {
    console.log("Initializing English hadith books collection...");
    
    ISLAMIC_BOOKS_COLLECTION = ENGLISH_HADITH_BOOKS_CONFIG.map(config => ({
      id: config.apiId,
      title: config.title,
      titleArabic: config.titleArabic,
      author: config.author,
      authorArabic: config.authorArabic,
      category: BOOK_CATEGORIES[0], // Hadith category
      language: "en",
      description: config.description,
      totalChapters: 100, // Will be updated when we fetch actual data
      difficulty: config.difficulty,
      tags: config.tags,
      translator: config.translator,
      apiSource: "fawazahmed0-hadith-api",
      apiId: config.apiId
    }));
      
    console.log(`Successfully initialized ${ISLAMIC_BOOKS_COLLECTION.length} English hadith books`);
    
  } catch (error) {
    console.error("Error initializing books collection:", error);
    ISLAMIC_BOOKS_COLLECTION = [];
  }
}

// Service Functions

// Get all book categories
export function getBookCategories(): BookCategory[] {
  return BOOK_CATEGORIES;
}

// Get category by ID
export function getBookCategory(categoryId: string): BookCategory | null {
  return BOOK_CATEGORIES.find(cat => cat.id === categoryId) || null;
}

// Get all books (initialize if needed)
export async function getAllBooks(): Promise<IslamicBook[]> {
  if (ISLAMIC_BOOKS_COLLECTION.length === 0) {
    await initializeBooksCollection();
  }
  return ISLAMIC_BOOKS_COLLECTION;
}

// Get book by ID
export async function getBookById(bookId: string): Promise<IslamicBook | null> {
  const books = await getAllBooks();
  return books.find(book => book.id === bookId) || null;
}

// Get books by category
export async function getBooksByCategory(categoryId: string): Promise<IslamicBook[]> {
  const books = await getAllBooks();
  return books.filter(book => book.category.id === categoryId);
}

// Get books by language
export async function getBooksByLanguage(language: string): Promise<IslamicBook[]> {
  const books = await getAllBooks();
  return books.filter(book => book.language === language);
}

// Get books by difficulty
export async function getBooksByDifficulty(difficulty: BookDifficulty): Promise<IslamicBook[]> {
  const books = await getAllBooks();
  return books.filter(book => book.difficulty === difficulty);
}

// Search books by title, author, or tags
export async function searchBooks(query: string): Promise<IslamicBook[]> {
  const books = await getAllBooks();
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return books;
  
  return books.filter(book => 
    book.title.toLowerCase().includes(searchTerm) ||
    book.author.toLowerCase().includes(searchTerm) ||
    book.description.toLowerCase().includes(searchTerm) ||
    book.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    (book.titleArabic && book.titleArabic.includes(searchTerm)) ||
    (book.authorArabic && book.authorArabic.includes(searchTerm))
  );
}

// Advanced search with filters
export async function searchBooksAdvanced(
  query?: string,
  categoryId?: string,
  language?: string,
  difficulty?: BookDifficulty,
  tags?: string[]
): Promise<BookSearchResult> {
  let filteredBooks = await getAllBooks();
  
  // Apply text search
  if (query && query.trim()) {
    filteredBooks = await searchBooks(query);
  }
  
  // Apply category filter
  if (categoryId) {
    filteredBooks = filteredBooks.filter(book => book.category.id === categoryId);
  }
  
  // Apply language filter
  if (language) {
    filteredBooks = filteredBooks.filter(book => book.language === language);
  }
  
  // Apply difficulty filter
  if (difficulty) {
    filteredBooks = filteredBooks.filter(book => book.difficulty === difficulty);
  }
  
  // Apply tags filter
  if (tags && tags.length > 0) {
    filteredBooks = filteredBooks.filter(book =>
      tags.some(tag => book.tags.includes(tag))
    );
  }
  
  // Get unique categories and languages from results
  const categories = Array.from(
    new Set(filteredBooks.map(book => book.category.id))
  ).map(id => getBookCategory(id)!);
  
  const languages = Array.from(
    new Set(filteredBooks.map(book => book.language))
  );
  
  return {
    books: filteredBooks,
    totalCount: filteredBooks.length,
    categories,
    languages
  };
}

// Get featured/recommended books
export async function getFeaturedBooks(limit: number = 6): Promise<IslamicBook[]> {
  const books = await getAllBooks();
  // Return most popular/authentic books first
  const featured = books
    .filter(book => book.tags.includes("sahih") || book.tags.includes("six-books") || book.difficulty === "beginner")
    .slice(0, limit);
  
  return featured;
}

// Get book chapters list from English Hadith API
export async function fetchBookChaptersList(bookId: string): Promise<BookChapter[]> {
  try {
    const book = await getBookById(bookId);
    if (!book || !book.apiId) return [];
    
    console.log(`Fetching chapters list for book ${bookId} (${book.apiId})`);
    
    // Fetch first 20 hadiths from the English API
    const response = await fetch(`${HADITH_API_BASE}/editions/${book.apiId}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch chapters`);
    }
    
    const apiResponse: HadithApiResponse = await response.json();
    console.log("Chapters API Response metadata:", apiResponse.metadata);
    
    if (!apiResponse.hadiths || apiResponse.hadiths.length === 0) {
      return [];
    }
    
    // Take first 20 hadiths for the chapter list
    const chapters: BookChapter[] = apiResponse.hadiths.slice(0, 20).map(hadith => ({
      id: `${bookId}-hadith-${hadith.hadithnumber}`,
      bookId,
      chapterNumber: hadith.hadithnumber,
      title: `Hadith ${hadith.hadithnumber}`,
      titleArabic: `الحديث ${hadith.hadithnumber}`,
      content: "", // Will be loaded when requested
      wordCount: hadith.text.split(' ').length,
      estimatedReadingTime: Math.ceil(hadith.text.split(' ').length / 200)
    }));
    
    // Update the book's total chapters count
    const bookIndex = ISLAMIC_BOOKS_COLLECTION.findIndex(b => b.id === bookId);
    if (bookIndex !== -1) {
      ISLAMIC_BOOKS_COLLECTION[bookIndex].totalChapters = apiResponse.hadiths.length;
    }
    
    console.log(`Successfully loaded ${chapters.length} chapters for ${book.title} (total: ${apiResponse.hadiths.length})`);
    return chapters;
    
  } catch (error) {
    console.error("Error fetching book chapters list:", error);
    return [];
  }
}

// Fetch individual hadith from English API
export async function fetchBookChapter(bookId: string, chapterNumber: number): Promise<BookChapter | null> {
  try {
    console.log(`Fetching chapter ${chapterNumber} from book ${bookId}`);
    
    // Get book info
    const book = await getBookById(bookId);
    if (!book || !book.apiId) {
      throw new Error("Book not found or not API-enabled");
    }
    
    // Fetch the entire book first (since the API doesn't support individual hadith fetching)
    const response = await fetch(`${HADITH_API_BASE}/editions/${book.apiId}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch hadith`);
    }
    
    const apiResponse: HadithApiResponse = await response.json();
    
    // Find the specific hadith by number
    const hadith = apiResponse.hadiths.find(h => h.hadithnumber === chapterNumber);
    if (!hadith) {
      throw new Error(`Hadith ${chapterNumber} not found`);
    }
    
    // Get section information if available
    let sectionInfo = "";
    if (apiResponse.metadata.section) {
      const sectionKey = Object.keys(apiResponse.metadata.section).find(key => {
        const detail = apiResponse.metadata.section_detail?.[key];
        if (detail) {
          return hadith.hadithnumber >= detail.hadithnumber_first && 
                 hadith.hadithnumber <= detail.hadithnumber_last;
        }
        return false;
      });
      
      if (sectionKey) {
        sectionInfo = `**Chapter:** ${apiResponse.metadata.section[sectionKey]}\n\n`;
      }
    }
    
    // Format the content with proper English translation
    const content = `**${book.title} - Hadith ${hadith.hadithnumber}**

${sectionInfo}**English Translation:**
${hadith.text}

**Reference:** Book ${hadith.reference.book}, Hadith ${hadith.reference.hadith}
**Arabic Number:** ${hadith.arabicnumber}
${hadith.grades.length > 0 ? `**Grades:** ${hadith.grades.join(', ')}` : ''}

**Collection:** ${book.title} (${book.titleArabic})
**Translator:** ${book.translator || 'Unknown'}

---

*This hadith is from ${book.title}, one of the authentic collections of Prophetic traditions. Each hadith provides guidance for Muslims in their daily lives and spiritual development.*

*May Allah grant us the ability to understand and implement the teachings of Prophet Muhammad (peace be upon him) in our lives.*`;
    
    const wordCount = content.split(' ').length;
    const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    return {
      id: `${bookId}-hadith-${chapterNumber}`,
      bookId,
      chapterNumber,
      title: `Hadith ${hadith.hadithnumber}`,
      titleArabic: `الحديث ${hadith.hadithnumber}`,
      content,
      wordCount,
      estimatedReadingTime
    };
    
  } catch (error) {
    console.error("Error fetching book chapter:", error);
    return null;
  }
}

// Utility functions
export async function getAvailableLanguages(): Promise<string[]> {
  const books = await getAllBooks();
  return Array.from(new Set(books.map(book => book.language)));
}

export function getAvailableDifficulties(): BookDifficulty[] {
  return ["beginner", "intermediate", "advanced", "scholar"];
}

export async function getAllTags(): Promise<string[]> {
  const books = await getAllBooks();
  const allTags = books.flatMap(book => book.tags);
  return Array.from(new Set(allTags)).sort();
}

// Format reading time
export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min read`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m read` : `${hours}h read`;
}

// Clean Arabic text for display
export function cleanArabicText(text: string): string {
  return text
    .replace(/[\u064B-\u0652]/g, '') // Remove diacritics if needed
    .trim();
}