# Managr — Shared Memory (Claude + Codex)

Last updated: 2026-04-18

## Critical gotchas
- **Auth is currently BYPASSED** — middleware and UserProvider both have dev bypass active. See SESSION_HANDOFF.md for how to re-enable.
- shadcn Base UI: NO DialogTrigger asChild — use `onClick={() => setOpen(true)}`
- Font: loaded via `next/font/google` in layout.tsx — NOT @import in globals.css
- Client components: always use `useParams()` from `next/navigation`
- HomeCard + HomeListRow are client components (use useRouter for navigation)
- Drug test "overdue" = not tested this calendar week (Mon–Sun), NOT rolling 7 days
- First user to sign up = owner (checked by counting profiles table rows)
- SUPABASE_SERVICE_ROLE_KEY must be in .env.local for /api/invite to work
- Inline styles pattern used throughout (not Tailwind classes) for precise dark theme colors

## Auth bypass files (DEV MODE)
- `src/middleware.ts` — bypass block at top, real auth commented below
- `src/components/auth/UserProvider.tsx` — fake "owner" profile at top, real provider commented below
- When re-enabling: swap the comments in both files

## Tables that need to exist (run /seed SQL blocks in Supabase)
| Block | Tables | Notes |
|---|---|---|
| Block 1 | homes, residents | Core — run first |
| Block 2 | drug_tests, chores, notes, medications, weekly_meetings, restrictions | Resident detail tabs |
| Block 3 | profiles + RLS | Required for real auth to work |
| Block 4 | tasks, messages | Tasks and Messages pages |
| Block 5 | nightly_reports | Nightly page |

## Columns added via ALTER TABLE (included in Block 3 SQL on /seed)
- homes.house_manager_email
- homes.manager_phone
- drug_tests.substance

## Design system (do not change color values mid-build)
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

## Utility CSS classes (from globals.css)
- `.dash-card` — standard dark card (bg #0F1523, border, hover border blue)
- `.gradient-card` — blue-purple gradient card (used for flags/AI insights sections)
- `.row-hover` — subtle row background on hover
- `.card-label` — tiny uppercase section label (gray, 0.65rem)
- `.fade-in` — fade + slide up animation on mount
- `.flag-dot` — 6px colored dot for flag indicators
- `.status-badge` — small rounded pill badge

## What NOT to change without asking
- The weekly drug test logic (calendar week, not rolling days) — intentional design
- The cascade delete behavior on homes
- The first-user-becomes-owner logic in UserProvider (when auth is re-enabled)
- Color tokens — all pages are built against these exact values

## App overview
- Built for Mike at Lighthouse Recovery (sober living facility in TX)
- Owner = Mike (can see all homes, all residents, full analytics)
- Manager = house manager (sees only their assigned home)
- Aamir's personal mission: give this to Mike as a gift + use it to reconnect
- Long-term: sell to other sober living facilities ($500–$2,000/month SaaS)
