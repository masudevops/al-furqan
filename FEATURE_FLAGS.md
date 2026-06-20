# Al-Furqan Feature Flags

This document explains how to use feature flags in the Al-Furqan application to enable/disable features.

## Overview

Feature flags allow you to control which features are available in the application without changing code. This is useful for:

- **Development**: Testing features in isolation
- **Deployment**: Gradual rollout of new features
- **Maintenance**: Temporarily disabling problematic features
- **Customization**: Different feature sets for different environments

## Configuration

### Environment Variables

Feature flags are controlled via environment variables in `.env.local` file:

```bash
# Mushaf View Feature Flag
VITE_ENABLE_MUSHAF_VIEW=true

# Other feature flags
VITE_ENABLE_AUDIO_PLAYER=true
VITE_ENABLE_BOOKMARKS=true
VITE_ENABLE_TAFSEER=true
VITE_ENABLE_ISLAMIC_LIBRARY=true
VITE_ENABLE_PRAYER_TIMES=true
VITE_ENABLE_HISNUL_MUSLIM=true

# Development flags
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_BETA_FEATURES=false
```

### Setting Up

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your desired settings:
   - Set to `true` to enable a feature
   - Set to `false` to disable a feature

3. **Restart the development server** for changes to take effect:
   ```bash
   npm run dev
   ```

## Available Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `VITE_ENABLE_MUSHAF_VIEW` | Shows/hides Mushaf (page-based) Quran view | `true` |
| `VITE_ENABLE_AUDIO_PLAYER` | Shows/hides audio player functionality | `true` |
| `VITE_ENABLE_BOOKMARKS` | Shows/hides bookmark functionality | `true` |
| `VITE_ENABLE_TAFSEER` | Shows/hides Tafseer (commentary) section | `true` |
| `VITE_ENABLE_ISLAMIC_LIBRARY` | Shows/hides Islamic books library | `true` |
| `VITE_ENABLE_PRAYER_TIMES` | Shows/hides prayer times feature | `true` |
| `VITE_ENABLE_HISNUL_MUSLIM` | Shows/hides Hisnul Muslim (supplications) | `true` |
| `VITE_ENABLE_DEBUG_MODE` | Shows debug information and feature flag panel | `false` |
| `VITE_ENABLE_BETA_FEATURES` | Shows/hides experimental features | `false` |

## Usage in Code

### Using the Hook

```typescript
import { useFeatureFlags } from '../hooks/useFeatureFlags';

function MyComponent() {
  const { mushafView, isEnabled } = useFeatureFlags();
  
  // Check individual flags
  if (mushafView) {
    // Mushaf view is enabled
  }
  
  // Or use the isEnabled helper
  if (isEnabled.tafseer()) {
    // Tafseer is enabled
  }
}
```

### Using the FeatureGate Component

```typescript
import { FeatureGate } from '../components/FeatureGate';

function MyComponent() {
  return (
    <div>
      <FeatureGate feature="enableMushafView">
        <MushafViewComponent />
      </FeatureGate>
      
      <FeatureGate 
        feature="enableTafseer"
        fallback={<div>Tafseer is disabled</div>}
      >
        <TafseerComponent />
      </FeatureGate>
    </div>
  );
}
```

### Direct Import

```typescript
import { featureFlags, enableMushafView } from '../config/featureFlags';

// Use the flags directly
if (enableMushafView) {
  // Mushaf view is enabled
}

// Or access all flags
console.log(featureFlags);
```

## Development Tools

### Debug Panel

When `VITE_ENABLE_DEBUG_MODE=true`, a debug panel appears in the bottom-right corner showing all feature flag states.

### Console Logging

In development mode with debug enabled, feature flags are logged to the console on app startup.

## Examples

### Disabling Mushaf View

To disable the Mushaf view feature:

1. Edit `.env.local`:
   ```bash
   VITE_ENABLE_MUSHAF_VIEW=false
   ```

2. Restart the dev server

3. The Mushaf tab will be hidden from the Quran page
4. The `/mushaf` route will return 404
5. The Mushaf button will be hidden from Surah detail pages

### Enabling Debug Mode

To see all feature flags and debug information:

1. Edit `.env.local`:
   ```bash
   VITE_ENABLE_DEBUG_MODE=true
   ```

2. Restart the dev server

3. A "🚩 Feature Flags" button will appear in the bottom-right corner

## Production Deployment

### Vercel

Set environment variables in the Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add variables like `VITE_ENABLE_MUSHAF_VIEW` with value `true` or `false`

### Docker

Pass environment variables when running the container:

```bash
docker run -e VITE_ENABLE_MUSHAF_VIEW=false al-furqan
```

### Build Time

Environment variables are embedded at build time, so you need to rebuild when changing them in production.

## Best Practices

1. **Default to Enabled**: Most features should default to `true` for better user experience
2. **Document Changes**: Update this file when adding new feature flags
3. **Clean Up**: Remove unused feature flags and their code regularly
4. **Test Both States**: Always test features in both enabled and disabled states
5. **Gradual Rollout**: Use feature flags for gradual rollout of new features

## Troubleshooting

### Changes Not Taking Effect

- Restart the development server after changing `.env.local`
- Clear browser cache if needed
- Check that variable names start with `VITE_`

### Feature Still Showing When Disabled

- Check that the component uses `FeatureGate` or proper flag checking
- Verify the environment variable name matches exactly
- Check browser console for any JavaScript errors

### Debug Panel Not Showing

- Ensure `VITE_ENABLE_DEBUG_MODE=true` in `.env.local`
- Restart the development server
- Check that you're in development mode (`npm run dev`)