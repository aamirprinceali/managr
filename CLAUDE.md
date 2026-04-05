# Managr — Sober Living Operations App

## What this is
A web app for sober living house managers and facility owners. Manages residents, chores, drug tests, medications, incidents, and reports across multiple homes. Built as a gift for a friend (Mike), with the goal of selling it to other facilities.

## Project location
`~/Desktop/dev/managr`

## How to run
```bash
cd ~/Desktop/dev/managr
npm run dev
```
Then open: http://localhost:3000

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui components
- Supabase (PostgreSQL database + Auth + file storage)
- Vercel deployment target

## User Roles
| Role    | Access                                          |
|---------|-------------------------------------------------|
| Admin   | Everything — all homes, all residents           |
| Manager | Their assigned home only                        |
| Viewer  | Read-only on their assigned home                |

---

## Complete Feature List

### Homes Page (/)
- List all homes in card view or list view (toggle between layouts)
- Summary stats bar across all homes: total residents, total beds, vacancies, flagged residents
- Each home card shows: name, address, resident count, bed count, vacancy count, red-flagged count
- Add new home dialog: name, address, bed count, house manager name
- Click into any home to open its dashboard
- All data from Supabase (real database, not local storage)

### Home Dashboard (/homes/[id])
- Home info: name, address, bed count, house manager name
- Live resident count and vacancy count
- List of all residents in that home with status badge and flag color
- Add resident button
- Click any resident to open their full profile

### Resident Profile (/homes/[id]/residents/[residentId])
Full profile with all sections on one scrollable page:

**Header / Quick Info**
- Full name, status badge (Active / On Pass / Discharged)
- Flag: Green / Yellow / Red
- Points counter with +/- controls
- Sobriety date, intake date, move-in date, date of birth
- Room number, phone number
- Emergency contact name + phone
- Drug of choice, risk level
- Sponsor name, case manager name, therapist name
- General notes field

**Drug Tests**
- Log a drug test: date, result (Negative / Positive / Refused / Inconclusive), notes
- Full history of all drug tests with date, result, recorded by

**Chores**
- Assign chores: title, cadence (Daily / Weekly)
- All assigned chores with status (Pending / Done)
- Mark complete with timestamp

**Notes / Incidents**
- Add a note or incident report: type (Note / Incident), body text, severity
- Full history of all notes and incidents

**Medications**
- Add medications: name, dosage, frequency, prescriber, start date, notes
- Full list of current medications

**Weekly Meetings**
- Log weekly check-in meetings: meeting date + notes
- Full history of all meeting logs

**Restrictions**
- Add restrictions (e.g. no outside contact, no phone use): title + notes
- Full list of active restrictions

### All Residents View (/residents)
- All residents across every home in one place
- Filter and search

### Analytics (/analytics)
- Analytics dashboard (built)

### Reports (/reports)
- Reports page (built)

### Settings (/settings)
- App settings

---

## Database Tables (Supabase)
- `homes` — id, name, address, bed_count, house_manager_name
- `residents` — full resident record including status, flag, points, dates, contacts, notes
- `drug_tests` — resident_id, test_date, result, notes, recorded_by
- `chores` — resident_id, title, cadence, status, completed_at, completed_by
- `notes` — resident_id, type (Note/Incident), body, severity, created_by
- `medications` — resident_id, name, dosage, frequency, prescriber, start_date
- `weekly_meetings` — resident_id, meeting_date, notes
- `restrictions` — resident_id, title, notes

---

## Design Principles
- Mobile-first — works great on phone browsers (house managers use phones)
- Color language: Green = good, Yellow = watch, Red = alert (used for flags throughout)
- shadcn/ui + Tailwind — clean and professional
- This is a product being sold to facilities — must look premium

## What's planned next
- Documents tab (file upload per resident via Supabase Storage)
- Nightly/weekly report templates
- Push notifications
- React Native mobile app (Phase 2 — same Supabase backend, no rebuild)
- Multi-facility admin panel
- Billing/subscription for new clients

## Key file locations
```
src/app/
  homes/                         — homes list
  homes/[id]/                    — home dashboard
  homes/[id]/residents/[id]/     — resident full profile
  residents/                     — all residents view
  analytics/                     — analytics
  reports/                       — reports
  settings/                      — settings
src/components/
  homes/     — HomeCard, HomeListRow, AddHomeDialog
  residents/ — ResidentRow, AddResidentDialog
  layout/    — AppShell, Sidebar, MobileNav
  ui/        — shadcn/ui components
```
