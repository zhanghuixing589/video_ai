# Consumer Channel Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mixed home route plus dedicated television, movie, and variety routes with URL-backed genre filtering.

**Architecture:** Keep channel metadata, grouping, genre ordering, validation, and filtering in a pure tested model. Reuse `ConsumerHome` for all four routes through an explicit channel prop, and keep navigation route-driven in both the consumer header and playback page.

**Tech Stack:** React 18, TypeScript, React Router 6, Ant Design 5, Vitest, CSS

---

### Task 1: Pure Channel Model

**Files:**
- Create: `frontend/src/pages/consumerChannelModel.test.ts`
- Create: `frontend/src/pages/consumerChannelModel.ts`

- [x] **Step 1: Write failing model tests**

Create fixtures for television, movie, and variety content. Test:

```ts
CHANNELS.map(({channel, path})) === [
  {channel: 'HOME', path: '/'},
  {channel: 'TV_SERIES', path: '/tv'},
  {channel: 'MOVIE', path: '/movies'},
  {channel: 'VARIETY', path: '/variety'},
]
```

Also test home grouping, channel type filtering, genre ordering,
`normalizeGenre`, genre filtering, and `getChannelPath`.

- [x] **Step 2: Verify RED**

Run:

```powershell
npx vitest run src/pages/consumerChannelModel.test.ts --reporter=verbose --pool=threads --poolOptions.threads.singleThread
```

Expected: FAIL because `consumerChannelModel.ts` does not exist.

- [x] **Step 3: Implement the minimal pure model**

Export:

```ts
ConsumerChannel
CHANNELS
GENRE_LABELS
GENRE_ORDER
getChannelPath
groupContentByType
getChannelContent
getAvailableGenres
normalizeGenre
filterContentByGenre
```

Use `VideoType` and `VideoGenre` from `type/api.ts`. Do not import React or
router APIs.

- [x] **Step 4: Verify GREEN**

Run the focused Vitest command again.

Expected: all channel-model tests PASS.

### Task 2: Route-Driven Consumer Pages

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/ConsumerHome.tsx`

- [x] **Step 1: Register the four routes**

Render:

```tsx
<Route path="/" element={<ConsumerHome channel="HOME" />} />
<Route path="/tv" element={<ConsumerHome channel="TV_SERIES" />} />
<Route path="/movies" element={<ConsumerHome channel="MOVIE" />} />
<Route path="/variety" element={<ConsumerHome channel="VARIETY" />} />
```

- [x] **Step 2: Replace local tab state with the channel prop**

Remove the `type` query and `activeTab` state. Build the header navigation from
`CHANNELS`, navigate to each route, and derive the active state from `channel`.

- [x] **Step 3: Preserve the mixed home layout**

For `HOME`, show the mixed carousel and three grouped floors. Do not render a
genre selector.

- [x] **Step 4: Render a single channel page**

For a typed channel, show only matching content in the carousel and grid. Read
`genre` with `useSearchParams`, validate it with the model, normalize invalid
values by deleting the parameter, and update the query when a genre is chosen.

- [x] **Step 5: Add channel empty states**

Keep the channel heading and selector visible. When a valid selected genre has
no cards, render `该分类暂时没有已发布作品` and a `查看全部` button that clears the
query.

### Task 3: Channel And Genre Styling

**Files:**
- Modify: `frontend/src/pages/ConsumerHome.css`

- [x] **Step 1: Style route navigation**

Reuse existing header colors and active underline. Make the four route buttons
horizontally scrollable on narrow screens and expose visible focus states.

- [x] **Step 2: Style the genre selector**

Add a compact horizontal row of semantic buttons. Use the existing accent for
the pressed state, existing surface tokens for idle/hover states, and 44px
mobile touch height.

- [x] **Step 3: Style channel empty results**

Use the existing empty-card surface and a single `查看全部` action without
introducing new colors or visual assets.

### Task 4: Playback Navigation

**Files:**
- Modify: `frontend/src/pages/VideoPlayPage.tsx`

- [x] **Step 1: Use shared channel routes**

Import `CHANNELS` or `getChannelPath`. Add `首页` to the playback header and
route television, movie, and variety buttons to `/tv`, `/movies`, and
`/variety`.

- [x] **Step 2: Preserve playback behavior**

Do not change DPlayer lifecycle, episode navigation, comments, ratings, or
background behavior.

### Task 5: Verification And Documentation

**Files:**
- Modify if a meaningful issue is confirmed: `问题与解决.md`

- [x] **Step 1: Run automated checks**

```powershell
npm test -- --pool=threads --poolOptions.threads.singleThread
npm run build
npm run lint
git diff --check -- frontend/src/App.tsx frontend/src/pages/ConsumerHome.tsx frontend/src/pages/ConsumerHome.css frontend/src/pages/VideoPlayPage.tsx frontend/src/pages/consumerChannelModel.ts frontend/src/pages/consumerChannelModel.test.ts
```

- [x] **Step 2: Verify routes in the in-app Browser**

Check `/`, `/tv`, `/movies`, and `/variety` with direct refresh. Confirm the
active header item, content type restriction, genre URL updates, invalid genre
normalization, and the focused empty state.

- [x] **Step 3: Verify mobile layout**

At 390px width, confirm the channel and genre rows scroll horizontally, page
content has no horizontal overflow, cards remain usable, and controls retain
keyboard focus states.

- [x] **Step 4: Record confirmed issue evidence**

If implementation confirms that component-only tab state caused route and
refresh inconsistency, append an evidence-based entry to `问题与解决.md` with
symptom, impact, confirmed root cause, solution, verification, and follow-up.
