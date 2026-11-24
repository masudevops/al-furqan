import { localeInfo, type Locale } from "./locales";
import ar from "./messages/ar";
import bn from "./messages/bn";
import fr from "./messages/fr";
import id from "./messages/id";
import tr from "./messages/tr";
import ur from "./messages/ur";

export type Messages = Record<string, string>;
const MESSAGES: Partial<Record<Locale, Messages>> = { ar, bn, fr, id, tr, ur };

// The active language for this render. The app shell sets it before rendering and remounts its tree when the
// language changes, so every component reads the new value. Server renders use English.
let current: Locale = "en";
export const setCurrentLocale = (locale: Locale) => { current = locale; };
export const currentLocale = () => current;
export const currentLocaleInfo = () => localeInfo(current);

// English text is the key: a phrase not yet translated shows in English rather than breaking.
export function t(key: string, values?: Record<string, string | number>) {
  const text = MESSAGES[current]?.[key] ?? key;
  return values ? text.replace(/\{(\w+)\}/g, (match, name: string) => name in values ? String(values[name]) : match) : text;
}

export const messagesFor = (locale: Locale) => MESSAGES[locale] ?? {};
