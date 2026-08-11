# EPIC — Search visibility and crawlability

## Goal

Make Al-Furqan technically easy to crawl, understand, and index for Quran, Sunnah, Salah, Dua, and other enabled features without keyword stuffing, generated religious content, or promises of ranking position.

## Delivery sequence

### 1. Server-rendered page content

- [x] Render the complete Quran catalog in the initial `/quran` HTML.
- [x] Render sourced Arabic and translation content in initial Surah HTML, then progressively hydrate the interactive reader.
- [x] Seed Sunnah collection, browse, and Hadith detail pages with server-fetched provider data.
- [x] Preserve fail-closed unavailable states when a religious source fails.
- [ ] Extend server-provided initial data to Dua and Quran Reflect detail pages after their provider stability work.

### 2. Route metadata

- [x] Add descriptive titles, descriptions, Open Graph fields, and canonicals for the homepage, Quran catalog, Surahs, Ayahs, Sunnah catalog, collections, Hadith details, Salah Times, Dua, Qibla, Masjid Finder, Search, Reflect, and structure pages.
- [x] Mark invalid/unavailable dynamic Quran and Hadith records `noindex`.
- [ ] Add source-backed dynamic metadata to Dua and Quran Reflect detail records.

### 3. Sitemap and robots

- [x] Generate `/sitemap.xml` for core pages, all dynamically discovered Surahs, and enabled Hadith collections.
- [x] Generate `/robots.txt`, advertise the sitemap, and exclude API, callback, and private settings routes.
- [ ] Add Hadith detail URLs only when the provider exposes a stable canonical-ID feed that does not require fabricating sequential records.

### 4. Structured data

- [x] Add `WebSite`, `Organization`, and `SoftwareApplication` JSON-LD.
- [x] Add `BreadcrumbList` JSON-LD to Surah, Hadith collection, and Hadith detail pages.
- [ ] Validate deployed pages with Google's Rich Results Test after release.

### 5. Performance and crawl efficiency

- [x] Use local fonts and keep the global shell free from third-party tracking scripts.
- [x] Revalidate public server-rendered Quran and Hadith pages hourly, within source caching restrictions.
- [x] Revalidate the dynamic sitemap daily.
- [x] Keep location-dependent and daily widgets client-loaded so they do not block initial semantic HTML.
- [ ] Measure deployed Core Web Vitals in Search Console after enough field data exists.

### 6. Search-engine verification

- [x] Add optional `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` metadata hooks.
- [x] Owner: verify the domain in Google Search Console through DNS.
- [x] Owner: submit `https://al-furqan.app/sitemap.xml` to Google Search Console.
- [x] Owner: inspect and request Google indexing for `/`, `/quran`, and `/sunnah`.
- [ ] Owner: complete the equivalent Bing Webmaster Tools verification, sitemap, and URL submission workflow.

## Success measures

- Valid pages are indexed without rendering or canonical errors.
- Search Console reports healthy Core Web Vitals and increasing non-brand impressions.
- Queries begin ranking for specific intent such as Surah names, Arabic/translation reading, Tajweed, sourced Hadith references, Salah times, and Dua—not merely the broadest single-word terms.
- No SEO content compromises religious-source integrity or user privacy.
