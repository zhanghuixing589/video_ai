# Single-Device Login Notice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the single-device-login rejection reason across the hard redirect and display it exactly once on the login page.

**Architecture:** A focused `authNotice` module stores a notice code in `sessionStorage` and consumes it into user-facing text. The Axios interceptor classifies the backend 401 message, clears local authentication, stores the code, and redirects; the login page consumes the notice after mounting.

**Tech Stack:** React 18, TypeScript, Axios, Ant Design, Vitest

---

### Task 1: One-Time Authentication Notice

**Files:**
- Create: `frontend/src/services/authNotice.ts`
- Create: `frontend/src/services/authNotice.test.ts`

- [x] **Step 1: Write failing tests**

Test storing and consuming `SESSION_REPLACED`, one-time consumption, unknown codes, and backend message classification.

- [x] **Step 2: Verify tests fail**

Run: `npm test -- --run src/services/authNotice.test.ts`

Expected: FAIL because `authNotice.ts` does not exist.

- [x] **Step 3: Implement the notice module**

Provide `storeAuthNotice`, `consumeAuthNotice`, and `isSessionReplacedMessage` using the key `auth:notice`.

- [x] **Step 4: Verify tests pass**

Run: `npm test -- --run src/services/authNotice.test.ts`

Expected: all notice tests pass.

### Task 2: Redirect and Login-Page Integration

**Files:**
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/pages/Login.tsx`

- [x] **Step 1: Update the Axios interceptor**

On protected-request 401, clear local authentication. For the session-replaced response, store `SESSION_REPLACED`; then redirect to `/login`. Do not redirect failed `/auth/login` requests.

- [x] **Step 2: Consume the notice on login**

On login-page mount, consume the notice and display it through `App.useApp().message.error`.

- [x] **Step 3: Run frontend verification**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all commands exit successfully.

### Task 3: Project Issue Record

**Files:**
- Modify: `问题与解决.md`

- [x] **Step 1: Record root cause and solution**

Document that hard navigation destroyed the in-memory Ant Design message and that a one-time `sessionStorage` notice now bridges the redirect.

- [x] **Step 2: Verify changed files**

Run `git diff --check` for all files changed by this implementation.
