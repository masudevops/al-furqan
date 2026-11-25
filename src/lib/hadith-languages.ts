// Hadith translation languages offered by fawazahmed0/hadith-api (editions.json, checked 2026-11-24).
// English is the default; the others are that dataset's own editions, shown as given. Most name no translator.
export const HADITH_LANGUAGES = [
  { code: "en", name: "English", edition: "eng", dir: "ltr" },
  { code: "ur", name: "Urdu", edition: "urd", dir: "rtl" },
  { code: "bn", name: "Bengali", edition: "ben", dir: "ltr" },
  { code: "id", name: "Indonesian", edition: "ind", dir: "ltr" },
  { code: "tr", name: "Turkish", edition: "tur", dir: "ltr" },
  { code: "fr", name: "French", edition: "fra", dir: "ltr" },
  { code: "ru", name: "Russian", edition: "rus", dir: "ltr" },
  { code: "ta", name: "Tamil", edition: "tam", dir: "ltr" },
] as const;

export type HadithLanguage = (typeof HADITH_LANGUAGES)[number];
export type HadithLanguageCode = HadithLanguage["code"];

// Which editions exist per collection, besides English and Arabic.
const AVAILABLE: Record<string, HadithLanguageCode[]> = {
  bukhari: ["ur", "bn", "id", "tr", "fr", "ru", "ta"],
  muslim: ["ur", "bn", "id", "tr", "fr", "ru", "ta"],
  abudawud: ["ur", "bn", "id", "tr", "fr", "ru"],
  tirmidhi: ["ur", "bn", "id", "tr"],
  ibnmajah: ["ur", "bn", "id", "tr", "fr"],
  nasai: ["ur", "bn", "id", "tr", "fr"],
  malik: ["ur", "bn", "id", "tr", "fr"],
  nawawi: ["bn", "tr", "fr"],
  qudsi: ["fr"],
};

export const hadithLanguage = (code: string | null | undefined) => HADITH_LANGUAGES.find((language) => language.code === code) ?? HADITH_LANGUAGES[0];

export function hadithLanguagesFor(collection: string): HadithLanguage[] {
  const codes = new Set<string>(["en", ...(AVAILABLE[collection] ?? [])]);
  return HADITH_LANGUAGES.filter((language) => codes.has(language.code));
}

// The language to use for a collection: the requested one if the source has it, otherwise English.
export const resolveHadithLanguage = (collection: string, code: string | null | undefined): HadithLanguage => hadithLanguagesFor(collection).find((language) => language.code === code) ?? HADITH_LANGUAGES[0];
