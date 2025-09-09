# PoC: Per‑User Owned Visual Components (Google Docs–style autosave + My Components)

Status: Approved plan – pending implementation via TDD
Owner: You / Agent Mode
Scope: Backend (Express + Prisma + Postgres), Frontend (Vite + React)

1) Summary (What and Why)
- What: Store each visual component document as owned by the authenticated user with Google Docs–style autosave. Provide a “My Components” library to revisit and edit.
- Why: Move beyond anonymous/global storage to production-grade ownership, privacy, and access control. Aligns with real product expectations, devops standards, and your rules.

2) Decisions (Locked)
- Backfill: Do not auto-assign existing anonymous VisualComponents; they remain inaccessible and do not appear in “My Components”.
- Library MVP: “Recent 50” list plus search; pagination can be added later.
- Auth UX: If unauthenticated and user attempts edit/save, redirect to login; on success, return to the editor.
- Naming: “My Components” in navigation and page header.
- Deployment targets: API on AWS (ECS Fargate + RDS Postgres 17.5), Frontend on Cloudflare Pages; secrets via AWS Secrets Manager/SSM; restrictive CORS.

3) Goals and Non‑Goals
- Goals
  - Per-user ownership and access control for visual components.
  - Debounced autosave (existing), in-flight coalescing and retry (existing), with auth.
  - Library page to list owner’s documents; open into VisualEditorPage by id.
  - TDD-first: tests for backend ownership and frontend library + auth flows.
- Non‑Goals (MVP)
  - Public sharing, collaboration, or version history for VisualComponents.
  - Marketplace integration with Component/ComponentVersion models.

4) Data Model and Migration (Prisma, Postgres 17.5)
- VisualComponent changes
  - Add ownerId String (FK → User.id). NOT NULL after backfill window.
  - Add isPublic Boolean default false (reserved for future sharing).
  - Index: (ownerId, updatedAt) to support “Recent” and paging.
- Safe migration plan (no destructive deletes)
  1) Add ownerId String? and isPublic Boolean default false, plus index.
  2) Backfill strategy: leave existing rows with ownerId null (inaccessible via auth‑required endpoints).
  3) Enforce NOT NULL on ownerId for newly created rows; existing null rows remain but are never returned.
  4) Verify application paths rely only on ownerId-scoped queries.

5) API Contract (Express + Prisma)
Base path: /api/v1/visual-components
All endpoints require authentication unless noted. Ownership is required for resource access.

- POST /visual-components
  - Auth: required
  - Body: { name?: string, jsxCode: string, description?: string }
  - Behavior: Create with ownerId=req.user.id; returns full record.
  - Errors: 401 no token; 400 validation; 500 internal.

- GET /visual-components
  - Auth: required
  - Query: search?: string, page?: number, limit?: number (default 50), sort?: updatedAt|createdAt (default updatedAt desc)
  - Behavior: Returns only owner’s components; list excludes jsxCode for performance.
  - Response: { success, data: Array<{ id, name, description, viewCount, createdAt, updatedAt }>, pagination, message, timestamp }

- GET /visual-components/:id
  - Auth: required; owner only
  - Behavior: Returns full record (including jsxCode). Increments viewCount.
  - Errors: 401, 403 if not owner, 404 if not found.

- PUT /visual-components/:id
  - Auth: required; owner only
  - Body: { name?: string, jsxCode?: string, description?: string }
  - Behavior: Updates record and returns updated record.
  - Errors: 401, 403, 404, 400.

- DELETE /visual-components/:id (not exposed in UI for MVP)
  - If implemented, auth + owner only. Hidden in UI to avoid destructive behaviors.

Response shape consistency: Maintain { success, data, message, timestamp } as in current API.

6) Frontend Behavior (Vite + React)
- VisualEditorPage
  - Keep autosave logic (debounce, coalescing, retry). Now calls auth‑required endpoints.
  - On first divergence from default: create() with auth; then updates by id.
  - Error handling: If 401/403 on create/update/getById, raise auth requirement; redirect to login and preserve return path.
- My Components (Library) page
  - Use visualComponentsApi.list to fetch Recent 50 of current user.
  - Display: name, updatedAt, viewCount; Open navigates to /visual-editor?id=<id>.
  - Search input filters by name/description (server-side via query).
  - Optional future: pagination controls.
- Navigation
  - Add “My Components” entry in AppHeader.

7) TDD Plan (Tests before code)
- Backend (Jest + Supertest)
  - Create requires auth; returns ownerId = requester.
  - List requires auth; returns only owner’s docs; excludes jsxCode; respects search and limit.
  - Get by id requires auth; owner can fetch; non-owner blocked (403/404 behavior clarified in middleware); increments viewCount.
  - Update requires auth; owner can update; non-owner blocked.
  - Validation errors return 400; unauthenticated 401.

- Frontend (Vitest + RTL)
  - Library page
    - Renders empty state when list returns [].
    - Renders list items and Open navigates to /visual-editor?id=<id>.
    - Search triggers API call with query.
    - 401 on list prompts auth flow (mock AuthContext to simulate).
  - VisualEditorPage
    - On 401 create/update/getById, triggers auth flow (redirect intent captured).
    - Autosave behaviors remain unchanged (existing tests continue to pass).

8) Operational Runbook (Production)
- Backend (AWS)
  - DB: AWS RDS Postgres 17.5. Automated backups and PITR enabled.
  - Compute: ECS Fargate service. ALB with HTTPS, WAF, security groups.
  - Secrets: AWS Secrets Manager or SSM. Inject DATABASE_URL and JWT_SECRET. Do not echo secrets in logs/CI.
  - CORS: Restrict to Cloudflare Pages domain (and localhost in dev).
  - Observability: CloudWatch logs and metrics; alarms on 5xx and latency.

- Frontend (Cloudflare Pages)
  - Build: pnpm -C frontend build.
  - Deploy: Upload dist; immutable caching for hashed assets; index.html with short TTL/SPAs fallback.
  - Config: VITE_API_BASE_URL provided via Pages env; no secrets in client bundle.

9) Risks and Mitigations
- Legacy anonymous rows: Inaccessible by design; do not appear in the Library. If needed, a one-off migration can assign them to a system user.
- Large payloads (jsxCode): Exclude jsxCode in list endpoint to keep responses small and fast.
- Auth coupling: Ensure axios attaches Authorization header; handle token refresh if implemented.

10) Acceptance Criteria
- A logged-in user can create, autosave, list, open, and update their components; others cannot access them.
- Library shows owner’s recent docs and supports search.
- 401/403 paths trigger auth flow and protect data.
- All new tests pass in CI; no regressions in existing autosave tests.
- Deployment instructions followed with secure env management.

11) Git and Sequencing (approval-gated)
- Commit 1: docs: PoC for per-user owned Visual Components (this document).
- Commit 2: test(backend): visual-components auth + ownership tests.
- Commit 3: test(frontend): Library page + editor auth flow tests.
- Commit 4: feat(backend): ownerId migration + updated routes.
- Commit 5: feat(frontend): Library page + nav + editor auth handling.
- Commit 6: ops: Deployment notes and production configuration docs.

12) Commands Reference (pnpm only)
- Backend dev: pnpm -C backend dev
- Frontend dev: pnpm -C frontend dev
- Backend tests: pnpm -C backend test
- Frontend tests: pnpm -C frontend test
- Frontend build: pnpm -C frontend build

Notes
- Never commit env files or secrets. Use .env.example for local templates and AWS SSM/Secrets Manager for real values.
- Code to be implemented only after tests are authored and pass in TDD flow.

