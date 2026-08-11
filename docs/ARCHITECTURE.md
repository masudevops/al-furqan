# Al-Furqan architecture

## System context

Al-Furqan is a Next.js App Router application deployed on Vercel. Public Quran and Sunnah pages are server rendered for accessibility, fast first content, and search crawlability; interactive controls hydrate in the browser. All confidential credentials, OAuth tokens, provider keys, and raw sessions remain behind same-origin route handlers.

```mermaid
flowchart LR
  User["Reader"] -->|"HTTPS"| App["Al-Furqan on Vercel"]
  Crawler["Search crawler"] -->|"public HTML and discovery files"| App
  App --> QF["Quran.Foundation"]
  App --> UA["UmmahAPI"]
  App --> DD["dua-dhikr and matched audio"]
  App --> AA["AlAdhan"]
  App --> OSM["OpenStreetMap services"]
  App <--> Redis["Redis session store"]
  User <--> Local["Browser-local preferences and bookmarks"]
```

## Container architecture

```mermaid
flowchart TB
  subgraph Browser["Browser trust zone"]
    Pages["Hydrated React pages"]
    SWR["SWR data client"]
    BrowserAPIs["Geolocation · orientation · audio · FontFace"]
    LocalState["Versioned local storage and session cache"]
  end

  subgraph Server["Next.js server trust zone"]
    SSR["Server-rendered route pages"]
    API["Same-origin route handlers"]
    ProviderLayer["Typed provider adapters and normalizers"]
    QFSDK["Quran.Foundation server SDK"]
    Auth["OAuth callback · refresh · logout · session rotation"]
    FeatureConfig["Build-time public feature configuration"]
    Discovery["Metadata · JSON-LD · sitemap · robots · social images"]
  end

  subgraph State["State services"]
    Redis["Redis in production"]
    Memory["In-memory store for local development only"]
  end

  subgraph External["External providers"]
    QF["Quran.Foundation APIs and CDN"]
    Ummah["UmmahAPI"]
    Dua["fitrahive dua-dhikr and Hisnul Muslim audio"]
    AlAdhan["AlAdhan"]
    OSM["Overpass and Nominatim"]
  end

  Pages --> SWR
  Pages <--> BrowserAPIs
  Pages <--> LocalState
  SWR -->|"same-origin JSON"| API
  SSR --> ProviderLayer
  API --> ProviderLayer
  ProviderLayer --> QFSDK
  QFSDK --> QF
  ProviderLayer --> Ummah
  ProviderLayer --> Dua
  ProviderLayer --> AlAdhan
  ProviderLayer --> OSM
  API --> Auth
  Auth --> QF
  Auth --> Redis
  Auth -.->|"local only"| Memory
  SSR --> FeatureConfig
  Pages --> FeatureConfig
  Discovery --> SSR
```

## Quran public-content request

```mermaid
sequenceDiagram
  participant B as Browser or crawler
  participant P as Next.js page
  participant R as Same-origin API route
  participant S as Quran server adapter
  participant Q as Quran.Foundation

  B->>P: GET Quran page
  P->>S: Load initial sourced content
  S->>Q: App-token Content request
  Q-->>S: Quran text and resources
  S-->>P: Validated normalized model
  P-->>B: Server-rendered Arabic and translation HTML
  B->>R: Interactive resource request
  R->>S: Load reader, audio, Tafsir, or Search data
  S->>Q: App-token request
  Q-->>S: Provider response
  S-->>R: Validated model or unavailable error
  R-->>B: Same-origin JSON with cache policy
```

Public Quran responses use short revalidation windows and remain below Quran.Foundation's one-week maximum caching rule. Quran text is rendered with `lang="ar"`, `dir="rtl"`, and `translate="no"`. Missing provider content is never reconstructed.

## OAuth and personalized User API flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as Al-Furqan server
  participant R as Redis
  participant O as Quran.Foundation OAuth
  participant U as Quran.Foundation User API

  B->>A: Start sign-in
  A->>A: Create state, nonce, and PKCE verifier
  A->>R: Store transient server session
  A-->>B: Redirect to authorization endpoint
  B->>O: User authorization
  O-->>A: Callback with code and state
  A->>R: Validate state and rotate session
  A->>O: Exchange code with verifier and client credentials
  O-->>A: Access, refresh, and ID tokens
  A->>R: Store tokens server-side
  A-->>B: Signed opaque HttpOnly cookie
  B->>A: Personalized same-origin request
  A->>R: Resolve server session
  A->>U: User-token API request
  U-->>A: Private user data
  A-->>B: Private no-store response
```

The browser never receives the client secret, refresh token, raw token set, or raw session. Production requires Redis because serverless instances cannot safely share an in-memory session store.

## Feature flags

Optional public sections use a single typed configuration in `src/lib/features.ts`. The same resolved values control navigation, homepage entry points, route availability, sitemap inclusion, metadata copy, and the generated social image.

| Feature | Default |
| --- | --- |
| Salah Times | Enabled |
| Dua | Enabled |
| Qibla | Disabled |
| Masjid Finder | Enabled |

A disabled feature returns the standard 404 page rather than exposing a dead or partially working experience. Flags are build-time `NEXT_PUBLIC_*` values and require redeployment after changes.

## Data ownership and caching

| Data | Location | Policy |
| --- | --- | --- |
| Quran public content | Provider plus short Next.js/edge cache | Never retained beyond Quran.Foundation terms; no permanent offline corpus |
| User API data and tokens | Redis-backed server session | Private, server-only, no shared caching |
| Theme, text size, last read, local bookmarks | Browser storage | User-device only; no login required |
| Location and Salah preferences | Browser storage | Sent only to same-origin calculation routes when needed |
| Mosque results | Server cache plus browser session cache | Short-lived and respectful of Overpass fair-use limits |
| Hadith and Dua responses | Provider-specific Next.js revalidation | No invented replacements; fail closed |

## Search and sharing architecture

- Public Quran and Sunnah pages include meaningful initial server HTML.
- Canonicals and route-specific metadata prevent duplicate-route ambiguity.
- WebSite, Organization, SoftwareApplication, and Breadcrumb structured data describe the application and content hierarchy.
- `/sitemap.xml` includes core enabled pages, discovered Surahs, and stable Hadith collection routes.
- `/robots.txt` advertises the sitemap and excludes API, callback, and private settings routes.
- Generated Open Graph/Twitter images and application icons support social previews.
- Disabled feature names and routes are removed from discovery surfaces.

## Future native boundary

Provider contracts, normalization, integrity validation, audio sequencing, daily selection, and local bookmark models are kept outside page components where practical. A future native client can reuse or port those rules, while replacing web-specific adapters for Next.js route handlers, browser geolocation/orientation, `localStorage`, `sessionStorage`, `FontFace`, and web audio. No native framework has been selected and no native scaffold exists yet.
