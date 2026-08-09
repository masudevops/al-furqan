# Architecture decisions

## 2026-08-09 — Greenfield on the official starter

Replaced the legacy Vite implementation and retained only Git history as recovery. The official Next.js scaffold provides the SDK, OAuth callback, server sessions, refresh, app/user token separation, and API adapters.

## Public Quran URLs

Use `/quran/:chapter/:ayah?`, not starter `/read/:chapter`, for durable shareable semantics. Public Quran content never requires authentication.

## No social scopes in v1

Removed `post` and `comment`; QuranReflect UI is disabled. Scope approval remains owner-controlled.

## Local reading continuity

Theme, text sizes, and last-read use small localStorage records. No remote write occurs on scroll. Cloud migration is deferred until account features and conflict policy are implemented.

## Offline restraint

No permanent Quran storage until Foundation grants permission. App-shell PWA work is a later phase.
