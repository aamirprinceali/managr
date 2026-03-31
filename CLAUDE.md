# Managr — Claude Code Project Context

## What This App Is
Managr is a sober living / recovery housing operations app built for house managers and facility owners.
It was built as a gift for a friend who runs a sober living facility, with the long-term goal of
turning it into a product sold to treatment centers, sober livings, and detox facilities.

**App name:** Managr
**Owner/first client:** Mike (friend, owns a sober living)
**Business goal:** Give to Mike free, let word of mouth spread to other facilities, then charge others

---

## Tech Stack

### Phase 1 — Web App (current)
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (role-based: Admin, Manager, Viewer)
- **File storage:** Supabase Storage (for documents)
- **Deployment:** Vercel

### Phase 2 — Mobile App (after web is solid)
- **Framework:** React Native + Expo
- Convert web logic/API into mobile shell
- Same Supabase backend — no rebuild needed

---

## Navigation Structure
```
Homes → Home Dashboard → Residents → Resident Profile
```

---

## User Roles
| Role    | Can Do                                          |
|---------|-------------------------------------------------|
| Admin   | Everything — add homes, manage all residents    |
| Manager | Manage residents in their assigned home         |
| Viewer  | Read-only access to their assigned home         |

---

## Core Modules (MVP)

### 1. Homes
- List all homes with name, address, resident count
- Add / edit / archive homes
- Click into a home to see its dashboard

### 2. Home Dashboard
- Home info + stats (bed count, occupancy, flagged residents)
- List of current residents with status + flag color
- Add resident button

### 3. Residents
- Active, On Pass, Discharged statuses
- Archive discharged residents (never deleted — can be readmitted)
- Transfer residents between homes (all notes/history follow them)
- Full profile with all history visible to new manager

### 4. Resident Profile
Full name, photo, status, flag (Green/Yellow/Red), points, sobriety date,
intake date, drug of choice, phone, emergency contact, risk level

Sections inside profile:
- Medications
- Chores
- Drug Tests
- Documents
- Notes / Incident Reports
- Appointments (doctor, therapy)
- Use history

### 5. Chores
- Assigned per resident
- Daily or Weekly cadence
- Status: Pending / Done
- Completed by + timestamp

### 6. Drug Tests
- Date, result (Negative / Positive / Refused / Inconclusive)
- Notes, recorded by

### 7. Documents
- Types: ID, Insurance, Consent, Treatment Plan, Other
- Status: On File / Missing / Expiring Soon
- File upload via Supabase Storage

### 8. Points System
- Simple +/- counter per resident (Phase 1)
- Points history ledger (Phase 2)

### 9. Nightly Reports
- Sunday report template (matches how Mike's facility runs)
- Structured form that generates a report
- Reports archived per house per week

### 10. Incident Reports
- Tied to resident + date + house
- Notes field, severity, resolution
- All incident reports follow the resident if they transfer

---

## Data Models

### Homes
- id, name, address, notes, bed_count, created_at

### Residents
- id, home_id, full_name, photo_url, move_in_date, move_out_date
- status (Active / On Pass / Discharged)
- phone, emergency_contact_name, emergency_contact_phone
- points (integer), flag (Green / Yellow / Red)
- sobriety_date, intake_date, drug_of_choice, risk_level
- is_archived (bool)

### Chores
- id, resident_id, title, cadence (Daily/Weekly)
- due_date, status (Pending/Done), completed_at, completed_by

### Drug Tests
- id, resident_id, test_date, result, notes, recorded_by

### Documents
- id, resident_id, doc_type, file_url, status, uploaded_at, uploaded_by

### Medications
- id, resident_id, name, dosage, frequency, prescriber, start_date, notes

### Notes / Incidents
- id, resident_id, home_id, type (Note / Incident), body
- severity (for incidents), created_by, created_at

### Appointments
- id, resident_id, type (Doctor/Therapy/Other), date_time, location, notes, status

### Nightly Reports
- id, home_id, report_date, submitted_by, body (JSON), created_at

---

## Design Principles
- **Mobile-first** — even the web version must look and feel great on a phone browser
- **Tap-first workflow** — big buttons, clear labels, no confusion
- **Professional + premium** — this is a product we're selling to facilities
- **Clean and elegant** — not clinical or cold. Warm but sharp.
- **Color language:** Green = good, Yellow = watch, Red = alert (used for flags throughout)
- Use shadcn/ui components + Tailwind
- Use ui-ux-pro-max skill for all design decisions

---

## Skills to Use on This Project
| Skill | When to Use |
|-------|-------------|
| `ui-ux-pro-max` | Every screen, every component design decision |
| `frontend-design` | Building any UI component or screen |
| `brainstorming` | Before adding any new feature |
| `writing-plans` | Before starting any implementation sprint |
| `systematic-debugging` | When something breaks |
| `verification-before-completion` | Before claiming anything is done |

---

## Phase 2 Features (after MVP)
- Messaging within app
- Calendar integration
- Due Today dashboard
- More advanced flag automation
- Points history ledger
- Push notifications
- React Native mobile app (same Supabase backend)
- Multi-facility admin panel
- Billing / subscription for new customers

---

## What's Been Done
- [x] Project folder created: `~/Desktop/dev/managr`
- [x] Git initialized
- [x] GitHub repo created
- [x] CLAUDE.md written
- [x] Project blueprint documented

## What's Next (First Build Session)
1. Run `npx create-next-app@latest` to scaffold the app
2. Set up Supabase project + connect
3. Install shadcn/ui + Tailwind
4. Build the Homes screen first (list + add home)
5. Build Home Dashboard
6. Build Resident Profile shell

---

## Session Notes
- Always explain what we're doing and why before doing it (Aamir is learning)
- Always add comments in code explaining what each section does
- Keep files small and focused
- Always use .env for secrets
- End every session with a summary of what was built and what's next
- Update this CLAUDE.md at the end of every session
