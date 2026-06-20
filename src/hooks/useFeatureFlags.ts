// React hook for feature flags
import { featureFlags, isFeatureEnabled, type FeatureFlags } from '../config/featureFlags';

/**
 * Hook to access feature flags in React components
 * @returns Object with all feature flags and utility functions
 */
export function useFeatureFlags() {
  return {
    // All feature flags
    flags: featureFlags,
    
    // Utility functions for checking specific features
    isEnabled: isFeatureEnabled,
    
    // Individual flag getters (for convenience)
    mushafView: isFeatureEnabled.mushafView(),
    audioPlayer: isFeatureEnabled.audioPlayer(),
    bookmarks: isFeatureEnabled.bookmarks(),
    tafseer: isFeatureEnabled.tafseer(),
    islamicLibrary: isFeatureEnabled.islamicLibrary(),
    prayerTimes: isFeatureEnabled.prayerTimes(),
    hisnulMuslim: isFeatureEnabled.hisnulMuslim(),
    debugMode: isFeatureEnabled.debugMode(),
    betaFeatures: isFeatureEnabled.betaFeatures(),
  };
}

/**
 * Hook to check if a specific feature is enabled
 * @param feature - The feature to check
 * @returns boolean indicating if the feature is enabled
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature];
}