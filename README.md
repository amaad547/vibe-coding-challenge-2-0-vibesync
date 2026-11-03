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



