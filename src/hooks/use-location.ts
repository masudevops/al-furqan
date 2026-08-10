"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { readSavedLocation, SavedLocation, saveLocation } from "@/lib/location";

export function useLocation() {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setLocation(readSavedLocation()), []);

  const detect = useCallback(() => {
    setError(null);
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition((position) => {
      const next: SavedLocation = {
        city: null,
        country: null,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: "Current location",
      };
      saveLocation(next);
      setLocation(next);
      setStatus("idle");
    }, () => setStatus("denied"), { enableHighAccuracy: true, maximumAge: 86_400_000, timeout: 12_000 });
  }, []);

  const submitManual = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    const form = new FormData(event.currentTarget);
    const city = String(form.get("city") ?? "").trim();
    const country = String(form.get("country") ?? "").trim();
    try {
      const response = await fetch(`/api/location?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Location was not found.");
      saveLocation(payload.location);
      setLocation(payload.location);
      setStatus("idle");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Location was not found.");
      setStatus("error");
    }
  }, []);

  return { detect, error, location, setLocation, status, submitManual };
}
