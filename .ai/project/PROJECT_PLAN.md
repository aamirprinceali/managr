# Managr — Project Plan

Last updated: 2026-04-18

---

## Phase 1 — Premium Redesign + Dual Dashboards ✅ COMPLETE

- [x] Design system overhaul (globals.css — NeuroBank dark palette)
- [x] Owner Dashboard (KPIs, donut chart, bar chart, house health, flags feed)
- [x] Manager Dashboard (checklist, resident list, messages widget, flags)
- [x] Nightly Reports page (manager form + owner all-homes view)
- [x] Sidebar updated (Nightly added, dark theme refined)
- [x] All pages dark themed: Tasks, Messages, Reports, Settings, Calendar
- [x] Auth bypassed for dev mode (middleware + UserProvider mocked)
- [x] Login error handling fixed (try/catch — no more infinite hang)

---

## Phase 2 — Feature Completion (Current Focus)

### 2A. Resident Management
- [ ] **Edit resident profile** ← #1 priority — update flag, status, sobriety date, notes, room, phone
- [ ] **Discharge resident flow** — outcome dropdown (Graduated/Left/Violation/Hospitalized/Other), sets discharge_date
- [ ] **All Residents page** (/residents) — global searchable list across all homes, sort by flag/home/status
- [ ] Resident timeline view (chronological: tests, incidents, notes, flag changes)

### 2B. House Manager Candidates Page (/candidates)
- [ ] Auto-filter: 6+ months resident + 6+ months sober + zero failed tests in 90d + no incidents + Green flag
- [ ] Mike can star/pin candidates (`hm_candidate_pinned` boolean on residents table)
- [ ] Managers can nominate 1–2 from their home (`hm_nominated_by` field)
- [ ] Pinned candidates always at top of list

### 2C. Flags & Alerts System
- [ ] Flag types: drug test fail, curfew violation, incident report, restriction added, manager-raised
- [ ] Auto-flag on failed drug test
- [ ] Flag status: Open / Acknowledged / Resolved
- [ ] Mike sees all open flags across all homes in one view

### 2D. Formal Incident Reports
- [ ] Form beyond notes field: type (fight/relapse/theft/curfew/medical/other)
- [ ] Becomes primary data source for incident frequency tracking
- [ ] Nav item already in sidebar (placeholder)

### 2E. Manager Performance Metrics
- [ ] Per manager: nightly submission rate, drug test completion rate, incident frequency, open flag count
- [ ] Roll into "House Health Score" per house on Mike's dashboard

---

## Phase 3 — Analytics + Business Intelligence

### 3A. Analytics Dashboard (/analytics)
- [ ] Occupancy over time (line chart per house + combined)
- [ ] Drug test pass rate over time
- [ ] Discharge outcomes pie (graduated vs. ejected vs. other)
- [ ] Flag escalation heatmap
- [ ] Nightly compliance by manager (bar chart)

### 3B. Business Intelligence Metrics
Track from day one to build valuable data:
- [ ] Discharge outcome type (biggest unlock for retention analytics)
- [ ] Referral source (hospital/court/treatment/word of mouth/self/other)
- [ ] Length of stay by outcome
- [ ] Time-to-fill vacant bed
- [ ] Re-admission rate
- [ ] Sobriety milestone hit rate (30/60/90/180 days)
- [ ] Flag escalation trajectory (pattern before relapse)

### 3C. Predictive Indicators (stretch)
- [ ] At-risk score per resident (flag pattern + test trend)
- [ ] House health composite score
- [ ] Weekly auto-report emailed to Mike every Sunday

---

## Phase 4 — Launch & Scale

- [ ] Re-enable auth (flip comments in middleware.ts + UserProvider.tsx)
- [ ] Run all Supabase SQL blocks (Blocks 1–5 via /seed)
- [ ] Supabase RLS rules (before real users)
- [ ] Add SUPABASE_SERVICE_ROLE_KEY to .env.local
- [ ] Deploy to Vercel
- [ ] Mike creates account, enters homes, invites managers
- [ ] React Native mobile app (same Supabase backend — Phase 4 or 5)
- [ ] Multi-facility version (white-label for other sober living operators)
- [ ] Billing/subscription layer

---

## Architecture Notes
- No RLS yet — role filtering is client-side only (fine for demo, add before real users)
- All data pages gracefully handle missing tables (try/catch → "table not set up" state)
- Inline styles throughout (not Tailwind classes) — allows precise dark theme control
- Auth bypass is temporary — two file swaps to re-enable (see SHARED_MEMORY.md)
