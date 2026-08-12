export interface ListSlice<T> {
  error: string | null;
  gatingMessage: string | null;
  items: T[];
}

export interface FactItem {
  label: string;
  value: string;
}

export interface NoteItem {
  body: string;
  id: string | null;
  ranges: string[];
}

export interface BookmarkItem {
  id: string | null;
  readerUrl: string | null;
  type: string;
  verseKey: string;
}

export interface CollectionItem {
  id: string | null;
  name: string;
  updatedAt: string | null;
}

export interface FeedItem {
  authorName: string;
  body: string;
  commentsCount: number;
  id: string | null;
  likesCount: number;
  readerUrl: string | null;
  referenceLabel: string | null;
}

export interface SearchItem {
  arabicText?: string | null;
  label?: string;
  readerUrl: string | null;
  subtitle?: string | null;
  text?: string;
  verseKey?: string | null;
}

export interface ContentPreviewItem {
  id: number;
  nameArabic: string | null;
  nameSimple: string;
  readerUrl: string;
  translatedName: string | null;
  versesCount: number | null;
}

export interface TranslationResource {
  authorName: string | null;
  id: number;
  languageName: string | null;
  name: string;
}

export interface RecitationResource {
  id: number;
  name: string;
  style: string | null;
}

export interface ChapterReciterResource {
  id: number;
  name: string;
  style: string | null;
}

export interface QuranAudioTimestamp {
  segments: Array<[number, number, number]>;
  timestampFrom: number;
  timestampTo: number;
  verseKey: string;
}

export interface ChapterAudioPayload {
  audioUrl: string;
  chapterId: number;
  reciterId: number;
  timestamps: QuranAudioTimestamp[];
}

export interface TafsirResource {
  authorName: string | null;
  id: number;
  languageName: string | null;
  name: string;
}

export interface ReaderWord {
  arabicText: string;
  audioUrl: string | null;
  charType: string;
  lineNumber: number | null;
  position: number;
  qcfCode: string | null;
  translation: string | null;
  transliteration: string | null;
}

export interface ReaderVerse {
  arabicText: string;
  audioUrl: string | null;
  id: string;
  translationName: string | null;
  translationText: string | null;
  translationFootnotes: Array<{ id: number; label: string }>;
  tajweedHtml: string | null;
  tafsirName: string | null;
  tafsirText: string | null;
  verseKey: string | null;
  verseNumber: number | null;
  words: ReaderWord[];
  pageNumber: number | null;
  juzNumber: number | null;
  hizbNumber: number | null;
  rubNumber: number | null;
}

export interface FootnotePayload {
  id: number;
  languageName: string | null;
  textHtml: string;
}

export interface ChapterInfoPayload {
  chapterId: number;
  languageName: string | null;
  shortText: string | null;
  source: string | null;
  textHtml: string;
}

export interface ReaderPayload {
  chapter: {
    id: number;
    nameArabic: string | null;
    nameSimple: string;
    translatedName: string | null;
    versesCount: number | null;
  };
  translationIds: number[];
  recitationId: number | null;
  script: QuranScript;
  tafsirId: number | null;
  verses: ReaderVerse[];
}

export type QuranScript = "uthmani" | "uthmani_simple" | "imlaei" | "indopak" | "indopak_nastaleeq";

export interface QuranReflectItem {
  authorName: string | null;
  bodyHtml: string;
  excerpt: string;
  id: number;
  languageName: string | null;
  postType: string;
  publishedAt: string | null;
  references: Array<{ chapterId: number; from: number; to: number }>;
  title: string | null;
  verified: boolean;
}

export interface QuranReflectPayload {
  error: string | null;
  items: QuranReflectItem[];
  page: number;
  pages: number;
}

export interface AyahHadithItem {
  bookNumber: string | null;
  chapterTitle: string | null;
  collection: string;
  grades: Array<{ grade: string; gradedBy: string | null }>;
  hadithNumber: string;
  textHtml: string;
}

export interface AyahAnswerItem {
  answerHtml: string;
  answeredBy: string | null;
  questionHtml: string;
  questionId: number;
  summary: string | null;
  theme: string | null;
  type: string | null;
}

export interface AyahStudyPayload {
  answers: AyahAnswerItem[];
  hadiths: AyahHadithItem[];
  verseKey: string;
}

export interface MushafWord extends ReaderWord { verseKey: string }
export interface MushafTajweedVerse {
  arabicText: string;
  tajweedHtml: string | null;
  verseKey: string;
}
export interface MushafPayload {
  error:null;
  chapterNames:string[];
  hizbNumbers:number[];
  juzNumbers:number[];
  pageNumber:number;
  lines:Array<{lineNumber:number;words:MushafWord[]}>;
  tajweedLines:Array<{lineNumber:number;words:MushafWord[]}>;
  tajweedVerses:MushafTajweedVerse[];
  verseKeys:string[];
}

export interface BootstrapPayload {
  authError: string | null;
  bookmarks: ListSlice<BookmarkItem>;
  collections: ListSlice<CollectionItem>;
  contentPreview: {
    error: string | null;
    items: ContentPreviewItem[];
    previewReaderUrl: string;
  };
  flashNotice: {
    message: string;
    type: "error" | "success";
  } | null;
  grantedScopes: string[];
  idTokenSummary: Record<string, unknown> | null;
  isLoggedIn: boolean;
  notes: ListSlice<NoteItem>;
  quranReflect: {
    feed: ListSlice<FeedItem>;
    profile: {
      data: Record<string, unknown> | null;
      error: string | null;
      facts: FactItem[];
      gatingMessage: string | null;
    };
  };
  goals: {
    data: Record<string, unknown> | null;
    error: string | null;
    gatingMessage: string | null;
  };
  preferences: {
    data: Record<string, unknown> | null;
    error: string | null;
    gatingMessage: string | null;
  };
  sessionFacts: FactItem[];
  sessionStoreSummary: string;
  userInfo: {
    data: Record<string, unknown> | null;
    error: string | null;
    facts: FactItem[];
    gatingMessage: string | null;
  };
}
