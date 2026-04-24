# Session Handoff — Last updated 2026-04-23

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

## What's been fully built

### ✅ Complete — all styled, dark theme consistent
| Page | Notes |
|---|---|
| Dashboard — Owner | KPIs, donut chart, bar chart, house health, flags feed, drug tests, nightly widget |
| Dashboard — Manager | 4-card checklist (Tests, Chores, Nightly, Tasks), resident list, messages, flags |
| Homes | List + detail, add/edit home dialog |
| Resident Profile | 7 tabs: Overview, Drug Tests, Chores, Notes, Medications, Meetings, Restrictions |
| Tasks (**REBUILT**) | Group tasks (Morning Meds / Night Meds / Drug Test Round), standard tasks, owner assignment, recurring, reminders, 2-step type picker, progress bars |
| Messages | House manager directory, compose panel, message history |
| Nightly Reports | Manager form + owner all-homes view |
| Reports | KPI cards, status table, drug test compliance, incident log, date filter |
| Settings | Team list, invite manager, remove member |
| Calendar | Placeholder |
| Seed (/seed) | Blocks 1–6 all present |

### ⚠️ Supabase — run Block 6 before using new Tasks
Block 6 adds columns to `tasks` and creates `task_group_completions` table.
Go to `/seed` → copy Block 6 → run in Supabase SQL Editor → confirm RLS warning (safe to ignore in dev).

---

## What to build NEXT SESSION (all approved, ready to build)

### 1. Tasks Page — Polish & Fixes
- Group task cards more compact when collapsed (less visual weight)
- Section headings need more contrast/presence — currently blend into background
- Drug tests for same house consolidated into one collapsible group card, not multiple rows
- Task rows sharper, more premium visual treatment
- Add Task form — strip to essentials only, conditional field reveals (fields appear based on prior selections)
- "Assign to Manager" pulls real manager names from `profiles` table (dropdown, not free text)
- Time picker added to both recurring and one-off tasks
- Click existing task → opens in edit mode (currently add-only)

### 2. Nightly Reports — Owner View Redesign
Replace flat list with **house cards grid**:
- Each card: house name, manager name, tonight's status (✓ Submitted / ✗ Missing), incident preview line
- Click card → **House Nightly Detail page**:
  - Header: house name, manager name + phone
  - Stats bar: "Sarah has submitted 47 nightlies · 112 total for this house"
  - Tonight's full report (expandable) or "Not submitted yet" banner
  - History: scrollable timeline of every past nightly, each expandable to read full report

### 3. Reports Page — Full Rebuild
**Confirmed metrics (Top 10, selected by Aamir):**
1. Occupancy Rate — % of beds filled across all homes
2. Drug Test Compliance Rate — % of required weekly tests completed
3. Drug Test Pass Rate — % of tests that came back negative
4. 30-Day Retention Rate — % of residents who stayed 30+ days
5. 90-Day Retention Rate — % of residents who stayed 90+ days (industry benchmark)
6. Graduation Rate — % of discharges that were "completed program"
7. Average Length of Stay — average days residents are in the program
8. Active Red Flags — residents currently red-flagged across all homes
9. Relapse Rate (30-day) — % of residents with a positive test in last 30 days
10. Incident Rate — incidents per resident per month, trending up or down

**Layout:**
- Top 6 always visible as snapshot metric cards (Mike selects which 6 he wants pinned)
- Remaining 4 in "More Metrics" expandable section below
- Click any metric card → drawer opens showing calculation, raw data, goal vs actual
- Date range filter (7 / 30 / 90 days / all time) at top — applies to all metrics
- Each metric shows: current value, goal target, trend arrow (up/down vs last period)

### 4. Design Facelift (entire app)
- New heading font — Syne or Space Grotesk (more character, less generic)
- Cards: subtle top-edge inner highlight, more layered depth
- Section headers: stronger presence, thin colored left-border accent, better contrast
- Sidebar: refined active state, subtle gradient behind active item
- Status pills: thin border + soft glow treatment instead of flat fills
- Page headers: clear visual hierarchy — title should feel like a title
- Micro-details: hover states, slight scale on interactive cards, smoother transitions

---

## Supabase status
- Project ID: `tvirellvovwppyofjtjs`
- URL: `https://tvirellvovwppyofjtjs.supabase.co`
- **Project may be paused** (free tier auto-pauses after inactivity) — check app.supabase.com

### SQL blocks status
| Block | Table(s) | Status |
|---|---|---|
| Block 1 | homes, residents | ✅ Done |
| Block 2 | tasks table (basic) | ✅ Done |
| Block 3 | profiles + RLS | ✅ Done |
| Block 4 | messages | ✅ Done |
| Block 5 | nightly_reports | ✅ Done |
| Block 6 | tasks upgrade + task_group_completions | ⚠️ Run this — needed for new task system |

### .env.local entries required
```
NEXT_PUBLIC_SUPABASE_URL=https://tvirellvovwppyofjtjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  (already set)
SUPABASE_SERVICE_ROLE_KEY=...  (needed for /settings invite manager)
```

---

## Design tokens (do not change)
```
Background:    #090B14
Card:          #0F1523
Dark surface:  #131929
Border:        rgba(255,255,255,0.06)
Primary blue:  #3B82F6
Text heading:  #F1F5F9
Text body:     #94A3B8
Text muted:    #475569
Text dim:      #334155
Text ghost:    #1E293B
Success:       #4ADE80 | Warning: #FCD34D | Danger: #F87171
```

---

## Critical code patterns (do NOT break these)
- `useProfile()` from `@/components/auth/UserProvider` → gives `profile.role`, `profile.home_id`, `profile.full_name`
- `isOwner = profile?.role === "owner"` / `isManager = profile?.role === "manager"`
- Drug test "overdue" = not tested this calendar week (Mon–Sun), NOT rolling 7 days
- First user to sign up = owner (checked by counting profiles rows)
- Supabase client: `createClient()` from `@/lib/supabase/client`
- Graceful table fallback: try/catch → show "table not set up" state with link to /seed

---

## GitHub
Repo: https://github.com/aamirprinceali/managr
Branch: main
