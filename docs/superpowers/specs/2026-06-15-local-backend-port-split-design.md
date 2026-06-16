# Local Backend Port Split Design

## Goal

Keep the Docker backend available on host port 8080 while allowing the IDEA-launched development backend to run at the same time on port 8081.

## Design

- Docker and production configuration remain on port 8080.
- The active `dev` Spring profile overrides the shared server port with 8081.
- The Vite development server keeps serving the frontend on port 3000 and proxies `/api` requests to `http://localhost:8081`.
- Frontend API code continues using the relative `/api` base URL, so no application code or production URL changes are required.

## Verification

- Confirm Docker publishes `8080:8080` and `/api/contents/public` responds on port 8080.
- Confirm the IDEA-launched Spring Boot process listens on port 8081 and `/api/contents/public` responds on port 8081.
- Confirm a request through the Vite server's `/api` proxy reaches the local backend.

The Actuator health endpoint currently returns HTTP 401 because it is protected by the application's security configuration, so it is not used as the anonymous availability check.
