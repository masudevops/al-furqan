# EPIC — Public feature flags

## Goal

Allow optional public sections to be enabled or withdrawn cleanly without deleting their implementation. Quran and Sunnah remain core, unflagged experiences. Qibla is disabled by default until mobile-browser compass behavior is dependable across supported devices.

## Flags

| Environment variable | Default | Controls |
| --- | --- | --- |
| `NEXT_PUBLIC_FEATURE_SALAH_TIMES` | `true` | Salah Times page, navigation and homepage widget |
| `NEXT_PUBLIC_FEATURE_DUA` | `true` | Dua routes, navigation and homepage shortcut |
| `NEXT_PUBLIC_FEATURE_QIBLA` | `false` | Qibla route, navigation, homepage shortcut and discovery metadata |
| `NEXT_PUBLIC_FEATURE_MASJID_FINDER` | `true` | Masjid Finder page, navigation and homepage shortcut |

These values are intentionally public, non-secret build settings. Changing one in Vercel requires a redeployment.

## Acceptance criteria

- [x] Resolve flags through one typed configuration module.
- [x] Hide disabled features from desktop navigation, mobile navigation and homepage entry points.
- [x] Return a standard 404 for direct visits to a disabled page, including nested Dua routes.
- [x] Exclude disabled routes from the generated sitemap.
- [x] Exclude disabled feature names from site descriptions and the generated social card.
- [x] Document production variables and defaults.
- [x] Test default and explicit flag resolution.

## Follow-up before enabling Qibla

- Validate orientation permission and heading changes on current iOS Safari and Android Chrome hardware.
- Clearly distinguish magnetic heading from geographic North where browser data permits.
- Retain the sourced numeric bearing fallback when orientation data is unavailable.
- Complete accessibility and responsive checks before setting `NEXT_PUBLIC_FEATURE_QIBLA=true` in production.
