# Content Engagement Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace playback-page demo ratings, comments, and recommendations with persisted backend comments, ratings, and content recommendations.

**Architecture:** Attach engagement data to the current `Content` playback model, not the legacy `Video` model. The backend exposes focused `/contents/{contentId}/comments`, `/contents/{contentId}/rating`, and `/contents/{contentId}/recommendations` APIs; the frontend fetches these APIs and renders empty/loading/auth states without generating fake user data.

**Tech Stack:** Spring Boot 3, Spring Data JPA, Spring Security, PostgreSQL/Hibernate `ddl-auto=update`, React, TypeScript, Ant Design, Vitest.

---

### Task 1: Backend Engagement Tests

**Files:**
- Create: `src/test/java/org/example/video_ai/service/ContentEngagementServiceTest.java`
- Create: `src/test/java/org/example/video_ai/controller/ContentEngagementControllerTest.java`

- [ ] **Step 1: Write failing service tests**

Cover listing comments newest first, rejecting blank comments, creating comments for the authenticated user, creating/updating a user rating, aggregating average score/count, and recommending published content with same type/genre while excluding the current content.

- [ ] **Step 2: Run backend engagement tests to verify red**

Run: `.\mvnw -Dtest=ContentEngagementServiceTest,ContentEngagementControllerTest test`
Expected: compilation/test failure because engagement classes and APIs do not exist.

### Task 2: Backend Engagement Implementation

**Files:**
- Create: `src/main/java/org/example/video_ai/dto/ContentEngagementDTO.java`
- Create/modify: `src/main/java/org/example/video_ai/entity/Comment.java`
- Create: `src/main/java/org/example/video_ai/entity/ContentRating.java`
- Create/modify: `src/main/java/org/example/video_ai/repository/CommentRepository.java`
- Create: `src/main/java/org/example/video_ai/repository/ContentRatingRepository.java`
- Modify: `src/main/java/org/example/video_ai/repository/ContentRepository.java`
- Create/modify: `src/main/java/org/example/video_ai/service/CommentService.java`
- Create/modify: `src/main/java/org/example/video_ai/controller/CommentController.java`

- [ ] **Step 1: Implement minimal persistence model**

Create `content_comments` and `content_ratings` entities with `contentId`, `userId`, display fields needed for rendering, validation-friendly body/score fields, and timestamps.

- [ ] **Step 2: Implement service behavior**

Require published content for public engagement reads, require authenticated users for writes, trim comments, allow one rating per user/content, compute rounded average and count from stored ratings, and query recommendations from published content with deterministic fallback ordering.

- [ ] **Step 3: Run backend tests to verify green**

Run: `.\mvnw -Dtest=ContentEngagementServiceTest,ContentEngagementControllerTest test`
Expected: all selected tests pass.

### Task 3: Frontend API And Model Tests

**Files:**
- Modify: `frontend/src/type/api.ts`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/pages/videoPlayModel.ts`
- Modify: `frontend/src/pages/videoPlayModel.test.ts`

- [ ] **Step 1: Write failing frontend model test**

Assert `videoPlayModel` no longer exports or builds deterministic demo comments/ratings, and keeps only playback resolution/path helpers plus real-data formatting helpers.

- [ ] **Step 2: Run frontend tests to verify red**

Run: `npm test -- --run src/pages/videoPlayModel.test.ts`
Expected: failure while the old demo builder is still exported/used.

- [ ] **Step 3: Add API types and clients**

Add `ContentComment`, `ContentRatingSummary`, `ContentRatingRequest`, and `ContentCommentRequest` types, plus `contentEngagementApi` methods for comments, rating summary, submitting rating, and recommendations.

### Task 4: Playback Page Wiring

**Files:**
- Modify: `frontend/src/pages/VideoPlayPage.tsx`
- Modify: `frontend/src/pages/VideoPlayPage.css`

- [ ] **Step 1: Remove demo data dependency**

Delete `buildPlaybackDemo` imports and usage. Fetch engagement APIs when playback resolution is ready.

- [ ] **Step 2: Render real states**

Show rating average/count from backend, empty comment/recommendation states when backend returns none, post-auth prompts for comment/rating writes, and refresh comments/rating after successful submit.

- [ ] **Step 3: Run frontend tests/build**

Run: `npm test -- --run src/pages/videoPlayModel.test.ts`
Run: `npm run build`
Expected: selected tests and production build pass.

### Task 5: Final Verification And Project Notes

**Files:**
- Modify if a meaningful issue/fix is discovered: `问题与解决.md`

- [ ] **Step 1: Run backend verification**

Run: `.\mvnw test`
Expected: backend test suite passes, or any unrelated blocker is recorded with evidence.

- [ ] **Step 2: Run frontend verification**

Run: `npm test -- --run`
Run: `npm run build`
Expected: frontend test suite/build passes, or any unrelated blocker is recorded with evidence.

- [ ] **Step 3: Review diff**

Run: `git diff -- frontend/src/pages/videoPlayModel.ts frontend/src/pages/VideoPlayPage.tsx src/main/java/org/example/video_ai`
Expected: only scoped engagement-loop changes plus necessary wiring.
