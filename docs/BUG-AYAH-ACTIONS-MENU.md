# Bug — Ayah overflow control has no visible actions

## Problem

The three-dot control looked like an overflow menu but was only a direct link to the Ayah detail route. Clicking it therefore appeared to do nothing when the destination closely resembled the current reading context.

## Resolution

- [x] Replace the ambiguous link with an accessible per-Ayah action menu.
- [x] Provide an explicit **Open Ayah** action.
- [x] Provide a **Copy link** action using the canonical Ayah URL.
- [x] Provide a native **Share Ayah** action, with copy-link fallback where the Web Share API is unavailable.
- [x] Close the menu and announce a short **Copied** confirmation after success.
- [x] Preserve keyboard and screen-reader access through native `details`/`summary` semantics.
