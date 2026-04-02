# Managr — Master Feature List

This document tracks every feature planned, in progress, or built.
Update this as features are added to the actual build.

Legend: ✅ Built | 🔨 In Progress | 📋 Planned | 💡 Future Idea

---

## HOMES

### Core Home Management
- ✅ List all homes (card view)
- 🔨 Toggle between card view and list view
- ✅ Add a new home (name, address, notes, bed count)
- 📋 Edit home details
- 📋 Archive / deactivate a home
- 📋 Name the house (e.g. "Oak House", "Cedar Manor")
- 📋 Assign house manager to a home
- 📋 See who the house manager is on each home card
- 📋 Total bed count per home
- 📋 Total occupied spots per home
- 📋 Total vacant spots per home
- 📋 Alert when home is near capacity (e.g. 1 bed left)
- 📋 Reserve a spot in a home (hold a bed without a resident yet)
- 📋 Add rooms within a home (Room 1, Room 2, Room A, etc.)
- 📋 Assign residents to specific rooms

### Main Dashboard (All Homes Overview)
- 🔨 Total residents across all homes
- 🔨 Total vacancies across all homes
- 🔨 Total beds/spots across all homes
- 📋 Count of flagged (Red) residents across all homes
- 📋 Quick stats card at top of homes screen

---

## RESIDENTS

### Core Resident Management
- ✅ Add a resident to a home
- ✅ View resident list per home (sorted Red → Yellow → Green)
- ✅ Resident status: Active / On Pass / Discharged
- ✅ Flag system: Green / Yellow / Red (visible everywhere)
- ✅ Points counter (+/-)
- 📋 Edit resident profile
- 📋 Move resident to a different home (all history follows them)
- 📋 Discharge a resident (moves to archive)
- 📋 Archive of discharged residents (never deleted)
- 📋 Readmit an archived resident (restores all history)
- 📋 Reserve a bed for a future resident (pre-admit)

### Resident Profile — Personal Info
- ✅ Full name
- ✅ Photo
- ✅ Move-in date / intake date
- ✅ Move-out date
- ✅ Status (Active / On Pass / Discharged)
- ✅ Flag color (Green / Yellow / Red)
- ✅ Phone number
- ✅ Emergency contact name + phone
- ✅ Sobriety date + days sober counter
- ✅ Drug of choice
- ✅ Risk level (Low / Medium / High)
- 📋 Date of birth (DOB)
- 📋 Room assignment within the home
- 📋 Sponsor name + contact info
- 📋 Case manager name + contact info
- 📋 Therapist name + contact info
- 📋 Is in clinical program? (yes/no + program name)
- 📋 Important health history notes
- 📋 Multiple contacts (family, guardian, girlfriend, etc.) — add, label, and store any number of contacts

### Resident Profile — Activity & History
- 📋 Drug test history (full log of all tests)
- 📋 Incident reports (documented events with date, type, severity, notes)
  - Relapse can be logged as an incident type
- 📋 Notes section (general manager notes on the resident)
- 📋 Privileges tracking (car privileges, curfew level, phone privileges, etc.)
- 📋 Points history ledger (full log of +/- changes)
- 📋 Chores assigned + completion history
- 📋 Documents (upload and store files — contracts, IDs, treatment plans, etc.)
- 📋 Behavioral contracts (signed docs attached to profile)

### Resident Profile — Appointments & Calendar
- 📋 Appointment list (doctor, therapy, court, other)
- 📋 Resident-level calendar (view/add appointments for that resident)
- 📋 House manager can add to resident's calendar
- 📋 Resident can have own calendar view (future — resident-facing app)

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
- 📋 Relapse flagged as incident type (triggers flag color change option)

---

## DRUG TESTS

- 📋 Log a drug test per resident (date, result, panel type, notes)
- 📋 Results: Negative / Positive / Refused / Inconclusive
- 📋 Recorded by + timestamp
- 📋 Full test history per resident
- 📋 Filter/search test history

---

## CHORES

- 📋 Assign chores to a resident
- 📋 Daily or Weekly cadence
- 📋 Mark complete (by whom + timestamp)
- 📋 Pending/overdue chore alerts
- 📋 House-level chore board (all residents' chores in one view)

---

## MEDICATIONS

- 📋 Medication list per resident (name, dosage, frequency, prescriber)
- 📋 Start date + end date
- 📋 Notes
- 📋 MAR (Medication Administration Record) log

---

## DOCUMENTS

- 📋 Upload documents to resident profile
- 📋 Document types: ID, Insurance, Consent Form, Treatment Plan, Behavioral Contract, Other
- 📋 Status: On File / Missing / Expiring Soon
- 📋 Uploaded by + timestamp
- 📋 Download/view document

---

## COMMUNICATIONS (Phase 2)

- 💡 In-app messaging from house manager to resident's phone
- 💡 Broadcast message to all residents in a home
- 💡 Notification alerts (curfew reminders, appointment reminders)
- 💡 SMS integration via Twilio

---

## CALENDAR (Phase 2)

- 💡 Admin-level calendar (all homes, all residents)
- 💡 Per-home calendar
- 💡 Per-resident calendar
- 💡 Google Calendar integration
- 💡 House manager can view all residents' appointments in one calendar
- 💡 Appointment types: Doctor, Therapy, Court, AA/NA Meeting, Other

---

## USER ROLES & ACCESS

- 📋 Admin role — sees all homes, all residents, all data, all reports
- 📋 House Manager role — assigned to one home, manages that home fully
- 📋 House Manager can view other homes (read-only)
- 📋 Viewer role — read-only access to assigned home
- 📋 Login / authentication (email + password)
- 📋 Assign house managers to homes
- 📋 See house manager name on each home

---

## SETTINGS

- 📋 Manage users (add/remove managers)
- 📋 Assign managers to homes
- 📋 Facility-level settings (name, logo, contact info)
- 📋 Notification preferences
- 📋 Custom report templates

---

## AAMIR'S ADDITIONAL IDEAS & SUGGESTIONS

### Ideas Worth Adding
- **Privileges tracker** — each facility has its own privilege system (car, curfew time, phone, etc.). Build it as a configurable list so Mike can customize what privileges exist.
- **Sobriety milestones** — auto-celebrate 30, 60, 90, 6mo, 1yr with a badge on the profile. Managers love being able to celebrate these.
- **"Red flag" auto-escalation** — if a resident gets a positive drug test or a serious incident report, auto-suggest changing their flag to Red.
- **Bed map visualization** — visual grid of all rooms/beds in a home showing who's in each spot. Drag to move residents.
- **Resident transfer log** — every time a resident moves between homes, log it with date + reason so there's a permanent record.
- **Curfew check-in** — simple "checked in on time / late / no show" daily log per resident.
- **Sponsor contact quick-dial** — one tap to call sponsor from resident's profile.
- **Quick notes** — floating "+ note" button on every screen so managers can jot something down fast without navigating into a profile.
- **House rules acknowledgment** — resident signs/acknowledges house rules digitally, stored in documents.

### My Suggestions to Stand Out vs Competitors
- **Resident timeline view** — one scrollable timeline of everything that happened to a resident (tests, incidents, notes, moves, milestones). No competitor has this.
- **Discharge summary auto-generator** — when you discharge a resident, auto-generate a PDF summary of their stay (dates, tests, incidents, notes). Massive time saver for treatment teams.
- **Occupancy rate tracking over time** — graph showing how full each home has been week over week. Useful for owners who are business-minded.
- **"Due Today" dashboard widget** — one view showing: who has a drug test today, whose chores are overdue, who has an appointment today. Saves managers from checking 5 different places.
- **Multi-facility support** — when selling to other facilities, one admin account can manage multiple locations. This is the enterprise play.

---

## BUILD ORDER (Current Plan)

### Sprint 1 — Foundation ✅ (Done)
- Next.js scaffold, shadcn/ui, Supabase connected
- Homes screen (list + add)
- Home Dashboard (stats + resident list)

### Sprint 2 — Design + Core Features 🔨 (Now)
- Redesign with premium fonts and color scheme
- Card/list toggle on homes screen
- Dashboard stats (total residents, vacancies, total spots)
- Fix 404 pages (residents, reports, settings stubs)
- Add Resident form
- Resident Profile screen

### Sprint 3 — Resident Profile Depth
- Drug tests module
- Chores module
- Notes + Incident Reports
- Documents upload

### Sprint 4 — Reports
- Nightly report form
- Report archive

### Sprint 5 — Access Control
- Auth (login screen)
- Role-based access (Admin / Manager / Viewer)
- Assign managers to homes

### Sprint 6 — Polish + Deploy
- Mobile responsiveness pass
- Performance
- Deploy to Vercel
- Give to Mike
