# Managr — Full Product Blueprint

## Vision
A premium, mobile-first operations app for sober living and recovery housing facilities.
House managers run their homes from their phone. Owners see everything from a dashboard.
Residents have full profiles that follow them — even if they transfer homes or return after discharge.

---

## What Makes Managr Different

1. **Resident history travels with them** — when a resident transfers or returns, the new manager
   sees every note, test, incident, and document. No more re-explaining everything.

2. **Built by someone who knows how these houses actually run** — Sunday nightly reports,
   drug test logging, chore tracking, the revolving door of managers — all accounted for.

3. **Archive, don't delete** — discharged residents are archived, not deleted. If they come
   back (and they often do), everything is waiting for them.

4. **Color-coded at a glance** — Green / Yellow / Red flags visible on every screen so
   managers know who needs attention without clicking into anything.

5. **Role-based access** — Owners see everything. Managers see their house. Viewers are read-only.

---

## Screen-by-Screen Breakdown

### Screen 1: Login
- Clean, minimal login screen
- Email + password via Supabase Auth
- Role auto-assigned on login

### Screen 2: Homes Dashboard (Main Landing)
- Grid or card list of all homes
- Each card shows: home name, address, # of residents, # flagged red
- "Add Home" button (Admin only)
- Tap a home → goes to Home Dashboard

### Screen 3: Home Dashboard
- Header with home name + address
- Stats row: Total beds | Occupied | On Pass | Flagged
- Resident list sorted by flag color (Red first)
- Each resident row: name, flag color dot, status badge, points
- "Add Resident" button
- Tap a resident → goes to Resident Profile

### Screen 4: Resident Profile
- Photo + name at top
- Status badge (Active / On Pass / Discharged)
- Flag color indicator (Green / Yellow / Red)
- Sobriety date + Days Sober counter
- Intake date, drug of choice, risk level
- Points with +/- buttons

**Tabs or sections below:**
- Chores
- Drug Tests
- Medications
- Documents
- Notes & Incidents
- Appointments
- Use History

### Screen 5: Add/Edit Resident
- Form with all fields
- Assign to home
- Upload photo
- Set sobriety date, intake date

### Screen 6: Nightly Report
- Per-house, per-week
- Structured form matching how Mike's facility runs it
- Submit + archive
- Past reports viewable

### Screen 7: Incident Reports
- Attached to resident
- Severity level, notes, resolution
- Listed on resident profile + house log

### Screen 8: Admin Panel
- Manage users (add managers, assign to homes)
- Manage homes
- View all houses at once

---

## UI Design Direction

**Style:** Premium, clean, slightly warm. Not clinical. Not corporate.
Think: the professionalism of a medical app with the warmth of a recovery environment.

**Colors:**
- Primary: Deep navy or dark slate (authority, trust)
- Accent: Warm amber or gold (hope, forward motion)
- Success/Green: #22C55E
- Warning/Yellow: #EAB308
- Alert/Red: #EF4444
- Background: Off-white or very light gray (not pure white)

**Typography:**
- Headings: Inter or Geist (clean, modern)
- Body: Inter
- Weights: 400 body, 600 labels, 700 headings

**Components:**
- Large tap targets (min 44px height on mobile)
- Card-based layouts
- Sticky headers on mobile
- Bottom tab navigation on mobile view
- Status badges with color fills
- Animated transitions between screens

---

## Tech Decisions & Why

| Decision | Why |
|----------|-----|
| Next.js | Works great on web, easy to learn, Vercel deploys in seconds |
| Supabase | Free tier, built-in auth, file storage, real-time — all in one |
| shadcn/ui | Pre-built premium components, easy to customize |
| Tailwind | Fast styling, consistent spacing, mobile-first |
| React Native (Phase 2) | Same logic, real native app on iOS/Android |

---

## MVP Build Order

**Week 1**
1. Scaffold Next.js app
2. Connect Supabase
3. Auth (login + role detection)
4. Homes screen

**Week 2**
5. Home Dashboard
6. Add/Edit Resident
7. Resident Profile shell

**Week 3**
8. Chores module
9. Drug Tests module
10. Documents (upload + list)

**Week 4**
11. Notes & Incidents
12. Nightly Report form
13. Polish + mobile responsiveness
14. Deploy to Vercel
15. Give to Mike

---

## Future Business Model
- Give Mike free forever (he's the case study + word of mouth engine)
- Charge other facilities: $99-199/month per facility
- Upsell: custom report templates, custom branding, multi-facility plans
- Phase 2: build custom tools for detoxes and treatment centers
