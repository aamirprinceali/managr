# Managr — Project Plan

Last updated: 2026-04-23

---

## Phase 1 — Premium Redesign + Dual Dashboards ✅ COMPLETE

- [x] Design system overhaul (globals.css — NeuroBank dark palette)
- [x] Owner Dashboard (KPIs, donut chart, bar chart, house health, flags feed)
- [x] Manager Dashboard (checklist, resident list, messages widget, flags)
- [x] Nightly Reports page (manager form + owner all-homes view)
- [x] Sidebar updated (all nav items, dark theme refined)
- [x] All pages dark themed: Tasks, Messages, Reports, Settings, Calendar
- [x] Auth bypassed for dev mode (middleware + UserProvider mocked)

---

## Phase 2 — Feature Completion (Current Focus)

### 2A. Tasks System ✅ REBUILT (needs polish next session)
- [x] Group tasks: Morning Meds, Night Meds, Drug Test Round
- [x] Collapsible resident checklists with progress bars
- [x] Standard tasks with priority, category, recurring, reminders
- [x] Owner can assign tasks to managers
- [x] 2-step type picker dialog
- [x] Manager dashboard Tasks card
- [ ] **NEXT** — Tasks polish: compact collapsed cards, sharper rows, conditional form fields
- [ ] **NEXT** — "Assign to Manager" pulls from real profiles table (dropdown)
- [ ] **NEXT** — Time picker on all tasks
- [ ] **NEXT** — Edit existing tasks (currently add-only)
- [ ] **NEXT** — Section headings need contrast fix

### 2B. Nightly Reports — Owner View Redesign (NEXT SESSION)
- [ ] Replace flat list with house cards grid
- [ ] Each card: house name, manager, tonight's status, incident preview
- [ ] Click → House Nightly Detail page (stats, tonight's report, full history)

### 2C. Reports Page — Full Rebuild (NEXT SESSION)
**10 confirmed metrics (selected by Aamir):**
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

- [ ] Top 6 snapshot cards (Mike selects which 6 to pin)
- [ ] Remaining 4 in expandable "More Metrics" section
- [ ] Click metric → drawer with calculation, data, goal vs actual
- [ ] Date range filter (7/30/90/all) applied globally
- [ ] Goal target line per metric (Mike sets his own goals)

### 2D. Design Facelift (NEXT SESSION)
- [ ] New heading font (Syne or Space Grotesk)
- [ ] Cards: top-edge highlight, more depth
- [ ] Section headers: higher contrast, left-border accent
- [ ] Sidebar: refined active states
- [ ] Status pills: thin border + glow instead of flat fill
- [ ] Micro-interactions: hover scale, smoother transitions

### 2E. Resident Management (Backlog)
- [ ] Edit resident profile (flag, status, sobriety date, notes, room, phone)
- [ ] Discharge resident flow (outcome dropdown → sets discharge_date)
- [ ] All Residents page (/residents) — global search across all homes
- [ ] Resident timeline (chronological: tests, incidents, notes, flag changes)

### 2F. Other Backlog
- [ ] House Manager Candidates page — auto-filter (6mo+ sober, zero fails, green, no incidents)
- [ ] Formal Incident Report form (fight/relapse/theft/curfew/medical/other)
- [ ] Manager performance metrics → House Health Score
- [ ] Referral source field on resident intake
- [ ] Discharge outcome tracking
- [ ] Flag history log

---

## Phase 3 — Analytics + Growth

- [ ] Analytics dashboard (/analytics) — occupancy over time, test trends, discharge outcomes
- [ ] Push notifications (nightly reminder at 8pm)
- [ ] Google Calendar sync
- [ ] Deploy to Vercel (flip auth bypass, enable RLS, add service role key)
- [ ] Multi-facility admin panel
- [ ] Billing/subscription layer
- [ ] React Native mobile app (same Supabase backend)

---

## Architecture Notes
- No RLS yet — role filtering is client-side (fine for dev, enable before real users)
- All data pages gracefully handle missing tables (try/catch → "table not set up" state)
- Inline styles throughout — allows precise dark theme control
- Auth bypass is temporary — two file swaps to re-enable (see SHARED_MEMORY.md)
- Block 6 SQL in /seed must be run to enable new tasks system
