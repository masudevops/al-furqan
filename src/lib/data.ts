import "server-only";

import { DEFAULT_BOOKMARK_MUSHAF, DEFAULT_FEED_QUERY, LIST_PREVIEW_LIMIT, SESSION_EXPIRED_MESSAGE } from "@/lib/constants";
import { dailyIndex } from "@/lib/daily";
import { getConfig } from "@/lib/env";
import { decodeJwt } from "@/lib/oauth";
import type { StoredSession } from "@/lib/session/store";
import { createClients, getSearchModeQuick } from "@/lib/sdk";
import type {
  BookmarkItem,
  BootstrapPayload,
  ChapterAudioPayload,
  ChapterInfoPayload,
  ChapterReciterResource,
  CollectionItem,
  ContentPreviewItem,
  FactItem,
  FeedItem,
  FootnotePayload,
  AyahStudyPayload,
  AyahTafsirPayload,
  TajweedGlyphPayload,
  TajweedGlyphWord,
  PracticeWordPayload,
  NoteItem,
  ReaderPayload,
  QuranScript,
  QuranReflectPayload,
  RecitationResource,
  SearchItem,
  TafsirResource,
  TranslationResource,
} from "@/lib/types";

type JsonObject = Record<string, unknown>;

const READER_PAGE_SIZE = 50;

const asObject = (value: unknown): JsonObject => {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as JsonObject;
};

const asString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

const asNullableString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
};

const asNullableNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asNullableObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
};

const toArray = (value: unknown, keys: string[] = []): JsonObject[] => {
  if (Array.isArray(value)) {
    return value.map(asObject);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  for (const key of keys) {
    const nested = (value as Record<string, unknown>)[key];
    if (Array.isArray(nested)) {
      return nested.map(asObject);
    }
  }

  return [];
};

const formatError = (error: unknown): string => String((error as Error)?.message ?? error);

const withReaderStage = async <T>(stage: string, operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw new Error(`Reader ${stage} failed: ${formatError(error)}`, { cause: error });
  }
};

const formatTimestamp = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const milliseconds = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const getTranslation = (
  translations: unknown,
  preferredResourceId: number,
): { footnotes: Array<{ id: number; label: string }>; name: string | null; text: string | null } => {
  const items = Array.isArray(translations) ? translations : [];
  if (items.length === 0) {
    return { footnotes: [], name: null, text: null };
  }

  const preferred = items.find((item) => {
    const translation = asObject(item);
    const resourceId = asNullableNumber(
      translation.resourceId ?? translation.resource_id,
    );
    const text = asNullableString(translation.text);
    return resourceId === preferredResourceId && Boolean(text);
  });

  if (preferred) {
    const translation = asObject(preferred);
    const text = asNullableString(translation.text);
    if (text) {
      const normalized = sanitizeTranslationMarkup(text);
      return {
        footnotes: normalized.footnotes,
        name: asNullableString(
          translation.resourceName ?? translation.resource_name,
        ),
        text: normalized.html,
      };
    }
  }

  const firstWithText = items.find((item) =>
    Boolean(asNullableString(asObject(item).text)),
  );

  if (!firstWithText) {
    return { footnotes: [], name: null, text: null };
  }

  const translation = asObject(firstWithText);
  const normalized = sanitizeTranslationMarkup(asNullableString(translation.text) ?? "");
  return {
    footnotes: normalized.footnotes,
    name: asNullableString(
      translation.resourceName ?? translation.resource_name,
    ),
    text: normalized.html,
  };
};

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const decodeCodePoint = (match: string, code: number) => Number.isInteger(code) && code >= 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : match;
const decodeSourceEntities = (value: string) => value
  .replace(/&#(\d+);/g, (match, code: string) => decodeCodePoint(match, Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (match, code: string) => decodeCodePoint(match, Number.parseInt(code, 16)))
  .replace(/&nbsp;/gi, "\u00a0")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&amp;/gi, "&");

export const sanitizeSourceHtml = (value: unknown): string => {
  const source = decodeSourceEntities(asString(value)).replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  return escapeHtml(source)
    .replace(/&lt;(p|h2|h3|strong|em|b|i|span|ul|ol|li|blockquote)(?:\s[^]*?)?&gt;/gi, "<$1>")
    .replace(/&lt;\/(p|h2|h3|strong|em|b|i|span|ul|ol|li|blockquote)&gt;/gi, "</$1>")
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>");
};

export const sanitizeTranslationMarkup = (value: string) => {
  const footnotes: Array<{ id: number; label: string }> = [];
  const withoutFootnotes = value.replace(/<sup\s+foot_note=["']?(\d+)["']?\s*>([^<]*)<\/sup>/gi, (_match, id: string, label: string) => {
    const parsed = Number(id);
    if (parsed > 0 && !footnotes.some((item) => item.id === parsed)) footnotes.push({ id: parsed, label: label.trim() || String(footnotes.length + 1) });
    return `__AF_FOOTNOTE_${parsed}_${escapeHtml(label.trim() || String(footnotes.length))}__`;
  });
  let html = sanitizeSourceHtml(withoutFootnotes);
  // The marker keeps the note id so the reader can open the translator's note from the number in the text.
  html = html.replace(/__AF_FOOTNOTE_(\d+)_([^_]+)__/g, '<sup data-footnote="$1">$2</sup>');
  return { footnotes, html };
};

export const deriveReflectPresentation = (value: unknown): { excerpt: string; title: string | null } => {
  const cleaned = decodeSourceEntities(asString(value))
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|li|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const lines = cleaned.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const title = firstLine.length >= 8 && firstLine.length <= 140 ? firstLine : null;
  const excerptSource = (title ? lines.slice(1) : lines).join(" ");
  if (excerptSource.length <= 240) return { excerpt: excerptSource, title };
  const shortened = excerptSource.slice(0, 241);
  const lastSpace = shortened.lastIndexOf(" ");
  return { excerpt: `${shortened.slice(0, lastSpace > 180 ? lastSpace : 240).trimEnd()}…`, title };
};

const reflectBodyWithoutRepeatedTitle = (value: unknown, title: string | null) => {
  const source = asString(value);
  if (!title) return source;
  const leadingWhitespace = source.match(/^\s*/)?.[0].length ?? 0;
  return source.slice(leadingWhitespace).startsWith(title)
    ? source.slice(leadingWhitespace + title.length).replace(/^\s+/, "")
    : source;
};

const plainSourceText = (value: unknown): string | null => {
  const text = asNullableString(value);
  if (!text) return null;
  return text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
};

// The UthmanicHafs font is drawn for Quran.Foundation's QPC Hafs encoding; with text_uthmani some marks
// (e.g. U+06DF small high rounded zero) fall onto a dotted circle. The trailing Ayah number is dropped
// because the interface draws its own end-of-Ayah marker.
export const qpcHafsText = (item: Record<string, unknown>) =>
  asNullableString(item.textQpcHafs ?? item.text_qpc_hafs)?.replace(/\s*[\u0660-\u0669\u06F0-\u06F9]+\s*$/, "") || null;

// Word recitations are served from Quran.Foundation's audio host; the API gives paths relative to it.
const WORD_AUDIO_BASE = "https://verses.quran.foundation/";
const absoluteWordAudio = (value: unknown) => {
  const audio = asNullableString(value);
  return audio ? (audio.startsWith("http") ? audio : `${WORD_AUDIO_BASE}${audio.replace(/^\//, "")}`) : null;
};

const normalizeWords = (value: unknown) => toArray(value).map((word) => {
  const translation = asObject(word.translation);
  const transliteration = asObject(word.transliteration);
  return {
    arabicText: qpcHafsText(word) ?? asString(word.textUthmani ?? word.text),
    audioUrl: absoluteWordAudio(word.audioUrl ?? word.audio_url),
    charType: asString(word.charTypeName ?? word.char_type_name, "word"),
    lineNumber: asNullableNumber(word.lineNumber ?? word.line_number),
    position: Number(asNullableNumber(word.position) ?? 0),
    qcfCode: asNullableString(word.codeV2 ?? word.code_v2),
    translation: asNullableString(translation.text),
    transliteration: asNullableString(transliteration.text),
  };
});

export const buildReaderUrlFromKey = (key: string | null | undefined): string | null => {
  const normalized = String(key ?? "").trim();
  if (!normalized) {
    return null;
  }

  if (/^\d+$/.test(normalized)) {
    return `/quran/${normalized}`;
  }

  if (/^\d+:\d+(?:-\d+)?$/.test(normalized)) {
    return `/quran/${normalized.replace(":", "/").split("-")[0]}`;
  }

  return null;
};

export const getGrantedScopes = (session: StoredSession): string[] => {
  const userSession = session.userSession ?? {};
  const rawScopes =
    userSession.scope ??
    userSession.scopes ??
    userSession.grantedScopes ??
    [];

  if (Array.isArray(rawScopes)) {
    return rawScopes.filter(Boolean);
  }

  if (typeof rawScopes !== "string") {
    return [];
  }

  return rawScopes
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
};

const hasScope = (grantedScopes: string[], scope: string): boolean =>
  grantedScopes.includes(scope);

const summarizeIdToken = (idToken: unknown): Record<string, unknown> | null => {
  if (typeof idToken !== "string") {
    return null;
  }

  const payload = decodeJwt(idToken);
  if (!payload) {
    return null;
  }

  return {
    audience: payload.aud,
    email: payload.email ?? null,
    expiresAt: payload.exp ?? null,
    firstName: payload.first_name ?? null,
    issuedAt: payload.iat ?? null,
    issuer: payload.iss ?? null,
    lastName: payload.last_name ?? null,
    sessionId: payload.sid ?? null,
    subject: payload.sub ?? null,
  };
};

const buildSessionFacts = (
  userSession: Record<string, unknown>,
  grantedScopes: string[],
  idTokenSummary: Record<string, unknown> | null,
): FactItem[] => {
  const subject =
    String(idTokenSummary?.email ?? idTokenSummary?.subject ?? "Unknown user");

  return [
    {
      label: "Signed in as",
      value: subject,
    },
    {
      label: "Granted scopes",
      value: `${grantedScopes.length}`,
    },
    {
      label: "Refresh token",
      value: userSession.refreshToken ? "Available" : "Missing",
    },
    {
      label: "Expires at",
      value: formatTimestamp(userSession.expiresAt) ?? "Unknown",
    },
  ];
};

const buildUserInfoFacts = (userInfo: Record<string, unknown> | null): FactItem[] => {
  if (!userInfo) {
    return [];
  }

  return [
    { label: "Subject", value: String(userInfo.sub ?? "Unavailable") },
    { label: "Email", value: String(userInfo.email ?? "Unavailable") },
    { label: "Issuer", value: String(userInfo.iss ?? "Unavailable") },
  ];
};

const buildProfileFacts = (profile: Record<string, unknown> | null): FactItem[] => {
  if (!profile) {
    return [];
  }

  const displayName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  return [
    { label: "Username", value: String(profile.username ?? "Unavailable") },
    { label: "Display name", value: displayName || "Unavailable" },
    { label: "Posts", value: `${Number(profile.postsCount ?? 0)}` },
    { label: "Followers", value: `${Number(profile.followersCount ?? 0)}` },
  ];
};

const normalizeNoteItem = (note: unknown): NoteItem => {
  const entry = asObject(note);

  return {
    body: asString(entry.body),
    id: asNullableString(entry.id),
    ranges: Array.isArray(entry.ranges)
      ? entry.ranges.map((value) => asString(value)).filter(Boolean)
      : [],
  };
};

const normalizeBookmarkItem = (bookmark: unknown): BookmarkItem => {
  const entry = asObject(bookmark);
  const chapterKey = asNullableString(entry.key);
  const verseNumber = asNullableString(entry.verseNumber);
  const verseKey =
    chapterKey && verseNumber ? `${chapterKey}:${verseNumber}` : chapterKey ?? "?";

  return {
    id: asNullableString(entry.id),
    readerUrl: buildReaderUrlFromKey(verseKey),
    type: asString(entry.type, "ayah"),
    verseKey,
  };
};

const normalizeCollectionItem = (collection: unknown): CollectionItem => {
  const entry = asObject(collection);

  return {
    id: asNullableString(entry.id),
    name: asString(entry.name, "Untitled collection"),
    updatedAt: asNullableString(entry.updatedAt),
  };
};

const normalizeFeedItem = (post: unknown): FeedItem => {
  const entry = asObject(post);
  const references = Array.isArray(entry.references) ? entry.references : [];
  const firstReference = asObject(references[0]);
  const chapterId = asNullableString(firstReference.chapterId);
  const fromVerse = asNullableString(firstReference.from);
  const toVerse = asNullableString(firstReference.to);

  const referenceLabel = chapterId
    ? `${chapterId}:${fromVerse ?? "?"}${
        toVerse && toVerse !== fromVerse
          ? `-${toVerse}`
          : ""
      }`
    : null;

  const author = asObject(entry.author);

  return {
    authorName: asString(author.displayName ?? author.username, "QuranReflect author"),
    body: asString(entry.body),
    commentsCount: Number(asNullableNumber(entry.commentsCount) ?? 0),
    id: asNullableString(entry.id),
    likesCount: Number(asNullableNumber(entry.likesCount) ?? 0),
    readerUrl: buildReaderUrlFromKey(referenceLabel),
    referenceLabel,
  };
};

// Quran.Foundation search (with getText) returns ranked results: Surahs, Juz and Ayahs with their Arabic text.
// Its English snippets mix unnamed translations, so Ayah results are shown with one named translation instead.
export const normalizeSearchResults = (response: unknown, query: string) => {
  const payload = asObject(response);
  const result = asObject(payload.result);
  const pagination = asObject(payload.pagination);
  const navigationItems: SearchItem[] = [];
  const verseItems: SearchItem[] = [];
  for (const item of [...toArray(result.navigation), ...toArray(result.verses)]) {
    const key = asNullableString(item.key);
    const type = asString(item.resultType ?? item.result_type, "ayah");
    if (type === "ayah" && key && /^\d+:\d+$/.test(key)) {
      verseItems.push({ arabicText: asNullableString(item.arabic), readerUrl: buildReaderUrlFromKey(key), verseKey: key });
    } else if (type === "surah" && key) {
      navigationItems.push({ label: asString(item.name, `Surah ${key}`), readerUrl: buildReaderUrlFromKey(key), subtitle: asNullableString(item.arabic) });
    }
  }
  return {
    error: null,
    navigationItems,
    page: Number(asNullableNumber(pagination.currentPage ?? pagination.current_page) ?? 1),
    pages: Number(asNullableNumber(pagination.totalPages ?? pagination.total_pages) ?? 1),
    query,
    total: Number(asNullableNumber(pagination.totalRecords ?? pagination.total_records) ?? verseItems.length + navigationItems.length),
    verseItems,
  };
};

const createEmptySlice = (gatingMessage: string | null = null) => ({
  error: null,
  gatingMessage,
  items: [],
});

const createScopeGate = (scope: string): string => `Requires the \`${scope}\` scope.`;

const loadSafely = async (loader: () => Promise<unknown>) => {
  try {
    return {
      data: await loader(),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: formatError(error),
    };
  }
};

const didSdkClearSession = (
  initialUserSession: Record<string, unknown> | null | undefined,
  session: StoredSession,
): boolean => Boolean(initialUserSession && !session.userSession);

const normalizeNotes = (response: unknown): NoteItem[] =>
  toArray(response, ["data", "items", "rows"]).slice(0, LIST_PREVIEW_LIMIT).map(normalizeNoteItem);

const normalizeBookmarks = (response: unknown): BookmarkItem[] =>
  toArray(response, ["data", "items", "rows"]).slice(0, LIST_PREVIEW_LIMIT).map(normalizeBookmarkItem);

const normalizeCollections = (response: unknown): CollectionItem[] =>
  toArray(response, ["data", "items", "rows"]).slice(0, LIST_PREVIEW_LIMIT).map(normalizeCollectionItem);

const normalizeFeedItems = (response: unknown): FeedItem[] =>
  toArray(response, ["data", "items", "rows"]).slice(0, LIST_PREVIEW_LIMIT).map(normalizeFeedItem);

export const loadContentPreviewData = async (
  session: StoredSession,
  limit = 6,
): Promise<{ error: string | null; items: ContentPreviewItem[]; previewReaderUrl: string }> => {
  const config = getConfig();
  const { serverClient } = await createClients(session);

  const payload: {
    error: string | null;
    items: ContentPreviewItem[];
    previewReaderUrl: string;
  } = {
    error: null,
    items: [] as ContentPreviewItem[],
    previewReaderUrl: `/quran/${config.defaultReaderChapter}`,
  };

  try {
    const chapters = await serverClient.content.v4.chapters.list({ language: "en" });
    const items = toArray(chapters, ["data", "chapters"]).slice(0, limit);

    payload.items = items.map((chapter) => ({
      id: Number(asNullableNumber(chapter.id) ?? 0),
      nameArabic: asNullableString(chapter.nameArabic),
      nameSimple: asString(chapter.nameSimple, `Chapter ${asString(chapter.id)}`),
      readerUrl: `/quran/${asString(chapter.id)}`,
      revelationOrder: asNullableNumber(chapter.revelationOrder ?? chapter.revelation_order),
      revelationPlace: asNullableString(chapter.revelationPlace ?? chapter.revelation_place),
      translatedName: asNullableString(asObject(chapter.translatedName).name),
      versesCount: asNullableNumber(chapter.versesCount),
    }));

    if (payload.items[0]?.readerUrl) {
      payload.previewReaderUrl = payload.items[0].readerUrl;
    }
  } catch (error) {
    payload.error = formatError(error);
  }

  return payload;
};

export const loadTranslationResources = async (
  session: StoredSession,
): Promise<{ error: string | null; items: TranslationResource[] }> => {
  const { serverClient } = await createClients(session);

  try {
    const response = await serverClient.content.v4.resources.translations.list({
      language: "en",
    });
    const items = toArray(response, ["data", "translations"])
      .map((resource) => ({
        authorName: asNullableString(
          resource.authorName ?? resource.author_name,
        ),
        id: Number(asNullableNumber(resource.id) ?? 0),
        languageName: asNullableString(
          resource.languageName ?? resource.language_name,
        ),
        name: asString(
          resource.name ?? resource.translatedName ?? resource.translated_name,
          "Unnamed translation",
        ),
      }))
      .filter((resource) => resource.id > 0);

    return { error: null, items };
  } catch (error) {
    return { error: formatError(error), items: [] };
  }
};

export const loadRecitationResources = async (
  session: StoredSession,
): Promise<{ error: string | null; items: RecitationResource[] }> => {
  const { serverClient } = await createClients(session);

  try {
    const response = await serverClient.content.v4.resources.recitations.list({ language: "en" });
    const items = toArray(response, ["data", "recitations"])
      .map((resource) => ({
        id: Number(asNullableNumber(resource.id) ?? 0),
        name: asString(resource.reciterName ?? resource.reciter_name, "Unnamed reciter"),
        style: asNullableString(asObject(resource.style).name ?? (typeof resource.style === "string" ? resource.style : null)),
      }))
      .filter((resource) => resource.id > 0);
    return { error: null, items };
  } catch (error) {
    return { error: formatError(error), items: [] };
  }
};

export const loadChapterReciterResources = async (
  session: StoredSession,
): Promise<{ error: string | null; items: ChapterReciterResource[] }> => {
  const { serverClient } = await createClients(session);
  try {
    const response = await serverClient.content.v4.resources.chapterReciters.list({ language: "en" });
    const items = toArray(response, ["data", "reciters", "chapterReciters", "chapter_reciters"])
      .map((resource) => ({
        id: Number(asNullableNumber(resource.id) ?? 0),
        name: asString(resource.reciterName ?? resource.reciter_name ?? resource.name, "Unnamed reciter"),
        style: asNullableString(asObject(resource.style).name ?? (typeof resource.style === "string" ? resource.style : null)),
      }))
      .filter((resource) => resource.id > 0);
    return { error: null, items };
  } catch (error) {
    return { error: formatError(error), items: [] };
  }
};

export const loadChapterAudio = async (
  session: StoredSession,
  chapterId: number,
  reciterId: number,
): Promise<ChapterAudioPayload> => {
  const { serverClient } = await createClients(session);
  const response = await serverClient.content.v4.audio.chapterRecitation.get(String(reciterId), String(chapterId), { segments: true });
  const payload = asObject(response);
  const audioFile = asObject(payload.audioFile ?? payload.audio_file ?? payload);
  const audioUrl = asNullableString(audioFile.audioUrl ?? audioFile.audio_url);
  if (!audioUrl) throw new Error("Synchronized chapter audio URL is unavailable.");
  const timestamps = toArray(audioFile.timestamps).map((timestamp) => ({
    segments: (Array.isArray(timestamp.segments) ? timestamp.segments : [])
      .map((segment) => Array.isArray(segment) ? segment.map(Number) : [])
      .filter((segment): segment is [number, number, number] => segment.length === 3 && segment.every(Number.isFinite)),
    timestampFrom: Number(asNullableNumber(timestamp.timestampFrom ?? timestamp.timestamp_from) ?? 0),
    timestampTo: Number(asNullableNumber(timestamp.timestampTo ?? timestamp.timestamp_to) ?? 0),
    verseKey: asString(timestamp.verseKey ?? timestamp.verse_key),
  })).filter((timestamp) => timestamp.verseKey && timestamp.timestampTo >= timestamp.timestampFrom);
  if (!timestamps.length) throw new Error("Authoritative chapter timestamps are unavailable.");
  return { audioUrl, chapterId, reciterId, timestamps };
};

export const loadTafsirResources = async (session: StoredSession): Promise<{error:string|null;items:TafsirResource[]}> => {
  const {serverClient}=await createClients(session);
  try {
    const response=await serverClient.content.v4.resources.tafsirs.list({language:"en"});
    const items=toArray(response,["data","tafsirs"]).map(resource=>({
      authorName:asNullableString(resource.authorName??resource.author_name),id:Number(asNullableNumber(resource.id)??0),
      languageName:asNullableString(resource.languageName??resource.language_name),name:asString(resource.name,"Unnamed tafsir"),
    })).filter(item=>item.id>0);
    return{error:null,items};
  }catch(error){return{error:formatError(error),items:[]}}
};

type ServerClient = Awaited<ReturnType<typeof createClients>>["serverClient"];

// The English translation shown outside the reader: a configured one if Quran.Foundation offers it, else Saheeh International (the reader's default).
const resolveDefaultTranslation = async (serverClient: ServerClient) => {
  const translations = toArray(await serverClient.content.v4.resources.translations.list({ language: "en" }), ["data", "translations"]);
  const configuredIds = getConfig().translationIds;
  const resource = translations.find((item) => configuredIds.includes(Number(asNullableNumber(item.id) ?? 0)))
    ?? translations.find((item) => /\b(saheeh|sahih) international\b/i.test(asString(item.name)))
    ?? translations[0];
  const id = Number(asNullableNumber(resource?.id) ?? 0);
  return id ? { id, name: asString(resource?.name, "Verified English translation") } : null;
};

// Footnote markers are dropped and markup removed so a translation can be shown as plain text.
const plainTranslation = (html: string) => html.replace(/<sup\b[^>]*>.*?<\/sup>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

export type SearchPayload = { error: string | null; navigationItems: SearchItem[]; page: number; pages: number; query: string; total: number; verseItems: SearchItem[] };

export const loadSearchData = async (
  session: StoredSession,
  query: string | null,
  requestedPage = 1,
): Promise<SearchPayload> => {
  const normalizedQuery = String(query ?? "").trim().slice(0, 200);
  const empty = { navigationItems: [], page: 1, pages: 1, query: normalizedQuery, total: 0, verseItems: [] };
  if (!normalizedQuery) return { error: null, ...empty };

  const { serverClient } = await createClients(session);
  const mode = await getSearchModeQuick();
  const page = Math.max(1, Math.min(50, Math.floor(requestedPage) || 1));

  try {
    const response = await serverClient.search.v1.query({ mode, query: normalizedQuery, getText: 1, size: 20, page } as Parameters<typeof serverClient.search.v1.query>[0]);
    const results = normalizeSearchResults(response, normalizedQuery);
    const resource = results.verseItems.length ? await resolveDefaultTranslation(serverClient).catch(() => null) : null;
    if (!resource) return results;
    const verses = await Promise.all(results.verseItems.map(async (item) => {
      try {
        const verse = asObject(asObject(await serverClient.raw.content.v4.versesByVerseKey({ path: { verse_key: String(item.verseKey) }, query: { fields: { textUthmani: true, textQpcHafs: true } as { textUthmani: boolean }, translations: [resource.id] } })).verse);
        const translation = getTranslation(verse.translations, resource.id);
        return { ...item, arabicText: qpcHafsText(verse) ?? asNullableString(verse.textUthmani ?? verse.text_uthmani) ?? item.arabicText, text: translation.text ? plainTranslation(translation.text) : undefined, translationName: translation.text ? resource.name : null };
      } catch {
        return item;
      }
    }));
    return { ...results, verseItems: verses };
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message.includes("Token request failed")
          ? "Quran search is not enabled for this API client yet. The application owner must ask Quran.Foundation to approve the search scope."
          : formatError(error),
      ...empty,
    };
  }
};

export const loadReaderData = async (
  session: StoredSession,
  chapterId: string,
  requestedTranslationId?: number,
  requestedRecitationId?: number,
  options: { includeWords?: boolean; tafsirId?: number; script?: QuranScript; wordLanguage?: string } = {},
): Promise<ReaderPayload> => {
  const config = getConfig();
  const translationIds = requestedTranslationId
    ? [requestedTranslationId]
    : config.translationIds;
  const { serverClient } = await createClients(session);
  const script = options.script ?? "uthmani";
  const scriptField = { uthmani: "textUthmani", uthmani_simple: "textUthmaniSimple", imlaei: "textImlaei", indopak: "textIndopak", indopak_nastaleeq: "textIndopakNastaleeq" }[script];

  let chapterResponse: unknown;
  try {
    chapterResponse = await serverClient.content.v4.chapters.get(chapterId);
  } catch (_error) {
    const chapters = await withReaderStage("chapter catalog fallback", () =>
      serverClient.content.v4.chapters.list(),
    );
    const chapterFromCatalog = toArray(chapters, ["data", "chapters"]).find(
      (item) => asNullableNumber(item.id) === Number(chapterId),
    );
    if (!chapterFromCatalog) {
      throw new Error(`Reader chapter metadata failed: chapter ${chapterId} was not found.`);
    }
    chapterResponse = chapterFromCatalog;
  }
  const chapterPayload = asObject(chapterResponse);
  const chapter = asObject(chapterPayload.chapter ?? chapterPayload);
  const versesCount = asNullableNumber(chapter.versesCount);
  const totalVersePages = Math.max(
    1,
    versesCount ? Math.ceil(versesCount / READER_PAGE_SIZE) : 1,
  );
  const versePageResponses = await Promise.all(
    Array.from({ length: totalVersePages }, (_value, index) =>
      withReaderStage(`verse page ${index + 1}`, () => serverClient.content.v4.verses.byChapter(chapterId, {
        fields: {
          [scriptField]: true,
          ...(script === "uthmani" ? { textQpcHafs: true } : {}),
        },
        page: index + 1,
        perPage: READER_PAGE_SIZE,
        translations: translationIds,
        tafsirs: options.tafsirId ? [options.tafsirId] : undefined,
        words: Boolean(options.includeWords),
        ...(options.includeWords && options.wordLanguage ? { language: options.wordLanguage } : {}),
        wordFields: options.includeWords ? { textUthmani: true, ...(script === "uthmani" ? { textQpcHafs: true } : {}), verseKey: true, location: true } : undefined,
      })),
    ),
  );
  const audioByVerse = new Map<string, string>();
  if (requestedRecitationId) {
    const audioPageResponses = await Promise.all(
      Array.from({ length: totalVersePages }, (_value, index) =>
        withReaderStage(`audio page ${index + 1}`, () => serverClient.content.v4.audio.verseRecitation.byChapter(
          chapterId,
          String(requestedRecitationId),
          { page: index + 1, perPage: READER_PAGE_SIZE },
        )),
      ),
    );
    for (const audio of audioPageResponses.flatMap((response) => toArray(response, ["data", "audioFiles", "audio_files"]))) {
      const key = asNullableString(audio.verseKey ?? audio.verse_key);
      const url = asNullableString(audio.audioUrl ?? audio.audio_url ?? audio.url);
      if (key && url) audioByVerse.set(key, url);
    }
  }

  const verses = versePageResponses
    .flatMap((response) => toArray(response, ["data", "verses"]))
    .map((verse) => {
      const translation = getTranslation(
        verse.translations,
        translationIds[0],
      );
      const tafsir = toArray(verse.tafsirs)[0];

      return {
        arabicText: (script === "uthmani" ? qpcHafsText(verse) : null) ?? asString(verse[scriptField] ?? verse.textUthmani),
        audioUrl: audioByVerse.get(asString(verse.verseKey)) ?? null,
        id: asString(
          verse.id ??
            verse.verseKey ??
            `${chapterId}-${asString(verse.verseNumber, "verse")}`,
        ),
        translationName: translation.name,
        translationText: translation.text,
        translationFootnotes: translation.footnotes,
        tafsirName: asNullableString(tafsir?.resourceName ?? tafsir?.resource_name ?? tafsir?.name),
        tafsirText: plainSourceText(tafsir?.text),
        verseKey: asNullableString(verse.verseKey),
        verseNumber: asNullableNumber(verse.verseNumber),
        words: normalizeWords(verse.words),
        pageNumber: asNullableNumber(verse.pageNumber ?? verse.page_number),
        juzNumber: asNullableNumber(verse.juzNumber ?? verse.juz_number),
        hizbNumber: asNullableNumber(verse.hizbNumber ?? verse.hizb_number),
        rubNumber: asNullableNumber(verse.rubElHizbNumber ?? verse.rub_el_hizb_number),
      };
    });

  return {
    chapter: {
      id: Number(asNullableNumber(chapter.id) ?? Number(chapterId)),
      nameArabic: asNullableString(chapter.nameArabic),
      nameSimple: asString(chapter.nameSimple, `Chapter ${chapterId}`),
      translatedName: asNullableString(asObject(chapter.translatedName).name),
      versesCount,
    },
    translationIds,
    recitationId: requestedRecitationId ?? null,
    script,
    tafsirId: options.tafsirId ?? null,
    verses,
  };
};

export const loadMushafPage = async (session:StoredSession,pageNumber:number) => {
  const {serverClient}=await createClients(session);
  const [response,tajweedResponse,chapterResponse]=await Promise.all([
    serverClient.content.v4.verses.byPage(pageNumber,{mushaf:1,words:true,perPage:50,fields:{codeV2:true,textUthmani:true,textQpcHafs:true},wordFields:{codeV2:true,textUthmani:true,verseKey:true}}),
    serverClient.content.v4.verses.byPage(pageNumber,{mushaf:19,words:true,perPage:50,fields:{codeV2:true,textUthmani:true,textQpcHafs:true},wordFields:{codeV2:true,textUthmani:true,verseKey:true}}),
    serverClient.content.v4.chapters.list(),
  ]);
  const verses=toArray(response,["data","verses"]); const lines=new Map<number,Array<Record<string,unknown>>>(); const verseKeys:string[]=[];
  for(const verse of verses){const verseKey=asString(verse.verseKey??verse.verse_key);verseKeys.push(verseKey);for(const word of normalizeWords(verse.words)){const line=word.lineNumber??0;const items=lines.get(line)??[];items.push({...word,verseKey});lines.set(line,items)}}
  const tajweedVerses=verses.map(verse=>({
    arabicText:qpcHafsText(verse)??asString(verse.textUthmani??verse.text_uthmani),
    verseKey:asString(verse.verseKey??verse.verse_key),
  }));
  const tajweedLines=new Map<number,Array<Record<string,unknown>>>();
  for(const verse of toArray(tajweedResponse,["data","verses"])){
    const verseKey=asString(verse.verseKey??verse.verse_key);
    for(const word of normalizeWords(verse.words)){
      const line=word.lineNumber??0;
      const items=tajweedLines.get(line)??[];
      items.push({...word,verseKey});
      tajweedLines.set(line,items);
    }
  }
  const uniqueNumbers=(values:Array<number|null>)=>Array.from(new Set(values.filter((value):value is number=>value!==null)));
  const chapterIds=uniqueNumbers(verses.map(verse=>asNullableNumber(verse.chapterId??verse.chapter_id)??asNullableNumber(asString(verse.verseKey??verse.verse_key).split(":")[0])));
  const chapters=toArray(chapterResponse,["data","chapters"]);
  const chapterNames=chapterIds.map(id=>{
    const chapter=chapters.find(item=>asNullableNumber(item.id)===id);
    return asString(chapter?.nameSimple??chapter?.name_simple,`Surah ${id}`);
  });
  return{
    error:null,
    chapterNames,
    hizbNumbers:uniqueNumbers(verses.map(verse=>asNullableNumber(verse.hizbNumber??verse.hizb_number))),
    juzNumbers:uniqueNumbers(verses.map(verse=>asNullableNumber(verse.juzNumber??verse.juz_number))),
    pageNumber,
    verseKeys,
    tajweedVerses,
    tajweedLines:Array.from(tajweedLines.entries()).sort(([a],[b])=>a-b).map(([lineNumber,words])=>({lineNumber,words})),
    lines:Array.from(lines.entries()).sort(([a],[b])=>a-b).map(([lineNumber,words])=>({lineNumber,words})),
  };
};

export const loadStructureVerses = async (session:StoredSession,kind:"juz"|"hizb"|"rub"|"ruku"|"manzil",id:number) => {
  const {serverClient}=await createClients(session); const all:JsonObject[]=[];
  const fetchPage=(page:number)=>{const query={page,perPage:50,mushaf:19,words:true,wordFields:{codeV2:true,pageNumber:true},fields:{textUthmani:true,textQpcHafs:true}};if(kind==="juz")return serverClient.content.v4.verses.byJuz(id,query);if(kind==="hizb")return serverClient.content.v4.verses.byHizb(id,query);if(kind==="rub")return serverClient.content.v4.verses.byRub(id,query);const operation=kind==="ruku"?"versesByRukuNumber":"versesByManzilNumber";const path=kind==="ruku"?{ruku_number:id}:{manzil_number:id};return serverClient.raw.content.v4[operation]({path,query})};
  const first=await fetchPage(1);const firstChunk=toArray(first,["data","verses"]);all.push(...firstChunk);
  const responseObject=asObject(first);const dataObject=asObject(responseObject.data);const pagination=asObject(responseObject.pagination??dataObject.pagination);const reportedPages=asNullableNumber(pagination.totalPages??pagination.total_pages);
  if(reportedPages&&reportedPages>1){const remaining=await Promise.all(Array.from({length:Math.min(20,reportedPages)-1},(_,index)=>fetchPage(index+2)));all.push(...remaining.flatMap(response=>toArray(response,["data","verses"]))) }
  else if(firstChunk.length===50){for(let page=2;page<=20;page++){const chunk=toArray(await fetchPage(page),["data","verses"]);all.push(...chunk);if(chunk.length<50)break}}
  return all.map(verse=>({arabicText:qpcHafsText(verse)??asString(verse.textUthmani??verse.text_uthmani),tajweedWords:toGlyphWords(verse.words),verseKey:asString(verse.verseKey??verse.verse_key),pageNumber:asNullableNumber(verse.pageNumber??verse.page_number)}));
};

export const loadVerseRange = async (session: StoredSession, from: string, to: string) => {
  const { serverClient } = await createClients(session);
  const response = await serverClient.content.v4.verses.byRange(from, to, { fields: { textUthmani: true, textQpcHafs: true }, perPage: 50 });
  return toArray(response, ["data", "verses"]).map((verse) => ({ arabicText: qpcHafsText(verse) ?? asString(verse.textUthmani ?? verse.text_uthmani), verseKey: asString(verse.verseKey ?? verse.verse_key), pageNumber: asNullableNumber(verse.pageNumber ?? verse.page_number) }));
};

export const DAILY_VERSE_MIN_WORDS = 6;
export const isStandaloneDailyVerse = (arabicText: string) => arabicText.split(/\s+/).filter((word) => /[\u0621-\u064A\u0671]/.test(word)).length >= DAILY_VERSE_MIN_WORDS;

export const loadDailyVerse = async (session: StoredSession, day: string) => {
  const { serverClient } = await createClients(session);
  const chapterResponse = await serverClient.content.v4.chapters.list();
  const chapters = toArray(chapterResponse, ["data", "chapters"]).map((chapter) => ({
    id: Number(asNullableNumber(chapter.id) ?? 0),
    name: asString(chapter.nameSimple ?? chapter.name_simple),
    verses: Number(asNullableNumber(chapter.versesCount ?? chapter.verses_count) ?? 0),
  })).filter((chapter) => chapter.id > 0 && chapter.verses > 0);
  const totalVerses = chapters.reduce((total, chapter) => total + chapter.verses, 0);
  const keyAt = (position: number) => {
    let ordinal = position % totalVerses;
    const chapter = chapters.find((candidate) => {
      if (ordinal < candidate.verses) return true;
      ordinal -= candidate.verses;
      return false;
    });
    if (!chapter) throw new Error("A daily Quran verse could not be selected.");
    return { chapter, verseKey: `${chapter.id}:${ordinal + 1}` };
  };
  const start = dailyIndex(day, totalVerses, "quran-verse");

  const resource = await resolveDefaultTranslation(serverClient);
  if (!resource) throw new Error("A verified English translation is unavailable.");
  const translationId = resource.id;

  // A one- or two-word Ayah (e.g. 69:1) reads as a fragment out of context, so the selection steps forward
  // to the next Ayah long enough to stand alone. The order is fixed; nothing is chosen by meaning.
  let selected: { arabicText: string; chapter: (typeof chapters)[number]; translation: ReturnType<typeof getTranslation>; verseKey: string } | null = null;
  for (let step = 0; step < 12 && !selected; step += 1) {
    const { chapter, verseKey } = keyAt(start + step);
    const response = await serverClient.raw.content.v4.versesByVerseKey({ path: { verse_key: verseKey }, query: { fields: { textUthmani: true, textQpcHafs: true } as { textUthmani: boolean }, translations: [translationId] } });
    const verse = asObject(asObject(response).verse ?? response);
    const translation = getTranslation(verse.translations, translationId);
    const uthmani = asString(verse.textUthmani ?? verse.text_uthmani);
    const arabicText = qpcHafsText(verse) ?? uthmani;
    if (arabicText && translation.text && (isStandaloneDailyVerse(uthmani) || step === 11)) selected = { arabicText, chapter, translation, verseKey };
  }
  if (!selected) throw new Error("The sourced daily Quran verse is incomplete.");
  const { arabicText, chapter, translation, verseKey } = selected;
  return {
    arabicText,
    chapterName: chapter.name,
    translationName: translation.name ?? resource.name,
    translationText: translation.text,
    verseKey,
  };
};

export const loadFootnote = async (session: StoredSession, id: number): Promise<FootnotePayload> => {
  const { serverClient } = await createClients(session);
  const response = await serverClient.raw.content.v4.getFootNote({ path: { id } });
  const footnote = asObject(asObject(response).footNote ?? asObject(response).foot_note ?? response);
  return { id: Number(asNullableNumber(footnote.id) ?? id), languageName: asNullableString(footnote.languageName ?? footnote.language_name), textHtml: sanitizeSourceHtml(footnote.text) };
};

export const loadChapterInfo = async (session: StoredSession, chapterId: number): Promise<ChapterInfoPayload> => {
  const { serverClient } = await createClients(session);
  const response = await serverClient.content.v4.chapters.getInfo(String(chapterId), { language: "en", includeResources: true });
  const info = asObject(asObject(response).chapterInfo ?? asObject(response).chapter_info ?? response);
  if (!asNullableString(info.text)) throw new Error("Chapter information is unavailable.");
  return { chapterId, languageName: asNullableString(info.languageName ?? info.language_name), shortText: asNullableString(info.shortText ?? info.short_text), source: asNullableString(info.source), textHtml: sanitizeSourceHtml(info.text) };
};

export const loadQuranReflectFeed = async (session: StoredSession, page = 1): Promise<QuranReflectPayload> => {
  const { serverClient } = await createClients(session);
  try {
    const response = await serverClient.raw.content.v4.postsControllerFeed({ query: { tab: "qdc", languages: [2], limit: 20, page } });
    const root = asObject(response);
    const items = toArray(root.data).filter((post) => post.removed !== true && post.hidden !== true).map((post) => {
      const author = asObject(post.author);
      const displayName = asNullableString(author.displayName ?? author.display_name) ?? ([asNullableString(author.firstName ?? author.first_name), asNullableString(author.lastName ?? author.last_name)].filter(Boolean).join(" ") || asNullableString(author.username));
      const presentation = deriveReflectPresentation(post.body);
      return { authorName: displayName || null, bodyHtml: sanitizeSourceHtml(reflectBodyWithoutRepeatedTitle(post.body, presentation.title)), excerpt: presentation.excerpt, id: Number(asNullableNumber(post.id) ?? 0), languageName: asNullableString(post.languageName ?? post.language_name), postType: asString(post.postTypeName ?? post.post_type_name, Number(post.postTypeId ?? post.post_type_id) === 2 ? "lesson" : "reflection"), publishedAt: asNullableString(post.publishedAt ?? post.published_at), references: toArray(post.references).map((reference) => ({ chapterId: Number(asNullableNumber(reference.chapterId ?? reference.chapter_id) ?? 0), from: Number(asNullableNumber(reference.from) ?? 0), to: Number(asNullableNumber(reference.to ?? reference.from) ?? 0) })).filter((reference) => reference.chapterId > 0 && reference.from > 0), title: presentation.title, verified: post.verified === true };
    }).filter((post) => post.id > 0 && post.bodyHtml);
    return { error: null, items, page: Number(asNullableNumber(root.currentPage ?? root.current_page) ?? page), pages: Number(asNullableNumber(root.pages) ?? 1) };
  } catch (error) {
    return { error: formatError(error), items: [], page, pages: 0 };
  }
};

export const loadQuranReflectPost = async (session: StoredSession, id: number) => {
  const { serverClient } = await createClients(session);
  const response = await serverClient.raw.content.v4.postsControllerFindOne({ path: { id } });
  const root = asObject(response);
  const post = asObject(root.data ?? root.post ?? root);
  if (post.removed === true || post.hidden === true || !asNullableString(post.body)) throw new Error("Reflection is unavailable.");
  const author = asObject(post.author);
  const authorName = asNullableString(author.displayName ?? author.display_name) ?? ([asNullableString(author.firstName ?? author.first_name), asNullableString(author.lastName ?? author.last_name)].filter(Boolean).join(" ") || asNullableString(author.username));
  const presentation = deriveReflectPresentation(post.body);
  return {
    authorName: authorName || null,
    bodyHtml: sanitizeSourceHtml(reflectBodyWithoutRepeatedTitle(post.body, presentation.title)),
    excerpt: presentation.excerpt,
    id: Number(asNullableNumber(post.id) ?? id),
    languageName: asNullableString(post.languageName ?? post.language_name),
    postType: asString(post.postTypeName ?? post.post_type_name, Number(post.postTypeId ?? post.post_type_id) === 2 ? "lesson" : "reflection"),
    publishedAt: asNullableString(post.publishedAt ?? post.published_at),
    references: toArray(post.references).map((reference) => ({ chapterId: Number(asNullableNumber(reference.chapterId ?? reference.chapter_id) ?? 0), from: Number(asNullableNumber(reference.from) ?? 0), to: Number(asNullableNumber(reference.to ?? reference.from) ?? 0) })).filter((reference) => reference.chapterId > 0 && reference.from > 0),
    title: presentation.title,
    verified: post.verified === true,
  };
};

const toGlyphWords = (value: unknown): TajweedGlyphWord[] => toArray(value).map((word) => ({
  charType: asString(word.charTypeName ?? word.char_type_name, "word"),
  code: asNullableString(word.codeV2 ?? word.code_v2),
  pageNumber: asNullableNumber(word.pageNumber ?? word.page_number),
}));

// Official QCF V4 Tajweed glyphs (Mushaf 19) for a whole Surah. Each word keeps its own Mushaf page,
// because a glyph code is only valid with that page's font.
export const parseTajweedGlyphs = (responses: unknown[], chapterId: number): TajweedGlyphPayload => ({
  chapterId,
  verses: responses.flatMap((response) => toArray(response, ["data", "verses"])).map((verse) => ({
    verseKey: asString(verse.verseKey ?? verse.verse_key),
    words: toGlyphWords(verse.words),
  })).filter((verse) => verse.verseKey),
});

export const loadChapterTajweedGlyphs = async (session: StoredSession, chapterId: number): Promise<TajweedGlyphPayload> => {
  const { serverClient } = await createClients(session);
  const chapterResponse = asObject(await serverClient.content.v4.chapters.get(String(chapterId)));
  const chapter = asObject(chapterResponse.chapter ?? chapterResponse);
  const versesCount = asNullableNumber(chapter.versesCount ?? chapter.verses_count) ?? READER_PAGE_SIZE;
  const responses = await Promise.all(Array.from({ length: Math.max(1, Math.ceil(versesCount / READER_PAGE_SIZE)) }, (_value, index) =>
    serverClient.content.v4.verses.byChapter(String(chapterId), {
      mushaf: 19,
      page: index + 1,
      perPage: READER_PAGE_SIZE,
      words: true,
      wordFields: { codeV2: true, pageNumber: true },
    })));
  return parseTajweedGlyphs(responses, chapterId);
};

// Short Surahs whose words give every letter real examples for Learn practice.
export const PRACTICE_CHAPTERS = [1, 93, 94, 95, 97, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114] as const;

// Surahs read word by word, in order, on the last Learn days.
export const READ_ALONG_CHAPTERS = [1, 108, 112, 114] as const;

export const parsePracticeWords = (responses: unknown[], chapterIds: readonly number[] = PRACTICE_CHAPTERS): PracticeWordPayload => {
  const seen = new Set<string>();
  const words: PracticeWordPayload["words"] = [];
  const sequences: PracticeWordPayload["sequences"] = {};
  responses.forEach((response, index) => {
    const chapterId = chapterIds[index];
    for (const verse of toArray(response, ["data", "verses"])) {
      const verseKey = asString(verse.verseKey ?? verse.verse_key);
      for (const word of toArray(verse.words)) {
        const text = asString(word.textUthmani ?? word.text_uthmani ?? word.text);
        const charType = asString(word.charTypeName ?? word.char_type_name, "word");
        if (charType !== "word" || !text) continue;
        const item = {
          text,
          audioUrl: absoluteWordAudio(word.audioUrl ?? word.audio_url),
          verseKey,
          position: Number(asNullableNumber(word.position) ?? 0),
          transliteration: asNullableString(asObject(word.transliteration).text),
          translation: asNullableString(asObject(word.translation).text),
        };
        if ((READ_ALONG_CHAPTERS as readonly number[]).includes(chapterId)) (sequences[chapterId] ??= []).push(item);
        if (!seen.has(text)) { seen.add(text); words.push(item); }
      }
    }
  });
  return { chapters: [...chapterIds], sequences, words };
};

export const loadPracticeWords = async (session: StoredSession): Promise<PracticeWordPayload> => {
  const { serverClient } = await createClients(session);
  const responses = await Promise.all(PRACTICE_CHAPTERS.map((chapterId) =>
    serverClient.content.v4.verses.byChapter(String(chapterId), { perPage: 50, words: true, language: "en", wordFields: { textUthmani: true } })));
  return parsePracticeWords(responses);
};

export const parseAyahTafsir = (response: unknown, verseKey: string, tafsirId: number): AyahTafsirPayload => {
  const root = asObject(response);
  const verse = asObject(root.verse ?? root);
  const tafsir = toArray(verse.tafsirs)[0];
  return {
    tafsirId,
    tafsirName: asNullableString(tafsir?.resourceName ?? tafsir?.resource_name ?? tafsir?.name),
    tafsirText: plainSourceText(tafsir?.text),
    verseKey,
  };
};

// One Ayah's Tafsir, so opening a single study panel does not refetch the whole Surah.
export const loadAyahTafsir = async (session: StoredSession, verseKey: string, tafsirId: number): Promise<AyahTafsirPayload> => {
  const { serverClient } = await createClients(session);
  const response = await serverClient.content.v4.verses.byKey(verseKey, { tafsirs: [tafsirId] });
  return parseAyahTafsir(response, verseKey, tafsirId);
};

export const loadAyahStudy = async (session: StoredSession, verseKey: string): Promise<AyahStudyPayload> => {
  const { serverClient } = await createClients(session);
  const [hadithResponse, answerResponse] = await Promise.all([
    serverClient.content.v4.hadithReferences.hadithsByAyah(verseKey, { language: "en", limit: 20, page: 1 }),
    serverClient.raw.content.v4.listAyahAnswers({ path: { ayah_key: verseKey }, query: { language: "en", page: 1, pageSize: 20 } }),
  ]);

  const hadiths = toArray(hadithResponse, ["hadiths", "data"]).map((hadith) => {
    const contents = toArray(hadith.hadith);
    const preferred = contents.find((content) => asString(content.lang).toLowerCase().startsWith("en")) ?? contents[0] ?? {};
    return {
      bookNumber: asNullableString(hadith.bookNumber ?? hadith.book_number),
      chapterTitle: asNullableString(preferred.chapterTitle ?? preferred.chapter_title),
      collection: asString(hadith.collection, "Hadith collection"),
      grades: toArray(preferred.grades).map((grade) => ({ grade: asString(grade.grade), gradedBy: asNullableString(grade.gradedBy ?? grade.graded_by) })).filter((grade) => grade.grade),
      hadithNumber: asString(hadith.hadithNumber ?? hadith.hadith_number),
      textHtml: sanitizeSourceHtml(preferred.body),
    };
  }).filter((hadith) => hadith.hadithNumber && hadith.textHtml);

  const answerRoot = asObject(answerResponse);
  const answers = toArray(answerRoot.questions ?? asObject(answerRoot.data).questions).flatMap((question) => {
    const publishedQuestion = !question.status || asString(question.status).toLowerCase() === "published" || asString(question.status).toLowerCase() === "answered";
    if (!publishedQuestion) return [];
    const answer = toArray(question.answers).find((candidate) => !candidate.status || asString(candidate.status).toLowerCase() === "published");
    if (!answer) return [];
    return [{
      answerHtml: sanitizeSourceHtml(answer.body),
      answeredBy: asNullableString(answer.answeredBy ?? answer.answered_by),
      questionHtml: sanitizeSourceHtml(question.body),
      questionId: Number(asNullableNumber(question.id) ?? 0),
      summary: asNullableString(question.summary),
      theme: asNullableString(question.theme),
      type: asNullableString(question.type),
    }];
  }).filter((item) => item.questionId > 0 && item.answerHtml);

  return { answers, hadiths, verseKey };
};

const createSignedOutBootstrap = ({
  authError,
  contentPreview,
  flashNotice,
  sessionStoreSummary,
}: {
  authError: string | null;
  contentPreview: BootstrapPayload["contentPreview"];
  flashNotice: BootstrapPayload["flashNotice"];
  sessionStoreSummary: string;
}): BootstrapPayload => ({
  authError,
  bookmarks: createEmptySlice(),
  collections: createEmptySlice(),
  contentPreview,
  flashNotice,
  goals: {
    data: null,
    error: null,
    gatingMessage: null,
  },
  grantedScopes: [],
  idTokenSummary: null,
  isLoggedIn: false,
  notes: createEmptySlice(),
  preferences: {
    data: null,
    error: null,
    gatingMessage: null,
  },
  quranReflect: {
    feed: createEmptySlice(),
    profile: {
      data: null,
      error: null,
      facts: [],
      gatingMessage: null,
    },
  },
  sessionFacts: [],
  sessionStoreSummary,
  userInfo: {
    data: null,
    error: null,
    facts: [],
    gatingMessage: null,
  },
});

export const loadBootstrapData = async (
  session: StoredSession,
  sessionStoreSummary: string,
): Promise<BootstrapPayload> => {
  const contentPreview = await loadContentPreviewData(session);
  const authError = session.authError ?? null;
  const flashNotice = session.flashNotice ?? null;
  session.authError = null;
  session.flashNotice = null;

  const initialUserSession = session.userSession;
  if (!initialUserSession) {
    return createSignedOutBootstrap({
      authError,
      contentPreview,
      flashNotice,
      sessionStoreSummary,
    });
  }

  const grantedScopes = getGrantedScopes(session);
  const { serverClient } = await createClients(session);

  const [
    userInfoResult,
    notesResult,
    bookmarksResult,
    collectionsResult,
    goalsResult,
    preferencesResult,
    profileResult,
    feedResult,
  ] = await Promise.all([
    loadSafely(() => serverClient.oauth2.v1.getUserInfo()),
    hasScope(grantedScopes, "note")
      ? loadSafely(() => serverClient.auth.v1.notes.list())
      : Promise.resolve({ data: null, error: null }),
    hasScope(grantedScopes, "bookmark")
      ? loadSafely(() =>
          serverClient.auth.v1.bookmarks.list({
            first: LIST_PREVIEW_LIMIT,
            mushafId: DEFAULT_BOOKMARK_MUSHAF,
            type: "ayah",
          }),
        )
      : Promise.resolve({ data: null, error: null }),
    hasScope(grantedScopes, "collection")
      ? loadSafely(() =>
          serverClient.auth.v1.collections.list({
            first: LIST_PREVIEW_LIMIT,
            sortBy: "recentlyUpdated",
          }),
        )
      : Promise.resolve({ data: null, error: null }),
    hasScope(grantedScopes, "goal")
      ? loadSafely(() => serverClient.auth.v1.goals.getTodaysPlan())
      : Promise.resolve({ data: null, error: null }),
    hasScope(grantedScopes, "preference")
      ? loadSafely(() => serverClient.auth.v1.preferences.get())
      : Promise.resolve({ data: null, error: null }),
    hasScope(grantedScopes, "user")
      ? loadSafely(() => serverClient.quranReflect.v1.users.profile())
      : Promise.resolve({ data: null, error: null }),
    hasScope(grantedScopes, "post")
      ? loadSafely(() => serverClient.quranReflect.v1.posts.feed(DEFAULT_FEED_QUERY))
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (didSdkClearSession(initialUserSession, session)) {
    return createSignedOutBootstrap({
      authError,
      contentPreview,
      flashNotice: {
        message: SESSION_EXPIRED_MESSAGE,
        type: "error",
      },
      sessionStoreSummary,
    });
  }

  const currentSession = (session.userSession ?? initialUserSession) as Record<string, unknown>;
  const currentScopes = getGrantedScopes(session);
  const idTokenSummary = summarizeIdToken(currentSession.idToken);
  const normalizedUserInfo = asNullableObject(userInfoResult.data);
  const normalizedGoals = asNullableObject(goalsResult.data);
  const normalizedPreferences = asNullableObject(preferencesResult.data);
  const normalizedProfile = asNullableObject(profileResult.data);

  return {
    authError,
    bookmarks: hasScope(currentScopes, "bookmark")
      ? {
          error: bookmarksResult.error,
          gatingMessage: null,
          items: normalizeBookmarks(bookmarksResult.data),
        }
      : createEmptySlice(createScopeGate("bookmark")),
    collections: hasScope(currentScopes, "collection")
      ? {
          error: collectionsResult.error,
          gatingMessage: null,
          items: normalizeCollections(collectionsResult.data),
        }
      : createEmptySlice(createScopeGate("collection")),
    contentPreview,
    flashNotice,
    goals: {
      data: normalizedGoals,
      error: goalsResult.error,
      gatingMessage: hasScope(currentScopes, "goal") ? null : createScopeGate("goal"),
    },
    grantedScopes: currentScopes,
    idTokenSummary,
    isLoggedIn: true,
    notes: hasScope(currentScopes, "note")
      ? {
          error: notesResult.error,
          gatingMessage: null,
          items: normalizeNotes(notesResult.data),
        }
      : createEmptySlice(createScopeGate("note")),
    preferences: {
      data: normalizedPreferences,
      error: preferencesResult.error,
      gatingMessage: hasScope(currentScopes, "preference") ? null : createScopeGate("preference"),
    },
    quranReflect: {
      feed: hasScope(currentScopes, "post")
        ? {
            error: feedResult.error,
            gatingMessage: null,
            items: normalizeFeedItems(feedResult.data),
          }
        : createEmptySlice(createScopeGate("post")),
      profile: {
        data: normalizedProfile,
        error: profileResult.error,
        facts: buildProfileFacts(normalizedProfile),
        gatingMessage: hasScope(currentScopes, "user") ? null : createScopeGate("user"),
      },
    },
    sessionFacts: buildSessionFacts(currentSession, currentScopes, idTokenSummary),
    sessionStoreSummary,
    userInfo: {
      data: normalizedUserInfo,
      error: userInfoResult.error,
      facts: buildUserInfoFacts(normalizedUserInfo),
      gatingMessage: null,
    },
  };
};

export const runUserAction = async <T>(
  session: StoredSession,
  action: (serverClient: import("@/lib/sdk").ServerClient) => Promise<T>,
): Promise<{ data: T | null; error: string | null; sessionExpired: boolean }> => {
  const initialUserSession = session.userSession;
  const { serverClient } = await createClients(session);

  try {
    return {
      data: await action(serverClient),
      error: null,
      sessionExpired: false,
    };
  } catch (error) {
    if (didSdkClearSession(initialUserSession, session)) {
      return {
        data: null,
        error: SESSION_EXPIRED_MESSAGE,
        sessionExpired: true,
      };
    }

    return {
      data: null,
      error: formatError(error),
      sessionExpired: false,
    };
  }
};

export const ensureUserScope = (
  session: StoredSession,
  scope: string,
):
  | { ok: true }
  | {
      gatingMessage?: string | null;
      message: string;
      ok: false;
      signedOut: boolean;
      status: number;
    } => {
  if (!session.userSession) {
    return {
      message: "Sign in first to use user-session actions.",
      ok: false,
      signedOut: true,
      status: 401,
    };
  }

  const grantedScopes = getGrantedScopes(session);
  if (!hasScope(grantedScopes, scope)) {
    return {
      gatingMessage: createScopeGate(scope),
      message: `This action requires the \`${scope}\` scope.`,
      ok: false,
      signedOut: false,
      status: 403,
    };
  }

  return {
    ok: true,
  };
};

export const parsePositiveInteger = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed)) {
    return null;
  }

  return parsed;
};

export const parseVerseKey = (value: unknown): string | null => {
  const trimmed = String(value ?? "").trim();

  if (!/^\d+:\d+$/.test(trimmed)) {
    return null;
  }

  return trimmed;
};

export const normalizeMutationPayload = {
  bookmark: normalizeBookmarkItem,
  collection: normalizeCollectionItem,
  note: normalizeNoteItem,
};
