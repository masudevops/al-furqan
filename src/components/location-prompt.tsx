"use client";

import { useEffect, useRef } from "react";
import { useLocation } from "@/hooks/use-location";
import { Button, Icon } from "@/components/ui";
import styles from "./location-prompt.module.css";

type LocationState = ReturnType<typeof useLocation>;
export type LocationControls = Pick<LocationState, "clear" | "detect" | "status">;

// `live` re-detects a previously detected position on mount when permission is already granted,
// so features like Masjid Finder follow the visitor instead of reusing a stale saved position.
export default function LocationPrompt({ children, header, live = false }: { children: (location: NonNullable<LocationState["location"]>, controls: LocationControls) => React.ReactNode; header?: (location: LocationState["location"], controls: LocationControls) => React.ReactNode; live?: boolean }) {
  const { clear, detect, error, location, status, submitManual } = useLocation();
  const refreshed = useRef(false);
  useEffect(() => {
    if (!live || refreshed.current || location?.label !== "Current location" || !navigator.permissions) return;
    refreshed.current = true;
    navigator.permissions.query({ name: "geolocation" }).then((permission) => { if (permission.state === "granted") detect(); }).catch(() => undefined);
  }, [detect, live, location]);
  const heading = header?.(location, { clear, detect, status });
  if (location) return <>{heading}{children(location, { clear, detect, status })}</>;
  return <>{heading}<section className={styles.card} aria-labelledby="location-title">
    <div className={styles.intro}>
      <span className={styles.pin} aria-hidden="true"><Icon name="pin" /></span>
      <div><h2 id="location-title">Where are you?</h2><p>Set your location once to see accurate local results. It stays in this browser and is only sent to the calculation or map service when you use this page.</p></div>
    </div>
    <Button variant="primary" icon="compass" className={styles.detect} onClick={detect} disabled={status === "loading"}>{status === "loading" ? "Finding your location…" : "Use my current location"}</Button>
    <div className={styles.divider}>or enter a city</div>
    <form className={styles.form} onSubmit={submitManual}>
      <label>City<input name="city" required maxLength={100} autoComplete="address-level2" placeholder="Chicago"/></label>
      <label>Country<input name="country" required maxLength={100} autoComplete="country-name" placeholder="United States"/></label>
      <Button type="submit" disabled={status === "loading"}>Use this city</Button>
    </form>
    {status === "denied" ? <p className={styles.notice} role="status">Location access was declined or blocked. Enter your city and country instead.</p> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </section></>;
}

// Shows the active location with a way to change it; used in page headers.
export function LocationChip({ label, onChange }: { label: string; onChange: () => void }) {
  return <Button small icon="pin" onClick={onChange} aria-label={`Location: ${label}. Change location`}>{label}<span aria-hidden="true">· Change</span></Button>;
}
