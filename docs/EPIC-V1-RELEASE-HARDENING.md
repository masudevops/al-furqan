# EPIC — v1 release hardening

## Outcome

Ship a cohesive v1 in which every visible control has a destination, public routes never render blank, critical reading and discovery flows are covered by browser tests, and loading, error, bookmarking, accessibility, metadata, and copy patterns feel like one product.

## P1 — release requirements

- [x] Provide a Saved Library for local Quran, Sunnah, and Dua bookmarks.
- [x] Resolve the blank `/settings`, `/library`, and `/goals` routes with useful content, redirects, or a real 404.
- [x] Show meaningful Quran search context instead of reference-only result cards.
- [x] Preserve server-rendered route content during delayed client hydration and standardize delayed-content feedback.
- [x] Make modal dialogs move focus inside, trap keyboard focus, close with Escape, and restore focus.
- [x] Add Playwright critical-path coverage for navigation, bookmarks, search, themes, modal behavior, and unavailable states. Existing unit coverage continues to gate Quran audio sequencing and follow behavior.

## P2 — release polish

- [x] Reuse consistent loading, empty, and unavailable-state patterns across the primary Quran, Sunnah, Dua, and Reflect journeys.
- [x] Use a consistent icon bookmark interaction and accessible pressed-state label across content types.
- [x] Keep public copy focused on user value; retain religious references without exposing implementation/provider commentary.
- [x] Make translation discovery manageable through language grouping and clearer selection.
- [x] Add missing accessible labels and bring compact touch controls to a 44px target where practical.
- [x] Preserve intentional spacing in the homepage heading's accessible text.
- [x] Add route-specific metadata for Mushaf, Dua details, and Reflect details.
- [x] Return a real not-found response for invalid Quran and structural records, plus malformed Dua/Reflect IDs, where server validation is reliable.
- [x] Reconcile scope and deployment documentation with the owner's confirmed Quran.Foundation approval.

## Verification

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `npm run smoke:config`
- [x] `npm run smoke:routes`
- [x] `npm run test:e2e`
- [x] Browser QA at 375, 430, 768, 1280, and 1440px in light, dark, and sepia, including horizontal-overflow checks.
