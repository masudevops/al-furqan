# AF-006B Audio Experience

**Completed:** June 22, 2026

## Controls

- Playback speeds: 0.75×, 1×, 1.25×, 1.5×, and 2×
- Repeat modes: off, current ayah, and selected ayah range
- Selectable visible queue
- Sleep timer: 5, 15, 30, or 60 minutes

Speed and repeat mode are persisted locally under `alFurqan.audio.preferences`. The sleep timer is intentionally session-only because browsers and operating systems may suspend background JavaScript.

## Repeat behavior

- Current ayah resets the active media item to the beginning when it ends.
- Ayah range advances within the selected queue indexes and returns to the range start after the range end.
- Range selections are normalized if the end is selected before the start.
- Off preserves normal bounded queue advancement.

## Platform boundary

Preference validation and repeat-range normalization live under `src/core/audio`. The browser adapter remains the `HTMLAudioElement` lifecycle in `AudioContext`. Native clients can reuse the contracts while implementing their own media engine.

## Honest platform limitations

- Web background playback depends on browser and operating-system policy.
- The sleep timer cannot be guaranteed while a browser tab is suspended.
- Audio downloads remain deferred until storage estimates, licensing, versioning, and removal controls are designed.
- Queue restoration after closing the app remains deferred.
