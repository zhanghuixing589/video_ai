# User Profile Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a role-aware personal center where authenticated users can view and update profile details, upload a local avatar, change their password, and access the appropriate role-specific placeholder or studio content tab.

**Architecture:** Add authenticated `/users/me/*` endpoints backed by `UserService`, isolate local avatar file handling in `AvatarStorageService`, and expose uploaded files through Spring MVC resource mapping. Complete the existing React `UserProfile` page using the current Axios/sessionStorage patterns and pure helper functions for role tabs, file validation, and cached-user synchronization.

**Tech Stack:** Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, Redis sessions, JUnit 5/Mockito, React 18, TypeScript, Ant Design 5, Axios, Vitest.

---

### Task 1: Profile and password domain behavior

**Files:**
- Modify: `src/main/java/org/example/video_ai/dto/ProfileUpdateRequest.java`
- Modify: `src/main/java/org/example/video_ai/dto/PasswordUpdateRequest.java`
- Modify: `src/main/java/org/example/video_ai/repository/UserRepository.java`
- Modify: `src/main/java/org/example/video_ai/service/SessionService.java`
- Modify: `src/main/java/org/example/video_ai/service/UserService.java`
- Create: `src/test/java/org/example/video_ai/service/UserServiceProfileTest.java`

- [ ] **Step 1: Write failing service tests**

Cover normalized display name/email updates, duplicate email rejection, incorrect old password, mismatched confirmation, unchanged password rejection, and successful password encoding plus session invalidation.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `.\mvnw.cmd -Dtest=UserServiceProfileTest test`

Expected: compilation or assertion failures because the profile/password methods and repository ownership query are incomplete.

- [ ] **Step 3: Implement the minimal service behavior**

Use `existsByEmailIgnoreCaseAndIdNot(email, userId)`, trim names, lowercase emails, validate password rules, encode the new password, save the user, and remove the user's active Redis session through a user-wide invalidation method.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `.\mvnw.cmd -Dtest=UserServiceProfileTest test`

Expected: all profile service tests pass.

### Task 2: Local avatar storage and static resource delivery

**Files:**
- Create: `src/main/java/org/example/video_ai/config/AvatarStorageProperties.java`
- Create: `src/main/java/org/example/video_ai/config/WebMvcConfig.java`
- Create: `src/main/java/org/example/video_ai/service/AvatarStorageService.java`
- Create: `src/test/java/org/example/video_ai/service/AvatarStorageServiceTest.java`
- Modify: `src/main/resources/application.yml`
- Modify: `.gitignore`

- [ ] **Step 1: Write failing storage tests**

Use `MockMultipartFile` and a temporary directory to cover JPEG/PNG/WebP acceptance, empty/unsupported/oversized rejection, generated filenames, URL generation, and deletion restricted to managed avatar URLs.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `.\mvnw.cmd -Dtest=AvatarStorageServiceTest test`

Expected: compilation failure because `AvatarStorageService` does not exist.

- [ ] **Step 3: Implement storage and resource mapping**

Bind `app.avatar.storage-directory`, `app.avatar.public-path`, and `app.avatar.max-size`. Validate MIME type and file signature, generate UUID filenames, atomically copy files into `uploads/avatars`, expose `/uploads/avatars/**`, and ignore uploaded runtime files in Git.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `.\mvnw.cmd -Dtest=AvatarStorageServiceTest test`

Expected: all avatar storage tests pass.

### Task 3: Authenticated profile HTTP endpoints

**Files:**
- Modify: `src/main/java/org/example/video_ai/controller/UserController.java`
- Modify: `src/main/java/org/example/video_ai/service/UserService.java`
- Modify: `src/main/java/org/example/video_ai/dto/AuthDTO.java`
- Modify: `src/main/java/org/example/video_ai/service/AuthService.java`
- Create: `src/test/java/org/example/video_ai/controller/UserProfileControllerTest.java`

- [ ] **Step 1: Write failing MockMvc tests**

Cover `GET /users/me/profile`, `PATCH /users/me/profile`, `POST /users/me/avatar`, and `PATCH /users/me/password`, including validation and authenticated username forwarding.

- [ ] **Step 2: Run controller tests and verify RED**

Run: `.\mvnw.cmd -Dtest=UserProfileControllerTest test`

Expected: 404 or compilation failures because endpoints are absent.

- [ ] **Step 3: Implement endpoint wiring**

Return `ApiResponse<UserDTO>` for profile and avatar operations, `ApiResponse<Void>` for password updates, call `AvatarStorageService` before updating the stored URL, delete the prior managed avatar after a successful database update, and include `avatarUrl` in login and `/auth/me` payloads.

- [ ] **Step 4: Run controller and service tests**

Run: `.\mvnw.cmd -Dtest=UserProfileControllerTest,UserServiceProfileTest,AvatarStorageServiceTest test`

Expected: all focused backend tests pass.

### Task 4: Frontend profile helpers and API contract

**Files:**
- Modify: `frontend/src/type/api.ts`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/services/authSession.ts`
- Modify: `frontend/src/services/authSession.test.ts`
- Create: `frontend/src/pages/userProfileModel.ts`
- Create: `frontend/src/pages/userProfileModel.test.ts`

- [ ] **Step 1: Write failing Vitest tests**

Cover role tab keys, JPEG/PNG/WebP file acceptance, 5 MB rejection, and writing an updated user into storage.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/pages/userProfileModel.test.ts src/services/authSession.test.ts`

Expected: module/function-not-found failures.

- [ ] **Step 3: Add types, helpers, and API calls**

Add optional `avatarUrl`, profile/password request types, `userApi.profile`, `userApi.updateProfile`, `userApi.uploadAvatar`, and `userApi.updatePassword`. Add a reusable `storeAuthenticatedUser` helper and role-tab/file-validation helpers.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/pages/userProfileModel.test.ts src/services/authSession.test.ts`

Expected: all focused frontend tests pass.

### Task 5: Complete the role-aware personal center UI

**Files:**
- Modify: `frontend/src/pages/UserProfile.tsx`
- Modify: `frontend/src/pages/UserProfile.css`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/ConsumerHome.tsx`
- Modify: `frontend/src/pages/StudioWorkspace.tsx`
- Modify: `frontend/src/pages/StudioReviewerDashboard.tsx`
- Modify: `frontend/src/pages/AdminDashboard.tsx`

- [ ] **Step 1: Implement the page from the approved design**

Load profile data on mount; render avatar/name/role; provide edit-profile and password modals; upload avatar with client-side validation; show studio works from `contentApi.listMine`; show the ordinary-user browsing-history empty state; omit the middle tab for reviewer/admin.

- [ ] **Step 2: Add protected routing and navigation entry points**

Register `/profile` under `PrivateRoute` and add personal-center buttons to authenticated headers without changing existing role navigation.

- [ ] **Step 3: Verify frontend tests**

Run: `npm test`

Expected: all Vitest files pass.

- [ ] **Step 4: Verify frontend type and production builds**

Run: `npm run build`

Expected: TypeScript and Vite build pass without unused imports or type errors.

### Task 6: Full integration verification and review

**Files:**
- Review all files changed by Tasks 1-5.

- [ ] **Step 1: Run the full backend suite**

Run: `.\mvnw.cmd test`

Expected: all Maven tests pass.

- [ ] **Step 2: Run the full frontend suite and build**

Run: `npm test` and `npm run build` from `frontend`.

Expected: all tests and production build pass.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check` and inspect only task-related changes. Confirm no runtime uploads, generated build files, secrets, or unrelated user edits were added.

- [ ] **Step 4: Perform local UI smoke verification when the app is runnable**

Open `/profile`, verify each role's tab set, edit display name/email, upload a valid avatar, reject an invalid file, change password, and confirm the session returns to `/login`.
