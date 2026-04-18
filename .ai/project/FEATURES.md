# Managr — Feature Status

Last updated: April 2026

## Legend
- ✅ Built & styled (dark theme, complete UI)
- 🔧 Built — requires Supabase table to be seeded to show data
- 📋 Placeholder page — skeleton only
- 💡 Planned / backlog

---

## Auth & Infrastructure
- ✅ Login page (email + password)
- ✅ Supabase Auth + middleware protecting all routes
- ✅ UserProvider / useProfile() hook → profile.role
- ✅ Role-based access: owner vs. manager
- ✅ Dark theme design system (globals.css — NeuroBank palette)
- ✅ App shell: sidebar (desktop) + mobile bottom nav
- ✅ Sidebar: all nav items, active states, homes sub-list (owner only)

---

## Dashboard (/dashboard)
- ✅ Owner Dashboard:
  - KPI strip (Homes, Residents, Open Beds, Active Flags, Nightlies Pending)
  - Donut ring chart (occupancy overview)
  - Bar chart (occupancy by home)
  - House health grid with flag counts + nightly status
  - Gradient flags feed (active red-flagged residents)
  - Drug Tests overdue widget
  - Nightly Reports status widget
- ✅ Manager Dashboard:
  - Daily checklist cards (Drug Tests Due, Chores Overdue, Nightly Status)
  - Nightly reminder banner (shows after 8pm if not submitted)
  - Resident list sorted Red → Yellow → Green (with sobriety days + status badge)
  - Messages widget (unread count + list; Mike's messages highlighted amber)
  - Open Flags gradient card

---

## Homes
- ✅ Homes list — card + list view toggle, stats bar, add home dialog
- ✅ Home detail — resident list sorted by flag, occupancy, edit home
- ✅ Resident profile — 7-tab deep profile (Overview, Drug Tests, Chores, Notes, Medications, Meetings, Restrictions)
- ✅ Drug test weekly tracker on home dashboard (Mon–Sun, mark individual or bulk)
- 🔧 All data from Supabase (requires homes + residents tables)

---

## All Residents (/residents) — Owner Only
- 📋 Placeholder — global resident search across all homes (Sprint 2)

---

## Tasks (/tasks)
- ✅ Dark theme task list
- ✅ Priority + type badges (dark pill style)
- ✅ Filter by status and home
- ✅ Select all + bulk mark done
- ✅ Bulk Drug Test button (creates a drug test task per active resident)
- ✅ Add Task dialog (dark theme)
- 🔧 Requires `tasks` table in Supabase (Block 4 on /seed)

---

## Messages (/messages)
- ✅ House manager directory (name, email, phone per home)
- ✅ mailto / tel links for quick contact
- ✅ Internal compose panel
- ✅ Message history with unread badges
- 🔧 Requires `messages` table (Block 4 on /seed) + email/phone columns on homes (Block 3)

---

## Nightly Reports (/nightly)
- ✅ Manager form — Yes/No toggles + notes for: residents accounted, incidents, medications, curfew violations + general notes
- ✅ "Already submitted" state with expandable confirmation card
- ✅ Owner view — all homes listed with ✓/✗ status for last night, expandable to read full report
- 🔧 Requires `nightly_reports` table in Supabase (Block 5 on /seed)

---

## Reports (/reports)
- ✅ Summary KPI cards (residents, compliance %, incidents, red flags)
- ✅ Resident status table by home (active, on pass, green/yellow/red breakdown)
- ✅ Drug test compliance bar + detail table
- ✅ Incident log
- ✅ Date range filter (7/14/30/90 days) + print button

---

## Calendar (/calendar)
- 📋 Coming soon placeholder — dark themed with planned features preview

---

## Analytics (/analytics)
- 📋 Owner-only placeholder — real charts coming in Phase 3

---

## Settings (/settings)
- ✅ Team member list with role + home assignment badges
- ✅ Invite house manager dialog (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
- ✅ Remove team member (with confirmation dialog)

---

## Setup / Seed (/seed)
- ✅ Block 1: Core tables (homes, residents)
- ✅ Block 2: Detail tables (drug_tests, chores, notes, medications, meetings, restrictions)
- ✅ Block 3: profiles table + RLS policies + manager email/phone columns
- ✅ Block 4: tasks + messages tables
- ✅ Block 5: nightly_reports table
- ✅ Seed button — 3 test homes + 12 residents + sample data
- ✅ Clear all data button

---

## Planned — Phase 2 (next sprint)
- 💡 Edit resident profile (currently create-only — need edit form for flag, status, sobriety date, notes)
- 💡 Discharge resident flow (mark discharged, pick reason: graduated/left/violation/hospitalized)
- 💡 All Residents page — global search + filter across all homes (owner only)
- 💡 House Manager Candidates page — auto-filter (6+ months sobriety, zero fails, green flag)
  - Mike can star/pin candidates
  - Managers can nominate 1–2 from their home
- 💡 Formal Incident Report form (type: fight/relapse/theft/curfew/medical/other)
- 💡 Manager performance metrics (nightly rate, drug test %, incident frequency, flag counts → House Health Score)
- 💡 Referral source field on resident intake (hospital/court/treatment/word of mouth/self/other)
- 💡 Discharge outcome tracking (for retention rate analytics)
- 💡 Flag history log (track flag changes: who changed it, when, old→new)

---

## Planned — Phase 3 (analytics + growth)
- 💡 Analytics dashboard: discharge outcomes pie, drug test pass rate over time, avg length of stay, nightly compliance by manager
- 💡 Push notifications (nightly reminder at 8pm if not submitted)
- 💡 Google Calendar sync
- 💡 Deploy to Vercel
- 💡 Multi-facility admin panel (sell to other facilities)
- 💡 Billing / subscription layer
- 💡 React Native mobile app (same Supabase backend, no rebuild needed)
