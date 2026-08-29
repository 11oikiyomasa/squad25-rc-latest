# SQUAD.25 Agent Contract

## Mission
Keep SQUAD.25 production-safe, fast, accessible, and intentionally minimal. Prefer fixing real UX, reliability, security, and data-integrity problems over adding features.

## Product rules
- Homepage is a focused showcase. Do not render the full 25-player directory there.
- The complete player directory lives at `/roster`.
- Player profiles live at `/member/[id]`.
- Recruitment is public at `/recruitment` and managed privately under admin.
- Scrims are public at `/scrims`; internal notes must never cross the public boundary.
- Public montage/cut counts must only include entries with a valid YouTube ID.
- Use the Vercel project domain as the canonical site URL. Do not reintroduce retired domains.

## Engineering rules
- Never claim a change is complete without evidence from typecheck/build/tests or a concrete runtime check.
- Never bypass a failing CI or deployment gate.
- Never invent production data, match results, player facts, or credentials.
- Do not weaken authentication, authorization, RLS, or public/private data boundaries for convenience.
- Validate user-controlled input at the boundary and handle API failures explicitly.
- Keep mobile behavior first-class; validate small-screen layouts before desktop polish.
- Prefer existing components and design tokens over one-off styles.
- Preserve reduced-motion behavior and keyboard accessibility.
- Avoid unnecessary dependencies and avoid client-side work when server rendering is sufficient.

## Review protocol
For every meaningful change, check the affected surface from five angles:
1. UX/accessibility
2. Security/data exposure
3. Performance/media loading
4. Functional/E2E behavior
5. Release/deployment safety

When two reviewers disagree, prefer the option with lower production risk and better evidence. 
