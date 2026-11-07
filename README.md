<div align="center">

# ⚡ SportSync

### *Dumka Sports Academy Management Desk*

**Your Academy. Your Performance. Your Future.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge)](https://zod.dev/)
[![Dark Mode](https://img.shields.io/badge/Theme-Light%20%7C%20Dark-6366F1?style=for-the-badge&logo=halfmoon)](https://vc2-vibesync.vercel.app/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-vc2--vibesync.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://vc2-vibesync.vercel.app/)

</div>

> 🌐 **Live App**: [https://vc2-vibesync.vercel.app/](https://vc2-vibesync.vercel.app/)
>
> coach email : coach@dumkasports.org
> coach password : coach@dumka123
>
> scout email : scout@dumkasports.org
> scout password : scout@sport123

---

## 📋 Overview

**SportSync** is a full-stack sports academy management platform built for **Dumka Sports Academy**. It replaces paper-based registers and spreadsheets with a secure, role-aware digital system that tracks players from registration all the way through trial readiness — with tamper-proof attendance records, sport-specific match scorecards, a full training & match calendar, and an independent scout discovery portal.

The system is built around three distinct role portals — **Coach**, **Player**, and **Scout** — each with server-enforced access rules. No client-side filtering is trusted for security-sensitive data; every critical invariant (attendance locks, readiness thresholds, scout eligibility, calendar permissions) is enforced at the API layer.

---

## ✨ Key Features

### 🏋️ Coach Portal

- **Player Management** — Add players directly (instantly verified) or manage the self-registration approval queue (Approve / Reject)
- **Practice Session Management** — Create sessions by date and sport, mark each eligible player PRESENT or ABSENT, then lock sessions permanently
- **Immutable Attendance Locks** — Once a session is closed, attendance records cannot be modified through any UI action or direct API call
- **Match Scorecard Recording** — Create match records linked to closed practice sessions; only players marked PRESENT in the linked session may be added
- **Sport-Specific Statistics** — Cricket: runs & wickets per player role; Football: goals & assists; Athletics & Badminton supported
- **Trial Readiness Overview** — See every player's live readiness status (attendance %, matches played, READY / NOT READY) in a single dashboard view
- **Dashboard Overview** — Aggregated stats: total players, pending registrations, open sessions, upcoming matches
- **Training & Match Calendar** — Full calendar module with Month / Week / Day / List views; create, edit and cancel training sessions and match fixtures with duplicate-prevention checks; link sessions and matches to existing attendance/match modules; cancellation requires a reason
- **Coach Profile** — Edit personal info and academy contact details (phone, office phone, address, hours, emergency contact); changes automatically reflect on the public landing page contact section

### 👟 Player Portal

- **Trial Readiness & Overview** — Dual-condition progress indicator: attendance ≥ 75% AND matches played ≥ 2 (both must pass); scout visibility status shown live
- **Upcoming Schedule & Calendar** — Read-only view of all upcoming training sessions and match fixtures; identical visual layout to the coach calendar
- **Practice Attendance Log** — Full history of closed sessions with PRESENT / ABSENT status per session and running attendance percentage
- **Match Performances** — Broadcast-style performance lines per match (e.g., *"45 Runs · Batsman"*, *"2 Goals · Striker"*) across all finalized fixtures
- **Shared Responsive Navbar** — Tab-based navigation between the four player pages with mobile hamburger drawer; active route highlighted
- **Self-Registration with Skill Selection** — Players choose their sport and position/skill at sign-up; account starts PENDING until coach approves

### 🔭 Scout Portal

- **Talent Discovery Registry** — Paginated, filterable list of READY athletes only
- **Player Dossiers** — Full profile with verified attendance evidence and match performance history
- **Real-Time Access Revocation** — If a player's readiness drops below threshold, they immediately disappear from scout view — no manual intervention required
- **Server-Side Enforcement** — Scout API endpoints reject non-ready players even on direct API calls; frontend filtering is never the sole guard

### 🌐 Landing Page

- **Responsive Navbar** — Sticky navigation with mobile hamburger menu; Register / Login button moves into the hamburger drawer on small screens
- **Dynamic Contact Section** — Phone, office phone, address, office hours and emergency contact are read live from the coach's profile — no hardcoding needed
- **Role Portals Showcase** — Visual entry points to Coach, Player and Scout portals

### 🌙 Global Light / Dark Theme

- **Instant Toggle** — Single-click button in every navbar switches between Light and Dark mode; no dropdowns, no delays
- **Three Brand Color Palettes** — Light (`#F8FAFC` background, `#0B1736` text, `#1769FF` accent) and Dark (`#0B1120` background, `#F8FAFC` text, `#4B8BFF` accent) with full surface, border, and muted token coverage
- **Persistent** — Theme selection saved in `localStorage` and restored on every page load, navigation, and after logout/login
- **Anti-FOUC** — Synchronous inline `<ThemeScript />` in `<head>` reads `localStorage` before first paint — zero flash of wrong theme
- **Accessible** — Respects `prefers-reduced-motion`; full keyboard focus, `aria-label`, and smooth transitions on color and border properties
- **Universal Coverage** — Toggle present in Landing Navbar, Coach Topbar, Player Navbar, Scout Header, and Auth Pages (Login & Register)
- **Demo Credentials Autofill** — Login page displays clickable credential cards for Coach and Scout demo accounts that autofill both fields on click

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
| **Calendar Duplicate Prevention** | No two activities may share the same date, sport, type, and overlapping time slot. The server rejects the request with `409 Conflict`. |
| **Scheduling Invariant** | Adding a match to the calendar does **not** auto-finalize it or create scores. Calendar events and match scorecards are independent. |
| **Calendar Player RBAC** | Players receive `HTTP 200` on `GET /api/activities`; any create / edit / cancel / delete attempt returns `HTTP 403 Forbidden`. |
| **Dynamic Activity Status** | An activity auto-resolves to `COMPLETED` when its linked Session is `CLOSED` or its linked Match is `FINALIZED`. |
| **Coach Profile → Landing Page Sync** | Contact details (phone, office phone, address, hours, emergency contact) are served dynamically from the coach's profile record to the public landing page. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15.5](https://nextjs.org/) — App Router, Server Components, Server Actions |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) — strict mode, full type coverage |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) via [Mongoose 8](https://mongoosejs.com/) ODM |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) with custom glassmorphic design system + Light/Dark CSS tokens |
| **Validation** | [Zod](https://zod.dev/) — server-side schema validation on all API inputs |
| **Authentication** | JWT tokens stored in `httpOnly` cookies; `iron-session`-style session management |
| **Route Protection** | Next.js `middleware.ts` with role-based redirect logic |
| **Theming** | Native `ThemeProvider` + `ThemeScript` (zero dependencies, anti-FOUC, `localStorage` persistence) |

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
│  /api/activities/**  │  /api/contact  │  /api/sports        │
│  Auth: requireRole()  │  Zod validation on every mutation   │
│  Business logic: Readiness, Sport Config, Calendar Services │
└───────────────────────────┬─────────────────────────────────┘
                            │  Mongoose ODM
┌───────────────────────────▼─────────────────────────────────┐
│                      MongoDB Atlas                          │
│  users │ players │ sessions │ matches │ sportconfigs        │
│  activities                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Core Services

| Service | File | Responsibility |
|---|---|---|
| **Readiness Service** | `src/lib/services/readiness.ts` | `calculatePlayerReadiness()` — queries closed sessions & finalized matches, applies dual-condition logic |
| **Sport Config Service** | `src/lib/services/sport-config.ts` | `getSportScoreConfig()` — server-only lookup; derives `scoreMetric` & `scoreUnit` from DB |
| **Contact Service** | `src/lib/services/contact.ts` | `getAcademyContact()` — reads coach profile contact fields for the public landing page |
| **Session Auth** | `src/lib/auth/session.ts` | `requireRole()`, `requireUser()` — extracts and validates JWT from cookie |
| **Skills Registry** | `src/lib/constants/skills.ts` | `SPORT_SKILLS` map, `getSkillsForSport()`, `formatMatchPerformance()` |

---

## ⚽ Sports & Skills Supported

| Sport | Positions / Skills | Match Stats |
|---|---|---|
| **Football** | Forward/Striker, Midfielder, Defender, Goalkeeper | Goals, Assists |
| **Cricket** | Batsman, Bowler, All-Rounder, Wicketkeeper | Runs, Wickets |
| **Athletics** | Sprinter, Middle Distance, Long Distance, Jumper, Thrower | Time, Distance |
| **Badminton** | Singles, Doubles, Mixed Doubles, All-Rounder | Sets Won, Points |

> **Sport Config** is stored in the `sportconfigs` collection and can be extended without code changes. The scoring metric and unit displayed in every scorecard derive from this config server-side.

---

## 🚀 Deployment

The app is deployed on **Vercel** and available at:

**[https://vc2-vibesync.vercel.app/](https://vc2-vibesync.vercel.app/)**

The `main` branch is connected to Vercel for automatic deployments — every push to `main` triggers a new production build.

| Portal | URL |
|---|---|
| **Landing Page** | [https://vc2-vibesync.vercel.app/](https://vc2-vibesync.vercel.app/) |
| **Coach Login** | [https://vc2-vibesync.vercel.app/login](https://vc2-vibesync.vercel.app/login) |
| **Player Login** | [https://vc2-vibesync.vercel.app/login](https://vc2-vibesync.vercel.app/login) |
| **Scout Login** | [https://vc2-vibesync.vercel.app/login](https://vc2-vibesync.vercel.app/login) |

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 18.17+ (LTS recommended)
- **pnpm** 8+ (`npm install -g pnpm`)
- A **MongoDB Atlas** cluster (free tier works fine) or a local MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/amaad547/vibe-coding-challenge-2-0-vibesync.git
cd SportSync
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

### Coach — Profile

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/coach/profile` | COACH | Retrieve coach profile (personal info + academy contact details) |
| `PATCH` | `/api/coach/profile` | COACH | Update coach profile; changes are immediately reflected on the landing page contact section |

### Calendar Activities

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/activities` | Any Auth | List all activities (supports `sport`, `type`, `status`, `from`, `to` query params) |
| `POST` | `/api/activities` | COACH | Create a training session or match fixture; validates for duplicate time slot |
| `GET` | `/api/activities/[id]` | Any Auth | Get single activity detail |
| `PATCH` | `/api/activities/[id]` | COACH | Update activity fields (title, date, time, venue, notes, etc.) |
| `DELETE` | `/api/activities/[id]` | COACH | Delete an activity permanently |
| `POST` | `/api/activities/[id]/cancel` | COACH | Cancel an activity with a mandatory reason; sets `status: CANCELLED` and `cancelledAt` |

### Player

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/player/me` | PLAYER | Full self-service data: profile, attendance, readiness, match history |

### Scout

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/scout/ready-players` | SCOUT | Paginated list of READY athletes only (supports search & sport filter) |
| `GET` | `/api/scout/ready-players/[id]` | SCOUT | Individual player dossier (attendance evidence + match scores) |

### Contact

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/contact` | Public | Submit a contact form message; stored against the academy contact record |

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
│   │   ├── page.tsx                        # Landing page (glassmorphic hero, role portals, dynamic contact)
│   │   ├── globals.css                     # Design tokens, glass utilities, light/dark CSS variables, animations
│   │   ├── layout.tsx                      # Root layout — ThemeScript (anti-FOUC) + ThemeProvider
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx              # Unified login for all roles + demo credential autofill cards
│   │   │   └── register/page.tsx           # Athlete self-registration with skill selection
│   │   ├── (coach)/coach/
│   │   │   ├── page.tsx                    # Coach dashboard overview
│   │   │   ├── players/page.tsx            # Player management + approval queue
│   │   │   ├── sessions/page.tsx           # Session management + attendance marking
│   │   │   ├── matches/page.tsx            # Match scorecard entry + broadcast view
│   │   │   ├── readiness/page.tsx          # Trial readiness overview table
│   │   │   ├── calendar/page.tsx           # Training & Match Calendar (Month/Week/Day/List views)
│   │   │   └── profile/page.tsx            # Coach profile editor; syncs to landing page contact
│   │   ├── (player)/player/
│   │   │   ├── page.tsx                    # Trial Readiness & Overview
│   │   │   ├── calendar/page.tsx           # Upcoming Schedule & Calendar (read-only)
│   │   │   ├── sessions/page.tsx           # Practice Attendance Log
│   │   │   └── matches/page.tsx            # Match Performances & Score Ledger
│   │   ├── (scout)/scout/
│   │   │   └── page.tsx                    # Scout talent discovery registry
│   │   └── api/
│   │       ├── auth/                       # register, login, logout, me
│   │       ├── coach/                      # overview, registrations, profile
│   │       ├── players/                    # CRUD + archive
│   │       ├── sessions/                   # CRUD + attendance + close
│   │       ├── matches/                    # CRUD + scorecard
│   │       ├── readiness/                  # Readiness table
│   │       ├── activities/                 # Calendar CRUD + cancel endpoint
│   │       ├── player/                     # Player self-data
│   │       ├── scout/                      # Ready-only talent endpoints
│   │       ├── contact/                    # Public contact form submission
│   │       ├── sports/                     # Sport config list
│   │       └── health/                     # Health check
│   ├── components/
│   │   ├── theme/
│   │   │   ├── theme-provider.tsx          # ThemeProvider context + ThemeScript (anti-FOUC) + useTheme hook
│   │   │   └── theme-toggle.tsx            # One-click Light/Dark toggle button (Sun/Moon icon)
│   │   ├── layout/
│   │   │   ├── landing-navbar.tsx          # Responsive landing navbar with mobile hamburger + ThemeToggle
│   │   │   ├── player-navbar.tsx           # Shared player tab navbar with active route & mobile drawer + ThemeToggle
│   │   │   ├── topbar.tsx                  # Coach/Scout topbar with ThemeToggle
│   │   │   ├── sidebar.tsx                 # Coach sidebar with dark mode styling
│   │   │   └── app-shell.tsx               # Layout shell: Sidebar + Topbar
│   │   └── ui/
│   │       ├── button.tsx                  # Button component with dark mode variants
│   │       ├── card.tsx                    # Card + CardHeader/Title/Description/Content with dark mode
│   │       ├── badge.tsx                   # Badge variants (primary/success/warning/danger/info/neutral) with dark mode
│   │       ├── input.tsx                   # Input with dark background, border, placeholder styling
│   │       ├── modal.tsx                   # Modal dialog with dark backdrop and surface
│   │       └── table.tsx                   # Table with dark header, row, and border styling
│   ├── models/
│   │   ├── User.ts                         # IUser — id, email, passwordHash, role
│   │   ├── Player.ts                       # IPlayer — name, age, sport, skill, registrationStatus
│   │   ├── Session.ts                      # ISession — date, sport, roster, status (open/closed)
│   │   ├── Match.ts                        # IMatch — date, sport, opponent, participants, stats
│   │   ├── SportConfig.ts                  # ISportConfig — sport, scoreMetric, scoreUnit
│   │   └── Activity.ts                     # IActivity — type, status, date, time, endTime, venue, opponent, notes, sessionId, matchId, createdBy, cancelledAt, cancelReason
│   ├── lib/
│   │   ├── auth/
│   │   │   └── session.ts                  # requireRole(), requireUser(), JWT helpers
│   │   ├── constants/
│   │   │   └── skills.ts                   # SPORT_SKILLS map, skill formatters, stat formatters
│   │   ├── db/
│   │   │   └── mongoose.ts                 # Singleton MongoDB connection
│   │   ├── services/
│   │   │   ├── readiness.ts                # calculatePlayerReadiness(), evaluateReadiness()
│   │   │   ├── sport-config.ts             # getSportScoreConfig() — server-side only
│   │   │   └── contact.ts                  # getAcademyContact() — reads coach profile for landing page
│   │   └── validation/
│   │       ├── auth.ts                     # registerPlayerSchema, loginSchema
│   │       ├── player.ts                   # createPlayerSchema, updatePlayerSchema
│   │       ├── session.ts                  # createSessionSchema, attendanceSchema
│   │       ├── match.ts                    # createMatchSchema, matchParticipantInputSchema
│   │       └── activity.ts                 # createActivitySchema, updateActivitySchema, cancelActivitySchema
│   └── middleware.ts                       # Route protection + role-based redirect
├── scripts/
│   ├── test-player-management.ts           # 20 automated player management tests
│   ├── test-matches.ts                     # 23 automated match + eligibility tests
│   ├── test-readiness.ts                   # 45 automated readiness engine tests
│   ├── test-attendance.ts                  # 18 automated attendance workflow tests
│   ├── test-calendar.ts                    # 36 automated calendar module tests
│   └── test-acceptance.ts                  # 48 Phase 8 acceptance & security tests
├── public/                                 # Static assets
├── .env.local                              # Environment secrets (not committed)
├── .gitignore                              # Includes /Rules/, .env*.local, .next/, node_modules/
├── next.config.ts                          # Next.js configuration
├── tailwind.config.ts                      # Tailwind CSS configuration with darkMode: "class"
├── tsconfig.json                           # TypeScript configuration (strict mode)
└── package.json                            # Dependencies and scripts
```

---

## 🧪 Testing

SportSync includes six automated test suites that run against a live MongoDB instance and exercise the full API layer end-to-end.

```bash
# Run all test suites individually
pnpm test:players     # Player management, registration flow, approval/rejection
pnpm test:matches     # Match creation, eligibility enforcement, score validation
pnpm test:readiness   # Readiness engine: edge cases, threshold boundary, dual-condition
pnpm test:attendance  # Attendance workflow: session creation, marking, locking
pnpm test:calendar    # Calendar module: CRUD, permissions, duplicate prevention, cancellation
pnpm test:acceptance  # Phase 8: acceptance scenarios, security, role boundary enforcement
```

### Test Coverage

| Suite | Tests | What It Covers |
|---|---|---|
| `test:players` | **20 tests** | Player CRUD, coach creation vs. self-registration, archive, skill assignment, approval queue |
| `test:matches` | **23 tests** | Match creation, participant eligibility (absent player rejection), score validation, sport-specific stat derivation, finalization |
| `test:readiness` | **45 tests** | Below 75% threshold, exactly 75% boundary, above 75%, fewer than 2 matches, exactly 2 matches, zero-session baseline, real-time revocation |
| `test:attendance` | **18 tests** | Session creation, attendance marking, immutable lock enforcement, closed-session rejection |
| `test:calendar` | **36 tests** | Activity creation (TRAINING & MATCH types), edit, cancel with reason, duplicate slot rejection, player RBAC (403 on mutations), status auto-resolution |
| `test:acceptance` | **48 tests** | Four acceptance scenarios end-to-end: three-player attendance, absent player match rejection, 75% readiness boundary, scout sees only READY players |

> All test suites must pass before merging to `main`. Run `pnpm typecheck && pnpm lint` to verify TypeScript and ESLint compliance as well.

### Key Test Scenarios

**Three-Player Attendance Scenario** (`test:players`, `test:acceptance`):
- Player A: PRESENT → counted in attendance ratio numerator
- Player B: PRESENT → counted
- Player C: ABSENT → present in roster but not in numerator; session locked, record immutable

**Eligibility Rejection** (`test:matches`, `test:acceptance`):
- An absent player's ID submitted as a match participant → `400 Bad Request` with rejection reason

**Readiness Boundary** (`test:readiness`, `test:acceptance`):
- 3/4 sessions present = `0.75` exactly → `READY: true` (threshold is `≥ 0.75`)
- 2/3 sessions present = `0.666...` → `READY: false`
- 1 finalized match only → `READY: false` even with 100% attendance

**Scout Access Control** (`test:acceptance`):
- `GET /api/scout/ready-players` returns only players with `isReady: true`
- Directly requesting a non-ready player by ID returns `404` from the scout endpoint

**Calendar RBAC** (`test:calendar`):
- Player token: `GET /api/activities` → `200 OK`
- Player token: `POST /api/activities` → `403 Forbidden`
- Player token: `POST /api/activities/[id]/cancel` → `403 Forbidden`

---

## 📜 Scripts Reference

```bash
pnpm dev              # Start development server with Turbopack (http://localhost:3000)
pnpm build            # Production build — compiles all 36 routes
pnpm start            # Start production server (requires pnpm build first)
pnpm typecheck        # TypeScript check with no emit (tsc --noEmit)
pnpm lint             # ESLint check across all source files
pnpm format           # Prettier auto-format (writes in place)
pnpm test:players     # Run player management test suite (20 tests)
pnpm test:matches     # Run match and eligibility test suite (23 tests)
pnpm test:readiness   # Run readiness engine test suite (45 tests)
pnpm test:attendance  # Run attendance workflow test suite (18 tests)
pnpm test:calendar    # Run calendar module test suite (36 tests)
pnpm test:acceptance  # Run Phase 8 acceptance & security test suite (48 tests)
```

---

## 🎨 Design System

SportSync uses a **glassmorphic design language** implemented via custom Tailwind CSS utilities defined in `globals.css`:

| Utility | Usage |
|---|---|
| `.glass-panel` | Primary container with frosted-glass backdrop blur and translucent background |
| `.glass-card` | Secondary card surface with lighter opacity, used for list items |
| `.glass-dark` | Dark-tinted glass surface for modals and overlays |

### Light / Dark Theme Tokens

The theme system uses CSS variables mapped to Tailwind tokens via `darkMode: "class"` in `tailwind.config.ts`. Switching the `.dark` class on `<html>` instantly re-maps all surfaces and typography.

| Token | Light | Dark |
|---|---|---|
| `--background` | `#F8FAFC` | `#0B1120` |
| `--surface` | `#FFFFFF` | `#111C30` |
| `--foreground` | `#0B1736` | `#F8FAFC` |
| `--muted-foreground` | `#64748B` | `#94A3B8` |
| `--brand-primary` | `#1769FF` | `#4B8BFF` |
| `--border` | `#E2E8F0` | `#26344B` |

Animations include entrance transitions, shimmer loading states, and smooth status badge transitions. The design is fully responsive across mobile, tablet, and desktop viewports. Both the landing page and player portal use dedicated responsive navbar components with mobile hamburger drawers.

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
- Calendar activities must be validated for duplicate time slots server-side before insertion
- Contact details on the landing page must always come from `getAcademyContact()` — never hardcoded

---

## 📄 License

This project is proprietary software developed for **Dumka Sports Academy**.

---

<div align="center">

Built with ⚡ by the SportSync team · Dumka Sports Academy

*Transforming paper notebooks into verified digital records, one player at a time.*

</div>
