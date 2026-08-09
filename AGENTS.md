# Al-Furqan Engineering Context

## Mission and non-negotiables

Al-Furqan (الفرقان) is a free, ad-free, privacy-respecting Quran and worship companion. Quran integrity outranks feature count. Never invent, reconstruct, translate, paraphrase, classify, grade, or replace Quran, translation, Tafsir, Hadith, Dua, Adhkar, Asma-ul-Husna, fiqh, or linguistic content with an LLM. Production religious content must have an identified source and provenance. If a source fails, show an unavailable state.

## Architecture

- Next.js App Router, React, TypeScript, npm, and `@quranjs/api`.
- UI routes are in `src/app`; the interactive product shell is `src/components/app-shell.tsx`.
- Quran.Foundation traffic is behind same-origin route handlers. Content and Search use the app-token server path; personalized APIs use a user-token server path.
- Import `@quranjs/api/server` only in server code. `@quranjs/api/public` is only for browser-safe OAuth initiation. Never expose client secrets, session secrets, access/refresh tokens, or raw sessions.
- Preserve Authorization Code + PKCE, server callback exchange, refresh handling, OIDC logout, signed HttpOnly SameSite cookies, and session rotation.
- Production requires shared session storage (`REDIS_URL`); the memory store is local-only.
- Small preferences and last-read are localStorage-backed. Larger local state must use a versioned storage abstraction, not scattered IndexedDB calls.

## Content and UX rules

- Discover translations, Tafsir, reciters, fonts, and Mushaf resources dynamically. Do not assume an ID is permanently available.
- Quran text uses `lang="ar"`, `dir="rtl"`, and `translate="no"`; verified translations use `translate="no"`. Never rewrite Quran text.
- Do not approximate Mushaf pages. Only implement official line/page resources.
- Clearly distinguish Quran, translation, Tafsir, Hadith, and My Notes.
- No forced login for public Quran reading. No dead controls, fake sync, placeholder scripture, manipulative streaks, ads, or premium gates.
- Support light, dark, sepia, keyboard access, reduced motion, visible focus, responsive layouts, and WCAG 2.2 AA where practical.

## Sources, caching, and dependencies

- Register every external religious source in `docs/DATA-SOURCES.md` with license, storage, update, and attribution rules.
- Quran.Foundation terms currently prohibit caching QF Content longer than one week without express permission. Never add permanent offline Quran storage without written permission.
- Add dependencies conservatively; check maintenance, license, bundle, privacy, and security impact. Never run automated breaking audit fixes blindly.
- Never commit `.env.local` or credentials. OAuth scope approval is owner-controlled; documentation status must say `OWNER CONFIRMATION REQUIRED` until verified for the actual client.

## Definition of done

Relevant functionality works with authoritative source data; mobile/desktop, loading/error/empty states, keyboard use, responsive behavior, tests, docs, and source attribution are handled. Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:config
npm run smoke:routes
```

Inspect rendered UI at 375, 430, 768, 1280, and 1440 pixels, including RTL/Arabic, all themes, console output, and API failures. Never claim completion without reporting exact verification.
