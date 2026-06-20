// Al-Furqan - Islamic Books Service (IslamHouse API v3)
// Documentation: https://documenter.getpostman.com/view/7929737/TzkyMfPc

const API_KEY = "paV29H2gm56kvLP";
const API_BASE = `https://api3.islamhouse.com/v3/${API_KEY}`;

export interface IslamicBook {
  id: string; // "id" from API
  title: string; // "title"
  description: string; // "description"
  author: string; // derived from "add_date" or "author" array
  language: string; // "source_lang"
  coverImage?: string; // "image" url
  downloads: BookAttachment[];
  type: "book" | "article" | "audio" | "video";
}

export interface BookAttachment {
  url: string;
  label: string; // e.g. "PDF", "EPUB"
  size?: string;
}

export interface IslamHouseItem {
  id: number;
  type: string;
  title: string;
  description: string;
  source_lang: string;
  image?: string;
  add_date: number; // Unix timestamp
  attachments?: Array<{
    url: string;
    description: string;
    extension_type: string;  // Changed from 'extension' to 'extension_type'
    size: string;
  }>;
  w_authors?: Array<{
    id: number;
    title: string;
  }>;
}



// Fetch books from IslamHouse
export async function fetchBooks(
  page: number = 1,
  limit: number = 20,
  language: string = "en"
): Promise<{ books: IslamicBook[]; total: number; hasMore: boolean }> {
  try {
    // Correct endpoint: /main/{type}/{flang}/{slang}/{page}/{limit}/{format}
    // For books: type = "books", flang = interface language, slang = source language
    const url = `${API_BASE}/main/books/${language}/${language}/${page}/${limit}/json`;

    console.log("Fetching books from:", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // The API structure varies, but generally returns a list of items
    const rawData = await res.json();

    // IslamHouse API response structure is a bit non-standard sometimes
    // But usually data is in 'data' array
    const items: IslamHouseItem[] = rawData.data || [];

    const books: IslamicBook[] = items.map(mapItemToBook);

    return {
      books,
      total: rawData.meta?.total || 0,
      hasMore: !!rawData.links?.next,
    };

  } catch (error) {
    console.error("Error fetching books:", error);
    return { books: [], total: 0, hasMore: false };
  }
}

// Search books
export async function searchBooks(
  query: string,
  page: number = 1,
  language: string = "en"
): Promise<IslamicBook[]> {
  try {
    // Correct endpoint: /main/site-search/{lang}/{query}/{page}/{limit}/{format}
    const url = `${API_BASE}/main/site-search/${language}/${encodeURIComponent(query)}/${page}/20/json`;

    console.log("Searching books:", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rawData = await res.json();
    const items: IslamHouseItem[] = rawData.data || [];

    return items
      .filter(item => item.type === "book") // Filter only books from search results
      .map(mapItemToBook);

  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
}

function mapItemToBook(item: IslamHouseItem): IslamicBook {
  // Extract attachments (PDFs, etc)
  const downloads: BookAttachment[] = [];
  if (item.attachments) {
    item.attachments.forEach(att => {
      downloads.push({
        url: att.url,
        label: att.extension_type?.toUpperCase() || 'FILE',
        size: att.size
      });
    });
  }

  // Extract author name
  let author = "Unknown Author";
  if (item.w_authors && item.w_authors.length > 0) {
    author = item.w_authors.map(a => a.title).join(", ");
  }

  return {
    id: item.id.toString(),
    title: item.title,
    description: item.description,
    author: author,
    language: item.source_lang,
    coverImage: item.image,
    downloads,
    type: "book"
  };
}