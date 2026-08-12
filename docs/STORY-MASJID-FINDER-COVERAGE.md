# Story — Improve Masjid Finder coverage and details

## User outcome

As a visitor, I want a more complete nearby-masjid list with useful verified details so I can choose a masjid and navigate there without relying on a single stale directory.

## Provider audit (2026-08-12)

- **Takbeer Time:** selected as a supplemental source. Its public nearby endpoint needs no authentication, supports a 200 km radius and up to 100 results, and may include community-maintained congregation schedules.
- **OpenStreetMap Overpass:** retained as the open geographic base. Matching now includes standard Muslim places of worship plus `building=mosque` and legacy `amenity=mosque` records, with a second Overpass instance for availability fallback.
- **Masjidi:** not integrated because no documented public global mosque-directory API was found.
- **eSolat/JAKIM:** not integrated because it is a Malaysian prayer-zone/timetable service rather than a global nearby-mosque directory.

## Acceptance criteria

- [x] Merge Takbeer Time and OpenStreetMap results server-side.
- [x] Deduplicate records by proximity and normalized name.
- [x] Preserve the nearest result ordering and return up to 60 listings.
- [x] Show address, phone, website and directions when available.
- [x] Show congregation times only when the provider explicitly marks the effective schedule verified.
- [x] Continue returning partial results if either provider is temporarily unavailable.
- [x] Cache upstream reads for one hour and browser results per session/location.
- [x] Document provider constraints and data provenance.
