# MongoDB Data Model

Use Mongoose schemas with timestamps. Store dates consistently and
interpret academy calendar dates in `Asia/Kolkata`.

## 1. User

``` ts
{
  _id: ObjectId,
  email: string,              // unique, normalized lowercase
  passwordHash: string,
  role: "COACH" | "PLAYER" | "SCOUT",
  accountStatus: "PENDING" | "ACTIVE" | "REJECTED",
  playerId?: ObjectId,        // required only for PLAYER
  isActive: boolean,
  registrationStatus: "PENDING" | "VERIFIED" | "REJECTED",
  reviewedBy?: ObjectId,
  reviewedAt?: Date,
  rejectionReason?: string,
  createdAt: Date,
  updatedAt: Date
}
```

Rules: - Unique index on normalized email. - PLAYER must have exactly
one linked playerId. - COACH and SCOUT must not have playerId. - No
public user creation endpoint.

## 2. Player

``` ts
{
  _id: ObjectId,
  name: string,
  age: number,
  sport: string,              // normalized comparison value
  isActive: boolean,
  registrationStatus: "PENDING" | "VERIFIED" | "REJECTED",
  reviewedBy?: ObjectId,
  reviewedAt?: Date,
  rejectionReason?: string,
  createdAt: Date,
  updatedAt: Date
}
```

No academyId is required in MVP because there is exactly one academy. Do
not add fake multi-tenancy. If the product expands to multiple
academies, introduce academyId consistently across all collections.

## 3. Session

``` ts
{
  _id: ObjectId,
  date: Date,                 // academy-local date normalized to start of day
  sport: string,
  status: "OPEN" | "CLOSED",
  roster: [{
    playerId: ObjectId,
    playerNameSnapshot: string,
    status: "PRESENT" | "ABSENT" | null
  }],
  createdBy: ObjectId,        // coach User ID
  closedBy?: ObjectId,
  closedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes: - Unique compound index `{ date: 1, sport: 1 }` for one session
per sport/date in MVP. - `{ status: 1, date: -1 }` -
`{ "roster.playerId": 1, sport: 1, status: 1 }` as appropriate to query
patterns.

Roster snapshot: - Include active players whose normalized sport matches
the session sport when opened. - A player created later is not
retroactively added. - If no active players match, allow opening only if
product owner chooses; recommended behavior is reject with
`NO_ELIGIBLE_PLAYERS`.

## 4. Match

``` ts
{
  _id: ObjectId,
  date: Date,
  sport: string,
  opponent: string,
  sessionId: ObjectId,
  participants: [{
    playerId: ObjectId,
    playerNameSnapshot: string,
    score: number,
    scoreMetric: string,       // server-derived, e.g. goals/runs/points
    scoreUnit: string          // server-derived display unit
  }],
  status: "FINALIZED",
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes: - `{ date: -1, sport: 1 }` - `{ sessionId: 1 }` -
`{ "participants.playerId": 1, date: -1 }`

## 5. Relationships

- User PLAYER → one Player.
- Session → roster snapshot of Player IDs and attendance statuses.
- Match → one Session; participants must be PRESENT in that session.
- Match participant → Player ID and snapshot name.
- All records are associated with the one academy implicitly.

## 6. Important invariants

- Never physically delete players with historical attendance/matches.
  Archive them.
- A CLOSED session cannot be changed.
- A match can reference only a CLOSED session with the same date and
  sport.
- Match participants must be unique and must have PRESENT attendance in
  the linked session.
- Match scores must be finite non-negative numbers.
- Match count for readiness is the count of finalized match documents
  containing the player.
- Do not store `attendancePercentage` or `isReady` as authoritative
  fields. Compute them from source records.
- If caching is added later, invalidate it on session closure, match
  finalization, and player sport changes.


## 6. Sport score configuration
Maintain a server-controlled `SportConfig` registry (database collection or typed configuration for MVP):
```ts
{
  sport: string,              // unique normalized sport name
  scoreMetric: string,        // e.g. "Goals", "Runs", "Points"
  scoreUnit: string,          // e.g. "goals", "runs", "points"
  isActive: boolean
}
```
Seed sensible defaults for supported sports. Coach selects a configured sport; the UI displays its metric/unit. The server derives metric/unit from this registry when saving a match. Do not accept arbitrary metric/unit from client payloads. For a sport without a configured metric, block match creation until configured. No cross-sport raw-score ranking.
