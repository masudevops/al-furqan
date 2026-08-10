export interface SavedLocation {
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  label: string;
}

export const LOCATION_STORAGE_KEY = "af-location-v1";

export function readSavedLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY) ?? "null") as SavedLocation | null;
    return value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) ? value : null;
  } catch {
    return null;
  }
}

export function saveLocation(location: SavedLocation) {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  if (location.city) localStorage.setItem("af-prayer-city", location.city);
  if (location.country) localStorage.setItem("af-prayer-country", location.country);
}
