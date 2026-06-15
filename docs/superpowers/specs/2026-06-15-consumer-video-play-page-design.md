# Consumer Video Play Page Design

## Goal

Extend the consumer experience so a user can click a work card or an episode
button on `ConsumerHome` and enter a Tencent Video-inspired playback page.

## Confirmed Interaction

- Clicking a work card opens its first playable episode.
- Clicking an episode button opens that specific episode.
- Episode button clicks stop propagation so they do not also trigger the card.
- The playback URL is `/play/:contentId/:episodeId`.
- A direct refresh reconstructs the page from published content data instead of
  depending on router state.
- A work with no playable episodes remains visible but does not navigate.

## Data Boundary

The first version uses real backend data for:

- work title, description, cover, type, genre, and status
- current episode and video URL
- complete episode list and episode switching
- DPlayer playback controls
- guest preview and authenticated playback behavior

The first version uses clearly isolated frontend demo data for:

- aggregate rating and rating choices
- comment count and comment stream
- update or membership promotion copy
- behind-the-scenes items and related recommendations

Demo content is deterministic and keyed by the current work so it does not
change unexpectedly between renders. It does not call or imply a backend write.

## Architecture

### Playback Model

Create a focused `videoPlayModel.ts` module that:

- flattens direct and season episodes into a stable playback order
- resolves the requested episode from `contentId` and `episodeId`
- returns the first playable episode for card navigation
- builds deterministic demo rating, comment, and recommendation data

The model is pure and covered with Vitest tests. Components consume the model
instead of duplicating episode ordering and fallback logic.

### Data Loading

`VideoPlayPage` calls the existing public content-list endpoint and locates the
requested work by `contentId`. It then resolves `episodeId` within that work.
This avoids inventing the currently missing episode-detail and content-detail
frontend APIs.

When either identifier is invalid, the page displays an inline error state with
a return-home action. Authentication loading remains independent so public
content still renders if the visitor is logged out.

### DPlayer Integration

Install `dplayer` and its community TypeScript declarations. Create a focused
React wrapper that owns the DPlayer instance and:

- initializes one player for the current episode URL and cover
- enables native DPlayer playback controls, hotkeys, speed selection, and
  fullscreen behavior
- listens to playback time so logged-out visitors still stop at
  `previewSeconds`
- opens the existing login or registration prompt when the preview ends
- destroys the instance before an episode change or component unmount

The wrapper also adds a dedicated `画面` control beside the player's lower-right
settings area. It must not patch DPlayer's private menu DOM. Opening the control
shows three mutually exclusive display modes:

- `等比例缩放` is the default and uses `object-fit: contain`; the complete source
  frame remains visible and narrower sources keep pillarbox bars.
- `铺满大屏 / 16:9` uses `object-fit: fill`; the source is stretched to the
  player's 16:9 viewport without cropping or bars.
- `智能裁剪` uses centered `object-fit: cover`; the viewport is filled while
  overflow at the top and bottom is cropped for a 4:3 source.

Changing modes updates the existing video element immediately. It must preserve
playback time, paused or playing state, volume, and fullscreen state. The
selected mode remains active while switching episodes in the current page
session; a full page reload returns to `等比例缩放`.

Danmaku is not connected in this iteration because the project has no danmaku
read or write API. The wrapper keeps that integration boundary local so a real
service can be added later without restructuring `VideoPlayPage`.

### Home Navigation

`ConsumerHome` changes its play handler to receive both a work and an episode.
The card surface uses the work's first episode. Episode buttons call the same
handler with their own episode after stopping propagation.

## Page Structure

### Global Header

Use the existing dark Linear-inspired product shell and brand styling. Add a
compact Tencent-inspired content navigation row:

- 电视剧
- 电影
- 综艺
- existing login, profile, role center, and logout actions

The three content navigation items scroll or route back to the matching
`ConsumerHome` content floor. Home and account actions retain their current
behavior.

### Promotion Strip

Place a slim full-width strip below the header with a creator promotion message
and a client download entry. These controls are presentation-only in this
version and must not navigate to invented routes.

### Playback Hero

Use a desktop two-column layout:

- left: responsive 16:9 DPlayer wrapper
- right: work title, genre/type metadata, description, aggregate demo rating,
  rating choices, and current episode label

The player remains the dominant visual element. The right panel uses existing
surface, border, accent, typography, and spacing tokens.

The player viewport uses a deep translucent cyber surface instead of flat pure
black. In default contain mode, uncovered side areas use a restrained
blue-purple radial glow so they read as part of the product shell while
remaining dark enough for comfortable viewing.

### Cyber Flow Background

Reuse the existing global `linear-bg` layers already used by `ConsumerHome`,
including the dark gradient, subtle grid, noise, and blue-purple ambient blobs.
The background remains fixed behind the complete playback page. Header, promo
strip, score panel, comments, episode panels, and recommendation cards use
semi-transparent dark surfaces and existing border tokens so the ambient light
is visible without reducing text contrast.

No new background asset, color system, or large blurred animation is introduced.
Loading and error states use the same background treatment for visual
continuity.

### Comments

Below the hero, render a multi-row demo comment stream with:

- avatar-like initials using Ant Design `Avatar`
- display name and relative time
- comment body
- lightweight like and reply counts

The comment controls are non-writing visual controls. They do not mutate
backend state.

### Episode And Update Section

Render:

- current update summary
- a restrained membership activity card
- the complete ordered episode grid

The selected episode is accented and marked as playing. Clicking a different
episode updates the route and playback content. Long lists scroll within a
bounded panel on desktop and expand naturally on mobile.

### Discovery Section

Render three compact groups:

- behind-the-scenes demo items
- related works sourced from other published content when available
- a restrained promotion card and utility links

Real related work cards navigate to their first playable episode. If there are
not enough published works, the section uses deterministic demo labels without
invented external links.

## Responsive Behavior

- Above 1100px: player and score panel share a two-column hero.
- Between 768px and 1099px: score panel moves below the player; episode buttons
  remain a dense grid.
- Below 768px: header controls wrap, all sections become single-column, comments
  use compact spacing, and episode buttons remain at least 44px high.

## Accessibility

- Work cards are keyboard-activatable with `Enter` and `Space`.
- Clickable cards use a semantic button-like role and an accessible label.
- Episode buttons expose the episode number and title.
- The active episode uses `aria-current`.
- Focus styles remain visible against the dark theme.
- Disabled works announce that no playable episodes are available.
- The `画面` button exposes its expanded state and has a descriptive accessible
  label.
- Display choices are keyboard-selectable and expose the current choice with
  checked menu-item semantics.

## Error And Empty States

- Missing or nonnumeric route identifiers show an invalid-link state.
- A missing published work shows a work-not-found state.
- A missing episode falls back to an explicit episode-not-found state rather
  than silently playing another episode.
- A work without episodes shows a no-playable-content state.
- Public content request failures show the API error message and a return-home
  action.

## Testing

Unit tests cover:

- stable flattening and ordering of direct and season episodes
- selecting the first playable episode
- resolving a valid requested episode
- rejecting an episode that belongs to another work
- deterministic demo data generation
- playback route construction
- mapping each display mode to the intended video fit behavior
- defaulting unknown or absent display mode values to `等比例缩放`

Verification includes:

- frontend unit tests
- TypeScript production build
- ESLint
- local visual inspection at desktop and mobile widths
- card, episode, direct-refresh, invalid-route, and guest-preview interactions
- switching all three display modes without resetting playback state
- confirming the cyber-flow background and translucent surfaces at desktop and
  mobile widths

## Scope Exclusions

This iteration does not add backend comments, ratings, likes, recommendations,
membership purchases, client downloads, a danmaku service, or multiple
quality-source generation. DPlayer's built-in speed, hotkey, and fullscreen
controls are included.
