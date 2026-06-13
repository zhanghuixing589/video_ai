# Studio Media Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete studio workflow for creating works, uploading cover images and local video files, organizing seasons and episodes, previewing media, and checking publish readiness.

**Architecture:** Add a focused local media storage service behind authenticated multipart endpoints. Store generated public URLs in the existing `Content` and `Episode` records, then rebuild the studio workspace around the selected dark media-management visual target while preserving the current React, Ant Design, Spring Boot, JWT, and PostgreSQL architecture.

**Tech Stack:** Java 17, Spring Boot 3, Spring MVC multipart, JPA, JUnit 5, Mockito, React 18, TypeScript, Ant Design 5, Axios, Vitest, CSS.

---

### Task 1: Media Storage Boundary

**Files:**
- Create: `src/main/java/org/example/video_ai/config/MediaStorageProperties.java`
- Create: `src/main/java/org/example/video_ai/service/MediaStorageService.java`
- Test: `src/test/java/org/example/video_ai/service/MediaStorageServiceTest.java`
- Modify: `src/main/resources/application.yml`

- [ ] Write failing tests that require cover uploads to accept JPEG/PNG/WebP, video uploads to accept MP4/WebM/QuickTime, generated filenames to ignore client paths, and configured size limits to be enforced.
- [ ] Run `.\mvnw.cmd -Dtest=MediaStorageServiceTest test` and verify the new tests fail because the service does not exist.
- [ ] Implement `MediaStorageProperties` with separate cover/video directories, public paths, and size limits.
- [ ] Implement `MediaStorageService.storeCover` and `storeVideo` with MIME allowlists, signature checks, generated UUID filenames, normalized target paths, and streaming file copies.
- [ ] Run `.\mvnw.cmd -Dtest=MediaStorageServiceTest test` and verify it passes.

### Task 2: Authenticated Upload API

**Files:**
- Create: `src/main/java/org/example/video_ai/controller/MediaController.java`
- Test: `src/test/java/org/example/video_ai/controller/MediaControllerTest.java`
- Modify: `src/main/java/org/example/video_ai/config/WebMvcConfig.java`
- Modify: `src/main/java/org/example/video_ai/config/SecurityConfig.java`

- [ ] Write failing MockMvc tests for `POST /media/covers` and `POST /media/videos`, including authenticated studio access and returned URL metadata.
- [ ] Run `.\mvnw.cmd -Dtest=MediaControllerTest test` and verify failure before implementation.
- [ ] Add studio-only multipart endpoints that return `{url, fileName, size, contentType}` inside the existing `ApiResponse`.
- [ ] Register static resource handlers for stored covers and videos and allow public GET access to those media paths so published playback works.
- [ ] Run `.\mvnw.cmd -Dtest=MediaControllerTest test` and verify it passes.

### Task 3: Content Metadata and Uploaded Episode Contract

**Files:**
- Modify: `src/main/java/org/example/video_ai/dto/ContentDTO.java`
- Modify: `src/main/java/org/example/video_ai/service/ContentService.java`
- Modify: `src/test/java/org/example/video_ai/service/ContentServiceTest.java`

- [ ] Add failing tests that an episode created from an uploaded video preserves its generated media URL and original filename, and that content cover URLs can be updated through the studio workflow.
- [ ] Run `.\mvnw.cmd -Dtest=ContentServiceTest test` and verify the new expectations fail.
- [ ] Extend episode request/info with optional original filename and keep URL validation at the service boundary.
- [ ] Add a content update request for title, description, genre, and uploaded cover URL so drafts can be completed after initial creation.
- [ ] Run `.\mvnw.cmd -Dtest=ContentServiceTest test` and verify it passes.

### Task 4: Typed Frontend Upload Client

**Files:**
- Modify: `frontend/src/type/api.ts`
- Modify: `frontend/src/services/api.ts`
- Create: `frontend/src/pages/studioWorkspaceModel.ts`
- Create: `frontend/src/pages/studioWorkspaceModel.test.ts`

- [ ] Write failing Vitest tests for flattening movie/season episodes, calculating publish-readiness checks, and formatting file sizes/durations.
- [ ] Run `npm test -- studioWorkspaceModel.test.ts` in `frontend` and verify failure.
- [ ] Add typed upload responses and Axios multipart methods with `onUploadProgress`.
- [ ] Implement pure workspace helpers for episode rows, readiness state, file-size formatting, and duration formatting.
- [ ] Run the focused Vitest test and verify it passes.

### Task 5: Hybrid Studio Workspace UI

**Files:**
- Modify: `frontend/src/pages/StudioWorkspace.tsx`
- Create: `frontend/src/pages/StudioWorkspace.css`
- Modify: `frontend/src/pages/Dashboard.css`

- [ ] Replace the old form-first tabs with the selected hybrid layout: compact navigation, works list, project header, tabs, media preview, publish checklist, season selector, episode table, and editor drawer.
- [ ] Add real cover and video file selection, client validation, upload progress, retry/cancel state, preview, and URL persistence when creating an episode.
- [ ] Keep movies on a single main-video row and require seasons for series/variety content.
- [ ] Add responsive behavior for tablet/mobile without hiding upload actions or publish status.
- [ ] Run `npm run build` in `frontend` and fix all TypeScript/CSS integration errors.

### Task 6: End-to-End Verification

**Files:**
- Create: `design-qa.md`
- Preserve: `docs/product-design/studio-workspace-target.png`

- [ ] Run `.\mvnw.cmd test` and confirm all backend tests pass.
- [ ] Run `npm test`, `npm run lint`, and `npm run build` in `frontend`.
- [ ] Start backend and frontend, open `/studio` with the available development account, and verify the create/upload/preview workflow.
- [ ] Capture the implementation at the same desktop viewport as the visual target, compare hierarchy, spacing, typography, controls, and responsive behavior, then record findings in `design-qa.md`.
- [ ] Fix all P0/P1/P2 visual or interaction issues and repeat until `design-qa.md` says `final result: passed`.
