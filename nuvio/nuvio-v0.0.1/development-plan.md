# Development Plan: Nuvio Production Fixes

**Change**: `nuvio-production-fixes`
**Created**: 2026-10-01
**SDD Artifacts**: Engram (`sdd/nuvio-production-fixes/`)

---

## Objective
Make Nuvio production-ready: green typed build, secure auth, validated uploads, CI/CD, error boundaries, zero console noise.

---

## Phase Overview

| Phase | Focus | Status | Dependency |
|-------|-------|--------|------------|
| 1 | Critical Security & Build | ✅ DONE | — |
| 2 | TypeScript & Motion System | ✅ DONE | Phase 1 |
| 3 | Security Hardening | ✅ DONE | Phase 1 |
| 4 | Production Hygiene | ✅ DONE | Phase 1 |
| 5 | CI/CD & Testing | ✅ DONE | Phase 1 |

---

## Phase 1: Critical Security & Build (MUST complete first)

### Objective
Unblock green build, fix RCE, remove auth ambiguity, add error boundaries.

### Tasks

- [x] **TASK-1.1**: Delete root `proxy.ts` (keep only `src/proxy.ts`)
  - **Files**: `proxy.ts` (delete)
  - **Acceptance**: Only `src/proxy.ts` exists; `pnpm build` works

- [x] **TASK-1.2**: Remove `ignoreBuildErrors: true` from `next.config.ts`
  - **Files**: `next.config.ts`
  - **Acceptance**: Key removed; build runs typecheck

- [x] **TASK-1.3**: Create `src/components/ErrorBoundary.tsx` with `ErrorFallback` and `reportError`
  - **Files**: `src/components/ErrorBoundary.tsx` (create)
  - **Acceptance**: Component compiles; renders fallback on error

- [x] **TASK-1.4**: Wrap `src/app/layout.tsx` children with `<ErrorBoundary>`
  - **Files**: `src/app/layout.tsx`
  - **Acceptance**: App renders; errors caught by boundary

- [x] **TASK-1.5**: Upgrade Next.js to ≥16.3.6 in `package.json`
  - **Files**: `package.json`
  - **Acceptance**: `next@^16.3.6` installed; no breaking changes

- [x] **TASK-1.6**: Run `pnpm build` — fix any new TypeScript errors surfaced
  - **Files**: Any files with new errors
  - **Acceptance**: `pnpm build` exits 0 with `ignoreBuildErrors: false`

- [x] **TASK-1.7**: Create `src/app/global-error.tsx` (optional)
  - **Files**: `src/app/global-error.tsx` (create)
  - **Acceptance**: Global error UI renders on layout errors

---

## Phase 2: TypeScript & Motion System

### Objective
Clean typecheck, fix motion prop misuse across 14 files.

### Tasks

- [x] **TASK-2.1**: Update `src/lib/animation/variants.ts` — type `STAGGER` as `Record<string, number>`, export `Transition`
- [x] **TASK-2.2**: Update `src/lib/animation/hooks.ts` — type `getMotionSafeTransition` return as `Transition`
- [x] **TASK-2.3**: Fix `src/components/ui/Button.tsx` — remove unused `MotionProps`, fix `HTMLMotionProps<'button'>`
- [x] **TASK-2.4**: Fix `src/components/ui/Input.tsx` — ensure `motion.div` wrapper pattern correct
- [x] **TASK-2.5**: Fix `src/components/ui/Textarea.tsx` — ensure `motion.div` wrapper pattern correct
- [x] **TASK-2.6**: Fix `src/components/Navbar.tsx` — import `Transition`, type transition props
- [x] **TASK-2.7**: Fix `src/components/Footer.tsx` — replace all `@ts-expect-error` with proper `Variants` typing
- [x] **TASK-2.8**: Verify `src/components/dashboard/StudyStatsGrid.tsx` has unique keys
- [x] **TASK-2.9**: Run `pnpm tsc --noEmit` — must exit 0

---

## Phase 3: Security Hardening

### Objective
Secure auth flow, validate uploads server-side.

### Tasks

- [x] **TASK-3.1**: Add `file-type` to `package.json`
- [x] **TASK-3.2**: Create `src/lib/security/rate-limiter.ts` with sliding window `RateLimiter` class
- [x] **TASK-3.3**: Create `src/lib/security/mime-validation.ts` with `validateMimeType` using `file-type`
- [x] **TASK-3.4**: Update `src/lib/actions/studies.ts` — integrate rate limiter on `uploadStudy`; add MIME validation
- [x] **TASK-3.5**: Test rate limiting with rapid requests
- [x] **TASK-3.6**: Test MIME validation with valid/invalid files

---

## Phase 4: Production Hygiene

### Objective
Remove debug artifacts, env-driven config, image optimization.

### Tasks

- [x] **TASK-4.1**: Wrap `console.error` in `src/lib/studies/processing.ts` with dev check
- [x] **TASK-4.2**: Wrap `console.error` in `src/lib/extraction/pdf.ts` with dev check
- [x] **TASK-4.3**: Wrap `console.error` in `src/app/dashboard/page.tsx` with dev check
- [x] **TASK-4.4**: Wrap `console.error` in `src/app/dashboard/estudios/page.tsx` with dev check
- [x] **TASK-4.5**: Wrap `console.log` in `src/app/auth/callback/route.ts` with dev check
- [x] **TASK-4.6**: Wrap `console.warn/error` in `src/lib/analysis/analyze-study.ts` with dev check
- [x] **TASK-4.7**: Wrap `console.error` in `src/lib/actions/studies.ts` with dev check
- [x] **TASK-4.8**: Update `src/app/layout.tsx` — replace hardcoded `SITE_URL` with env var fallback
- [x] **TASK-4.9**: Update `src/components/dashboard/MobileNav.tsx` — replace `<img>` with `<Image />` for avatar
- [x] **TASK-4.10**: Verify no console output in production build

---

## Phase 5: CI/CD Pipeline & Testing Infrastructure

### Objective
Automated quality gates, stable test runner, sitemap/robots.

### Tasks

- [x] **TASK-5.1**: Add Vitest dependencies: `vitest`, `@vitest/coverage-v8`, `@testing-library/jest-dom`, `@vitejs/plugin-react`
- [x] **TASK-5.2**: Create `vitest.config.ts` with jsdom, coverage thresholds (80/70/80/80)
- [x] **TASK-5.3**: Create `vitest.setup.ts` with mocks for next/navigation, supabase, motion
- [x] **TASK-5.4**: Update `package.json` scripts: `test`, `test:watch`, `test:coverage`, `postbuild`
- [x] **TASK-5.5**: Add `next-sitemap` to devDependencies
- [x] **TASK-5.6**: Create `next-sitemap.config.js` with siteUrl, exclude paths, robots.txt config
- [x] **TASK-5.7**: Create `.github/workflows/ci.yml` with Node 20/22 matrix, pnpm cache, lint → tsc → test → build
- [x] **TASK-5.8**: Run `pnpm test` — all tests pass
- [x] **TASK-5.9**: Run `pnpm build && pnpm postbuild` — verify sitemap.xml and robots.txt generated
- [x] **TASK-5.10**: Run `pnpm audit` — verify 0 critical/high

---

## Global Acceptance Criteria

- [x] `pnpm build` passes with `ignoreBuildErrors: false`
- [x] `pnpm lint` exits 0
- [x] `pnpm test` passes on Vitest (no experimental flags)
- [x] CI/CD workflow green on push/PR
- [x] No `console.*` in production bundles
- [x] Error boundaries render on route errors
- [x] Auth callback has rate limiting
- [x] Upload validates MIME server-side
- [x] `sitemap.xml` and `robots.txt` generated
- [x] `pnpm audit` shows 0 critical/high vulnerabilities

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Motion prop refactor breaks animations | Type-only changes; visual regression check in Phase 2 |
| Next.js upgrade breaks app | Patch version only (16.3.3→16.3.6); test locally first |
| CI reveals hidden failures | Run all checks locally before pushing workflow |
| Rate limit blocks legitimate users | Start generous (10 req/min per IP); tune via logs |

---

## Notes

- **Single PR strategy**: All phases delivered in one PR but reviewable as logical commits
- **Artifact store**: Engram (`sdd/nuvio-production-fixes/`)
- **Strict TDD**: NOT active (Node test runner only); Vitest migration in Phase 5
- **Review policy**: 400 changed lines max per PR (single PR here)

---

*Generated by SDD workflow. Update this file as phases complete.*