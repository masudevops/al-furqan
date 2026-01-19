// Hadith API Service
// Using free Hadith API: https://github.com/fawazahmed0/hadith-api
// Base URL: https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/

const API_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

export interface HadithCollection {
    id: string;
    title: string;
    total: number;
    arabicName?: string;
    description?: string;
}

export interface HadithBook {
    bookNumber: string;
    bookName: string;
    hadithCount: number;
}

export interface Hadith {
    hadithNumber: string;
    hadithArabic: string;
    hadithEnglish: string;
    englishNarrator: string;
    status?: string;
    bookNumber: string;
    chapterId?: string;
    grade?: string;
}

// Major Hadith Collections with their API identifiers
export const HADITH_COLLECTIONS: HadithCollection[] = [
    {
        id: "bukhari",
        title: "Sahih al-Bukhari",
        total: 7563,
        arabicName: "صحيح البخاري",
        description: "The most authentic collection of Hadith"
    },
    {
        id: "muslim",
        title: "Sahih Muslim",
        total: 7563,
        arabicName: "صحيح مسلم",
        description: "Second most authentic collection"
    },
    {
        id: "abudawud",
        title: "Sunan Abu Dawud",
        total: 5274,
        arabicName: "سنن أبي داود",
        description: "One of the six major Hadith collections"
    },
    {
        id: "tirmidhi",
        title: "Jami` at-Tirmidhi",
        total: 3956,
        arabicName: "جامع الترمذي",
        description: "Includes grading of Hadith authenticity"
    },
    {
        id: "nasai",
        title: "Sunan an-Nasa'i",
        total: 5761,
        arabicName: "سنن النسائي",
        description: "Known for its careful selection"
    },
    {
        id: "ibnmajah",
        title: "Sunan Ibn Majah",
        total: 4341,
        arabicName: "سنن ابن ماجه",
        description: "One of the six major collections"
    },
    {
        id: "malik",
        title: "Muwatta Malik",
        total: 1842,
        arabicName: "موطأ مالك",
        description: "Earliest collection of Hadith"
    },
    {
        id: "ahmad",
        title: "Musnad Ahmad",
        total: 26363,
        arabicName: "مسند أحمد",
        description: "Largest collection of Hadith"
    }
];


// Fetch books/chapters for a collection
export async function fetchBooks(collectionId: string): Promise<HadithBook[]> {
    try {
        const books: HadithBook[] = [];
        const bookMap = new Map<number, { name: string; hadithNumbers: Set<number> }>();

        // Strategy: Use known book counts and fetch a small sample to get book names
        // This is much faster than trying to discover all books
        const bookCounts: Record<string, number> = {
            bukhari: 97,
            muslim: 57,
            abudawud: 43,
            tirmidhi: 49,
            nasai: 52,
            ibnmajah: 37,
            malik: 61,
            ahmad: 0 // Too large, will use different approach
        };

        const bookCount = bookCounts[collectionId] || 50;

        // Create books with placeholder names first
        for (let i = 1; i <= bookCount; i++) {
            bookMap.set(i, {
                name: `Book ${i}`,
                hadithNumbers: new Set()
            });
        }

        // Fetch a small sample of hadiths to get actual book names
        // Sample every Nth hadith to discover book names quickly
        const sampleSize = Math.min(50, bookCount * 2); // Sample up to 50 hadiths
        const sampleInterval = Math.max(1, Math.floor(1000 / sampleSize));

        const promises: Promise<void>[] = [];
        for (let i = 1; i <= 1000 && promises.length < sampleSize; i += sampleInterval) {
            promises.push(
                fetch(`${API_BASE}/editions/eng-${collectionId}/${i}.json`)
                    .then(async (res) => {
                        if (res.ok) {
                            try {
                                const data = await res.json();

                                // Extract book info from metadata.section
                                if (data.metadata?.section) {
                                    const sections = data.metadata.section;
                                    Object.keys(sections).forEach((sectionKey) => {
                                        const bookNum = parseInt(sectionKey);
                                        const bookName = sections[sectionKey] || `Book ${bookNum}`;

                                        if (bookMap.has(bookNum)) {
                                            bookMap.get(bookNum)!.name = bookName;
                                        } else {
                                            bookMap.set(bookNum, {
                                                name: bookName,
                                                hadithNumbers: new Set()
                                            });
                                        }
                                    });
                                }

                                // Also check hadiths array for book references
                                if (Array.isArray(data.hadiths)) {
                                    data.hadiths.forEach((h: any) => {
                                        if (h.reference?.book) {
                                            const bookNum = h.reference.book;
                                            if (bookMap.has(bookNum) && h.hadithnumber) {
                                                bookMap.get(bookNum)!.hadithNumbers.add(h.hadithnumber);
                                            }
                                        }
                                    });
                                }
                            } catch {
                                // Skip invalid JSON
                            }
                        }
                    })
                    .catch(() => {
                        // Continue if fetch fails
                    })
            );
        }

        // Wait for all samples with timeout
        await Promise.race([
            Promise.all(promises),
            new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
        ]);

        // Convert map to array
        bookMap.forEach((info, bookNum) => {
            books.push({
                bookNumber: bookNum.toString(),
                bookName: info.name,
                hadithCount: info.hadithNumbers.size || 0
            });
        });

        // If still no books found, use known book counts as fallback
        if (books.length === 0) {
            const bookCounts: Record<string, number> = {
                bukhari: 97,
                muslim: 57,
                abudawud: 43,
                tirmidhi: 49,
                nasai: 52,
                ibnmajah: 37,
                malik: 61
            };

            const count = bookCounts[collectionId] || 50;
            for (let i = 1; i <= count; i++) {
                books.push({
                    bookNumber: i.toString(),
                    bookName: `Book ${i}`,
                    hadithCount: 0
                });
            }
        }

        // Sort by book number
        books.sort((a, b) => parseInt(a.bookNumber) - parseInt(b.bookNumber));

        return books;
    } catch (error) {
        console.error("Error fetching books:", error);
        return [];
    }
}

// Fetch hadiths by book number
export async function fetchHadithsByBook(
    collectionId: string,
    bookNumber: string
): Promise<Hadith[]> {
    try {
        const hadiths: Hadith[] = [];
        const bookNum = parseInt(bookNumber);

        // Strategy: Fetch hadiths and filter by book number from metadata
        // We'll search through a reasonable range
        const collection = HADITH_COLLECTIONS.find(c => c.id === collectionId);
        const totalHadiths = collection?.total || 1000;

        // Estimate: books are roughly evenly distributed
        const estimatedBooks = collectionId === "bukhari" ? 97 :
            collectionId === "muslim" ? 57 :
                collectionId === "abudawud" ? 43 :
                    collectionId === "tirmidhi" ? 49 :
                        collectionId === "nasai" ? 52 :
                            collectionId === "ibnmajah" ? 37 :
                                collectionId === "malik" ? 61 : 50;

        const hadithsPerBook = Math.ceil(totalHadiths / estimatedBooks);
        const startRange = (bookNum - 1) * hadithsPerBook + 1;
        const endRange = Math.min(bookNum * hadithsPerBook + 50, totalHadiths);

        // Fetch hadiths in smaller batches to avoid overwhelming
        const batchSize = 20;
        for (let batchStart = startRange; batchStart <= endRange; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize - 1, endRange);
            const promises: Promise<void>[] = [];

            for (let i = batchStart; i <= batchEnd; i++) {
                promises.push(
                    fetch(`${API_BASE}/editions/eng-${collectionId}/${i}.json`)
                        .then(async (res) => {
                            if (res.ok) {
                                try {
                                    const data = await res.json();

                                    // Check if any hadith in this response belongs to the requested book
                                    if (Array.isArray(data.hadiths)) {
                                        data.hadiths.forEach((h: any) => {
                                            if (h.reference?.book === bookNum) {
                                                hadiths.push({
                                                    hadithNumber: h.hadithnumber?.toString() || i.toString(),
                                                    hadithArabic: h.arabic || "",
                                                    hadithEnglish: h.text || "",
                                                    englishNarrator: extractNarrator(h.text) || "",
                                                    bookNumber: bookNumber,
                                                    grade: h.grades?.[0]?.name || undefined,
                                                    status: h.grades?.[0]?.name || "Sahih"
                                                });
                                            }
                                        });
                                    }

                                    // Also check metadata.section for book number match
                                    if (data.metadata?.section && data.metadata.section[bookNum.toString()]) {
                                        const sectionDetail = data.metadata.section_detail?.[bookNum.toString()];
                                        if (sectionDetail && Array.isArray(data.hadiths)) {
                                            data.hadiths.forEach((h: any) => {
                                                if (h.reference?.book === bookNum ||
                                                    (sectionDetail.hadithnumber_first <= h.hadithnumber &&
                                                        h.hadithnumber <= sectionDetail.hadithnumber_last)) {
                                                    if (!hadiths.find(existing => existing.hadithNumber === h.hadithnumber?.toString())) {
                                                        hadiths.push({
                                                            hadithNumber: h.hadithnumber?.toString() || i.toString(),
                                                            hadithArabic: h.arabic || "",
                                                            hadithEnglish: h.text || "",
                                                            englishNarrator: extractNarrator(h.text) || "",
                                                            bookNumber: bookNumber,
                                                            grade: h.grades?.[0]?.name || undefined,
                                                            status: h.grades?.[0]?.name || "Sahih"
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    }
                                } catch {
                                    // Skip invalid JSON
                                }
                            }
                        })
                        .catch(() => {
                            // Continue if this hadith doesn't exist
                        })
                );
            }

            await Promise.all(promises);
        }

        // Sort by hadith number
        hadiths.sort((a, b) => parseInt(a.hadithNumber) - parseInt(b.hadithNumber));

        return hadiths;
    } catch (error) {
        console.error("Error fetching hadiths:", error);
        return [];
    }
}

// Alternative: Fetch a specific hadith by number
export async function fetchHadithByNumber(
    collectionId: string,
    hadithNumber: number,
    language: string = "eng"
): Promise<Hadith | null> {
    try {
        const res = await fetch(`${API_BASE}/editions/${language}-${collectionId}/${hadithNumber}.json`);
        if (!res.ok) return null;

        const data = await res.json();

        return {
            hadithNumber: data.hadithnumber?.toString() || hadithNumber.toString(),
            hadithArabic: data.text || "",
            hadithEnglish: data.translation || "",
            englishNarrator: data.narrator || "",
            bookNumber: data.metadata?.book?.number?.toString() || "",
            grade: data.grade || undefined,
            status: data.grade || "Sahih"
        };
    } catch (error) {
        console.error("Error fetching hadith:", error);
        return null;
    }
}

// Helper function to extract narrator from hadith text
function extractNarrator(text: string): string {
    if (!text) return "";
    const match = text.match(/Narrated\s+([^:]+):/i);
    return match ? match[1].trim() : "";
}
