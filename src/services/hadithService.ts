import {
    createHadithProvider,
} from "../core/providers/hadithProvider";
import type {
    Hadith,
    HadithBook,
    HadithChapter,
} from "../core/contracts/hadith";
import { getProviderEndpoint } from "../platform/web/providerGateway";

export type { Hadith, HadithBook, HadithChapter };

const hadithProvider = createHadithProvider({
    endpoint: getProviderEndpoint("hadith"),
});

export interface HadithCollection {
    id: string;
    title: string;
    total: number;
    arabicName?: string;
    description?: string;
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
        return await hadithProvider.getBooks();
    } catch (error) {
        console.error("Error fetching books:", error);
        return [];
    }
}

// Fetch chapters for a specific book
export async function fetchChapters(bookSlug: string): Promise<HadithChapter[]> {
    try {
        return await hadithProvider.getChapters(bookSlug);
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
        return await hadithProvider.getHadiths(bookSlug, chapterId);
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
