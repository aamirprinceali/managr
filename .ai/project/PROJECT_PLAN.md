# Managr — Project Plan

## Current Sprint (April 2026)
- [x] Auth system (login, middleware, UserProvider)
- [x] Role-based views (owner vs manager)
- [x] Weekly drug test tracker (calendar week Mon–Sun)
- [x] Edit/delete homes
- [x] Manager Dashboard, Tasks, Reports, Messages pages
- [x] Seed & Setup page
- [ ] Premium redesign (in progress — Aamir providing design specs)
- [ ] Edit resident profile
- [ ] Discharge resident flow
- [ ] Profiles SQL + auth fully wired

## Next Sprint
1. Finish redesign
2. Edit resident + discharge flow
3. All Residents page (/residents) wired to real data
4. Analytics page
5. Deploy to Vercel (show Mike)

## Architecture Notes
- No RLS yet — role filtering is client-side only (safe for MVP/demo, needs RLS before real users)
- SUPABASE_SERVICE_ROLE_KEY needed in .env.local for invite flow to work
- tasks + messages + profiles tables need to be created via /seed SQL blocks
