import React from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { type FeatureFlags } from '../config/featureFlags';

/**
 * Component wrapper that conditionally renders children based on feature flag
 * @param feature - The feature flag to check
 * @param children - Content to render if feature is enabled
 * @param fallback - Optional content to render if feature is disabled
 */
interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeatureFlag(feature);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}