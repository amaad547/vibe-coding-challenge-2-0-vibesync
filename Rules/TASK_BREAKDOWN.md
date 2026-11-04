# Development Task Breakdown

Build in the order below. Do not start later phases until the previous
phase’s acceptance checks pass.

## Phase 0 — Product and repository foundation

- Create Next.js App Router + TypeScript project.
- Enable strict TypeScript, linting, formatting.
- Add Tailwind and accessible UI primitives.
- Create environment schema and `.env.example`.
- Add MongoDB connection utility with safe connection reuse.
- Add README with local setup. **Exit:** app runs locally;
  lint/typecheck pass; DB connection works.

## Phase 1 — Data models and authentication

- Implement User, Player, Session, Match schemas.
- Add indexes and validation.
- Implement secure credential login/session handling.
- Implement public player self-registration with PENDING status.
- Implement coach registration review queue with approve/reject actions.
- Ensure pending/rejected players cannot log in; approval activates linked player account.
- Implement role guards and server-side identity resolution.
- Add secure coach seed script; no public coach signup.
- Add secure scout account provisioning. **Exit:** each
  role can log in; unauthorized role access is blocked; secrets are not
  exposed.

## Phase 2 — Player management

- Coach player list, add, edit, archive.
- Create linked player account/invite.
- Player `/me` endpoint and own-profile screen.
- Tests for player scoping and historical archive behavior. **Exit:**
  coach manages players; player sees only own row.

## Phase 3 — Sessions and attendance

- Open session with date/sport.
- Snapshot active sport roster.
- Mark Present/Absent.
- Show progress and unmarked entries.
- Close session atomically and lock it.
- Attendance aggregation service. **Exit:** supplied
  three-player/two-present/one-absent scenario passes; closed records
  cannot change.

## Phase 4 — Matches

- Match form linked to a closed session.
- Configure sport-specific score metric/unit (e.g. goals, runs, points).
- Filter eligible roster to Present players.
- Numeric score input for each participant with sport-specific metric/unit.
- Server-side eligibility/date/sport validation.
- Match history. **Exit:** present players can be saved; absent player
  is rejected even via forged API request.

## Phase 5 — Readiness and role-specific views

- Shared readiness calculation service.
- Coach readiness view for all active players.
- Scout endpoint and UI returning Ready players only.
- Player dashboard with own readiness and scores.
- Tests at 74.9%, exactly 75%, and below/above two matches. **Exit:**
  all readiness and data visibility acceptance criteria pass.

## Phase 6 — Hardening and QA

- Unit, integration, and Playwright tests.
- Login rate limiting, input validation, secure cookies, CSRF
  protections as applicable.
- Empty/loading/error states and mobile responsiveness.
- Audit metadata and structured error handling.
- Accessibility pass. **Exit:** test suite green; no known critical
  authorization issue.

## Phase 7 — Deployment

- Provision MongoDB Atlas.
- Configure production environment variables in Vercel.
- Run seed script securely for first coach.
- Deploy and test production flows with test accounts.
- Configure domain and HTTPS.
- Document backup/export and operational recovery procedure. **Exit:**
  live URL supplied; Coach, Player, Scout smoke tests pass.

## Agent execution protocol

For every task: 1. Read this package and inspect existing repository
before editing. 2. State a short plan and files expected to change. 3.
Implement one coherent task/phase. 4. Run lint, typecheck, and relevant
tests. 5. Fix failures before moving on. 6. Summarize changed files,
tests, and known limitations. 7. Never claim a phase is complete if its
exit criteria are not verified.
