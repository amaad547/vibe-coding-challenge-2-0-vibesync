<div align="center">

# ⚡ SportSync

### *Dumka Sports Academy Management Desk*

**Your Academy. Your Performance. Your Future.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge)](https://zod.dev/)

</div>

---

## 📋 Overview

**SportSync** is a full-stack sports academy management platform built for **Dumka Sports Academy**. It replaces paper-based registers and spreadsheets with a secure, role-aware digital system that tracks players from registration all the way through trial readiness — with tamper-proof attendance records, sport-specific match scorecards, and an independent scout discovery portal.

The system is built around three distinct role portals — **Coach**, **Player**, and **Scout** — each with server-enforced access rules. No client-side filtering is trusted for security-sensitive data; every critical invariant (attendance locks, readiness thresholds, scout eligibility) is enforced at the API layer.

---

## ✨ Key Features

### 🏋️ Coach Portal
- **Player Management** — Add players directly (instantly verified) or manage the self-registration approval queue (Approve / Reject)
- **Practice Session Management** — Create sessions by date and sport, mark each eligible player PRESENT or ABSENT, then lock sessions permanently
- **Immutable Attendance Locks** — Once a session is closed, attendance records cannot be modified through any UI action or direct API call
- **Match Scorecard Recording** — Create match records linked to closed practice sessions; only players marked PRESENT in the linked session may be added
- **Sport-Specific Statistics** — Cricket: runs & wickets per player role; Football: goals & assists; Basketball: points, rebounds & assists; Athletics & Badminton supported
- **Trial Readiness Overview** — See every player's live readiness status (attendance %, matches played, READY / NOT READY) in a single dashboard view
- **Dashboard Overview** — Aggregated stats: total players, pending registrations, open sessions, upcoming matches

### 👟 Player Portal
- **Self-Service Profile** — View personal profile including sport, registered skill/position, and verification status
- **Attendance Summary** — Live attendance percentage calculated from closed sessions only
- **Trial Readiness Tracker** — Dual-condition progress indicator: attendance ≥ 75% AND matches played ≥ 2 (both must pass)
- **Match History** — Broadcast-style performance lines per match (e.g., *"45 Runs · Batsman"*, *"2 Goals · Striker"*)
- **Self-Registration with Skill Selection** — Players choose their sport and position/skill at sign-up

### 🔭 Scout Portal
- **Talent Discovery Registry** — Paginated, filterable list of READY athletes only
- **Player Dossiers** — Full profile with verified attendance evidence and match performance history
- **Real-Time Access Revocation** — If a player's readiness drops below threshold (missed sessions or insufficient match count), they immediately disappear from scout view — no manual intervention required
- **Server-Side Enforcement** — Scout API endpoints reject non-ready players even on direct API calls; frontend filtering is never the sole guard

---

## 🏛️ Business & Integrity Rules

| Rule | Detail |
|---|---|
| **Attendance Immutability** | Sessions cannot be edited after `status: "closed"`. The `close` endpoint is one-way. |
| **Exact Attendance Ratio** | `presentSessions / totalClosedSessions` is compared at full float precision — no rounding — against the threshold `0.75`. |
| **Dual-Condition Readiness** | A player is `READY` **only if** attendance ratio ≥ 0.75 **AND** finalized matches played ≥ 2. Both conditions must hold simultaneously. |
| **Zero-Session Baseline** | If no closed sessions exist for a player's sport, their attendance is `0%` and readiness is `NOT READY`. |
| **Match Eligibility** | The server rejects any participant whose attendance record for the linked session is not `PRESENT`, regardless of what the client sends. |
| **Server-Side Score Derivation** | `scoreMetric` and `scoreUnit` (e.g., *"Goals"*, *"Runs"*) are always read from `SportConfig` on the server. Client-supplied values are silently discarded. |
| **Scout Privacy Invariant** | Scout endpoints filter by `isReady: true` in the database query, not in application logic. A player who becomes NOT READY is never returned, even by ID. |
| **Registration Verification** | Self-registered players start as `PENDING` and must be explicitly approved by a coach to become `VERIFIED`. Coach-created players are `VERIFIED` immediately. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15.5](https://nextjs.org/) — App Router, Server Components, Server Actions |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) — strict mode, full type coverage |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) via [Mongoose 8](https://mongoosejs.com/) ODM |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with custom glassmorphic design system |
| **Validation** | [Zod](https://zod.dev/) — server-side schema validation on all API inputs |
| **Authentication** | JWT tokens stored in `httpOnly` cookies; `iron-session`-style session management |
| **Route Protection** | Next.js `middleware.ts` with role-based redirect logic |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│   Landing Page   │   Auth Pages   │   Role Portals (3)      │
└───────────────────────────┬─────────────────────────────────┘
                            │  httpOnly JWT Cookie
┌───────────────────────────▼─────────────────────────────────┐
│                   Next.js Middleware                        │
│      Route protection + role-based redirect enforcement     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      API Route Layer                        │
│  /api/coach/**   │  /api/player/**  │  /api/scout/**        │
│  Auth: requireRole('COACH')  │  requireRole('PLAYER/SCOUT') │
│  Input: Zod validation on every POST/PATCH body             │
│  Business logic: Readiness Service, Sport Config Service    │
└───────────────────────────┬─────────────────────────────────┘
                            │  Mongoose ODM
┌───────────────────────────▼─────────────────────────────────┐
│                      MongoDB Atlas                          │
│   users │ players │ sessions │ matches │ sportconfigs       │
└─────────────────────────────────────────────────────────────┘
```

### Core Services

| Service | File | Responsibility |
|---|---|---|
| **Readiness Service** | `src/lib/services/readiness.ts` | `calculatePlayerReadiness()` — queries closed sessions & finalized matches, applies dual-condition logic |
| **Sport Config Service** | `src/lib/services/sport-config.ts` | `getSportScoreConfig()` — server-only lookup; derives `scoreMetric` & `scoreUnit` from DB |
| **Session Auth** | `src/lib/auth/session.ts` | `requireRole()`, `requireUser()` — extracts and validates JWT from cookie |
| **Skills Registry** | `src/lib/constants/skills.ts` | `SPORT_SKILLS` map, `getSkillsForSport()`, `formatMatchPerformance()` |

---

## ⚽ Sports & Skills Supported

| Sport | Positions / Skills | Match Stats |
|---|---|---|
| **Football** | Forward/Striker, Midfielder, Defender, Goalkeeper | Goals, Assists |
| **Cricket** | Batsman, Bowler, All-Rounder, Wicketkeeper | Runs, Wickets |
| **Basketball** | Point Guard, Shooting Guard, Small Forward, Power Forward, Center | Points, Rebounds, Assists |
| **Athletics** | Sprinter, Middle Distance, Long Distance, Jumper, Thrower | Time, Distance |
| **Badminton** | Singles, Doubles, Mixed Doubles, All-Rounder | Sets Won, Points |

> **Sport Config** is stored in the `sportconfigs` collection and can be extended without code changes. The scoring metric and unit displayed in every scorecard derive from this config server-side.

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 18.17+ (LTS recommended)
- **pnpm** 8+ (`npm install -g pnpm`)
- A **MongoDB Atlas** cluster (free tier works fine) or a local MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/sportsync.git
cd sportsync
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB connection string (Atlas or local)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/sportsync?retryWrites=true&w=majority

# Session signing secret — must be at least 32 characters
SESSION_SECRET=your-super-secret-signing-key-at-least-32-chars

# Public app URL (used for internal API calls during SSR)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ Never commit `.env.local` to source control. It is already listed in `.gitignore`.

### 4. Seed Sport Configurations (First Run)

The `sportconfigs` collection must be populated before creating matches. The development server will auto-seed on first run if the collection is empty, or you can trigger it manually:

```bash
# Start the dev server — sport configs are seeded automatically
pnpm dev
```

### 5. Create the First Coach Account

Navigate to `http://localhost:3000` and use the **Coach Portal** login. For the initial setup, create a user directly in MongoDB with `role: "COACH"` or use the register endpoint with a temporary admin seed script.

### 6. Run the Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000) with Turbopack enabled for fast HMR.

---

## 🌍 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | Full MongoDB connection string including database name |
| `SESSION_SECRET` | ✅ | Secret used to sign JWT session tokens. Min 32 characters. Rotate this in production. |
| `NEXT_PUBLIC_APP_URL` | ✅ | The base URL of the deployed app (e.g., `https://sportsync.example.com`). Used for server-side fetch calls. |

---

## 📡 API Reference

All API routes are under `/api/`. Authenticated routes require a valid session cookie set by `/api/auth/login`.

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Athlete self-registration (name, email, password, age, sport, skill) |
| `POST` | `/api/auth/login` | Public | Login for all roles; sets httpOnly session cookie |
| `POST` | `/api/auth/logout` | Any | Clears session cookie |
| `GET` | `/api/auth/me` | Any | Returns current authenticated user's info |

### Coach — Players

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/players` | COACH | List all active players with filtering |
| `POST` | `/api/players` | COACH | Create a new player (immediately VERIFIED) |
| `GET` | `/api/players/[id]` | COACH | Get single player detail |
| `PATCH` | `/api/players/[id]` | COACH | Update player fields (name, age, sport, skill, etc.) |
| `POST` | `/api/players/[id]/archive` | COACH | Soft-archive a player (sets `isActive: false`) |

### Coach — Registrations

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/coach/registrations` | COACH | List all PENDING self-registrations |
| `POST` | `/api/coach/registrations/[id]/review` | COACH | Approve or reject a pending registration |

### Coach — Sessions

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sessions` | COACH | List all practice sessions |
| `POST` | `/api/sessions` | COACH | Create a new practice session (date, sport) |
| `GET` | `/api/sessions/[id]` | COACH | Get session detail with full attendance roster |
| `POST` | `/api/sessions/[id]/attendance` | COACH | Mark attendance for players (PRESENT / ABSENT) |
| `POST` | `/api/sessions/[id]/close` | COACH | Permanently lock the session — irreversible |

### Coach — Matches

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/matches` | COACH | List all finalized matches |
| `POST` | `/api/matches` | COACH | Create a match with participants and sport-specific stats |
| `GET` | `/api/matches/[id]` | COACH | Get match detail with full scorecard |

### Coach — Readiness

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/readiness` | COACH | Readiness table for all players (attendance %, matches played, status) |
| `GET` | `/api/coach/overview` | COACH | Dashboard summary stats |

### Player

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/player/me` | PLAYER | Full self-service data: profile, attendance, readiness, match history |

### Scout

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/scout/ready-players` | SCOUT | Paginated list of READY athletes only (supports search & sport filter) |
| `GET` | `/api/scout/ready-players/[id]` | SCOUT | Individual player dossier (attendance evidence + match scores) |

### Utility

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sports` | Any Auth | List available sport configurations |
| `GET` | `/api/health` | Public | Health check with DB connectivity status |

---

## 🗂️ Project Structure

```
SportSync/
├── src/
│   ├── app/
│   │   ├── page.tsx                        # Landing page (glassmorphic hero, role portals)
│   │   ├── globals.css                     # Design tokens, glass utilities, animations
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx              # Unified login for all roles
│   │   │   └── register/page.tsx           # Athlete self-registration with skill selection
│   │   ├── (coach)/coach/
│   │   │   ├── page.tsx                    # Coach dashboard overview
│   │   │   ├── players/page.tsx            # Player management + approval queue
│   │   │   ├── sessions/page.tsx           # Session management + attendance marking
│   │   │   ├── matches/page.tsx            # Match scorecard entry + broadcast view
│   │   │   └── readiness/page.tsx          # Trial readiness overview table
│   │   ├── (player)/player/
│   │   │   └── page.tsx                    # Player self-service portal
│   │   ├── (scout)/scout/
│   │   │   └── page.tsx                    # Scout talent discovery registry
│   │   └── api/
│   │       ├── auth/                       # register, login, logout, me
│   │       ├── coach/                      # overview, registrations
│   │       ├── players/                    # CRUD + archive
│   │       ├── sessions/                   # CRUD + attendance + close
│   │       ├── matches/                    # CRUD + scorecard
│   │       ├── readiness/                  # Readiness table
│   │       ├── player/                     # Player self-data
│   │       ├── scout/                      # Ready-only talent endpoints
│   │       ├── sports/                     # Sport config list
│   │       └── health/                     # Health check
│   ├── models/
│   │   ├── User.ts                         # IUser — id, email, passwordHash, role
│   │   ├── Player.ts                       # IPlayer — name, age, sport, skill, registrationStatus
│   │   ├── Session.ts                      # ISession — date, sport, roster, status (open/closed)
│   │   ├── Match.ts                        # IMatch — date, sport, opponent, participants, stats
│   │   └── SportConfig.ts                  # ISportConfig — sport, scoreMetric, scoreUnit
│   ├── lib/
│   │   ├── auth/
│   │   │   └── session.ts                  # requireRole(), requireUser(), JWT helpers
│   │   ├── constants/
│   │   │   └── skills.ts                   # SPORT_SKILLS map, skill formatters, stat formatters
│   │   ├── db/
│   │   │   └── mongoose.ts                 # Singleton MongoDB connection
│   │   ├── services/
│   │   │   ├── readiness.ts                # calculatePlayerReadiness(), evaluateReadiness()
│   │   │   └── sport-config.ts             # getSportScoreConfig() — server-side only
│   │   └── validation/
│   │       ├── auth.ts                     # registerPlayerSchema, loginSchema
│   │       ├── player.ts                   # createPlayerSchema, updatePlayerSchema
│   │       ├── session.ts                  # createSessionSchema, attendanceSchema
│   │       └── match.ts                    # createMatchSchema, matchParticipantInputSchema
│   └── middleware.ts                       # Route protection + role-based redirect
├── scripts/
│   ├── test-player-management.ts           # 20 automated player management tests
│   ├── test-matches.ts                     # 23 automated match + eligibility tests
│   └── test-readiness.ts                   # 45 automated readiness engine tests
├── public/                                 # Static assets
├── .env.local                              # Environment secrets (not committed)
├── next.config.ts                          # Next.js configuration
├── tailwind.config.ts                      # Tailwind CSS configuration
├── tsconfig.json                           # TypeScript configuration (strict mode)
└── package.json                            # Dependencies and scripts
```

---

## 🧪 Testing

SportSync includes three automated test suites that run against a live MongoDB instance and exercise the full API layer end-to-end.

```bash
# Run all test suites individually
pnpm test:players     # Player management, registration flow, approval/rejection
pnpm test:matches     # Match creation, eligibility enforcement, score validation
pnpm test:readiness   # Readiness engine: edge cases, threshold boundary, dual-condition
```

### Test Coverage

| Suite | Tests | What It Covers |
|---|---|---|
| `test:players` | **20 tests** | Player CRUD, coach creation vs. self-registration, archive, skill assignment, approval queue |
| `test:matches` | **23 tests** | Match creation, participant eligibility (absent player rejection), score validation, sport-specific stat derivation, finalization |
| `test:readiness` | **45 tests** | Below 75% threshold, exactly 75% boundary, above 75%, fewer than 2 matches, exactly 2 matches, zero-session baseline, real-time revocation |

> All test suites must pass before merging to `main`. Run `pnpm typecheck && pnpm lint` to verify TypeScript and ESLint compliance as well.

### Key Test Scenarios

**Three-Player Attendance Scenario** (`test:players`):
- Player A: PRESENT → counted in attendance ratio numerator
- Player B: PRESENT → counted
- Player C: ABSENT → present in roster but not in numerator; session locked, record immutable

**Eligibility Rejection** (`test:matches`):
- An absent player's ID submitted as a match participant → `400 Bad Request` with rejection reason

**Readiness Boundary** (`test:readiness`):
- 3/4 sessions present = `0.75` exactly → `READY: true` (threshold is `≥ 0.75`)
- 2/3 sessions present = `0.666...` → `READY: false`
- 1 finalized match only → `READY: false` even with 100% attendance

---

## 📜 Scripts Reference

```bash
pnpm dev            # Start development server with Turbopack (http://localhost:3000)
pnpm build          # Production build — compiles all 29 routes
pnpm start          # Start production server (requires pnpm build first)
pnpm typecheck      # TypeScript check with no emit (tsc --noEmit)
pnpm lint           # ESLint check across all source files
pnpm format         # Prettier auto-format (writes in place)
pnpm test:players   # Run player management test suite
pnpm test:matches   # Run match and eligibility test suite
pnpm test:readiness # Run readiness engine test suite
```

---

## 🎨 Design System

SportSync uses a **glassmorphic design language** implemented via custom Tailwind CSS utilities defined in `globals.css`:

| Utility | Usage |
|---|---|
| `.glass-panel` | Primary container with frosted-glass backdrop blur and translucent background |
| `.glass-card` | Secondary card surface with lighter opacity, used for list items |
| `.glass-dark` | Dark-tinted glass surface for modals and overlays |

Animations include entrance transitions, shimmer loading states, and smooth status badge transitions. The design is fully responsive across mobile, tablet, and desktop viewports.

---

## 🤝 Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with full TypeScript types and Zod validation on any new API inputs
3. Ensure `pnpm typecheck` and `pnpm lint` both pass with zero errors
4. Add or update tests in `scripts/` for any new business logic
5. Submit a pull request with a clear description of changes

### Code Standards

- All new API routes must call `requireRole()` or `requireUser()` before any business logic
- All POST/PATCH bodies must be validated with a Zod schema before use
- Score metrics and units must always be derived server-side from `SportConfig`; never accept them from the client
- Session closure is irreversible by design — do not add any endpoint that modifies attendance after close

---

## 📄 License

This project is proprietary software developed for **Dumka Sports Academy**.

---

<div align="center">

Built with ⚡ by the SportSync team · Dumka Sports Academy

*Transforming paper notebooks into verified digital records, one player at a time.*

</div>
