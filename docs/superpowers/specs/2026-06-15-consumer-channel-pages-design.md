# Consumer Channel Pages Design

## Goal

Turn the consumer header into four clear destinations:

- `/` for the mixed home page
- `/tv` for television series
- `/movies` for movies
- `/variety` for variety shows

The home page keeps its television, movie, and variety content floors. Each
channel page shows only content belonging to that channel and provides a
genre filter based on the existing `genreLabels`.

## Routing And Navigation

`App.tsx` maps the four routes to the existing `ConsumerHome` screen with an
explicit channel prop:

```ts
type ConsumerChannel = 'HOME' | VideoType;
```

The header always renders `首页`, `电视剧`, `电影`, and `综艺`. Each item is a
real route destination rather than component-only tab state:

| Label | Route | Channel |
| --- | --- | --- |
| 首页 | `/` | `HOME` |
| 电视剧 | `/tv` | `TV_SERIES` |
| 电影 | `/movies` | `MOVIE` |
| 综艺 | `/variety` | `VARIETY` |

The active item is derived from the route prop. Clicking the brand returns to
`/`. Playback-page header navigation uses the same routes. The old
`/?type=...` navigation is removed; legacy query parameters on `/` do not
change the selected channel.

## Shared Consumer Model

Create a pure `consumerChannelModel.ts` module that owns:

- channel route metadata and labels
- mapping a `VideoType` to its channel route
- grouping home-page content into the three type floors
- filtering channel content by `VideoType`
- deriving available genres from content in the active channel
- validating a requested `genre` query value
- filtering channel content by the validated genre

Genres follow the order already defined by `genreLabels`, not the order returned
by the API. The filter only exposes genres that exist in the active channel's
published content, preceded by `全部`.

## Home Page

The home page keeps the current visual structure:

- shared cyber-flow background
- global header and account actions
- mixed featured-content carousel
- `电视剧专区`
- `电影专区`
- `综艺专区`

Home does not show the genre filter. Empty type floors are omitted. If no
published content exists at all, the current global empty state remains.

## Channel Pages

Each channel page reuses the existing header, carousel, video cards, account
actions, background, spacing, and responsive grid.

The channel page renders:

1. a featured carousel sourced only from the active channel
2. a compact channel heading
3. a horizontally scrollable genre selector
4. one card grid containing the filtered channel content

The channel heading uses the existing floor title treatment and reads
`电视剧频道`, `电影频道`, or `综艺频道`.

The genre selector is rendered from semantic buttons:

- `全部` removes the `genre` query parameter
- a genre choice writes the genre key, for example `/tv?genre=ANIMATION`
- the selected option exposes `aria-pressed="true"`
- all controls keep visible focus styles and at least 44px touch height on
  mobile

Selecting a genre updates the URL without reloading the page. Direct refreshes
and shared links reconstruct the same filter state from the query parameter.

## Genre Validation And Empty States

Only genre keys declared by the existing `VideoGenre`/`genreLabels` contract
are accepted. An unknown value such as `?genre=UNKNOWN` behaves as `全部` and
the URL is normalized by removing the invalid parameter.

When the active channel contains published content but the selected valid genre
has no matching cards, the page keeps the channel heading and genre selector
visible and shows a focused empty state:

```text
该分类暂时没有已发布作品
```

The empty state includes a `查看全部` action that clears the genre filter.

## Data Loading

The existing public published-content request remains the only backend call.
Filtering is performed in the frontend because the current API already returns
the complete published catalog and no channel/genre endpoint is required for
this scope.

Authentication loading and account actions remain unchanged. Loading or API
errors do not invent new routes or backend contracts.

## Responsive Behavior

- Desktop keeps the current full header and card grid.
- Narrow screens allow the four channel links to scroll horizontally instead
  of wrapping into multiple uneven rows.
- Genre buttons use a separate horizontal scroll row with hidden visual
  overflow and preserved keyboard access.
- The carousel and grid retain their existing mobile breakpoints.

## Testing

Unit tests cover:

- route metadata for all four channels
- grouping mixed content into home floors
- restricting each channel to its matching `VideoType`
- deriving available genres in label order
- accepting a valid requested genre
- rejecting an unknown genre
- filtering cards by the selected genre
- mapping playback-page channel links to `/tv`, `/movies`, and `/variety`

Verification includes:

- complete frontend tests
- TypeScript production build
- ESLint
- direct refresh of all four routes
- active header state on every route
- genre selection and URL updates
- invalid genre normalization
- valid empty genre state and `查看全部`
- desktop and 390px mobile browser inspection

## Scope Exclusions

This change does not add server-side filtering, pagination, sorting, search,
genre-specific recommendation algorithms, new artwork, or separate channel
page templates.
