# Software Requirements Specification (SRS)

## 1. System overview

A responsive web application for one sports academy. The system stores
player profiles, practice sessions, attendance, matches, and derived
readiness. It has three authenticated roles: Coach, Player, Scout.

## 2. Functional requirements

### FR-AUTH

- FR-AUTH-01: The system shall authenticate users using email/username
  and password.
- FR-AUTH-02: The system shall load role and linked player ID from the
  database/session.
- FR-AUTH-03: The system shall deny access when the user is
  unauthenticated.
- FR-AUTH-04: The system shall deny operations not permitted to the
  user’s role.
- FR-AUTH-05: Public registration shall be disabled.
- FR-AUTH-06: Password reset or credential reset shall be coach/operator
  controlled for MVP.

### FR-PLAYER

- FR-PLAYER-01: Coach shall create a player with name, age, and sport.
- FR-PLAYER-02: Coach shall view and update player details.
- FR-PLAYER-03: Coach shall archive a player; historical records shall
  remain.
- FR-PLAYER-04: Player shall view only their own profile and derived
  records.
- FR-PLAYER-05: Scout shall not access the general player directory.

### FR-SESSION

- FR-SESSION-01: Coach shall open a session with a valid date and sport.
- FR-SESSION-02: On opening, the system shall snapshot all active
  players for that sport into the session roster.
- FR-SESSION-03: Each roster entry shall have exactly one status:
  PRESENT or ABSENT.
- FR-SESSION-04: Coach shall be able to save attendance marks while the
  session is OPEN.
- FR-SESSION-05: Coach shall close a session only when all roster
  entries are marked.
- FR-SESSION-06: Closing shall atomically change the session to CLOSED
  and lock all attendance entries.
- FR-SESSION-07: Closed sessions shall be read-only.
- FR-SESSION-08: Only CLOSED sessions shall count in attendance.
- FR-SESSION-09: A player added after a session opens shall not be added
  to that session’s roster.

### FR-MATCH

- FR-MATCH-01: Coach shall create a match with date, sport, opponent,
  and linked session.
- FR-MATCH-02: The linked session shall be CLOSED and match date/sport
  must equal session date/sport.
- FR-MATCH-03: A participant must be a roster member marked PRESENT in
  the linked session.
- FR-MATCH-04: Each participant shall have one numeric score; zero is
  valid.
- FR-MATCH-05: Duplicate participants shall be rejected.
- FR-MATCH-06: The server shall validate all participants; client-side
  validation is supplementary only.
- FR-MATCH-07: A match shall be finalized only when it has at least one
  participant and all participant scores are valid.
- FR-MATCH-08: Finalized match records shall be read-only in MVP.

### FR-READY

- FR-READY-01: Attendance shall be calculated from closed sessions for
  the player’s sport since player creation.
- FR-READY-02: Attendance percentage shall be present count divided by
  closed session count.
- FR-READY-03: If denominator is zero, attendance shall be 0%.
- FR-READY-04: Ready shall mean attendance \>= 75% AND finalized matches
  played \>= 2.
- FR-READY-05: The server shall calculate readiness at request time or
  from a safely invalidated derived cache.
- FR-READY-06: Scout queries shall return Ready players only, including their approved profile details and match history/scores.
- FR-READY-07: Scout profile/detail endpoints shall verify the player's current Ready status on every request.
- FR-READY-08: Player accounts with PENDING or REJECTED verification status shall not authenticate.
- FR-READY-07: Player queries shall be scoped to the authenticated
  user’s linked player ID.

### FR-AUDIT

- FR-AUDIT-01: Created/updated timestamps shall be stored.
- FR-AUDIT-02: Session and match records shall record the coach user ID
  that created them.
- FR-AUDIT-03: Closing a session shall record closedAt and closedBy.

## 3. Non-functional requirements

- NFR-SEC-01: Hash passwords with Argon2id or bcrypt using a current
  secure configuration.
- NFR-SEC-02: Use secure, HttpOnly, SameSite cookies for session tokens.
- NFR-SEC-03: Enforce authorization in server-side route
  handlers/services.
- NFR-SEC-04: Validate and normalize all input on the server.
- NFR-SEC-05: Rate-limit login attempts and avoid revealing whether an
  account exists.
- NFR-SEC-06: Protect state-changing requests against CSRF as
  appropriate to the chosen auth design.
- NFR-PRIV-01: Player endpoints shall never accept a client-selected
  player ID for self-service access.
- NFR-PRIV-02: Scout endpoints shall never return non-Ready player data.
- NFR-DATA-01: Use database transactions where multi-document
  consistency is required and supported by the MongoDB deployment.
- NFR-DATA-02: Enforce unique and query-supporting indexes.
- NFR-UX-01: Responsive layout for phone, tablet, and desktop.
- NFR-UX-02: Show clear empty, loading, validation, and error states.
- NFR-REL-01: Handle database/network failures without reporting false
  success.
- NFR-DEPLOY-01: Production secrets shall be configured through
  deployment environment variables.
- NFR-OBS-01: Log server errors and important record lifecycle events
  without logging passwords or session tokens.

## 4. Validation rules

- Name: trimmed, 2–80 characters.
- Age: integer from 5 through 100.
- Sport: trimmed, 2–40 characters; normalize casing for comparisons.
- Session date: valid ISO date; use academy timezone `Asia/Kolkata`.
- Opponent: trimmed, 2–80 characters.
- Score: finite number \>= 0; optional decimal precision may be
  sport-dependent, but MVP accepts up to 2 decimal places.
- Attendance: only PRESENT or ABSENT; no null when closing.
- Match participants: unique player IDs; at least one participant.
- Session: one session per sport/date in MVP to avoid ambiguous same-day
  match linking. If multiple sessions are needed later, remove this
  constraint and require explicit session selection.

## 5. Error behavior

Return consistent JSON:
`{ "error": { "code": "CODE", "message": "Human-readable message", "details": {} } }`
Use suitable HTTP status codes: 400 validation, 401 unauthenticated, 403
forbidden, 404 missing/not visible, 409 conflict/locked/duplicate, 500
unexpected server error.
