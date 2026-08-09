# Security

Secrets and app/user tokens remain server-side. Content/Search use the confidential server SDK path. OAuth preserves state, nonce, PKCE, backend exchange, refresh, session rotation, and OIDC logout. The browser receives only a signed opaque session ID in an HttpOnly, SameSite=Lax cookie; Secure is enabled in production. Redis is required for production multi-instance sessions.

Never log tokens, secrets, private notes, or raw sessions. Maintain same-origin JSON mutations; if cookie/CORS behavior broadens, add explicit CSRF tokens. Add CSP and rate limiting before public launch. Translation HTML is provider-controlled but must receive a reviewed allowlist sanitizer before accepting other HTML sources. Run dependency audits, but do not apply breaking automated fixes without reviewing the official starter compatibility.
