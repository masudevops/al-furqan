"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@/hooks/use-location";
import styles from "./prayer-times.module.css";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
type Payload = { date: string; error: null; gregorian: string; hijri: string; timings: Record<string,string>; timezone: string };

export function getNextPrayer(payload: Payload | null, now = new Date()) {
  if (!payload) return null;
  for (const name of PRAYERS) {
    const [hours, minutes] = payload.timings[name].replace(/\s*\(.+\)$/, "").split(":").map(Number);
    const at = new Date(now); at.setHours(hours, minutes, 0, 0);
    if (at > now) return { name, ms: at.getTime() - now.getTime() };
  }
  const [hours, minutes] = payload.timings.Fajr.split(":").map(Number);
  const at = new Date(now); at.setDate(at.getDate() + 1); at.setHours(hours, minutes, 0, 0);
  return { name: "Fajr", ms: at.getTime() - now.getTime() };
}

export default function PrayerTimes() {
  const { location } = useLocation();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    if (!location) return;
    const method = localStorage.getItem("af-prayer-method") || "2";
    const school = localStorage.getItem("af-prayer-school") || "0";
    const params = new URLSearchParams({ latitude:String(location.latitude), longitude:String(location.longitude), method, school });
    const cacheKey = `af-prayers:${new Date().toISOString().slice(0,10)}:${params}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { try { setPayload(JSON.parse(cached)); return; } catch {} }
    fetch(`/api/prayer-times?${params}`).then(response => response.json().then(data => ({ response, data }))).then(({response,data}) => {
      if (!response.ok) return;
      localStorage.setItem(cacheKey, JSON.stringify(data)); setPayload(data);
    }).catch(() => undefined);
  }, [location]);
  useEffect(() => { const id = setInterval(() => setTick(Date.now()), 30_000); return () => clearInterval(id); }, []);
  const next = useMemo(() => getNextPrayer(payload, new Date(tick)), [payload, tick]);
  const countdown = next ? `${Math.floor(next.ms/3_600_000)}h ${Math.floor((next.ms%3_600_000)/60_000)}m` : null;
  return <Link href="/salah-times" className={styles.compactCard} aria-label="Open Salah Times">
    <div><span>Next prayer{location ? ` · ${location.label}` : ""}</span><h2>{next ? next.name : location ? "Loading Salah Times…" : "Set your location"}</h2></div>
    <strong>{countdown ?? (location ? "View schedule" : "View Salah Times")}</strong><b>→</b>
  </Link>;
}
