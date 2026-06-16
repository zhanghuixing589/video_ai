# Local Backend Port Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the Docker backend on port 8080 and the IDEA development backend on port 8081 at the same time.

**Architecture:** Use Spring's profile-specific configuration to override only the local development port. Keep the frontend API base path relative and update only Vite's development proxy target.

**Tech Stack:** Spring Boot YAML configuration, Vite, Docker Compose, PowerShell verification

---

### Task 1: Split the development ports

**Files:**
- Modify: `src/main/resources/application-dev.yml`
- Modify: `frontend/vite.config.ts`

- [x] **Step 1: Verify the current configuration does not meet the port split**

Run a configuration assertion requiring development port 8081, Vite target 8081, and Docker mapping 8080.

Expected: FAIL for the development YAML and Vite target.

- [x] **Step 2: Change the development backend port**

Set `server.port` in `application-dev.yml` to `8081`.

- [x] **Step 3: Change the frontend development proxy**

Set the `/api` proxy target in `vite.config.ts` to `http://localhost:8081`.

- [x] **Step 4: Verify static configuration**

Run the same configuration assertion.

Expected: `PORT_SPLIT_CONFIG_OK`.

### Task 2: Verify both backend instances

**Files:**
- Modify: `问题与解决.md`

- [x] **Step 1: Start the Docker backend**

Run: `docker compose up -d backend`

Expected: Docker publishes host port 8080.

- [x] **Step 2: Start the development backend with the same `dev` profile used by IDEA**

Run the existing `VideoAiApplication` configuration.

Expected: Spring Boot starts on port 8081 with context path `/api`.

- [x] **Step 3: Verify public endpoints**

Run requests against:

```text
http://localhost:8080/api/contents/public
http://localhost:8081/api/contents/public
```

Expected: Both return HTTP 200.

- [x] **Step 4: Verify frontend proxy**

Start Vite and request:

```text
http://localhost:3000/api/contents/public
```

Expected: HTTP 200 from the IDEA backend.

- [x] **Step 5: Record the verified solution**

Update the existing port-conflict entry in `问题与解决.md` with the 8080/8081 development topology and verification evidence.
