export const starterConfig = {
  app: {
    description:
      "A calm, free, source-transparent Quran reading companion.",
    name: "Al-Furqan",
    shortName: "Al-Furqan",
  },
  branding: {
    accent: "#25624d",
    background: "#f6f2e8",
    card: "#fffdf7",
    text: "#17231c",
  },
  defaults: {
    chapterId: "1",
    mushafId: 4,
    searchPlaceholder: "Search a verse, surah, or phrase",
  },
  features: {
    collections: true,
    goals: true,
    notes: true,
    reflections: false,
    search: true,
  },
} as const;

export type StarterConfig = typeof starterConfig;
