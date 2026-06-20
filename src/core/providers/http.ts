export interface ProviderHttpClientOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class ProviderClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderClientError";
  }
}

export function createProviderHttpClient({
  fetchImpl = fetch,
  timeoutMs = 10_000,
}: ProviderHttpClientOptions = {}) {
  return async function getJson(
    endpoint: string,
    query: Record<string, string | number>,
  ): Promise<unknown> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      search.set(key, String(value));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(`${endpoint}?${search.toString()}`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ProviderClientError(
          `Provider request failed with HTTP ${response.status}`,
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ProviderClientError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ProviderClientError("Provider request timed out");
      }
      throw new ProviderClientError("Provider request failed");
    } finally {
      clearTimeout(timeout);
    }
  };
}
