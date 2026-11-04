# Product Requirements Document (PRD)

## Dumka Sports Academy Desk

### 1. Product vision

Replace the academy’s attendance and match notebook with a simple,
reliable desk that tells the coach who belongs to the academy, who
attended practice, what happened in matches, and which players currently
meet the trial-readiness criteria.

### 2. Problem

The coach runs one sports academy in Dumka. Players attend practice and
matches, but records are maintained in a notebook. It is difficult to
reliably answer: - Who skipped a practice session? - Which players
attended a particular session? - Which players played in a match and
what score did each record? - Which players meet the defined readiness
criteria for a trial?

### 3. Goals

- Maintain one accurate player register.
- Record attendance for each dated sport session.
- Prevent attendance records from changing after a session is closed.
- Record match participation and individual scores without including
  absent players.
- Calculate attendance and readiness consistently.
- Give scouts a restricted list of Ready players.
- Give each player access only to their own record.

### 4. Non-goals for MVP

- Multiple academies or academy subscription billing.
- Payments, fees, expenses, or payroll.
- Scheduling, notifications, chat, or parent accounts.
- Public player registration.
- Scout editing, player editing, or score entry.
- Video uploads, biometrics, GPS, or performance analytics beyond the
  defined score and readiness rules.
- Cross-sport score comparisons or automatic talent ranking.
- Trial booking or scout-player messaging.

### 5. Users and permissions

**Coach** - Owns the academy workspace. - Creates and manages player
profiles. - Opens sessions, marks attendance, and closes sessions. -
Creates matches linked to eligible sessions and records scores. - Views
all academy players, sessions, matches, attendance, and readiness.

**Player** - Signs in with an account created by the coach. - Views only
their own profile, attendance percentage, match history/scores, and
readiness status. - Cannot view other players or academy-wide lists.

**Scout** - Signs in with an account provisioned by the coach. - Views
only players who currently satisfy the Ready rule. - Can view the
readiness evidence needed to evaluate the player: name, age, sport,
attendance percentage, match count, and recorded match scores. - Cannot
see absent/not-ready players, edit records, or browse the full player
directory.

### 6. MVP scope and features

#### 6.1 Authentication

- Login for Coach, Player, and Scout.
- Role is assigned by the server from the user’s account record, never
  selected as a trusted client-side role.
- Players self-register; player access is pending until coach verification.
- Coach/operator provisions coach and scout accounts; no public coach/scout signup.
- Pending and rejected player accounts cannot log in.
- Logout and secure session expiry.
- Passwords stored as strong one-way hashes.

#### 6.2 Player register

Player fields: - Full name (required) - Age (required integer; minimum
5, maximum 100) - Sport (required; normalized text or configured sport
value) - Academy (implicitly the single academy; not user-selectable) -
Account link (for player login; created/invited by coach)

Coach can create, view, and update a player’s name, age, and sport. A
player cannot edit their own profile in MVP. Deletion should be
soft-disable/archive rather than destructive deletion if historical
records exist.

#### 6.3 Practice sessions

- Coach opens a session with date and sport.
- The session roster is the active players registered for that sport
  when the session is opened.
- Each roster player is marked exactly one of `PRESENT` or `ABSENT`.
- Coach cannot close the session until every roster player has a status.
- Coach closes the session.
- Closing locks the session and its attendance rows. No edit/reopen in
  MVP.
- Only closed sessions count in attendance calculations.

#### 6.4 Matches

- Coach creates a match with date, sport, opponent, and a linked closed
  session on the same date and sport.
- The match participant list can contain only players marked `PRESENT`
  in the linked session.
- Each participant must have one numeric score; zero is valid.
- Players absent from the linked session are rejected by the server even
  if the browser submits them.
- A match cannot be finalized with duplicate participants or missing
  scores.
- Match records are immutable after save in MVP. If correction is
  needed, the coach should contact the system operator; an audited
  correction workflow is a future enhancement.

#### 6.5 Attendance and readiness

Attendance percentage for a player:
`present closed sessions for player's sport since player creation / all closed sessions for player's sport since player creation × 100`.

- Open sessions do not count.
- Sessions for another sport do not count.
- Sessions dated before the player’s creation date do not count.
- If no eligible closed sessions exist, attendance is `0%` and the
  player is Not Ready.
- Display percentage rounded to one decimal place; readiness uses the
  unrounded ratio.
- Ready = attendance percentage `>= 75%` AND matches played `>= 2`.
- Match count means finalized matches in which the player is a
  participant.
- Readiness is dynamic and recalculated from saved records; do not store
  a manually editable Ready status.

#### 6.6 Scout view

- Show only Ready players.
- Search/filter may operate only within the Ready set.
- A player becoming Not Ready must disappear from the scout result on
  the next server request.
- Do not expose a hidden endpoint, count, export, or autocomplete that
  leaks non-Ready players.

### 7. Key user stories

- As a coach, I can add a player so that the academy register is up to
  date.
- As a coach, I can open a session for a date and sport.
- As a coach, I can mark every roster player Present or Absent.
- As a coach, I can close a complete session and know it cannot be
  altered accidentally.
- As a coach, I can record a match against an opponent.
- As a coach, I can only record players who were Present in the linked
  session.
- As a coach, I can see attendance and readiness for every player.
- As a scout, I can see only players who meet the Ready rule.
- As a player, I can see only my own profile, attendance, match scores,
  and readiness.

### 8. Acceptance criteria

1.  Given three players in the sport roster, when one session is closed
    with two Present and one Absent, the absent player’s row displays
    Absent and their attendance numerator does not increase.
2.  Given that session, when the coach records a same-date, same-sport
    match, the two Present players can be added and the Absent player is
    rejected by the server.
3.  A player below 75% attendance is Not Ready even if they have two
    matches.
4.  A player at exactly 75% attendance with at least two finalized
    matches is Ready.
5.  A scout’s API and UI return only Ready players.
6.  A player account can retrieve only its linked player record and
    cannot retrieve another player’s row by changing an ID in a URL or
    request.
7.  A closed session cannot be edited through the UI or API.
8.  Open sessions and sessions for other sports do not affect the
    player’s attendance percentage.

### 9. Success measures

- Coach can add a player and record a session without a spreadsheet or
  notebook.
- All attendance and match records are attributable to a coach and
  timestamped.
- The four supplied Check scenarios pass automated tests.
- No role-based data leakage is found in authorization tests.
- The live URL works on mobile and desktop browsers.

### 10. Assumptions requiring owner confirmation

- The academy has one coach-owner account in MVP; additional coach
  accounts are not required.
- Each player has one primary sport in MVP.
- A match is associated with one practice session, which is the
  eligibility source for its roster.
- Attendance history starts when the player is added, not before.
- Scores are numeric and interpreted in the context of the sport.
