export type PublicFeature = "salahTimes" | "dua" | "qibla" | "masjidFinder";

function enabled(value: string | undefined, defaultValue: boolean) {
  if (value == null || value.trim() === "") return defaultValue;
  return value.toLowerCase() !== "false";
}

type FeatureEnvironment = Partial<Record<
  | "NEXT_PUBLIC_FEATURE_SALAH_TIMES"
  | "NEXT_PUBLIC_FEATURE_DUA"
  | "NEXT_PUBLIC_FEATURE_QIBLA"
  | "NEXT_PUBLIC_FEATURE_MASJID_FINDER",
  string
>>;

export function resolvePublicFeatures(environment: FeatureEnvironment): Record<PublicFeature, boolean> {
  return {
    salahTimes: enabled(environment.NEXT_PUBLIC_FEATURE_SALAH_TIMES, true),
    dua: enabled(environment.NEXT_PUBLIC_FEATURE_DUA, true),
    qibla: enabled(environment.NEXT_PUBLIC_FEATURE_QIBLA, false),
    masjidFinder: enabled(environment.NEXT_PUBLIC_FEATURE_MASJID_FINDER, true),
  };
}

export const publicFeatures = resolvePublicFeatures({
  NEXT_PUBLIC_FEATURE_SALAH_TIMES: process.env.NEXT_PUBLIC_FEATURE_SALAH_TIMES,
  NEXT_PUBLIC_FEATURE_DUA: process.env.NEXT_PUBLIC_FEATURE_DUA,
  NEXT_PUBLIC_FEATURE_QIBLA: process.env.NEXT_PUBLIC_FEATURE_QIBLA,
  NEXT_PUBLIC_FEATURE_MASJID_FINDER: process.env.NEXT_PUBLIC_FEATURE_MASJID_FINDER,
});

export function enabledFeatureLabels() {
  return [
    publicFeatures.salahTimes ? "Salah times" : null,
    publicFeatures.dua ? "Dua" : null,
    publicFeatures.qibla ? "Qibla" : null,
    publicFeatures.masjidFinder ? "Masjid Finder" : null,
  ].filter((label): label is string => Boolean(label));
}
