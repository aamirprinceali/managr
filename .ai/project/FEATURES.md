# Managr — Feature Status

Last updated: 2026-04-23

## Legend
- ✅ Built & styled (dark theme, complete UI)
- 🔧 Built — requires Supabase table to be seeded to show data
- 🔨 Built but needs polish next session
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
- ✅ Owner Dashboard: KPIs, donut chart, bar chart, house health grid, flags feed, drug tests widget, nightly widget
- ✅ Manager Dashboard: 4-card checklist (Tests / Chores / Nightly / Tasks), resident list, messages widget, open flags card
- 🔧 Requires homes + residents + tasks tables in Supabase

---

## Homes
- ✅ Homes list — card + list view toggle, stats bar, add home dialog
- ✅ Home detail — resident list sorted by flag, occupancy bar, edit home
- ✅ Resident profile — 7-tab deep profile (Overview, Drug Tests, Chores, Notes, Medications, Meetings, Restrictions)
- ✅ Drug test weekly tracker (Mon–Sun, mark individual or bulk)
- 🔧 All data from Supabase

---

## All Residents (/residents) — Owner Only
- 📋 Placeholder — global resident search across all homes (Phase 2)

---

## Tasks (/tasks) — REBUILT
- ✅ Group tasks: Morning Meds, Night Meds, Drug Test Round
- ✅ Collapsible resident checklist per group task with progress bar
- ✅ "Mark All Done" per group task
- ✅ Daily auto-reset via task_group_completions table
- ✅ Standard tasks: title, category, priority, recurring, due date, reminder time
- ✅ Owner can assign tasks to managers (with "From Mike" badge)
- ✅ 2-step type picker dialog
- ✅ Tabs: Today / All / Assigned / Recurring
- ✅ Home filter
- 🔨 Needs polish: compact group cards, sharper rows, conditional form fields, manager dropdown from DB, time picker, edit task
- 🔧 Requires Block 6 SQL in Supabase (tasks upgrade + task_group_completions table)

---

## Messages (/messages)
- ✅ House manager directory (name, email, phone per home)
- ✅ mailto / tel links
- ✅ Internal compose panel
- ✅ Message history with unread badges
- 🔧 Requires messages table (Block 4) + email/phone columns on homes (Block 3)

---

## Nightly Reports (/nightly)
- ✅ Manager form — Yes/No toggles + notes (residents accounted, incidents, meds, curfew violations)
- ✅ "Already submitted" state with expandable confirmation card
- ✅ Owner view — all homes listed with ✓/✗ status, expandable to read full report
- 🔨 Owner view needs redesign: house cards grid → click → House Nightly Detail page with history (NEXT SESSION)
- 🔧 Requires nightly_reports table (Block 5)

---

## Reports (/reports)
- ✅ Current: summary KPI cards, status table, drug test compliance bar, incident log, date filter
- 🔨 Full rebuild planned next session around 10 confirmed metrics (see PROJECT_PLAN.md)
- 💡 New design: 6 pinned snapshot cards, More Metrics expandable, click-to-drill-down drawer, goal vs actual, date range filter

---

## Calendar (/calendar)
- 📋 Coming soon placeholder

---

## Analytics (/analytics)
- 📋 Owner-only placeholder — Phase 3

---

## Settings (/settings)
- ✅ Team member list with role + home assignment badges
- ✅ Invite house manager dialog
- ✅ Remove team member (with confirmation)

---

## Setup / Seed (/seed)
- ✅ Block 1: homes, residents
- ✅ Block 2: tasks table (basic — pre-upgrade)
- ✅ Block 3: profiles + RLS + manager email/phone columns
- ✅ Block 4: messages
- ✅ Block 5: nightly_reports
- ✅ Block 6: tasks upgrade + task_group_completions ← **must run for new task system**
- ✅ Seed button — 3 test homes + 12 residents + sample data
- ✅ Clear all data button

---

## Confirmed Metrics for Reports Page (NEXT SESSION)
1. Occupancy Rate
2. Drug Test Compliance Rate
3. Drug Test Pass Rate
4. 30-Day Retention Rate
5. 90-Day Retention Rate
6. Graduation Rate
7. Average Length of Stay
8. Active Red Flags
9. Relapse Rate (30-day)
10. Incident Rate

---

## Planned — Phase 2 backlog
- 💡 Edit resident profile
- 💡 Discharge resident flow
- 💡 All Residents page — global search + filter
- 💡 House Manager Candidates page
- 💡 Formal Incident Report form
- 💡 Manager performance metrics → House Health Score
- 💡 Referral source field on resident intake
- 💡 Discharge outcome tracking
- 💡 Flag history log

---

## Planned — Phase 3
- 💡 Analytics dashboard (charts over time)
- 💡 Push notifications
- 💡 Google Calendar sync
- 💡 Deploy to Vercel
- 💡 Multi-facility admin panel
- 💡 Billing/subscription layer
- 💡 React Native mobile app
