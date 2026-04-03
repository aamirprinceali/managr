# Managr — Claude Code Project Context

## What This App Is
Managr is a sober living / recovery housing operations app built for house managers and facility owners.
Built as a gift for a friend (Mike) who runs a sober living facility. Long-term goal: sell to other treatment centers, sober livings, and detox facilities.

**App name:** Managr
**Owner/first client:** Mike (friend, owns a sober living called Lighthouse)
**Business goal:** Give to Mike free, let word of mouth spread, then charge other facilities

---

## Tech Stack

### Phase 1 — Web App (current)
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Base UI version — NOT Radix)
- **Database:** Supabase (PostgreSQL + RLS)
- **Font:** Plus Jakarta Sans via `next/font/google`
- **Auth:** Supabase Auth (role-based — planned, not yet built)
- **Deployment:** Vercel (not yet deployed)

### Phase 2 — Mobile App (after web is solid)
- React Native + Expo, same Supabase backend

---

## Color Scheme
- Background: `#F0F4F8`
- Sidebar: `#0B1F3A` (deep navy)
- Accent / Primary: `#0284C7` (sky blue)
- Text: `#0B1F3A`
- Muted: `#64748B`
- Border: `#DDE4ED`
- Flags: Green `#16A34A`, Yellow `#D97706`, Red `#DC2626`

---

## How to Run
```bash
cd ~/Desktop/dev/managr
npm run dev
```
App runs at: http://localhost:3000

---

## Critical Technical Notes

### shadcn/ui Base UI compatibility
- `DialogTrigger asChild` does NOT work — causes runtime errors
- Pattern to use: plain `<Button onClick={() => setOpen(true)}>` before the `<Dialog>` component, no `DialogTrigger`

### Font loading
- Font is loaded via `next/font/google` in `layout.tsx` as `Plus_Jakarta_Sans`
- NEVER use `@import url()` for Google Fonts in `globals.css` — breaks PostCSS

### Supabase client
- Always use `createClient()` from `@/lib/supabase/client` in client components
- URL: `https://tvirellvovwppyofjtjs.supabase.co` (stored in `.env.local`)

### Route params in client components
- Always use `useParams()` from `next/navigation` — never use server-side params in client components

---

## Navigation Structure
```
/homes                          → Dashboard (all homes + stats)
/homes/[id]                     → Home Dashboard (residents list)
/homes/[id]/residents/[id]      → Resident Profile (all tabs)
```

---

## Supabase Tables (all created)

### homes
- id, name, address, notes, bed_count, house_manager_name, assistant_manager_name, created_at

### residents
- id, home_id, full_name, phone, dob, move_in_date, sobriety_date, drug_of_choice
- status (Active / On Pass / Discharged), flag (Green / Yellow / Red), risk_level
- room_number, emergency_contact_name, emergency_contact_phone
- sponsor_name, case_manager_name, therapist_name
- notes, points, is_archived

### drug_tests
- id, resident_id, test_date, result, notes, recorded_by, created_at

### chores
- id, resident_id, title, cadence (Daily/Weekly/One-time), status (Pending/Done), due_date, completed_at, completed_by

### notes
- id, resident_id, home_id, type (Note/Incident/Relapse), body, created_by, created_at

### medications
- id, resident_id, name, dosage, frequency, prescriber, start_date, notes

### weekly_meetings
- id, resident_id, meeting_date, notes, created_by, created_at

### restrictions
- id, resident_id, title, notes, is_active (bool), created_at

---

## File Structure (key files)

```
src/
  app/
    globals.css                          — Color tokens, utility classes
    layout.tsx                           — Root layout, Plus Jakarta Sans font
    page.tsx                             — Redirects to /homes
    homes/
      page.tsx                           — CLIENT: All homes dashboard + stats
      [id]/
        page.tsx                         — CLIENT: Home dashboard + resident list
        residents/
          [residentId]/
            page.tsx                     — CLIENT: Full resident profile (7 tabs)
  components/
    layout/
      Sidebar.tsx                        — Deep navy sidebar, fetches homes for sub-nav
      MobileNav.tsx                      — Fixed bottom nav, 4 items
    homes/
      AddHomeDialog.tsx                  — Add home form dialog
      HomeCard.tsx                       — Home card with occupancy bar + flagged banner
      HomeListRow.tsx                    — List view row for homes
    residents/
      AddResidentDialog.tsx              — Full 16-field add resident form (4 sections)
      ResidentRow.tsx                    — Resident row linking to profile
  lib/
    supabase/
      client.ts                          — Browser Supabase client
docs/
  features.md                            — Full feature tracking list
  plans/
    2026-03-31-mvp-foundation.md         — Original implementation plan
```

---

## Resident Profile Tabs (all built)
1. **Overview** — personal info, contacts (sponsor, case manager, therapist), general notes
2. **Drug Tests** — log new test, full test history with result badges
3. **Chores** — assign chores, toggle done/pending, cadence (Daily/Weekly/One-time)
4. **Notes** — add Note / Incident / Relapse entries, timeline view
5. **Medications** — add meds with dosage, frequency, prescriber
6. **Meetings** — log weekly house meeting notes per resident, history view
7. **Restrictions** — add restrictions, lift/reinstate them, lifted ones shown separately

---

## What Was Built (Cumulative)

### Sprint 1 — Foundation ✅
- Next.js scaffold, Supabase connected, shadcn/ui installed
- Homes screen (card + list toggle)
- Home Dashboard (stats + resident list sorted by flag)
- Add Home dialog
- Add Resident dialog (16 fields, 4 sections)

### Sprint 2 — Design + Profile ✅
- Premium design: navy sidebar, sky blue accent, Plus Jakarta Sans
- Resident Profile page with full header card (name, status, flag, days sober, points +/-)
- All 7 profile tabs: Overview, Drug Tests, Chores, Notes, Medications, Meetings, Restrictions
- Points live update (no page reload)
- Days sober auto-calculated from sobriety date

### Database fixes applied
- Added missing columns to residents: `dob`, `room_number`, `sponsor_name`, `case_manager_name`, `therapist_name`, `notes`
- Created `weekly_meetings` table
- Created `restrictions` table

---

## What's Next

### Immediate (next session)
- [ ] Test all 7 tabs end-to-end (add data, verify it saves and loads)
- [ ] Edit resident profile (currently read-only after creation)
- [ ] Discharge resident flow (sets status to Discharged, marks is_archived)
- [ ] "Due Today" dashboard — who has drug tests, chores overdue, appointments today

### Short Term
- [ ] Bulk drug test — test all residents in a home at once
- [ ] Curfew check-in log per resident
- [ ] Sobriety milestones (30/60/90 day badges)
- [ ] Resident timeline view (single scrollable history of everything)
- [ ] Nightly reports form

### Medium Term
- [ ] Auth / login (Supabase Auth)
- [ ] Role-based access (Admin / Manager / Viewer)
- [ ] Deploy to Vercel
- [ ] Give to Mike

---

## Skills to Use on This Project
| Skill | When to Use |
|-------|-------------|
| `ui-ux-pro-max` | Every screen, every component design decision |
| `frontend-design` | Building any UI component or screen |
| `brainstorming` | Before adding any new feature |
| `writing-plans` | Before starting any implementation sprint |

---

## Session Notes
- Always explain what we're doing and why before doing it (Aamir is learning)
- Always add comments in code explaining what each section does
- Keep files small and focused
- Always use .env for secrets
- End every session with a summary of what was built and what's next
- Update this CLAUDE.md at the end of every session
