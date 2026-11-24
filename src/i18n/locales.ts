// Interface languages. Content in each language comes only from sources (Quran.Foundation translations,
// Tafsir and word meanings); anything a source doesn't offer stays in English. Interface text is a draft
// awaiting native-speaker review (see docs/I18N.md).
export type Locale = "en" | "ar" | "ur" | "bn" | "id" | "tr" | "fr";

export type LocaleInfo = {
  code: Locale;
  name: string;
  englishName: string;
  dir: "ltr" | "rtl";
  /** Quran.Foundation `language_name` for translations and Tafsir in this language, if any. */
  contentLanguage: string | null;
  /** Quran.Foundation language code for word-by-word meanings, if offered. */
  wordLanguage: string;
};

export const LOCALES: LocaleInfo[] = [
  { code: "en", name: "English", englishName: "English", dir: "ltr", contentLanguage: "english", wordLanguage: "en" },
  { code: "ar", name: "العربية", englishName: "Arabic", dir: "rtl", contentLanguage: "arabic", wordLanguage: "en" },
  { code: "ur", name: "اردو", englishName: "Urdu", dir: "rtl", contentLanguage: "urdu", wordLanguage: "ur" },
  { code: "bn", name: "বাংলা", englishName: "Bengali", dir: "ltr", contentLanguage: "bengali", wordLanguage: "bn" },
  { code: "id", name: "Bahasa Indonesia", englishName: "Indonesian", dir: "ltr", contentLanguage: "indonesian", wordLanguage: "id" },
  { code: "tr", name: "Türkçe", englishName: "Turkish", dir: "ltr", contentLanguage: "turkish", wordLanguage: "tr" },
  { code: "fr", name: "Français", englishName: "French", dir: "ltr", contentLanguage: "french", wordLanguage: "fr" },
];

export const LOCALE_KEY = "af-locale";
export const localeInfo = (code: string | null | undefined) => LOCALES.find((item) => item.code === code) ?? LOCALES[0];
