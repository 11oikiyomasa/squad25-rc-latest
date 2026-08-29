# SQUAD.25 Copilot Review Rules

Apply these rules to every code review in this repository.

## Highest priority
- Flag security, authorization, data-leak, build, routing, and production-regression issues before cosmetic concerns.
- Do not treat successful compilation as proof of correctness.
- Require evidence for claims about behavior.

## Product architecture
- Keep the homepage concise and showcase-oriented; full roster belongs on `/roster`.
- Public data and private admin data must remain separated.
- Recruitment and scrim workflows are real data flows, not demo-only UI.
- Retired domains must not appear in active SEO/configuration.

## UI/UX
- Review mobile first, especially touch targets, overflow, modal behavior, navigation, hierarchy, and empty/loading/error states.
- Preserve the established visual system instead of introducing arbitrary patterns.
- Check keyboard access, focus visibility, dialog semantics, Escape behavior, and reduced motion.

## Security
- Treat all form/API input as untrusted.
- Check authentication and authorization at server boundaries.
- Do not expose internal notes, admin data, secrets, or service-role credentials to public clients.
- Review RLS and query filters for unintended reads/writes.

## Performance
- Watch image priority, large media, YouTube iframes, client-side waterfalls, and unnecessary hydration.
- Prefer lazy loading for non-critical media.

## Verification
- Run `npm run verify` and `npm run typecheck` for source-level checks.
- Run `npm run build` for production compilation.
- Exercise affected routes and APIs with smoke/E2E checks when practical.
- Never recommend merging a failing change just because the issue is small.
