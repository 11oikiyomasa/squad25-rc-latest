# Automated Testing Contract

Phase 12 makes automated testing a release gate. A green build is not enough: behavior, security boundaries, browser flows, and known regressions must stay green.

## Test layers

### Unit

Run with `npm run test:unit`.

Covers pure behavior with deterministic inputs:

- YouTube/content normalization (`normalizeYoutubeId`)
- recruitment validation (`isValidEmail`, `isValidHttpUrl`)
- text normalization/clamping and client IP extraction
- PDF extension/MIME/magic-byte validation
- auth redirect safety (`safeNext`)
- deterministic seed roster integrity

### Integration

Run with `npm run test:integration` against a local production server plus an optional Supabase environment.

Covers:

- public API response contracts
- admin endpoint denial for unauthenticated callers
- Supabase public-read contracts
- admin allowlist isolation
- privileged RPC denial for anonymous clients

Supabase integration becomes a hard gate when `REQUIRE_SUPABASE_TESTS=1` and the required publishable URL/key are supplied. CI currently keeps this flag at `0` because the repository does not store the environment credential.

### E2E

Run with `npm run test:e2e` after starting the production server.

Minimum browser journeys:

1. Visitor opens home.
2. Visitor searches roster.
3. Visitor opens member.
4. Visitor submits recruitment.
5. Admin logs in.
6. Admin sees an application.
7. Admin updates content.

The recruitment journey skips only when no active recruitment position exists. The admin journeys skip only when E2E admin credentials are absent. Set `REQUIRE_RECRUITMENT_E2E=1` or `REQUIRE_ADMIN_E2E=1` in a protected test environment to turn those prerequisites into hard failures.

Admin content publishing is intercepted in E2E so the browser test never mutates production data. Authenticated backend mutation coverage belongs in a protected integration environment.

## Regression policy

Every production bug gets a regression case before the fix is considered complete.

Regression mechanisms are layered:

- a pure unit test when the bug is represented by deterministic logic;
- an integration contract when the bug crosses an API/database/security boundary;
- a browser test when the failure is user-visible interaction;
- an existing verifier when the invariant is architectural/source-level (route canonicalization, lifecycle contract, migration/security boundary, media archive structure).

A skipped E2E prerequisite is not a passing product assertion. Production/release CI should run with the corresponding `REQUIRE_*` flags once a protected test environment is available.

## CI gate

The default CI sequence is:

`unit -> regression -> existing verifiers -> typecheck -> production build -> route smoke -> integration -> E2E`

The test commands use pinned `tsx` and Playwright versions. Playwright lives outside TypeScript typechecking through `.mjs` config/spec files.
