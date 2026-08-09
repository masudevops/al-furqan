# Architecture

The official Quran.Foundation Next.js scaffold is the reference foundation. The browser calls same-origin `/api/chapters`, `/api/reader/:chapter`, and `/api/search`; route handlers create the server SDK client. Application client credentials acquire Content/Search tokens independently of OAuth user sessions. User tokens remain in signed server-side sessions backed by memory locally or Redis in multi-instance production.

Canonical public URLs are `/`, `/quran`, `/quran/:chapter`, and `/quran/:chapter/:ayah`. The product shell fetches resources with SWR, persists only small reader settings and last-read locally, and renders source failures without substitute text. Feature modules should grow under `src/features` when the first component boundary becomes insufficient.

The generated account API routes remain server-isolated but account UI is not in the v1 slice. QuranReflect social scopes and presentation are disabled.
