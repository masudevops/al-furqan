"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// Registers the service worker (production only) so the site can be installed and show an offline page.
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js").catch(() => {});
}

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// The browser's install prompt is captured when offered; iOS has no prompt, so it gets the Share-menu steps instead.
export function useInstallApp() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [state, setState] = useState<"unknown" | "installed" | "prompt" | "ios" | "unavailable">("unknown");
  useEffect(() => {
    if (isStandalone()) { setState("installed"); return; }
    setState(isIos() ? "ios" : "unavailable");
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); setState("prompt"); };
    const installed = () => { setPrompt(null); setState("installed"); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", installed); };
  }, []);
  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    if (outcome === "accepted") setState("installed");
  };
  return { state, install };
}
