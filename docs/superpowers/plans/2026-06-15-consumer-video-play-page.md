# Consumer Video Play Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make consumer work cards and episode controls open a responsive Tencent-inspired playback page powered by DPlayer.

**Architecture:** Keep episode ordering, route resolution, and deterministic demo content in a pure model module. Wrap DPlayer in a lifecycle-safe React component that preserves guest preview limits. Build the playback page from the existing public content endpoint and reuse the current design tokens.

**Tech Stack:** React 18, TypeScript, React Router 6, Ant Design 5, DPlayer 1.27, Vitest, CSS

---

### Task 1: Playback Model

**Files:**
- Create: `frontend/src/pages/videoPlayModel.ts`
- Create: `frontend/src/pages/videoPlayModel.test.ts`

- [ ] **Step 1: Write failing tests**

Cover stable direct/season episode ordering, first-episode selection, playback
route construction, strict work/episode resolution, and deterministic demo data.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/pages/videoPlayModel.test.ts`

Expected: FAIL because `videoPlayModel.ts` does not exist.

- [ ] **Step 3: Implement the pure model**

Export `flattenPlaybackEpisodes`, `getFirstPlayableEpisode`,
`buildPlaybackPath`, `resolvePlayback`, and `buildPlaybackDemo`.

- [ ] **Step 4: Verify the model tests pass**

Run: `npm test -- src/pages/videoPlayModel.test.ts`

Expected: all model tests PASS.

### Task 2: DPlayer React Wrapper

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/src/components/DPlayerPlayer.tsx`
- Create: `frontend/src/components/DPlayerPlayer.css`

- [ ] **Step 1: Install DPlayer dependencies**

Run: `npm install dplayer@1.27.1 && npm install -D @types/dplayer@1.25.6`

- [ ] **Step 2: Implement lifecycle ownership**

Create DPlayer in an effect keyed by episode URL, attach the `timeupdate`
preview guard, and destroy the instance in cleanup.

- [ ] **Step 3: Preserve guest preview UX**

Show the preview duration hint and an Ant Design login/register modal when the
guest reaches `previewSeconds`.

- [ ] **Step 4: Type-check the wrapper**

Run: `npm run build`

Expected: no DPlayer or React lifecycle type errors.

### Task 3: Home Navigation And Playback Page

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/ConsumerHome.tsx`
- Modify: `frontend/src/pages/ConsumerHome.css`
- Modify: `frontend/src/pages/VideoPlayPage.tsx`
- Modify: `frontend/src/pages/VideoPlayPage.css`

- [ ] **Step 1: Update route and card interactions**

Use `/play/:contentId/:episodeId`. Make the work card a keyboard-accessible
native button surface. Stop propagation from episode controls.

- [ ] **Step 2: Add content-floor navigation**

Expose only `电视剧`, `电影`, and `综艺`; link each item to the matching home
floor with stable section IDs.

- [ ] **Step 3: Rebuild the playback page**

Load published works, strictly resolve route identifiers, render DPlayer,
rating summary, demo comments, update/membership panel, complete episode grid,
and real related-work links.

- [ ] **Step 4: Add responsive and accessible styling**

Use existing tokens, visible focus states, native controls, 44px mobile targets,
and single-column tablet/mobile layouts.

- [ ] **Step 5: Verify all frontend checks**

Run:

```powershell
npm test
npm run build
npm run lint
```

Expected: all commands exit successfully.

### Task 4: Visual Verification And Issue Log

**Files:**
- Modify when a meaningful issue/fix is confirmed: `问题与解决.md`

- [ ] **Step 1: Start the existing local app**

Use the configured Vite and backend development setup without changing ports.

- [ ] **Step 2: Verify visible behavior**

Check desktop and mobile layouts, work-card navigation, episode navigation,
direct refresh, invalid routes, DPlayer controls, and guest preview behavior.

- [ ] **Step 3: Record confirmed issue evidence**

If implementation confirms the pre-existing missing-detail-endpoint failure,
append an entry using the project's date, symptom, impact, root cause, solution,
verification, and follow-up structure.

- [ ] **Step 4: Run final diff and verification checks**

Run `git diff --check` and repeat the full frontend test/build/lint commands.

### Task 5: Player Display Modes And Cyber Flow Background

**Files:**
- Create: `frontend/src/components/videoDisplayMode.ts`
- Create: `frontend/src/components/videoDisplayMode.test.ts`
- Modify: `frontend/src/components/DPlayerPlayer.tsx`
- Modify: `frontend/src/components/DPlayerPlayer.css`
- Modify: `frontend/src/pages/VideoPlayPage.tsx`
- Modify: `frontend/src/pages/VideoPlayPage.css`
- Modify when the issue/fix is confirmed: `问题与解决.md`

- [x] **Step 1: Write failing display-mode model tests**

Create tests that require `normalizeVideoDisplayMode` to default invalid values
to `contain` and `getVideoDisplayStyle` to map:

```ts
contain -> {objectFit: 'contain', objectPosition: 'center'}
fill -> {objectFit: 'fill', objectPosition: 'center'}
cover -> {objectFit: 'cover', objectPosition: 'center'}
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/components/videoDisplayMode.test.ts`

Expected: FAIL because `videoDisplayMode.ts` does not exist.

- [x] **Step 3: Implement the minimal display-mode model**

Export `VideoDisplayMode`, `VIDEO_DISPLAY_OPTIONS`,
`normalizeVideoDisplayMode`, and `getVideoDisplayStyle`. Keep the module free of
React and browser dependencies.

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/components/videoDisplayMode.test.ts`

Expected: all display-mode tests PASS.

- [x] **Step 5: Add the accessible player display control**

In `DPlayerPlayer`, hold the selected mode in component state outside the
DPlayer lifecycle effect. Apply the selected style to `player.video` after
initialization and whenever the mode changes. Render a `画面` button in the
player's lower-right control area and a radio-style popup with:

```ts
[
  {value: 'contain', label: '等比例缩放', description: '保持完整画面'},
  {value: 'fill', label: '铺满大屏 / 16:9', description: '拉伸填满播放器'},
  {value: 'cover', label: '智能裁剪', description: '居中放大并裁剪边缘'},
]
```

Close the popup after selection and on outside click. Do not recreate DPlayer
when the display mode changes.

- [x] **Step 6: Style the player surface and popup**

Replace pure black with a deep blue-purple radial surface. Keep the popup above
the native controls, use existing accent and border tokens, provide visible
hover/focus/checked states, and maintain 44px touch targets on mobile.

- [x] **Step 7: Reuse the global cyber-flow background**

Add the existing `linear-bg` layer markup once behind `VideoPlayPage`. Make the
page shell transparent and update the header, promotion strip, score panel,
comment stream, episode panels, and discovery cards to semi-transparent dark
surfaces. Apply the same background to loading and error states.

- [x] **Step 8: Run automated verification**

Run:

```powershell
npm test
npm run build
npm run lint
git diff --check
```

Expected: tests and build pass; lint has no new errors; diff check reports no
whitespace errors.

- [x] **Step 9: Verify the rendered interaction**

Open the local playback route in the in-app Browser. Confirm all three choices
change the computed `object-fit`, switching does not replace the video element
or reset `currentTime`, the popup is keyboard operable, and the cyber-flow
background remains visible at desktop and mobile widths.

- [x] **Step 10: Record the confirmed issue**

Append an evidence-based entry to `问题与解决.md` describing the 4:3-in-16:9
pillarbox cause, the three user-selectable modes, cyber-flow background reuse,
verification commands, and any remaining visual verification gap.
