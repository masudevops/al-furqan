"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Tells our own server that a page was viewed: the path, the referring site on arrival, and the screen width.
// No cookie, no identifier, no third party. Honours Global Privacy Control and Do Not Track.
export default function PageViewBeacon() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (!pathname || pathname.startsWith("/insights")) return;
    const optedOut = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true || navigator.doNotTrack === "1";
    if (optedOut) return;
    const body = JSON.stringify({ path: pathname, referrer: first.current ? document.referrer : "", width: window.innerWidth });
    first.current = false;
    try {
      if (!navigator.sendBeacon?.("/api/insights/hit", body)) void fetch("/api/insights/hit", { method: "POST", body, keepalive: true }).catch(() => {});
    } catch {}
  }, [pathname]);
  return null;
}
