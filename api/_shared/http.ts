function getCorsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  if (!origin) return headers;

  let sameOrigin = false;
  try {
    sameOrigin = new URL(origin).host === new URL(request.url).host;
  } catch {
    sameOrigin = false;
  }

  const configuredOrigins = (process.env.PROVIDER_ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (sameOrigin || configuredOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  return headers;
}

export function validateProviderRequest(request: Request): Response | null {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    corsHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    corsHeaders.set("Access-Control-Allow-Headers", "Accept");
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return jsonResponse(request, { error: "Method not allowed" }, 405, false);
  }

  return null;
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
  cache = true,
): Response {
  const headers = getCorsHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (cache) {
    headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  } else {
    headers.set("Cache-Control", "no-store");
  }

  return new Response(JSON.stringify(body), { status, headers });
}
