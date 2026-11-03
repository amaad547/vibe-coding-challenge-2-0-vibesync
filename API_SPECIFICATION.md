# API Specification

Base path: `/api`. JSON request and response bodies. All routes except
login require an authenticated session.

## Authentication

Use the chosen auth library’s standard login/logout endpoints. The role
is loaded from the database. Do not accept a role in login payload as
proof of role.

## Coach endpoints

### `GET /api/players`

Role: COACH  
Returns active and archived players (support
`status=active|archived|all`).

### `POST /api/players`

Role: COACH  
Request:

``` json
{ "name": "Aarav", "age": 17, "sport": "Football", "email": "player@example.com", "temporaryPassword": "..." }
```

Creates player and linked PLAYER user account. In production prefer a
one-time invite/reset flow over sending a permanent password. If account
creation is not requested, player profile may be created first and
account linked later. Response:
`{ "player": { ... }, "userInvite": { ... } }` (never return password
hash).

### `PATCH /api/players/:id`

Role: COACH  
Request may contain `name`, `age`, `sport`. Validate all supplied
fields. If sport changes, readiness is recalculated against the new
sport from the effective date; MVP recommendation: do not permit sport
changes after the player has attendance or match history. Require
archive + create a new player instead, or add a future sport-history
model.

### `POST /api/players/:id/archive`

Role: COACH  
Archives player; historical records remain.

### `GET /api/sessions`

Role: COACH  
List sessions with date, sport, status, and attendance summary.

### `POST /api/sessions`

Role: COACH  
Request:

``` json
{ "date": "2026-11-03", "sport": "Football" }
```

Server snapshots active players for the sport and creates OPEN session.
Reject duplicate date/sport session.

### `GET /api/sessions/:id`

Role: COACH  
Returns session and roster.

### `PUT /api/sessions/:id/attendance`

Role: COACH  
Request:

``` json
{ "marks": [{ "playerId": "OBJECT_ID", "status": "PRESENT" }, { "playerId": "OBJECT_ID", "status": "ABSENT" }] }
```

Only allowed while OPEN. IDs must be in the session roster. The request
may update a subset while open; closing still requires all roster
entries marked. Reject unknown players and invalid statuses.

### `POST /api/sessions/:id/close`

Role: COACH  
No body required. Server verifies all roster entries are marked and
atomically closes/locks session. Repeated close returns conflict or the
already-closed representation; choose consistent idempotent behavior.

### `POST /api/matches`

Role: COACH  
Request:

``` json
{
  "sessionId": "OBJECT_ID",
  "date": "2026-11-03",
  "sport": "Football",
  "opponent": "City Academy",
  "participants": [
    { "playerId": "OBJECT_ID", "score": 2 },
    { "playerId": "OBJECT_ID", "score": 1 }
  ]
}
```

Server verifies linked session is CLOSED, date and sport match,
participants are unique, and every participant is PRESENT in the
session. Reject absent player with `409 PLAYER_NOT_ELIGIBLE`. At least
one participant required.

### `GET /api/matches`

Role: COACH  
Returns match history, with filters for date/sport/player.

### `GET /api/readiness`

Role: COACH  
Returns all active players with attendance numerator, denominator,
percentage, matches played, and `isReady`.

## Scout endpoint

### `GET /api/scout/ready-players`

Role: SCOUT  
Returns only Ready players, including approved profile details and sport-specific match history/scores. Any scout detail route must re-check Ready status. Apply readiness
predicate server-side. Do not return a total count of all players or Not
Ready players. Filters/search must be applied only to the Ready subset.

## Player endpoint

### `GET /api/player/me`

Role: PLAYER  
Returns the authenticated player’s own profile, attendance summary,
readiness, and match history/scores. The server derives player ID from
the authenticated user. Ignore or reject any supplied player ID.

## Response examples

Success:

``` json
{ "data": { "id": "...", "name": "Aarav" } }
```

Error:

``` json
{ "error": { "code": "PLAYER_NOT_ELIGIBLE", "message": "Only players marked Present in the linked session can be added." } }
```

## Status codes

- 200: successful read/update
- 201: created
- 400: malformed or invalid input
- 401: no valid login
- 403: role not allowed
- 404: missing resource or resource outside caller’s visibility
- 409: duplicate, locked session, or business-rule conflict
- 500: unexpected error

## API security checklist

- Validate ObjectIds and all request bodies with Zod.
- Never trust IDs, role, creator, status, readiness, or attendance
  supplied by client.
- Scope every query by role.
- Avoid mass assignment: explicitly pick allowed fields.
- Do not serialize passwordHash or internal auth data.
- Add rate limiting to login and sensitive endpoints.
