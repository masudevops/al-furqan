// Hadith API Service - Using hadithapi.com
// Documentation: https://hadithapi.com/

const API_KEY = "$2y$10$dRykIhT0di8yzzgj2iOHMeGniXNRF4QT5r2ko5U52kBTS3RkuOGMy";
const API_BASE = "https://hadithapi.com/api";

export interface HadithCollection {
    id: string;
    title: string;
    total: number;
    arabicName?: string;
    description?: string;
}

export interface HadithBook {
    bookSlug: string;
    bookName: string;
    bookNameArabic?: string;
    hadithCount: number;
}

export interface HadithChapter {
    id: number;
    chapterNumber: string;
    chapterEnglish: string;
    chapterUrdu?: string;
    chapterArabic?: string;
}

export interface Hadith {
    id: number;
    hadithNumber: string;
    englishNarrator: string;
    hadithEnglish: string;
    hadithUrdu?: string;
    hadithArabic?: string;
    status?: string;
    bookSlug: string;
    chapterId: string;
}

// Hadith API Response Types
interface BooksApiResponse {
    status: number;
    books: Array<{
        bookSlug: string;
        bookName: string;
        writerName: string;
        writerDeath: string;
        hadithsCount: string;
        chaptersCount: string;
        bookNameArabic?: string;
    }>;
}

interface ChaptersApiResponse {
    status: number;
    chapters: Array<{
        id: number;
        chapterNumber: string;
        chapterEnglish: string;
        chapterUrdu?: string;
        chapterArabic?: string;
    }>;
}

interface HadithsApiResponse {
    status: number;
    hadiths: {
        data: Array<{
            id: number;
            hadithNumber: string;
            englishNarrator: string;
            hadithEnglish: string;
            hadithUrdu?: string;
            hadithArabic?: string;
            status?: string;
        }>;
    };
}

// Major Hadith Collections (manually defined since API doesn't provide this)
export const HADITH_COLLECTIONS: HadithCollection[] = [
    {
        id: "sahih-bukhari",
        title: "Sahih al-Bukhari",
        total: 7563,
        arabicName: "صحيح البخاري",
        description: "The most authentic collection of Hadith"
    },
    {
        id: "sahih-muslim",
        title: "Sahih Muslim",
        total: 7563,
        arabicName: "صحيح مسلم",
        description: "Second most authentic collection"
    },
    {
        id: "abu-dawood",
        title: "Sunan Abu Dawud",
        total: 5274,
        arabicName: "سنن أبي داود",
        description: "One of the six major Hadith collections"
    },
    {
        id: "al-tirmidhi",
        title: "Jami` at-Tirmidhi",
        total: 3956,
        arabicName: "جامع الترمذي",
        description: "Includes grading of Hadith authenticity"
    },
    {
        id: "sunan-nasai",
        title: "Sunan an-Nasa'i",
        total: 5761,
        arabicName: "سنن النسائي",
        description: "Known for its careful selection"
    },
    {
        id: "ibn-e-majah",
        title: "Sunan Ibn Majah",
        total: 4341,
        arabicName: "سنن ابن ماجه",
        description: "One of the six major collections"
    }
];

// Fetch all books from API
export async function fetchBooks(): Promise<HadithBook[]> {
    try {
        const res = await fetch(`${API_BASE}/books?apiKey=${API_KEY}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: BooksApiResponse = await res.json();

        if (data.status !== 200 || !data.books) {
            return [];
        }

        return data.books.map(book => ({
            bookSlug: book.bookSlug,
            bookName: book.bookName,
            bookNameArabic: book.bookNameArabic,
            hadithCount: parseInt(book.hadithsCount) || 0
        }));
    } catch (error) {
        console.error("Error fetching books:", error);
        return [];
    }
}

// Fetch chapters for a specific book
export async function fetchChapters(bookSlug: string): Promise<HadithChapter[]> {
    try {
        const res = await fetch(`${API_BASE}/${bookSlug}/chapters?apiKey=${API_KEY}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: ChaptersApiResponse = await res.json();

        if (data.status !== 200 || !data.chapters) {
            return [];
        }

        return data.chapters;
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return [];
    }
}

// Fetch hadiths by book and chapter
export async function fetchHadithsByChapter(
    bookSlug: string,
    chapterId: string
): Promise<Hadith[]> {
    try {
        const res = await fetch(
            `${API_BASE}/hadiths?apiKey=${API_KEY}&book=${bookSlug}&chapter=${chapterId}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: HadithsApiResponse = await res.json();

        if (data.status !== 200 || !data.hadiths?.data) {
            return [];
        }

        return data.hadiths.data.map(hadith => ({
            ...hadith,
            bookSlug,
            chapterId
        }));
    } catch (error) {
        console.error("Error fetching hadiths:", error);
        return [];
    }
}

// Fetch hadiths by book only (for backward compatibility)
export async function fetchHadithsByBook(
    collectionId: string,
    bookNumber: string
): Promise<Hadith[]> {
    // For the new API, we need to fetch by chapter
    // This is a compatibility layer
    return fetchHadithsByChapter(collectionId, bookNumber);
}
