# Managr — Key Decisions

## Architecture
- **Client-side role filtering (not RLS)** — Chosen for speed of MVP. RLS will be added before going live with real users.
- **supabase-js browser client for most data** — All pages use `createBrowserClient`. Server-side client only used in middleware.
- **API route for user creation** — `/api/invite` uses service_role key server-side so owner can create manager accounts without signing themselves out.
- **First user = owner** — Avoids a manual setup step. When profiles table is empty, first sign-up gets owner role.

## Drug Testing
- **Calendar week (Mon–Sun), not rolling 7 days** — Matches how house managers actually think about it. Resets automatically every Monday.
- **Bulk mark Negative** — Most common outcome. Saves time. Individual positive logging still available.
- **Substance field on positives** — Required when result = Positive so there's always a record of what it was.

## Data Model
- **No migrations folder** — Schema created directly in Supabase SQL Editor. /seed page contains all required SQL.
- **Cascade deletes** — Deleting a home deletes all residents and their records. Intentional.
- **is_archived on residents** — Soft delete. Discharged residents can be archived without losing their history.

## Design
- **Deep navy (#0B1F3A) + sky blue (#0284C7)** — Original color scheme. Premium redesign in progress.
- **Plus Jakarta Sans** — Loaded via next/font/google in layout.tsx (NOT @import in CSS — caused a bug once).
- **shadcn Base UI** — No DialogTrigger asChild. Use `onClick={() => setOpen(true)}` pattern.
- **Mobile-first** — House managers use phones. Bottom nav on mobile, sidebar on desktop.
