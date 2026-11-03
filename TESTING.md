# Testing Strategy and Acceptance Tests

## 1. Test layers

- Unit: attendance/readiness calculations, validators, permission
  helpers.
- Integration: service functions and MongoDB persistence.
- API: role authorization, forged payloads, conflict responses.
- E2E: coach, player, and scout journeys in a browser.
- Production smoke: deployed login and core workflows.

## 2. Required acceptance tests

### AT-01 — Attendance row reflects absence

Given three active players in the same sport, open one session and mark
two PRESENT and one ABSENT. Close it. Expected: - Session shows all
three rows. - Two rows show Present; one shows Absent. - Absent player’s
attendance numerator remains unchanged. - Denominator increases by one
for all three players in that sport.

### AT-02 — Absent player cannot be added to match

Given AT-01’s closed session, create a same-date/same-sport match with
the two Present players and scores. Expected: - Match saves
successfully. - Both participants and scores are persisted. - Attempting
to add the Absent player through a forged API request returns 409
`PLAYER_NOT_ELIGIBLE`. - No match is saved from the rejected request.

### AT-03 — Below 75% is Not Ready

Given a player with 2 Present sessions out of 3 held sessions and 2
finalized matches: - Attendance = 66.666…%. - `isReady` is false. -
Scout endpoint excludes the player.

### AT-04 — Exactly 75% is Ready

Given a player with 3 Present sessions out of 4 held sessions and 2
finalized matches: - Attendance = exactly 75%. - `isReady` is true. -
Scout endpoint includes the player.

### AT-05 — Player self-registration requires coach verification
Given a new player submits valid registration details:
- Player and User are created with PENDING status.
- Registration does not create an authenticated session.
- Login is denied while pending.
- Coach approval changes player to VERIFIED and user to ACTIVE.
- Player can log in after approval.
- Rejected registration remains unable to log in.

### AT-06 — Scout sees full details for Ready players only
Given one Ready and one Not Ready player:
- Scout list returns only the Ready player.
- Scout can open the Ready player's profile and sport-specific match history/scores.
- Scout cannot open the Not Ready player's profile by guessing its ID.
- Scout cannot call the coach's full player directory endpoint.

### AT-07 — Sport-specific score metadata
Given a Football match and a Cricket match:
- Football score is displayed with Goals metric/unit.
- Cricket score is displayed with Runs metric/unit.
- Client-supplied metric/unit overrides are ignored or rejected.
- The UI does not compare raw scores across sports.

## 3. Additional critical tests

- Zero held sessions → 0% and Not Ready.
- 1/1 attendance but only 1 match → Not Ready.
- 4/5 attendance and 2 matches → Ready.
- Open session does not affect denominator.
- Session for another sport does not affect denominator.
- Session dated before player creation does not affect denominator.
- Player added after session opened is not in that session roster.
- Closing with any unmarked player fails and identifies unmarked rows.
- Marking attendance after close fails with 409.
- Closing same session twice behaves consistently.
- Duplicate date/sport session fails.
- Match cannot use OPEN session.
- Match date mismatch fails.
- Match sport mismatch fails.
- Match with no participants fails.
- Duplicate participant IDs fail.
- Negative, NaN, Infinity, or non-numeric scores fail.
- Score 0 is accepted.
- Archived player is excluded from future session rosters but historical
  records remain.
- Changing a player’s sport after historical records is blocked in MVP.
- Pending player login is denied; approved player login succeeds; rejected player login is denied.
- Scout can view full Ready player profile and match history, but cannot access Not Ready player by ID.
- Sport score metric/unit is server-derived and displayed correctly.
- Scout cannot call coach player-list endpoint.
- Scout cannot retrieve Not Ready player by ID.
- Player cannot retrieve another player’s data by changing a path/query
  ID.
- User with PLAYER role cannot call coach APIs.
- Unauthenticated user cannot access protected pages or APIs.

## 4. Boundary tests

- Attendance rate 74.999% → Not Ready.
- Attendance rate 75% → passes attendance condition.
- Attendance rate 75.001% → passes attendance condition.
- Match count 1 → fails match condition.
- Match count 2 → passes match condition.

## 5. Test data fixture

Use deterministic fixtures with at least: - Coach account. - Scout
account. - Three players in one sport. - One player in another sport. -
Four closed sessions for a 3/4 attendance case. - Two finalized matches
for the Ready player. - One open session to prove it is excluded.

## 6. Definition of Done

- All four problem-statement checks pass.
- All critical role-isolation tests pass.
- Lint and TypeScript checks pass.
- Unit, integration, and E2E tests pass.
- No secrets committed.
- Mobile layout verified.
- Production smoke tests pass on live URL.
