# Studio Workspace Design QA

Reference: `docs/product-design/studio-workspace-target.png`

Viewport: 1440 x 1024

## Comparison

- Navigation and works rail preserve the selected concept's compact media-management structure.
- Project header, status tags, tabs, preview area, publish checks, episode toolbar, and episode table follow the reference hierarchy.
- Empty states retain the same layout footprint as populated states, so uploading media does not cause major page reflow.
- Upload controls, disabled review submission, missing-season validation, progress, cancel, retry, and preview actions are visible and understandable.
- Dark surfaces use solid tone changes and dividers without decorative gradients, glow, or nested card stacks.
- Text and primary controls have sufficient contrast at the tested viewport.

## Issues Resolved

- P2: Default light secondary buttons interrupted the dark editing environment.
  - Fixed with scoped dark button styles in the project header and episode toolbar.
- P2: Basic-information inputs inherited the light Ant Design surface.
  - Fixed with scoped dark input, textarea, and select styles.
- P1: Uploaded files were written successfully but static resource locations omitted a trailing slash, causing public media URLs to return 500.
  - Fixed by normalizing every file resource location as a directory URI.

## Remaining Notes

- P3: The empty works-list illustration comes from Ant Design and is visually less tailored than the selected mockup.
- P3: The implementation uses the browser's native video controls rather than reproducing a custom editing timeline.

final result: passed
