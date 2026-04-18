# Session Handoff — Last updated 2026-04-18

## IMPORTANT: Auth is bypassed for dev mode
The app opens directly to `/dashboard` — NO login required. This was intentional so Aamir can browse and build without fighting Supabase connectivity issues.

**To re-enable login when ready:** Two files to swap:
1. `src/middleware.ts` — comment out the bypass block, uncomment the real auth block
2. `src/components/auth/UserProvider.tsx` — comment out the fake profile block, uncomment the real provider block
Both files have clear `// ✅ DEV BYPASS` and `// 🔒 REAL AUTH` labels.

---

## How to start the app
```bash
pkill -f "next dev" && cd ~/Desktop/dev/managr && npm run dev
```
Open: **http://localhost:3000** → goes straight to Owner Dashboard (no login)

The app shows "Mike (Dev Mode)" in the sidebar as the owner. All owner-only pages are visible.

---

## What's been fully built (this session)

### ✅ Complete — all styled, dark theme consistent
| Page | Notes |
|---|---|
| Dashboard — Owner | KPIs, donut chart, bar chart, house health, flags feed, drug tests, nightly widget |
| Dashboard — Manager | Checklist cards, resident list, messages widget (Mike's highlighted amber), open flags |
| Homes | List + detail, add/edit home dialog |
| Resident Profile | 7 tabs: Overview, Drug Tests, Chores, Notes, Medications, Meetings, Restrictions |
| Tasks | Full CRUD, bulk drug test, select all, priority/type badges |
| Messages | Manager directory, compose panel, message history |
| Nightly Reports | Manager form, already-submitted state, owner all-homes view |
| Reports | KPI cards, status table, drug test compliance, incident log, date filter |
| Settings | Team list, invite manager, remove member |
| Calendar | Placeholder with feature preview |
| Sidebar | All nav items, active states, homes sub-list |
| Login | Bypassed for now — real login page exists and works when re-enabled |

---

## Supabase status
- Project ID: `tvirellvovwppyofjtjs`
- URL: `https://tvirellvovwppyofjtjs.supabase.co`
- **Project may be paused** (free tier auto-pauses after inactivity) — check app.supabase.com

### SQL blocks Aamir still needs to run in Supabase
Go to app.supabase.com → SQL Editor → run each block from http://localhost:3000/seed

| Block | Table | Status |
|---|---|---|
| Block 1 | homes, residents | Likely already done |
| Block 2 | drug_tests, chores, notes, medications, meetings, restrictions | Likely already done |
| Block 3 | profiles + RLS + manager email/phone columns | May need to run |
| Block 4 | tasks + messages | May need to run |
| Block 5 | nightly_reports | Needs to be run |

### .env.local entries required
```
NEXT_PUBLIC_SUPABASE_URL=https://tvirellvovwppyofjtjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (already set)
SUPABASE_SERVICE_ROLE_KEY=...  (needed for /settings invite manager — get from Supabase → Settings → API)
```

---

## What to build next (in priority order)

### Sprint 2 — Finish the skeleton

**1. Edit Resident Profile** ← most important for demos
Currently residents are create-only. Need an edit form that lets you update:
- Flag color (Green/Yellow/Red)
- Status (Active/On Pass/Discharged)
- Sobriety date
- General notes
- Room number, phone
File: `src/app/homes/[id]/residents/[residentId]/page.tsx`

**2. All Residents page** (`/residents`)
Currently a "coming soon" placeholder. Build: searchable list of all residents across all homes, sortable by flag/home/status. Owner only.
File: `src/app/residents/page.tsx`

**3. Discharge Resident flow**
Button on resident profile: "Discharge Resident" → modal asking for outcome (Graduated / Left voluntarily / Rule violation / Hospitalized / Other). Sets status to Discharged, fills discharge_date.

**4. House Manager Candidates page** (new page — `/candidates`)
Owner-only page. Auto-filters residents who qualify: 6+ months as resident, 6+ months sobriety, zero failed drug tests in last 90 days, no incidents in last 90 days, Green flag.
Mike can star/pin candidates. Managers can nominate 1–2 from their home.
Needs new field: `hm_candidate_pinned` boolean on residents table.

**5. Analytics page** (`/analytics`)
Currently a placeholder. Build real charts: occupancy over time, drug test pass rate, discharge outcomes.

---

## Design tokens (everything is built on these)
```
Background:    #090B14
Card:          #0F1523
Dark surface:  #131929  (inputs, table headers, nested cards)
Border:        rgba(255,255,255,0.06)
Primary blue:  #3B82F6
Text heading:  #F1F5F9
Text body:     #94A3B8
Text muted:    #475569
Text dim:      #334155
Text ghost:    #1E293B
Success:       #4ADE80
Warning:       #FCD34D
Danger:        #F87171
```

---

## Critical code patterns (do NOT break these)
- `useProfile()` from `@/components/auth/UserProvider` → gives `profile.role`, `profile.home_id`, `profile.full_name`
- `isOwner = profile?.role === "owner"` / `isManager = profile?.role === "manager"`
- Drug test "overdue" = not tested this calendar week (Mon–Sun), NOT rolling 7 days
- First user to sign up = owner (checked by counting profiles rows)
- Supabase client: `createClient()` from `@/lib/supabase/client`
- Graceful table fallback pattern: try/catch → show "table not set up" state with link to /seed

---

## GitHub
Repo: https://github.com/aamirprinceali/managr
Branch: main
All changes are committed and pushed as of 2026-04-18.
