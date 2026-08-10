"use client";

import { useLocation } from "@/hooks/use-location";
import styles from "./feature-pages.module.css";

export default function LocationPrompt({ children }: { children: (location: NonNullable<ReturnType<typeof useLocation>["location"]>) => React.ReactNode }) {
  const { detect, error, location, status, submitManual } = useLocation();
  if (location) return <>{children(location)}</>;
  return <section className={styles.locationCard} aria-labelledby="location-title">
    <span className={styles.eyebrow}>Location needed</span>
    <h2 id="location-title">Use your location for accurate local results</h2>
    <p>Your coordinates stay in this browser. They are sent only to the selected calculation or map-data service when you use the feature.</p>
    <button className={styles.primaryButton} onClick={detect} disabled={status === "loading"}>{status === "loading" ? "Finding your location…" : "Detect my location"}</button>
    <div className={styles.divider}><span>or enter a location</span></div>
    <form className={styles.locationForm} onSubmit={submitManual}>
      <label>City<input name="city" required maxLength={100} autoComplete="address-level2" placeholder="Chicago"/></label>
      <label>Country<input name="country" required maxLength={100} autoComplete="country-name" placeholder="United States"/></label>
      <button disabled={status === "loading"}>Use this city</button>
    </form>
    {status === "denied" ? <p className={styles.notice}>Location access was declined or blocked. Enter your city and country above.</p> : null}
    {error ? <p className={styles.errorText}>{error}</p> : null}
  </section>;
}
