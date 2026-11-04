# UI/UX Guidelines

## 1. Design direction

A practical, clean sports-academy desk. Prioritize speed, legibility,
and mobile use because the coach may mark attendance on a phone at the
practice ground.

Visual tone: confident and athletic, but not overly decorative. Use a
neutral background, strong contrast, clear status colors, and consistent
spacing. Avoid cluttered analytics dashboards.

## 2. Global layout

- Desktop: left navigation + top bar + content area.
- Mobile: compact top bar and bottom navigation or collapsible menu.
- Show current signed-in user’s role.
- Provide clear logout.
- Use accessible labels, keyboard focus, and sufficient contrast.

## 3. Coach navigation

- Overview
- Players
- Sessions
- Matches
- Readiness

### Coach overview

Show: - Active player count - Latest session and its attendance
summary - Recent matches - Ready player count - Primary actions: Add
Player, Open Session, Record Match

### Players

- Table/list: name, age, sport, active status, attendance %, matches
  played, readiness.
- Add/edit player form.
- Archive action with confirmation.
- Do not permanently delete historical records.

### Session workflow

- Step 1: select date and sport; open session.
- Step 2: display snapshotted roster with Present/Absent controls.
- Use bulk actions “Mark all present” and “Mark all absent” only as
  convenience; coach must be able to review every row.
- Show marked count, e.g. `8 of 10 marked`.
- Step 3: close session; show confirmation and explain that closure
  locks the record.
- After close, render read-only attendance statuses.

### Matches

- Select a closed session; date and sport should auto-fill and be
  read-only.
- Show only Present players from that session as selectable
  participants.
- Enter numeric score for each selected participant.
- Display opponent and match date.
- Before final save, show a review summary.
- Do not offer absent players in the selection UI; server validation
  remains mandatory.

### Readiness

- Table: player, sport, attendance, matches, Ready/Not Ready.
- Show the exact reason when Not Ready, e.g. “Attendance 66.7%; needs
  75%” or “1 of 2 matches”.
- Coach can see all active players.

## 4. Public player registration
- Registration form: name, age, sport, email, password, confirm password.
- After submission, show “Registration submitted. Your account will be available after coach verification.”
- Pending/rejected users must not be shown an authenticated dashboard.
- Login should show a clear “Awaiting coach verification” message for pending accounts without leaking account details to unrelated users.

## 5. Player dashboard

Show only: - Own name, age, sport - Attendance percentage and
`present / held` - Matches played and each recorded score - Ready / Not
Ready with reason No search, player directory, or links to other player
IDs.

## 6. Scout dashboard

Show only Ready players: - Name, age, sport - Attendance percentage -
Matches played - Match history/scores as approved by product owner No
tabs or filters that expose all players. Empty state: “No players
currently meet the Ready criteria.”

## 7. Status vocabulary

- Session: Open / Closed
- Attendance: Present / Absent / Not marked
- Readiness: Ready / Not Ready Use text labels as well as color; never
  rely on color alone.

## 8. UX states

Every data screen must include: - Loading state - Empty state -
Validation errors beside relevant fields - Server error state with
retry - Success feedback after save - Confirmation for irreversible
session close and archive actions

## 9. Responsive and accessibility

- Attendance controls must be easy to tap on a small screen.
- Tables may become stacked cards on mobile.
- Do not use tiny score inputs.
- Ensure keyboard navigation and visible focus.
- Use semantic headings and form labels.
