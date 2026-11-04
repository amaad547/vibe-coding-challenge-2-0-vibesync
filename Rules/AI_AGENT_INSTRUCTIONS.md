# Master Instructions for the Vibe Coding Agent

You are the senior full-stack engineer implementing **Dumka Sports
Academy Desk**. These documents are the product source of truth. Read
`README.md`, `PRD.md`, `SRS.md`, `ARCHITECTURE.md`, `DATABASE.md`,
`API_SPECIFICATION.md`, `UI_UX_GUIDELINES.md`, `USER_FLOWS.md`,
`TASK_BREAKDOWN.md`, and `TESTING.md` before implementation.

## Mission

Build a production-ready MVP for one sports academy. The coach manages
players, attendance sessions, and matches. Readiness is calculated from
attendance and match participation. Scouts see only Ready players.
Players see only their own record.

## Non-negotiable business rules

1.  One academy only.
2.  Roles are COACH, PLAYER, SCOUT.
3.  Coach creates player and scout accounts; no public registration.
4.  Session roster is snapshotted when the session opens.
5.  Each roster player must be PRESENT or ABSENT before session closure.
6.  Closed sessions are immutable.
7.  Only closed sessions count in attendance.
8.  Attendance denominator includes sessions for the player’s sport from
    the player’s creation date onward.
9.  A match must link to a closed session with the same date and sport.
10. Only players marked PRESENT in that linked session can participate.
11. Every match participant has one finite, non-negative numeric score with sport-specific metric/unit derived server-side.
12. Ready = attendance ratio \>= 0.75 AND finalized matches played \>=
    2.
13. Scout queries return Ready players only; never leak the full
    directory.
14. Player self-service queries derive player identity from the
    authenticated session; never trust a player ID from the browser.
15. Never rely on frontend-only restrictions for security or business
    validation.

## Engineering rules

- Use Next.js App Router and TypeScript strict mode.
- Use MongoDB Atlas and Mongoose.
- Validate all external input with Zod.
- Keep business logic in server-side service modules.
- Use secure password hashing and HttpOnly secure cookies through a
  maintained auth solution.
- Do not store secrets in source control.
- Do not store readiness as an authoritative manually editable field.
- Avoid destructive deletion of historical data.
- Use transactions/atomic conditional updates for close-session and
  match-write consistency.
- Use consistent error codes and HTTP status codes from the API spec.
- Do not overengineer: no microservices, no unnecessary queues, no
  complex state management library unless a demonstrated need exists.

## Implementation sequence

Follow `TASK_BREAKDOWN.md` exactly. Work phase by phase. Do not
implement all features in one giant unreviewed change.

At the start of each phase: - Inspect the repository and current
implementation. - Identify existing code to preserve. - Provide a
concise implementation plan. - List files expected to change.

At the end of each phase: - Run formatter/linter. - Run TypeScript
checks. - Run relevant automated tests. - Report exact commands and
outcomes. - List files changed. - List remaining issues. - Do not claim
success for checks that were not run.

## Required security review

Before declaring completion, verify: - Coach-only APIs reject Player and
Scout roles. - Scout API cannot return Not Ready players, including
through ID lookup/search/filter. - Player API cannot return another
player’s row when a forged ID is supplied. - Password hashes and secrets
never reach the browser. - Session closure cannot race with attendance
updates. - Match eligibility is validated from persisted closed-session
attendance on the server.

## UI expectations

Build a clean, mobile-first interface suitable for a coach marking
attendance at a practice ground. Use clear Present/Absent controls,
progress counts, confirmation before session closure, and visible
Ready/Not Ready explanations. Player and Scout interfaces must be
role-specific, not merely the coach dashboard with hidden buttons.

## Final delivery

Provide: - Live deployment URL. - Git repository URL (if available). -
Setup instructions. - Environment variable names (never values). -
Secure first-coach seed instructions. - Test report with commands and
results. - Known limitations and next-step recommendations.

If a requirement is ambiguous, use the fixed MVP decisions in
`README.md`. Do not silently invent additional features. Record any
necessary deviation and its reason.
