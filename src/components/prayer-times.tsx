"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./prayer-times.module.css";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const METHODS = [{ id: 3, name: "Muslim World League" }, { id: 2, name: "ISNA" }, { id: 4, name: "Umm al-Qura" }, { id: 5, name: "Egyptian Authority" }, { id: 1, name: "Karachi" }];
type Payload = { date: string; error: string | null; hijri: string; timings: Record<string,string>; timezone: string };

export default function PrayerTimes() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState(2);
  const [school, setSchool] = useState(0);
  const [manual, setManual] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Your location");
  const [tick, setTick] = useState(Date.now());

  const load = async (location: { latitude?: number; longitude?: number; city?: string; country?: string }, force = false) => {
    const params = new URLSearchParams({ method: String(method), school: String(school) });
    Object.entries(location).forEach(([key,value]) => value !== undefined && params.set(key, String(value)));
    const key = `af-prayers:${new Date().toISOString().slice(0,10)}:${params}`;
    if (!force) {
      const cached = localStorage.getItem(key);
      if (cached) {
        try { setPayload(JSON.parse(cached)); setError(null); return; }
        catch { localStorage.removeItem(key); }
      }
    }
    const response = await fetch(`/api/prayer-times?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    localStorage.setItem(key, JSON.stringify(data));
    setPayload(data); setError(null);
  };

  useEffect(() => {
    setMethod(Number(localStorage.getItem("af-prayer-method")) || 2);
    setSchool(Number(localStorage.getItem("af-prayer-school")) || 0);
    const city = localStorage.getItem("af-prayer-city");
    const country = localStorage.getItem("af-prayer-country");
    if (city && country) { setLocationLabel(`${city}, ${country}`); load({ city, country }).catch(error => setError(String(error.message))); return; }
    if (!navigator.geolocation) { setManual(true); return; }
    navigator.geolocation.getCurrentPosition(
      position => load({ latitude: position.coords.latitude, longitude: position.coords.longitude }).catch(error => setError(String(error.message))),
      () => setManual(true), { maximumAge: 86_400_000, timeout: 10_000 },
    );
  // Settings changes deliberately trigger a fresh daily cache key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, school]);
  useEffect(() => { const id = setInterval(() => setTick(Date.now()), 30_000); return () => clearInterval(id); }, []);

  const next = useMemo(() => {
    if (!payload) return null;
    const now = new Date(tick);
    for (const name of PRAYERS) {
      const [hours, minutes] = payload.timings[name].replace(/\s*\(.+\)$/, "").split(":").map(Number);
      const at = new Date(now); at.setHours(hours, minutes, 0, 0);
      if (at.getTime() > now.getTime()) return { name, ms: at.getTime() - now.getTime() };
    }
    const [hours, minutes] = payload.timings.Fajr.split(":").map(Number);
    const at = new Date(now); at.setDate(at.getDate() + 1); at.setHours(hours, minutes, 0, 0);
    return { name: "Fajr", ms: at.getTime() - now.getTime() };
  }, [payload, tick]);
  const countdown = next ? `${Math.floor(next.ms / 3_600_000)}h ${Math.floor(next.ms % 3_600_000 / 60_000)}m` : "";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const values = new FormData(event.currentTarget); const city = String(values.get("city") ?? "").trim(); const country = String(values.get("country") ?? "").trim();
    if (!city || !country) return;
    localStorage.setItem("af-prayer-city", city); localStorage.setItem("af-prayer-country", country); setLocationLabel(`${city}, ${country}`);
    load({ city, country }, true).catch(error => setError(String(error.message)));
  };

  return <section className={styles.card} aria-labelledby="prayer-title">
    <div className={styles.heading}><div><p>Prayer times · {locationLabel}</p><h2 id="prayer-title">{next ? `${next.name} in ${countdown}` : "Prayer times"}</h2><small>{payload ? `${payload.hijri} · ${payload.timezone}` : "Allow location or enter a city below."}</small></div><button onClick={() => setManual(value => !value)}>{manual ? "Close" : "Change"}</button></div>
    {payload ? <div className={styles.times}>{PRAYERS.map(name => <div key={name}><span>{name}</span><strong>{payload.timings[name]}</strong></div>)}</div> : null}
    {error ? <p className={styles.error}>{error}</p> : null}
    {manual ? <form onSubmit={submit}><input name="city" required maxLength={100} autoComplete="address-level2" placeholder="City"/><input name="country" required maxLength={100} autoComplete="country-name" placeholder="Country"/><button>Show times</button></form> : null}
    <details><summary>Calculation settings</summary><div className={styles.settings}><label>Method<select value={method} onChange={event => { const value=Number(event.target.value); setMethod(value); localStorage.setItem("af-prayer-method",String(value)); }}>{METHODS.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Asr school<select value={school} onChange={event => { const value=Number(event.target.value); setSchool(value); localStorage.setItem("af-prayer-school",String(value)); }}><option value={0}>Shafi</option><option value={1}>Hanafi</option></select></label></div></details>
    <p className={styles.note}>Calculated times can vary from local mosque timetables. Source: AlAdhan.</p>
  </section>;
}
