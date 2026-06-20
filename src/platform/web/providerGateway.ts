const defaultProviderBaseUrl = "/api/providers";

export function getProviderEndpoint(provider: "hadith" | "islamhouse"): string {
  const configuredBaseUrl =
    import.meta.env.VITE_PROVIDER_API_BASE_URL || defaultProviderBaseUrl;
  return `${configuredBaseUrl.replace(/\/$/, "")}/${provider}`;
}
