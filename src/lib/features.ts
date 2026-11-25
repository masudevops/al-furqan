export type PublicFeature = "salahTimes" | "dua" | "hisnulMuslim" | "qibla" | "masjidFinder" | "learn";

function enabled(value: string | undefined, defaultValue: boolean) {
  if (value == null || value.trim() === "") return defaultValue;
  return value.toLowerCase() !== "false";
}

type FeatureEnvironment = Partial<Record<
  | "NEXT_PUBLIC_FEATURE_SALAH_TIMES"
  | "NEXT_PUBLIC_FEATURE_DUA"
  | "NEXT_PUBLIC_FEATURE_HISNUL_MUSLIM"
  | "NEXT_PUBLIC_FEATURE_QIBLA"
  | "NEXT_PUBLIC_FEATURE_MASJID_FINDER"
  | "NEXT_PUBLIC_FEATURE_LEARN",
  string
>>;

export function resolvePublicFeatures(environment: FeatureEnvironment): Record<PublicFeature, boolean> {
  return {
    salahTimes: enabled(environment.NEXT_PUBLIC_FEATURE_SALAH_TIMES, true),
    dua: enabled(environment.NEXT_PUBLIC_FEATURE_DUA, true),
    // Full Hisnul Muslim from hisnmuslim.com, an interim source pending written permission (docs/DATA-SOURCES.md). Set to false to withdraw it.
    hisnulMuslim: enabled(environment.NEXT_PUBLIC_FEATURE_HISNUL_MUSLIM, true),
    qibla: enabled(environment.NEXT_PUBLIC_FEATURE_QIBLA, false),
    masjidFinder: enabled(environment.NEXT_PUBLIC_FEATURE_MASJID_FINDER, true),
    // Learn (Noorani Qaidah) is a public preview; every page says its lessons await qualified review. See docs/LEARN-QAIDAH.md.
    learn: enabled(environment.NEXT_PUBLIC_FEATURE_LEARN, true),
  };
}

export const publicFeatures = resolvePublicFeatures({
  NEXT_PUBLIC_FEATURE_SALAH_TIMES: process.env.NEXT_PUBLIC_FEATURE_SALAH_TIMES,
  NEXT_PUBLIC_FEATURE_DUA: process.env.NEXT_PUBLIC_FEATURE_DUA,
  NEXT_PUBLIC_FEATURE_HISNUL_MUSLIM: process.env.NEXT_PUBLIC_FEATURE_HISNUL_MUSLIM,
  NEXT_PUBLIC_FEATURE_QIBLA: process.env.NEXT_PUBLIC_FEATURE_QIBLA,
  NEXT_PUBLIC_FEATURE_MASJID_FINDER: process.env.NEXT_PUBLIC_FEATURE_MASJID_FINDER,
  NEXT_PUBLIC_FEATURE_LEARN: process.env.NEXT_PUBLIC_FEATURE_LEARN,
});

export function enabledFeatureLabels() {
  return [
    publicFeatures.salahTimes ? "Salah times" : null,
    publicFeatures.dua ? "Dua" : null,
    publicFeatures.qibla ? "Qibla" : null,
    publicFeatures.masjidFinder ? "Masjid Finder" : null,
    publicFeatures.learn ? "Learn" : null,
  ].filter((label): label is string => Boolean(label));
}
