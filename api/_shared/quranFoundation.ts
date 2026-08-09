const TOKEN_EARLY_REFRESH_MS = 60_000;

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export interface QuranFoundationConfig {
  clientId: string;
  clientSecret: string;
  authBaseUrl: string;
  apiBaseUrl: string;
}

export function getQuranFoundationConfig(): QuranFoundationConfig | null {
  const clientId = process.env.QF_CLIENT_ID?.trim();
  const clientSecret = process.env.QF_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const production = process.env.QF_ENV === "production";
  return {
    clientId,
    clientSecret,
    authBaseUrl: production
      ? "https://oauth2.quran.foundation"
      : "https://prelive-oauth2.quran.foundation",
    apiBaseUrl: production
      ? "https://apis.quran.foundation"
      : "https://apis-prelive.quran.foundation",
  };
}

async function requestToken(config: QuranFoundationConfig): Promise<CachedToken> {
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");
  const response = await fetch(`${config.authBaseUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "content",
    }),
  });
  if (!response.ok) throw new Error(`Quran Foundation auth HTTP ${response.status}`);
  const payload = (await response.json()) as {
    access_token?: unknown;
    expires_in?: unknown;
  };
  if (typeof payload.access_token !== "string") {
    throw new Error("Quran Foundation returned an invalid token");
  }
  const lifetime =
    typeof payload.expires_in === "number" ? payload.expires_in : 3600;
  return {
    value: payload.access_token,
    expiresAt: Date.now() + lifetime * 1000,
  };
}

async function getToken(config: QuranFoundationConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_EARLY_REFRESH_MS > Date.now()) {
    return cachedToken.value;
  }
  cachedToken = await requestToken(config);
  return cachedToken.value;
}

export async function fetchQuranFoundationJson(
  config: QuranFoundationConfig,
  path: string,
): Promise<unknown> {
  const perform = async (token: string) =>
    fetch(`${config.apiBaseUrl}${path}`, {
      headers: {
        Accept: "application/json",
        "x-auth-token": token,
        "x-client-id": config.clientId,
      },
    });

  let response = await perform(await getToken(config));
  if (response.status === 401) {
    cachedToken = null;
    response = await perform(await getToken(config));
  }
  if (!response.ok) {
    throw new Error(`Quran Foundation content HTTP ${response.status}`);
  }
  return response.json();
}

export function resetQuranFoundationTokenForTests(): void {
  cachedToken = null;
}
