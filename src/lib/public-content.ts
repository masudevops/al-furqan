import "server-only";

import { NextResponse } from "next/server";

import type { StoredSession } from "@/lib/session/store";

const PUBLIC_CONTENT_TTL_SECONDS = 60 * 60;
const PUBLIC_CONTENT_STALE_SECONDS = 24 * 60 * 60;

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
): NextResponse => {
  const response = NextResponse.json(payload, { status });

  if (status >= 200 && status < 300) {
    response.headers.set(
      "Cache-Control",
      `public, max-age=300, s-maxage=${PUBLIC_CONTENT_TTL_SECONDS}, stale-while-revalidate=${PUBLIC_CONTENT_STALE_SECONDS}`,
    );
  } else {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
};
