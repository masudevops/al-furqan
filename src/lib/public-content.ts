import "server-only";

import { NextResponse } from "next/server";

import type { StoredSession } from "@/lib/session/store";

const PUBLIC_CONTENT_TTL_SECONDS = 60 * 60;
const PUBLIC_CONTENT_STALE_SECONDS = 24 * 60 * 60;
// Content that does not change between requests (Surah introductions, glyphs, catalogs, single-Ayah Tafsir).
// One day fresh plus six days stale keeps the total under Quran.Foundation's one-week caching limit.
const STABLE_CONTENT_TTL_SECONDS = 24 * 60 * 60;
const STABLE_CONTENT_STALE_SECONDS = 6 * 24 * 60 * 60;

export type PublicContentCache = "standard" | "stable";

export const createPublicContentSession = (): StoredSession => ({
  authError: null,
  flashNotice: null,
  oauth: null,
  oidcLogoutIdTokenHint: null,
  userSession: null,
});

export const publicContentJson = (
  payload: unknown,
  status = 200,
  cache: PublicContentCache = "standard",
): NextResponse => {
  const response = NextResponse.json(payload, { status });

  if (status >= 200 && status < 300) {
    response.headers.set(
      "Cache-Control",
      cache === "stable"
        ? `public, max-age=3600, s-maxage=${STABLE_CONTENT_TTL_SECONDS}, stale-while-revalidate=${STABLE_CONTENT_STALE_SECONDS}`
        : `public, max-age=300, s-maxage=${PUBLIC_CONTENT_TTL_SECONDS}, stale-while-revalidate=${PUBLIC_CONTENT_STALE_SECONDS}`,
    );
  } else {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
};
