# Managr — Shared Memory (Claude + Codex)

## Critical gotchas
- shadcn Base UI: NO DialogTrigger asChild — use `onClick={() => setOpen(true)}`
- Font: loaded via `next/font/google` in layout.tsx — NOT @import in globals.css
- Client components: always use `useParams()` from `next/navigation`
- HomeCard + HomeListRow are now client components (use useRouter for navigation)
- Drug test "overdue" = not tested this calendar week (Mon–Sun), NOT rolling 7 days
- First user to sign up = owner (checked by counting profiles table rows)
- SUPABASE_SERVICE_ROLE_KEY must be in .env.local for /api/invite to work

## Tables that need to exist (run /seed SQL blocks)
1. Core tables (Block 1): homes, residents, drug_tests, chores, notes, medications, weekly_meetings, restrictions
2. Tasks table (Block 2)
3. Profiles table (Block 3) — required for auth/roles
4. Messages table (Block 4)

## Columns added via ALTER TABLE (already done if seed ran)
- homes.house_manager_email
- homes.manager_phone
- drug_tests.substance

## Current user / owner
- Owner account: Mike (aamirprinceali context)
- App is built for Mike's Lighthouse sober living facility
- Not yet deployed — running locally at http://localhost:3000

## What NOT to change without asking
- The weekly drug test logic (calendar week, not rolling days) — intentional
- The cascade delete behavior on homes
- The first-user-becomes-owner logic in UserProvider
