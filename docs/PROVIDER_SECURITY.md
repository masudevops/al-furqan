# External Provider Security

**Baseline:** AF-002, June 20, 2026

## Security model

Al-Furqan clients never receive third-party provider credentials. Web, PWA, and future mobile clients use reusable contracts in `src/core` and call an Al-Furqan-controlled provider gateway.

```text
Web / PWA / mobile client
  -> core provider contract
  -> platform-specific gateway URL
  -> Al-Furqan server endpoint
  -> credentialed upstream provider
```

The web adapter defaults to `/api/providers`. A separately deployed gateway can be selected with the public `VITE_PROVIDER_API_BASE_URL` setting. Core clients accept an endpoint and `fetch` implementation, so they are not coupled to React, Vite, the DOM, or a web-only runtime.

## Provider inventory

| Capability | Provider/origin | Credential status | Access path |
|---|---|---|---|
| Quran metadata | Local `surah-list.json` | None | Local bundle |
| Quran text, translations, editions, search | `api.alquran.cloud` | Public/keyless | Direct client access |
| Quran audio | `api.alquran.cloud`, `verses.quran.com` | Public/keyless | Direct client/media access |
| Mushaf ayah images | `cdn.islamic.network` | Public/keyless | Direct image access |
| Standalone tafsir | jsDelivr mirror of `spa5k/tafsir_api` | Public/keyless | Direct client access |
| Inline tafsir | `api.alquran.cloud` | Public/keyless | Direct client access |
| Hadith | `hadithapi.com` | **Secret API key** | `/api/providers/hadith` |
| Islamic books | `api3.islamhouse.com` | **Secret API key** | `/api/providers/islamhouse` |
| Prayer times | `api.aladhan.com` | Public/keyless | Direct client access |
| Reverse geocoding | `api.bigdatacloud.net` | Public/keyless endpoint | Direct client access after location consent |
| Hisnul Muslim | Local JSON dataset | None | Local bundle |
| Fonts/pattern | Google Fonts, Toptal pattern | Public assets | Direct browser access |
| Analytics | Vercel Analytics | No source credential | Client SDK |

Public/keyless does not mean risk-free. Provider provenance, rate limiting, privacy, version pinning, and availability remain future hardening work.

## Required environment variables

Server-only:

```bash
HADITH_API_KEY=
ISLAMHOUSE_API_KEY=
```

Optional:

```bash
# Comma-separated origins for a separately hosted browser client.
PROVIDER_ALLOWED_ORIGINS=https://staging.example.com,https://al-furqan.app

# Public URL prefix; this is not a credential.
VITE_PROVIDER_API_BASE_URL=/api/providers
```

Never prefix a secret with `VITE_`. Vite embeds those values in the browser bundle.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Add newly issued provider credentials to `.env.local`.
3. Use a development runtime that serves both Vite and the `api/` functions, such as `vercel dev`.

Running plain `npm run dev` serves only the SPA. Secret-backed Hadith and IslamHouse calls require either the local server-function runtime or `VITE_PROVIDER_API_BASE_URL` pointing to a deployed development gateway.

Unit and smoke tests do not need real credentials and must never call credentialed upstream providers.

## Production configuration

### Vercel

Configure `HADITH_API_KEY` and `ISLAMHOUSE_API_KEY` as encrypted project environment variables for each required environment. The same-origin `/api/providers` default routes to standard Fetch API functions under `api/providers/`. See the [Vercel Functions documentation](https://vercel.com/docs/functions).

### Azure or another static host

The current Azure workflow deploys only static `dist` files and cannot execute the provider functions. Deploy the `api/` gateway separately on a server/serverless runtime, set its server-only credentials there, configure allowed origins, and build the client with:

```bash
VITE_PROVIDER_API_BASE_URL=https://provider-gateway.example.com/api/providers
```

Do not put the third-party keys in Azure static-app build variables exposed to Vite.

### Mobile

Mobile applications should construct the providers from `src/core/providers` with the deployed gateway endpoint and the platform fetch implementation. Mobile binaries must not contain HadithAPI or IslamHouse credentials.

## Runtime controls

- Only `GET` and `OPTIONS` are accepted.
- Provider action and parameter values are allowlisted and bounded.
- Upstream requests time out.
- Upstream payloads are validated and normalized before reaching clients.
- Client payloads are validated again at the contract boundary.
- Error responses do not include upstream URLs or credentials.
- Responses receive bounded edge-cache headers.
- Cross-origin browser access is limited to configured origins; native clients do not send browser CORS origins.

## Credentials requiring rotation

The previously committed HadithAPI and IslamHouse credentials must be considered compromised because they were present in frontend source and may exist in deployed bundles and Git history.

Required operational action:

1. Revoke or rotate both credentials at their provider dashboards.
2. Store only the replacements in encrypted deployment environment variables.
3. Confirm old credentials no longer work.
4. Consider removing the historical values from Git history in a separately coordinated repository-security operation. History rewriting is intentionally outside AF-002.

## Logging rules

Do not log:

- API keys or credential-bearing upstream URLs
- Exact user location
- Quran/Hadith search text by default
- Reading history, bookmarks, or notes

Server errors should identify the provider and failure class without returning credentials or raw upstream payloads.
