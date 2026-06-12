# Auth, Guest Preview, and Episodic Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a working authentication and registration flow, public guest browsing with a five-minute per-episode preview, studio application state routing, and a content/season/episode backend model.

**Architecture:** Keep the existing Spring Boot controller-service-repository layering and React/Ant Design frontend. Authentication remains stateless JWT; authorization is enforced in Spring Security and services. New content tables are additive, while the legacy `videos` table remains untouched.

**Tech Stack:** Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, PostgreSQL, JUnit 5, Mockito, React 18, TypeScript, Axios, Ant Design, Vite.

---

### Task 1: Restore Build Baseline and Typed API Contract

**Files:**
- Modify: `frontend/tsconfig.app.json`
- Modify: `frontend/tsconfig.node.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/type/api.ts`
- Modify: `frontend/src/services/api.ts`

- [ ] Remove unsupported `erasableSyntaxOnly` and `tsBuildInfoFile` options.
- [ ] Preserve `/api` in the Vite proxy because the backend context path is `/api`.
- [ ] Define typed `ApiResponse`, auth, studio application, content, season, and episode contracts.
- [ ] Make API methods unwrap `response.data.data` consistently and centralize readable error extraction.
- [ ] Run `npm run build`; expected result is either success or only application-code type errors exposed for later tasks.

### Task 2: Secure and Test Authentication

**Files:**
- Create: `src/main/java/org/example/video_ai/exception/ApiException.java`
- Modify: `src/main/java/org/example/video_ai/exception/GlobslExceptionHandler.java`
- Modify: `src/main/java/org/example/video_ai/dto/AuthDTO.java`
- Modify: `src/main/java/org/example/video_ai/repository/UserRepository.java`
- Modify: `src/main/java/org/example/video_ai/service/AuthService.java`
- Modify: `src/main/java/org/example/video_ai/controller/AuthController.java`
- Modify: `src/main/java/org/example/video_ai/config/SecurityConfig.java`
- Modify: `src/main/java/org/example/video_ai/util/JwtAuthenticationFilter.java`
- Create: `src/test/java/org/example/video_ai/service/AuthServiceTest.java`
- Create: `src/test/java/org/example/video_ai/controller/AuthControllerTest.java`

- [ ] Write failing service tests for normalized registration, studio registration, duplicate identity, login by email, bad password, and disabled account.
- [ ] Run focused tests and verify the expected failures.
- [ ] Implement normalized registration restricted to `USER` and `STUDIO`, status-specific errors, and a shared user mapper.
- [ ] Write failing MVC tests for JSON 400/401/403/409 responses and protected `/auth/me`.
- [ ] Implement global exception handling, authenticated principal lookup, JSON security handlers, and role-prefixed authorities.
- [ ] Run all backend tests and verify they pass.

### Task 3: Complete Studio Application Workflow

**Files:**
- Modify: `src/main/java/org/example/video_ai/service/UserService.java`
- Modify: `src/main/java/org/example/video_ai/controller/UserController.java`
- Create: `src/test/java/org/example/video_ai/service/UserServiceTest.java`

- [ ] Write failing tests for first application, rejected resubmission, pending duplicate submission, and non-studio rejection.
- [ ] Run focused tests and verify failure.
- [ ] Resolve the current user from the authenticated username and remove arbitrary user IDs from the public application endpoint.
- [ ] Allow `NONE` and `REJECTED` applications, set `PENDING`, and reject invalid transitions.
- [ ] Restrict user administration to admins and studio review to admins.
- [ ] Run focused and full backend tests.

### Task 4: Add Content, Season, and Episode Domain

**Files:**
- Create: `src/main/java/org/example/video_ai/entity/Content.java`
- Create: `src/main/java/org/example/video_ai/entity/Season.java`
- Create: `src/main/java/org/example/video_ai/entity/Episode.java`
- Create: `src/main/java/org/example/video_ai/repository/ContentRepository.java`
- Create: `src/main/java/org/example/video_ai/repository/SeasonRepository.java`
- Create: `src/main/java/org/example/video_ai/repository/EpisodeRepository.java`
- Create: `src/main/java/org/example/video_ai/dto/ContentDTO.java`
- Create: `src/main/java/org/example/video_ai/service/ContentService.java`
- Create: `src/main/java/org/example/video_ai/controller/ContentController.java`
- Create: `src/test/java/org/example/video_ai/service/ContentServiceTest.java`

- [ ] Write failing tests for approved-studio creation, blocked unapproved studio, movie episode creation, episodic season requirement, duplicate episode numbers, batch creation, and review-state reset.
- [ ] Run focused tests and verify failure.
- [ ] Implement additive JPA entities and repositories with uniqueness constraints.
- [ ] Implement public published-content queries and approved-studio write APIs.
- [ ] Implement season, single episode, and batch episode creation with `previewSeconds=300`.
- [ ] Keep legacy video classes and tables intact.
- [ ] Run focused and full backend tests.

### Task 5: Build Authentication, Public Home, Preview, and Studio Pages

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Login.css`
- Modify: `frontend/src/pages/ConsumerHome.tsx`
- Modify: `frontend/src/pages/ConsumerHome.css`
- Create: `frontend/src/pages/StudioApplication.tsx`
- Create: `frontend/src/pages/StudioApplication.css`
- Create: `frontend/src/components/PreviewPlayer.tsx`
- Create: `frontend/src/components/PreviewPlayer.css`
- Modify: `frontend/src/pages/StudioReviewerDashboard.tsx`

- [ ] Replace the misleading login role selector with login/register tabs and validated role registration.
- [ ] On successful registration, switch to login and show “注册成功，请登录”.
- [ ] Route login responses by role and studio status.
- [ ] Make `/` public, show authentication actions for guests, and retain account controls for users.
- [ ] Render content/season/episode data and stop guest playback at 300 seconds with a login/register modal.
- [ ] Implement studio application and status page for `NONE`, `PENDING`, and `REJECTED`.
- [ ] Protect studio workbench access with server-validated `/auth/me` state.
- [ ] Run `npm run build` and fix all TypeScript errors.

### Task 6: End-to-End Verification

**Files:**
- Modify only files required by failures found during verification.

- [ ] Run `.\mvnw.cmd test`; expect zero failures and errors.
- [ ] Run `npm run build`; expect exit code 0.
- [ ] Start backend and frontend against the local PostgreSQL database.
- [ ] Verify anonymous home access, registration-to-login transition, ordinary-user login, studio application routing, and the five-minute preview behavior in the in-app browser.
- [ ] Review the final diff for secrets, unrelated changes, and accidental legacy table deletion.
