# Managr — Master Feature List

This document tracks every feature planned, in progress, or built.
Update this as features are added to the actual build.

Legend: ✅ Built | 🔨 In Progress | 📋 Planned | 💡 Future Idea

---

## HOMES

### Core Home Management
- ✅ List all homes (card view + list view toggle)
- ✅ Add a new home (name, address, bed count, house manager, assistant manager, notes)
- ✅ Home cards showing manager name, occupancy bar, "Needs Attention" banner for red-flagged residents
- ✅ Home dashboard with resident count, on-pass count, flagged count
- ✅ Bed occupancy display (X of Y beds occupied)
- 📋 Edit home details
- 📋 Archive / deactivate a home
- 📋 Alert when home is near capacity (e.g. 1 bed left)
- 📋 Reserve a spot in a home (hold a bed without a resident yet)
- 📋 Add rooms within a home (Room 1, Room 2, etc.)

### Main Dashboard (All Homes Overview)
- ✅ Total homes stat card
- ✅ Total residents across all homes
- ✅ Total vacancies (open beds) across all homes
- ✅ Total red-flagged residents ("Need Attention")

---

## RESIDENTS

### Core Resident Management
- ✅ Add a resident to a home (16-field form: basic info, intake, contacts, notes)
- ✅ View resident list per home (sorted Red → Yellow → Green)
- ✅ Resident status: Active / On Pass / Discharged
- ✅ Flag system: Green / Yellow / Red (visible everywhere)
- ✅ Points counter (+/- live update, no page reload)
- 📋 Edit resident profile
- 📋 Move resident to a different home (all history follows them)
- 📋 Discharge a resident (moves to archive, is_archived = true)
- 📋 Archive of discharged residents (never deleted)
- 📋 Readmit an archived resident (restores all history)
- 📋 Reserve a bed for a future resident (pre-admit)

### Resident Profile — Personal Info (Overview Tab)
- ✅ Full name
- ✅ Status badge (Active / On Pass / Discharged)
- ✅ Flag color dot (Green / Yellow / Red)
- ✅ Days sober counter (auto-calculated from sobriety date)
- ✅ Move-in / intake date
- ✅ Drug of choice
- ✅ Risk level (Low / Medium / High)
- ✅ Room number
- ✅ Date of birth
- ✅ Phone number
- ✅ Emergency contact name + phone
- ✅ Sponsor name
- ✅ Case manager name
- ✅ Therapist name
- ✅ General notes from resident record
- 📋 Photo upload
- 📋 Multiple contacts (family, guardian, etc.) — labeled, unlimited
- 📋 Is in clinical program? (yes/no + program name)

---

## RESIDENT PROFILE TABS

### Drug Tests Tab ✅
- ✅ Log a drug test (date, result, notes)
- ✅ Results: Negative / Positive / Refused / Inconclusive (color-coded badges)
- ✅ Full test history (newest first)
- 📋 Filter/search test history
- 📋 Bulk drug test (test all residents in a home at once)
- 📋 Panel type (5-panel, 10-panel, etc.)
- 📋 Recorded by field

### Chores Tab ✅
- ✅ Assign chores to a resident (title + cadence)
- ✅ Cadence: Daily / Weekly / One-time
- ✅ Mark done / undo (checkbox toggle)
- ✅ Visual strikethrough on completed chores
- 📋 Due date per chore
- 📋 Overdue chore alerts
- 📋 House-level chore board (all residents' chores in one view)

### Notes Tab ✅
- ✅ Add notes with type: Note / Incident / Relapse
- ✅ Color-coded type badges
- ✅ Timeline view (newest first) with timestamp
- 📋 Edit / delete notes
- 📋 Filter by type

### Medications Tab ✅
- ✅ Add medication (name, dosage, frequency, prescriber)
- ✅ List all current medications
- 📋 Start date + end date
- 📋 Mark as discontinued
- 📋 MAR (Medication Administration Record) log

### Weekly Meetings Tab ✅
- ✅ Log house meeting notes per resident (date + notes)
- ✅ Meeting history view (newest first, date highlighted)
- 📋 Tag meeting attendees
- 📋 Mark action items from meeting

### Restrictions Tab ✅
- ✅ Add a restriction with title + optional details
- ✅ Active restrictions shown with "Lift" button
- ✅ Lifted restrictions shown separately (crossed out) with "Reinstate" button
- ✅ is_active toggle persists to Supabase
- 📋 Restriction history log (when added, when lifted, by whom)
- 📋 Restriction types (curfew, phone, visitors, passes, etc.)

---

## REPORTS

### Nightly Reports
- 📋 Nightly report form per home
- 📋 Template matching how Mike's facility runs Sunday reports
- 📋 Archive of all past nightly reports (searchable by date/home)
- 📋 Submitted by + timestamp

### Weekly Reports
- 📋 Weekly summary per home
- 📋 Auto-populated from nightly report data
- 📋 Export to PDF

### Incident Reports
- 📋 Incident report form (tied to resident + home + date)
- 📋 Severity levels (Minor / Moderate / Serious)
- 📋 Resolution notes
- 📋 All incident reports follow the resident (visible on profile)

---

## PLANNED FEATURES (Next Sessions)

### Due Today Dashboard
- 📋 Who has a drug test scheduled today
- 📋 Whose chores are overdue
- 📋 Who has an appointment today
- 📋 Single command-center view for house managers

### Curfew Check-In
- 📋 Daily log: Checked in on time / Late / No show
- 📋 Per resident
- 📋 History log

### Sobriety Milestones
- 📋 Auto-detect 30 / 60 / 90 day / 6mo / 1yr milestones
- 📋 Badge on resident profile when milestone hit
- 📋 Manager notification

### Resident Timeline View
- 💡 One scrollable timeline of everything: tests, incidents, notes, moves, milestones
- 💡 No competitor has this — major differentiator

### Discharge Summary
- 💡 Auto-generate PDF when resident is discharged
- 💡 Includes: stay dates, test history, incidents, notes summary

### Bulk Drug Test
- 📋 Test all residents in a home at once
- 📋 One form, one submit, creates test record for each resident

---

## USER ROLES & ACCESS

- 📋 Admin role — sees all homes, all residents, all data
- 📋 House Manager role — assigned to one home
- 📋 Viewer role — read-only
- 📋 Login / authentication (Supabase Auth)
- 📋 Assign house managers to homes

---

## SETTINGS

- 📋 Manage users (add/remove managers)
- 📋 Assign managers to homes
- 📋 Facility-level settings (name, logo, contact info)
- 📋 Notification preferences
- 📋 Custom report templates

---

## COMMUNICATIONS (Phase 2)

- 💡 In-app messaging from house manager to resident's phone
- 💡 Broadcast message to all residents in a home
- 💡 SMS integration via Twilio

---

## CALENDAR (Phase 2)

- 💡 Admin-level calendar (all homes, all residents)
- 💡 Per-home calendar
- 💡 Per-resident calendar
- 💡 Google Calendar integration

---

## BUILD ORDER

### Sprint 1 — Foundation ✅
- Next.js scaffold, shadcn/ui, Supabase connected
- Homes screen (list + add)
- Home Dashboard (stats + resident list)

### Sprint 2 — Design + Core Features ✅
- Premium design: navy/sky blue, Plus Jakarta Sans
- Card/list toggle on homes screen
- Dashboard stats (total residents, vacancies, flagged)
- Add Resident form (16 fields)
- Resident Profile — all 7 tabs built and functional

### Sprint 3 — Resident Actions (Next)
- Edit resident profile
- Discharge resident
- Due Today dashboard
- Bulk drug test
- Curfew check-in

### Sprint 4 — Reports
- Nightly report form
- Report archive

### Sprint 5 — Access Control
- Auth (login screen)
- Role-based access
- Assign managers to homes

### Sprint 6 — Polish + Deploy
- Mobile responsiveness pass
- Deploy to Vercel
- Give to Mike
