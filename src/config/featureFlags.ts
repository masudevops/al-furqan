// Al-Furqan Feature Flags Configuration
// Centralized feature flag management system

export interface FeatureFlags {
  // Core Features
  enableMushafView: boolean;
  enableAudioPlayer: boolean;
  enableBookmarks: boolean;
  enableTafseer: boolean;
  enableIslamicLibrary: boolean;
  enablePrayerTimes: boolean;
  enableHisnulMuslim: boolean;
  
  // Development Features
  enableDebugMode: boolean;
  enableBetaFeatures: boolean;
}

// Default feature flag values (fallback if env vars are not set)
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableMushafView: true,
  enableAudioPlayer: true,
  enableBookmarks: true,
  enableTafseer: true,
  enableIslamicLibrary: true,
  enablePrayerTimes: true,
  enableHisnulMuslim: true,
  enableDebugMode: false,
  enableBetaFeatures: false,
};

// Helper function to parse boolean from string
function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Load feature flags from environment variables
function loadFeatureFlagsFromEnv(): FeatureFlags {
  return {
    enableMushafView: parseBooleanEnv(import.meta.env.VITE_ENABLE_MUSHAF_VIEW, DEFAULT_FEATURE_FLAGS.enableMushafView),
    enableAudioPlayer: parseBooleanEnv(import.meta.env.VITE_ENABLE_AUDIO_PLAYER, DEFAULT_FEATURE_FLAGS.enableAudioPlayer),
    enableBookmarks: parseBooleanEnv(import.meta.env.VITE_ENABLE_BOOKMARKS, DEFAULT_FEATURE_FLAGS.enableBookmarks),
    enableTafseer: parseBooleanEnv(import.meta.env.VITE_ENABLE_TAFSEER, DEFAULT_FEATURE_FLAGS.enableTafseer),
    enableIslamicLibrary: parseBooleanEnv(import.meta.env.VITE_ENABLE_ISLAMIC_LIBRARY, DEFAULT_FEATURE_FLAGS.enableIslamicLibrary),
    enablePrayerTimes: parseBooleanEnv(import.meta.env.VITE_ENABLE_PRAYER_TIMES, DEFAULT_FEATURE_FLAGS.enablePrayerTimes),
    enableHisnulMuslim: parseBooleanEnv(import.meta.env.VITE_ENABLE_HISNUL_MUSLIM, DEFAULT_FEATURE_FLAGS.enableHisnulMuslim),
    enableDebugMode: parseBooleanEnv(import.meta.env.VITE_ENABLE_DEBUG_MODE, DEFAULT_FEATURE_FLAGS.enableDebugMode),
    enableBetaFeatures: parseBooleanEnv(import.meta.env.VITE_ENABLE_BETA_FEATURES, DEFAULT_FEATURE_FLAGS.enableBetaFeatures),
  };
}

// Global feature flags instance
export const featureFlags: FeatureFlags = loadFeatureFlagsFromEnv();

// Utility functions for checking specific features
export const isFeatureEnabled = {
  mushafView: () => featureFlags.enableMushafView,
  audioPlayer: () => featureFlags.enableAudioPlayer,
  bookmarks: () => featureFlags.enableBookmarks,
  tafseer: () => featureFlags.enableTafseer,
  islamicLibrary: () => featureFlags.enableIslamicLibrary,
  prayerTimes: () => featureFlags.enablePrayerTimes,
  hisnulMuslim: () => featureFlags.enableHisnulMuslim,
  debugMode: () => featureFlags.enableDebugMode,
  betaFeatures: () => featureFlags.enableBetaFeatures,
};

// Debug logging (only in development)
if (import.meta.env.DEV && featureFlags.enableDebugMode) {
  console.log('🚩 Al-Furqan Feature Flags:', featureFlags);
}

// Export individual flags for convenience
export const {
  enableMushafView,
  enableAudioPlayer,
  enableBookmarks,
  enableTafseer,
  enableIslamicLibrary,
  enablePrayerTimes,
  enableHisnulMuslim,
  enableDebugMode,
  enableBetaFeatures,
} = featureFlags;