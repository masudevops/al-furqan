import "server-only";
import crypto from "node:crypto";

// The analytics dashboard is private to the site owner: one password (INSIGHTS_PASSWORD) and a signed, HttpOnly cookie.
// Without INSIGHTS_PASSWORD the dashboard doesn't exist.
export const INSIGHTS_COOKIE = "af_insights";
const MAX_AGE_SECONDS = 30 * 86_400;

const secret = () => process.env.SESSION_SECRET?.trim() || "";
const sign = (value: string) => crypto.createHmac("sha256", secret()).update(`insights:${value}`).digest("hex");
const digest = (value: string) => crypto.createHash("sha256").update(value).digest();

export const insightsEnabled = () => Boolean(process.env.INSIGHTS_PASSWORD?.trim() && secret());

export function passwordMatches(candidate: unknown): boolean {
  const expected = process.env.INSIGHTS_PASSWORD?.trim();
  if (!expected || typeof candidate !== "string" || !secret()) return false;
  return crypto.timingSafeEqual(digest(candidate), digest(expected));
}

export function createInsightsToken(now = Date.now()) {
  const expires = String(Math.floor(now / 1000) + MAX_AGE_SECONDS);
  return { value: `${expires}.${sign(expires)}`, maxAge: MAX_AGE_SECONDS };
}

export function validInsightsToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !insightsEnabled()) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  if (Number(expires) * 1000 < now) return false;
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(expires), "hex"));
}
