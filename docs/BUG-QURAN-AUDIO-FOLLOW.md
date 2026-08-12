# Bug fix — Recitation does not visibly follow the active Ayah

**Status:** Implemented; pending deployment verification  
**Priority:** High reader UX  
**Area:** Quran reader / recitation playback

## Problem

During continuous Ayah playback, the reader changed the internal active-Ayah state but did not move the reading viewport. The existing background treatment was also too subtle to reliably communicate which Ayah was playing, especially in sepia and dark themes.

## Acceptance criteria

- The currently playing Ayah has an obvious, theme-safe visual treatment.
- Playback follows the active Ayah when it moves outside the usable viewport.
- Ayahs already fully visible do not trigger unnecessary scrolling.
- Reduced-motion preference disables smooth scrolling.
- A listener can turn automatic following off and restore it without restarting playback.
- The preference persists locally and does not require sign-in.
- Ordinary playback, range repetition, and synchronized chapter playback use the same behavior.

## Implementation

- Bind each rendered Ayah to its authoritative `verseKey` and the existing playback state.
- Follow changes to the active `verseKey`, accounting for the sticky header, mobile navigation, and fixed audio player.
- Persist the `Following` control in `localStorage` as `af-follow-recitation`.
- Keep the current Ayah exposed with `aria-current` and announce changes in the player with `aria-live`.
