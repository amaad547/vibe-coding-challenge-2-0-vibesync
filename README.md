# Dumka Sports Academy Desk — Documentation Pack

This package is the implementation source of truth for the MVP.

## Documents

1.  `PRD.md` — product scope, users, goals, and acceptance criteria.
2.  `SRS.md` — functional and non-functional requirements.
3.  `ARCHITECTURE.md` — application architecture and security
    boundaries.
4.  `DATABASE.md` — MongoDB collections, indexes, and invariants.
5.  `API_SPECIFICATION.md` — API contracts and validation behavior.
6.  `UI_UX_GUIDELINES.md` — pages, navigation, and interaction rules.
7.  `USER_FLOWS.md` — end-to-end workflows.
8.  `TASK_BREAKDOWN.md` — phased build plan and implementation order.
9.  `TESTING.md` — test plan, required scenarios, and edge cases.
10. `AI_AGENT_INSTRUCTIONS.md` — master instructions for the coding
    agent.

## Product summary

A single-academy system for a coach in Dumka to manage players, record
attendance sessions, record match scores, and identify players meeting
the readiness criteria. Scouts can see only Ready players. Players can
see only their own record.

## Fixed MVP decisions

- One academy; no multi-tenant academy switching.
- Roles: `COACH`, `PLAYER`, `SCOUT`.
- A player belongs to one academy and has one primary sport in the MVP.
- Attendance is calculated per player and their registered sport.
- Only **closed** sessions count in the attendance denominator.
- A match must be linked to a closed session on the same date and sport.
- Only players marked Present in that linked session can be added to the
  match.
- A player is Ready when attendance is at least 75% and they have played
  in at least 2 matches.
- The scout list contains Ready players only.
- A player account can retrieve only its own player record and related
  statistics.
- Closing a session locks it. There is no edit/reopen feature in the
  MVP.
- Match scores are numeric values. The coach may optionally enter a
  short score label/unit (for example, goals, points, runs); no
  cross-sport ranking is implied.

## Build and delivery rules

- Use Next.js App Router + TypeScript.
- Use MongoDB Atlas + Mongoose.
- Use secure server-side authentication and authorization.
- Deploy the web app to Vercel and MongoDB to Atlas.
- Never trust role, player ID, attendance status, match eligibility, or
  readiness values sent by the browser.
- Do not store a calculated Ready flag as the source of truth. Calculate
  readiness from records on the server.
- Seed the first coach using a secure deployment-time script or
  protected setup process. Do not expose public coach registration.
- Do not commit `.env` files or credentials.

## Local Setup & Development

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- MongoDB Atlas connection string (or local MongoDB instance)

### Installation

1. Clone or open the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration:
   ```bash
   copy .env.example .env.local
   ```
   Configure `MONGODB_URI` with your connection string and set a secure `AUTH_SECRET`.

### Scripts

- `npm run dev`: Start Next.js development server on `http://localhost:3000`
- `npm run build`: Build production assets
- `npm run start`: Start production server
- `npm run lint`: Run ESLint checks
- `npm run typecheck`: Run strict TypeScript compiler verification (`tsc --noEmit`)
- `npm run format`: Format source files with Prettier
- `npm run test:db`: Run the MongoDB connection utility verification script
- `npm run test:auth`: Run the Phase 2 Authentication and Role-Based Access Control test suite
- `npm run test:players`: Run the Phase 3 Player Management test suite
- `npm run test:attendance`: Run the Phase 4 Attendance Management test suite (AT-01 scenario)
- `npm run test:matches`: Run the Phase 5 Match & Score Management test suite
- `npm run test:readiness`: Run the Phase 6 Player Readiness Engine test suite
- `npm run test:dashboards`: Run the Phase 7 Role-Based Dashboards & RBAC test suite
- `npm run seed`: Provision or update initial Coach and Scout accounts securely

## Phase 1 — Project Foundation Architecture

### Folder Structure

```text
src/
├── app/
│   ├── api/
│   │   └── health/route.ts      # Health check endpoint (uptime, DB readiness)
│   ├── dashboard/page.tsx       # Interactive dashboard foundation & UI showcase
│   ├── error.tsx                # Client error boundary
│   ├── global-error.tsx         # Root error boundary
│   ├── not-found.tsx            # Custom 404 page
│   ├── globals.css              # Tailwind directives & CSS variables
│   ├── layout.tsx               # Root layout with SportSync metadata
│   └── page.tsx                 # Landing page with official branding
├── components/
│   ├── brand/
│   │   └── logo.tsx             # Official SportSync logo component
│   ├── layout/
│   │   ├── app-shell.tsx        # Responsive application shell
│   │   ├── sidebar.tsx          # Collapsible desktop & mobile sidebar
│   │   └── topbar.tsx           # Top navigation bar with role & notification cues
│   └── ui/
│       ├── badge.tsx            # Status indicator badges
│       ├── button.tsx           # Multi-variant button with loading state
│       ├── card.tsx             # Structured card container
│       ├── input.tsx            # Form input with icon and error support
│       ├── loading.tsx          # Spinners, skeletons, and loading overlays
│       ├── modal.tsx            # Accessible dialog modal
│       └── table.tsx            # Responsive data table primitives
└── lib/
    ├── db/
    │   └── mongodb.ts           # Cached Mongoose connection utility
    ├── errors/
    │   └── api-error.ts         # Standardized API error responses
    ├── env.ts                   # Zod environment variable validation
    └── utils.ts                 # Classname merge utility (clsx + twMerge)
```

### Health Check Endpoint

- **Endpoint**: `GET /api/health`
- **Response Format**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-03T23:15:00.000Z",
    "database": "connected",
    "uptime": 12.34
  }
  ```
  Returns status code `200` when healthy or `503` when degraded.

## Phase 2 — Authentication & Role-Based Access Control

### Roles & Security Model

- **COACH**: Owns academy workspace. Log in via secure seed/operator-provisioned credentials. Has review queue to verify or reject player registrations.
- **PLAYER**: Public self-registration (`/register`) enters a `PENDING` queue. Cannot log in while pending or rejected. Once approved by the coach, account activates. Scoped exclusively to own profile (`/api/auth/me`).
- **SCOUT**: Provisioned securely by operator. Restriced to trial-ready talent discovery.

### Auth Endpoints

- `POST /api/auth/register`: Public player registration (creates `Player` + `User` in `PENDING` status).
- `POST /api/auth/login`: Verifies bcrypt password hash, validates role and account status, issues encrypted HTTP-only session cookie (`sportsync_session`).
- `GET /api/auth/me`: Resolves authenticated session user and linked player profile.
- `POST /api/auth/logout`: Clears session cookie.
- `GET /api/coach/registrations`: Coach-only queue of pending player applications.
- `POST /api/coach/registrations/:id/review`: Coach-only action to `APPROVE` or `REJECT` applications.

## Phase 3 — Player Management & Roster Operations

### Features & Security Enforcements

- **Coach-Only Permission**: All player management endpoints (`/api/players*`) strictly verify the caller has the `COACH` role. Players attempting to modify verification status or other profiles are rejected with HTTP 403 `FORBIDDEN`.
- **Search, Filters & Pagination**: Full server-side search by name (case-insensitive regex), filter by sport (`football`, `cricket`, `athletics`, `badminton`), and filter by status (`active`, `archived`, `all`), complete with pagination metadata.
- **Roster Operations**:
  - Direct player creation (`POST /api/players`) with optional player portal invite account.
  - Profile updates (`PATCH /api/players/:id`) modifying name, age, sport, and status.
  - Soft archiving (`POST /api/players/:id/archive`) which flags `isActive = false` to preserve all historical attendance and match records.
- **Registration Approval Queue**:
  - Tabbed interface on `/coach/players` allowing coaches to review incoming athlete applications, approve them to grant immediate login access, or reject them with documented reasons.
- **UI States**: Real-time loading overlays, empty states for filtered queries, error handling with retry, and confirmation modals.

## Phase 4 — Attendance Management & Session Lifecycle

### Core Invariants & Calculations

- **Session Opening & Snapshotting**:
  - Coach creates a practice session with a normalized calendar date (`YYYY-MM-DD`) and sport.
  - Active, verified players belonging to that sport at session creation time are automatically snapshotted into `Session.roster` with initial status `null`.
  - Enforces unique session per `(sport, date)` composite constraint.
- **Attendance Marking**:
  - Coach can mark each snapshotted player as `PRESENT` or `ABSENT`.
  - Players outside the sport or registered after session opening are never snapshotted.
  - Batch updates via `PUT /api/sessions/:id/attendance` validate all player IDs and statuses on the server.
- **Atomic Locking & Immutability**:
  - Closing a session (`POST /api/sessions/:id/close`) requires all snapshotted players to have an assigned status (`PRESENT` or `ABSENT`).
  - Upon closing, the session status transitions atomically to `CLOSED` and `closedAt` timestamp is set.
  - Once closed, attendance records are locked and cannot be edited, reopened, or deleted via UI or API (subsequent modification attempts return HTTP 409 `CONFLICT`).
- **Attendance Aggregation Algorithm (`calculatePlayerAttendance`)**:
  - **Denominator**: Total number of **CLOSED** sessions matching the player's sport where session `date >= player.createdAt`.
  - **Numerator**: Total number of those closed sessions where the player was recorded as `PRESENT`.
  - Sessions from other sports, open sessions, and sessions prior to the player's enrollment date never count towards the denominator or numerator.

### Session Endpoints

- `GET /api/sessions`: List sessions with optional filters (`sport`, `status`) and summary attendance counts.
- `POST /api/sessions`: Open a new practice session and snapshot eligible athletes.
- `GET /api/sessions/:id`: Retrieve session details with full roster and attendance counts.
- `PUT /api/sessions/:id/attendance`: Mark athletes `PRESENT` or `ABSENT` in an open session.
- `POST /api/sessions/:id/close`: Verify all athletes are marked and atomically close/lock the session.

## Phase 5 — Match & Score Management

### Core Invariants & Rules

- **Linked Practice Session Constraint**:
  - Matches must be linked to an existing practice session (`sessionId`).
  - The linked session must have status `CLOSED` (matches cannot be linked to open sessions).
  - Match calendar date must strictly match the linked session date (`DATE_MISMATCH` rejection).
  - Match sport must strictly match the linked session sport (`SPORT_MISMATCH` rejection).
- **Athlete Eligibility Enforcement**:
  - Only athletes snapshotted into the linked session and marked `PRESENT` are eligible to participate.
  - If a client manually passes an `ABSENT` or foreign player ID, the server strictly rejects the request with HTTP 409 `PLAYER_NOT_ELIGIBLE`.
  - At least one eligible participant is required. Duplicate athlete IDs in the match sheet are rejected.
- **Server-Derived Score Metrics & Units (Tamper Resistance)**:
  - Scoring metrics and units are derived strictly on the server from `SportConfig` (or canonical defaults):
    - **Football**: Metric: `Goals`, Unit: `Goals`
    - **Cricket**: Metric: `Runs`, Unit: `Runs`
    - **Basketball**: Metric: `Points`, Unit: `Points`
    - **Athletics**: Metric: `Points`, Unit: `Points`
    - **Badminton**: Metric: `Points`, Unit: `Points`
  - Client-supplied metric or unit values are never trusted or accepted.
- **Score Validation**:
  - Scores must be non-negative, finite numbers.
  - A score of `0` is valid and accepted. Negative or non-numeric scores are rejected.
- **Finalized Status**:
  - Match records are created in `FINALIZED` status as immutable official fixtures.

### Match Endpoints

- `GET /api/matches`: List matches with optional filters (`sport`, `date`, `playerId`, pagination).
- `POST /api/matches`: Finalize match sheet with linked session validation, eligibility verification, and server score derivation.
- `GET /api/matches/:id`: Retrieve detailed match sheet with participant athlete performances.
- `GET /api/sports`: Retrieve server-configured sports, active statuses, and scoring metrics/units.

## Phase 6 — Player Readiness Engine

### Core Invariants & Calculation Rules

- **Attendance Calculation**:
  - `attendance percentage = (present closed sessions / all eligible closed sessions) * 100`
  - Eligible closed sessions are filtered strictly to the player's sport where session `date >= player.createdAt`.
  - Open practice sessions are completely excluded from the denominator.
  - Sessions from other sports or dated prior to the player's enrollment date never count.
  - If no eligible closed sessions exist (`heldSessions === 0`), attendance is `0.0%` and the athlete is Not Ready.
- **Trial Readiness Rule**:
  - An athlete is **`READY`** if and only if:
    1. **Attendance Rate &ge; 0.75 (75.0%)**: evaluated using the **exact unrounded ratio** (`present / held >= 0.75`).
    2. **Finalized Matches &ge; 2**: participated in at least two finalized match fixtures.
  - Both criteria must be satisfied simultaneously.
- **Dynamic Recalculation (No Static Stored Status)**:
  - Readiness is dynamically derived by the server-side service (`evaluateReadiness` / `calculatePlayerReadiness` / `getAcademyReadiness`).
  - Never stored as a static, authoritative, manually editable database flag, guaranteeing tamper-proof auditability.
- **Boundary Test Coverage**:
  - Below 75% attendance (e.g. 74.999% ratio with 2 matches) &rarr; `NOT READY`.
  - Exactly 75% attendance (3/4 ratio with 2 matches) &rarr; `READY`.
  - Above 75% attendance (e.g. 75.001% or 80.0% ratio with 2 matches) &rarr; `READY`.
  - Fewer than two matches (0 matches or 1 match with 100% attendance) &rarr; `NOT READY`.
  - Exactly two matches (2 matches with &ge; 75% attendance) &rarr; `READY`.

### Readiness Endpoints & UI

- `GET /api/readiness`: Coach endpoint returning all verified athletes with attendance numerators/denominators, percentages, matches played, and `isReady` flags.
- `/coach/readiness`: Coach dashboard interface displaying real-time athlete readiness ledger, criteria progress bars, filters (All, Ready, Not Ready, Sport), and search.

## Phase 7 — Role-Based Dashboards & Privacy Scoping

### Dashboard Architectural Separation

1. **Coach Dashboard (`/coach`)**:
   - `GET /api/coach/overview`: Aggregated player stats (active, pending, archived, verified, ready for scouts), session stats, match stats, and recent activity.
   - Registration Review Queue: Quick approval/rejection modal for pending applications.
   - Quick navigation shortcuts to Add Player, Practice Sessions, Record Match, and Readiness Ledger.

2. **Player Portal (`/player`)**:
   - `GET /api/player/me`: Strictly scoped to the authenticated user's linked player record.
   - Server resolves player ID from the secure session token; any client-supplied ID in query or body is ignored.
   - Personal attendance metrics (held sessions, present sessions, percentage, progress bar).
   - Real-time readiness evaluation with gap analysis and milestone tracking.
   - Complete personal finalized match history with recorded scores and server-derived units.

3. **Scout Talent Registry (`/scout`)**:
   - `GET /api/scout/ready-players`: Privacy-preserving talent discovery.
   - Strict Server-Side Ready Filter: Returns **only** athletes who satisfy `isReady === true`.
   - Never exposes total academy enrollment or Not Ready athlete counts.
   - Search and sport filters operate strictly within the Ready set.
   - `GET /api/scout/ready-players/:id`: Re-evaluates readiness in real time. If the athlete is not ready or has fallen below 75% attendance, the server immediately rejects the request with HTTP 404 `PLAYER_NOT_READY`.
   - Scouting Dossier Modal displaying verified trial readiness metrics and individual match performance scores.

### End-to-End Role-Based Access Control (RBAC) Enforcements

- **Coach Endpoints**: Accessible strictly by `COACH` role; `SCOUT` and `PLAYER` receive HTTP 403 `FORBIDDEN`.
- **Player Endpoints**: Accessible strictly by `PLAYER` role; unauthorized roles receive HTTP 403 `FORBIDDEN`.
- **Scout Endpoints**: Accessible strictly by `SCOUT` role; unauthorized roles receive HTTP 403 `FORBIDDEN`.
- **Unauthenticated Requests**: Blocked across all protected routes with HTTP 401 `UNAUTHORIZED`.








