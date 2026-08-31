# Regression Test Matrix

Rule: every bug discovered in production/review becomes a permanent automated contract. The test must fail on the broken behavior and pass only after the fix.

| Historical bug / invariant | Source evidence | Permanent automated coverage | Layer |
|---|---|---|---|
| Unsafe admin redirect / open redirect | `app/login/actions.ts` previously owned `next` validation | `safeNext` accepts only local paths and rejects `//`, absolute URLs, and non-strings | Unit |
| Recruitment multipart parsing broke | historical `fix(recruitment): correct multipart field parsing syntax` | Candidate E2E submits `multipart/form-data`; recruitment verifier requires `request.formData()` and size guards | E2E + Regression |
| Expired public recruitment positions leaked into UI | historical `fix(recruitment): filter expired public positions safely` | Recruitment verifier keeps the expiry predicate contract; protected E2E requires an active position before exercising submission | Regression + E2E |
| Admin recruitment search syntax needed sanitization | historical `fix(recruitment): sanitize admin search filter syntax` | Recruitment verifier requires bounded/normalized search handling; authenticated integration should exercise hostile query characters | Regression |
| Legacy recruitment submission path could bypass hardened path | historical `fix(recruitment): retire legacy submission RPC and trigger` | Recruitment verifier asserts legacy RPC retirement and server-only v7 submission boundary | Regression |
| Direct client writes to applications had to be closed | historical `fix(recruitment): close direct client write paths` | Recruitment verifier checks revoked table write grants; Supabase integration rejects anonymous privileged writes | Regression + Integration |
| Recruitment status updates needed atomic audit behavior | historical `fix(recruitment): make status changes transactionally audited` | Verifier checks atomic admin RPC + audit actions; authenticated integration is the activation gate for live transitions | Regression + Integration |
| Three-per-hour recruitment rate limit | historical `fix(recruitment): enforce three-per-hour limit and migrate terminal status` | Verifier checks threshold + advisory lock + one-hour window; live load test belongs in protected environment | Regression |
| Admin/non-admin routing separation | historical `fix: separate authenticated users from admin access denial` | `requireAdmin` contract + route smoke/API denial + protected admin E2E | Integration + E2E |
| Public content was accidentally coupled to auth sessions | historical `fix: isolate public content from auth sessions` | Public API integration stays anonymous; public content test does not require an auth session | Integration |
| Canonical route regressions (`/member`, `/scrims`, `/admin/preview`, `/admin/scrims`) | historical routing fixes | `scripts/verify.mjs` asserts canonical destinations, redirects, breadcrumbs and sitemap routes | Regression |
| Homepage match links could target wrong destination | historical `fix(ia): validate homepage match destination via shared MatchCenter` | Core verifier requires shared MatchCenter canonical `/matches` contract; E2E smoke covers home navigation | Regression + E2E |
| Match lifecycle renderer broke type safety | historical `fix(matches): type-safe lifecycle renderer` | `scripts/verify-scrims.mjs` requires lifecycle states and renderer/data contracts | Regression |
| Match lifecycle invariants needed enforcement | historical match lifecycle test/fix sequence | Scrim verifier asserts lifecycle migration, state checks, canonical UI and admin API | Regression |
| Media archive/video health drifted | historical media gate commits | `scripts/verify-media.mjs` + public media E2E surface where available | Regression + E2E |
| Unpublished/empty YouTube placeholders were counted as playable | historical media/content hardening | `normalizeYoutubeId` rejects empty/malformed IDs; media verifier requires empty placeholder behavior | Unit + Regression |
| Member image failures needed graceful fallback | historical `fix(ux): add resilient member image fallback` | Shared `MemberCard` remains on `next/image` with deterministic fallback; public roster E2E opens a real card | E2E + Regression |
| Mobile player card ratio/modal close regressions | historical mobile UX fix | Public member E2E plus existing source verifier; visual regression can be added when device matrix is enabled | E2E + Regression |
| SEO canonical metadata regressed | historical `fix(seo): correct route canonical metadata` | Existing verifier checks canonical URLs, absolute OG URLs, sitemap routes | Regression |
| IA/design controls drifted | historical design-system test commits | Existing verifier checks shared primitives, tokens, responsive breakpoints, focus/reduced-motion | Regression |
| Loading/error/404/403 recovery disappeared | historical routing/UX hardening | Existing verifier checks these route contracts; public smoke hits route shell | Regression + Integration |
| Accidental dead CTA / `#` links / dummy console handlers | historical IA hardening | Existing verifier scans all app/components/lib TypeScript sources | Regression |
| Auth helper behavior can regress independently of framework redirects | Phase 12 extraction | `tests/unit/auth-helpers.test.ts` | Unit |
| PDF spoofing / invalid resume types | recruitment security fixes | MIME, extension, size and `%PDF-` magic-byte tests | Unit |
| Unicode/input normalization drift | recruitment security fixes | `text()` regression tests for NFKC, trim and bounds | Unit |
| Admin preview button pointed at a redirect-only legacy page | deep admin audit | `tests/regression/admin-surface.test.ts` + functional draft preview route | Regression + E2E |
| Admin pages repeated auth checks and had inconsistent navigation | deep admin audit | Shared `app/admin/layout.tsx` contract; section pages no longer own duplicate `requireAdmin` checks | Regression |
| Supabase misconfiguration could still render the admin studio | deep admin auth audit | `requireAdmin` must redirect to the login/configuration state before rendering any admin page | Regression |
| Admin publish silently dropped achievements and gallery changes | deep admin CMS audit | Admin API + publish RPC contract requires achievements/gallery and persists them atomically | Regression + Integration |
| `/admin/media` exposed the roster studio instead of media management | deep admin CMS audit | `AdminMediaStudio` contract tests gallery/achievement editing and full-snapshot publishing | Regression + E2E |

## Missing live-fixture activation

Two groups intentionally require protected environment setup rather than fake green tests:

1. Authenticated admin E2E requires `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`.
2. Live Supabase integration requires `SUPABASE_PUBLISHABLE_KEY` as a protected GitHub variable; authenticated mutation tests additionally require a dedicated test admin identity/data fixture.

Until those are configured, the tests are present but environment-gated. The suite never claims a skipped security/mutation test is equivalent to a live pass.

## Change rule

When a bug is fixed:

1. Add or update its regression case.
2. Run the failing test once before the fix when practical.
3. Implement the fix.
4. Verify the regression turns green.
5. Keep the case permanently; do not delete it merely because the bug is old.
