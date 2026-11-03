# User Flows

## 1. Coach first-time setup

1.  Operator runs a secure seed script to create the first COACH
    account.
2.  Coach signs in.
3.  Coach adds players and creates player login accounts/invitations.
4.  Coach provisions scout login accounts/invitations.
5.  Coach lands on overview.

## 2. Add a player

1.  Coach opens Players → Add Player.
2.  Enters name, age, sport, and (if player login is enabled) account
    email.
3.  Server validates data and creates Player plus linked PLAYER User.
4.  System shows confirmation and invite/reset instructions.
5.  Player can sign in and see only their own dashboard.

## 3. Open and close a session

1.  Coach chooses Sessions → Open Session.
2.  Selects date and sport.
3.  Server snapshots active players for that sport.
4.  Coach opens roster and marks each player Present or Absent.
5.  Coach reviews marked count and statuses.
6.  Coach selects Close Session and confirms.
7.  Server verifies every roster entry has a status and locks the
    session.
8.  Attendance calculations now include this session.

## 4. Record a match

1.  Coach selects Matches → Record Match.
2.  Selects a closed session.
3.  System fills date and sport from that session.
4.  System displays only players marked Present in that session.
5.  Coach selects players who played and enters each score.
6.  Coach reviews and saves.
7.  Server independently validates eligibility and stores finalized
    match.
8.  Match count and readiness update.

## 5. Scout checks Ready players

1.  Scout signs in.
2.  Server queries players and calculates readiness.
3.  Only players with attendance \>= 75% and at least 2 finalized
    matches are returned.
4.  Scout opens a Ready player’s allowed details.
5.  Scout cannot navigate to the full directory or a Not Ready profile.

## 6. Player checks own record

1.  Player signs in.
2.  Server resolves the linked player ID from the session.
3.  Player sees own attendance, match scores, and readiness.
4.  Attempts to request another player’s ID return 404/403 and disclose
    no data.

## 7. Failure flows

- Incomplete attendance: close request rejected; show unmarked players.
- Closed session attendance update: reject with `SESSION_LOCKED`.
- Absent player submitted to match: reject with `PLAYER_NOT_ELIGIBLE`.
- Match date/sport mismatch: reject with `SESSION_MISMATCH`.
- Duplicate session for same date/sport: reject with
  `SESSION_ALREADY_EXISTS`.
- Scout requests non-Ready player: return 404/403 without exposing the
  record.
- Player changes ID in URL: server ignores client ID and returns own
  record only.

## 8. Player registration edge cases
- Duplicate email: reject with a generic registration error; do not create duplicate account.
- Pending account login: deny access and show awaiting-verification message.
- Rejected account login: deny access.
- Coach approval: atomically activate the linked User and mark Player VERIFIED.
- Player changes submitted details while pending: disallow in MVP; ask them to contact the coach or submit a corrected registration through a controlled process.
