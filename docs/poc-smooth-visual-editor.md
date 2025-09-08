# PoC: Smooth Real‑Time Updates in Visual Component Editor

Status: Draft
Owner: You / Agent Mode
Scope: Frontend VisualEditorPage only (no backend changes)

## 1) Problem Statement (What/Why)
Users reported chaotic behavior while editing:
- Characters disappear while typing (e.g., "Hello Worl" Effect).
- Elements flicker or briefly disappear on each keystroke.
- Selection is lost intermittently when the preview re-renders.

Why this happened:
- The preview root was unmounted and remounted on every edit, wiping DOM state and focus.
- The text input was not fully controlled during frequent re-renders, so React reset the value.
- All edits waited for AST/code mutation with no optimistic feedback.

Goals:
- Smooth, real‑time editing: no flicker, no lost characters.
- Stable selection across re-renders.
- Changes should be reflected in source code and persist with Save.
- Tests must lock these behaviors to prevent regressions.

Non‑Goals (for this PoC):
- Rewriting the editor into a patch/overlay architecture.
- Full property coverage and advanced controls.
- Backend refactors.

## 2) Solution Overview (How)
1) Persist the React root in the preview
   - Create the React root once and render into it; avoid unmount/recreate per keystroke.
   - Result: no remount churn, no flicker, caret and selection are preserved.

2) Optimistic UI updates with a local draft
   - Maintain `textDraft` for the Text Content field.
   - On change: update `textDraft` immediately, update the selected DOM node directly for instant feedback, then debounce source code mutation.
   - Debounce window: 150 ms (tunable).

3) Debounced, id‑based AST mutation (source of truth)
   - Use persistent `data-veid` ids to locate the exact JSX node and mutate via Babel AST.
   - After the debounce, compute the next code string and `setCode(next)` only if it actually changed.

4) Stable element mapping with `data-veid`
   - `Veidize` ensures JSX elements carry persistent IDs.
   - Preview instrumentation mirrors `data-veid` into `data-editor-id` for click mapping.
   - `lastSelectedIdRef` reselects elements across renders.

5) Test seam for deterministic UI tests
   - `testMode` prop disables auto‑save/load and preselects a test element, enabling reliable tests without network.

## 3) Implementation Details (Where)
Files changed:
- `frontend/src/pages/VisualEditorPage.tsx`
  - Persist preview root
  - `textDraft` state
  - Optimistic DOM updates + debounced code mutation
  - `testMode` seam and `data-testid` for preview container
- `frontend/vitest.config.ts`
  - jsdom environment + `@` alias resolution for tests
- `frontend/src/test/setup.ts`
  - Fake timers, basic browser API stubs
- `frontend/src/pages/__tests__/visual-editor.smooth-update.test.tsx`
  - 2 tests: no remount churn; no dropped characters

Key behaviors:
- Debounced update: 150 ms via `setTimeout` (candidate for `requestIdleCallback` later)
- Guarding: Only update code if `next !== base` to reduce redundant renders
- Selection persistence: Reselect by `data-editor-id` after render if available

## 4) Testing Strategy (TDD)
Tools: Vitest, Testing Library, jsdom, fake timers.

Tests added:
- "keeps a single React root mounted across code edits" – spies on `createRoot`; ensure it is called once across edits.
- "does not drop characters while typing" – input stays in sync at every keystroke.

Run:
- `pnpm -C frontend test src/pages/__tests__/visual-editor.smooth-update.test.tsx`
- Full suite: `pnpm -C frontend test`

Next test candidates (recommended):
- Color and font size edits follow optimistic path; preview updates immediately; code updates after debounce.
- Reselection after code change lands (selected tag remains highlighted).
- Veidize idempotency and persistence.

## 5) Operational Considerations (Build/Deploy/Run in Production)

Build with Vite:
- `pnpm -C frontend build`
- Outputs hashed assets suitable for CDN caching.

CDN deployment (AWS or Cloudflare):
- AWS S3 + CloudFront:
  - Upload `frontend/dist` to S3.
  - CloudFront distribution with:
    - Cache-Control: `immutable` for hashed JS/CSS, long TTL
    - SPA fallback to `index.html` for 404s (if client routing)
  - Invalidation strategy: on each deploy, invalidate `index.html` or switch versioned index.
- Cloudflare Pages/Workers + R2 (alternative):
  - Serve `dist` via Pages or Worker; ensure immutable caching for hashed assets.

Environment config:
- `VITE_API_BASE_URL` controls API origin.
- Do not commit envs. Use AWS SSM/Secrets Manager or Cloudflare Secrets.
- In CI/CD, export env to the build step (never echo secrets). Example practice:
  - `VITE_API_BASE_URL=$API_BASE_URL pnpm -C frontend build`

Security:
- No runtime secrets in the frontend bundle beyond public API base URLs.
- Ensure CORS and API auth are correctly configured server-side.

Observability:
- Client logs already exist; consider hooking into a telemetry endpoint (batching) or a 3rd-party service.
- Performance: measure time from input to visual update; track frame drops if necessary.

## 6) Future Work / Roadmap
- Generalize optimistic updates for style controls (color, fontSize, padding, etc.).
- E2E tests (Playwright) that simulate real typing and selection.
- Patch/overlay architecture:
  - Maintain a PatchMap keyed by `data-veid` applied in the preview layer.
  - Batch AST writes in the background for heavy edits.
- Build‑time cleanup:
  - Vite/Babel plugin to strip `data-veid` and `data-editor-id` in production bundles.
- Accessibility:
  - Keyboard navigation between elements; focus rings; ARIA descriptions for property panel.

## 7) Risks and Mitigations
- Drift between optimistic DOM and source code (if a transform fails):
  - Mitigation: Only optimistic update properties we can safely mirror; surface errors and revert optimistic state if AST write fails.
- Memory leaks due to listeners:
  - The preview click listener is attached to the preview container and cleaned up; ensure it remains that way.
- Excess renders from frequent updates:
  - Debounce and `next !== base` guard are in place; consider throttling for sliders.

## 8) Interview Talking Points
- Problem: UX jank from remount churn and uncontrolled inputs.
- Approach: Separate interaction latency (optimistic UI) from persistence (debounced, id-based AST writes).
- Stability: Persistent IDs (`data-veid`) provide deterministic mapping between DOM and JSX.
- Quality: Tests enforce UX guarantees (no remount, no dropped keystrokes); fake timers for reliable assertions.
- Production: Build for CDN, immutable caching, and no secret leakage in the bundle; strip editor metadata at build time.

## 9) Acceptance Criteria
- Typing in Text Content never drops characters.
- Preview does not flicker/remount while editing.
- Save persists the latest debounced code and reload is consistent.
- The two UI tests pass in CI.

## 10) Commands Reference
- Install test deps (already done):
  - `pnpm -C frontend add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
- Run specific tests: `pnpm -C frontend test src/pages/__tests__/visual-editor.smooth-update.test.tsx`
- Full tests: `pnpm -C frontend test`
- Build: `pnpm -C frontend build`

## 11) Open Questions
- Debounce interval tuning (150 ms now). Should it adapt based on typing rate?
- Should style changes use throttling instead of debounce (e.g., color sliders)?
- Should `Veidize` run automatically on paste and ensure global uniqueness across shares?

---
This PoC document describes what changed, why it changed, how to validate it, and how to run/build/deploy in production environments using modern DevOps practices. It prioritizes production viability and testable UX guarantees.

