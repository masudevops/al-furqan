# AF-006A Audio Reliability

**Completed:** June 22, 2026

## Reliability behavior

- Only validated HTTPS audio sources enter the player.
- Invalid or empty playlists are rejected with a user-visible message.
- The player reports `playing` only after the media element confirms playback.
- Rejected `play()` promises and media-element errors produce explicit states.
- Loading, play, pause, ended, metadata, and time updates are event-driven.
- Previous and next controls respect playlist boundaries.
- Seeking is clamped to the known duration.
- Reader audio controls remain disabled until validated audio metadata is available.
- Ayah audio is joined by ayah number rather than array position, preventing misalignment when an invalid provider record is discarded.

## Architecture

- Platform-neutral track validation and seek/index helpers live under `src/core/audio`.
- Browser media lifecycle remains isolated in `AudioContext`.
- Reader components provide canonical track data but do not own an `HTMLAudioElement`.
- Media Session handlers use stable callbacks and are removed during cleanup.

## Accessibility

- The global player is a named region.
- Play, pause, previous, next, and close controls have explicit accessible names.
- Previous and next controls expose their disabled state.
- Progress uses a native range input with an elapsed/total time description.
- Loading and playback errors are conveyed in text.

## Follow-up

AF-006B adds repeat, playback speed, queue controls, sleep timer, and persisted preferences. Download management, background-playback guarantees, and queue restoration remain deferred.
