# System Architecture

## 1. Recommended stack

- Next.js App Router
- TypeScript with strict mode
- React Server Components for read-heavy pages where appropriate
- Route Handlers for JSON APIs
- MongoDB Atlas
- Mongoose
- Zod for request and environment validation
- Auth.js or a carefully implemented server-side credential/session
  solution
- Tailwind CSS + accessible component primitives
- Vitest/Jest for unit tests; Playwright for end-to-end tests
- Vercel for application hosting

Use one consistent authentication library; do not build custom
cryptography or store raw bearer tokens in localStorage.

## 2. Logical architecture

Browser → Next.js pages/components → Route Handlers →
authorization/service layer → Mongoose models → MongoDB Atlas.

Business rules belong in server-side service functions, not React
components or client-only code.

## 3. Suggested project structure

``` text
src/
  app/
    (auth)/login/page.tsx
    (coach)/coach/page.tsx
    (coach)/coach/players/page.tsx
    (coach)/coach/sessions/page.tsx
    (coach)/coach/matches/page.tsx
    (coach)/coach/readiness/page.tsx
    (player)/player/page.tsx
    (scout)/scout/page.tsx
    api/
      auth/[...]/route.ts
      players/route.ts
      players/[id]/route.ts
      sessions/route.ts
      sessions/[id]/attendance/route.ts
      sessions/[id]/close/route.ts
      matches/route.ts
      matches/[id]/route.ts
      scout/ready-players/route.ts
      player/me/route.ts
  components/
  lib/
    auth/
    db/
    validation/
    permissions/
    services/
    readiness/
  models/
  types/
tests/
  unit/
  integration/
  e2e/
```

## 4. Authorization design

- `requireUser()` resolves the authenticated user from a verified
  server-side session.
- `requireRole("COACH")`, `requireRole("PLAYER")`, and
  `requireRole("SCOUT")` guard route handlers.
- Coach-only services receive the authenticated coach ID from the
  session, never from request JSON.
- Player self-service service obtains `playerId` from the authenticated
  account’s `playerId` link. Ignore/reject any `playerId` query/body
  field.
- Scout service applies the Ready predicate before selecting/serializing
  player data. Do not fetch all players and rely on the UI to hide rows.
- Return 404 for a player record outside the caller’s visibility scope
  where this avoids confirming that the record exists.

## 5. Core service functions

- `registerPlayer(input)`
- `reviewPlayerRegistration(playerId, decision, coachId)`
- `createPlayer(input, coachId)` (coach-created profile only if needed for migration/admin)
- `updatePlayer(playerId, input, coachId)`
- `archivePlayer(playerId, coachId)`
- `openSession({ date, sport }, coachId)`
- `markAttendance(sessionId, playerId, status, coachId)`
- `closeSession(sessionId, coachId)`
- `createMatch({ sessionId, date, sport, opponent, participants }, coachId)`
- `getPlayerStats(playerId)`
- `getReadyPlayersForScout(filters?)`

## 6. Readiness calculation

For player P: - Select CLOSED sessions where `sport` matches P.sport and
`date >= P.createdAt` (academy-local calendar date). -
`held = count(sessions)`. -
`present = count(attendance rows in those sessions for P with status PRESENT)`. -
`attendanceRate = held === 0 ? 0 : present / held`. -
`matchesPlayed = count(finalized matches containing P as a participant)`. -
`isReady = attendanceRate >= 0.75 && matchesPlayed >= 2`.

Avoid rounding before comparison. A displayed `75.0%` must not
accidentally make a 74.96% player Ready.

## 7. Concurrency and consistency

- Opening a session snapshots the eligible player roster at that moment.
- Marking attendance is permitted only while session status is OPEN.
- Closing must be atomic: verify every roster row has a status, then
  update status/closed metadata. Use a transaction or conditional update
  that prevents concurrent marks after closure.
- Match creation re-reads the closed session and validates every
  participant against its saved attendance rows.
- Prefer MongoDB transactions for match insertion and related writes if
  more than one document is written. Atlas replica sets support
  transactions.
- Add idempotency or duplicate protection for accidental double
  submission where practical.

## 8. Deployment

- MongoDB Atlas database and restricted database user.
- Vercel project connected to Git repository.
- Environment variables: `MONGODB_URI`, `AUTH_SECRET`, `APP_BASE_URL`,
  and any auth-provider-specific values.
- Use separate development and production databases.
- Run migrations/index setup and secure coach seed as controlled
  deployment steps.
- Add health endpoint that checks app process and database connectivity
  without exposing secrets.
- Configure production domain and HTTPS.
