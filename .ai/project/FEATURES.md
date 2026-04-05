# Managr — Feature Status

## ✅ Built

### Auth & Roles
- Login page (email + password, Supabase Auth)
- Middleware protecting all routes
- UserProvider context (owner / manager roles)
- First user = owner auto-setup
- Settings > Team: invite managers, assign to homes
- Role-based views (managers see only their home)

### Homes
- Homes dashboard (card + list view, stats bar)
- Edit + delete homes (EditHomeDialog with confirmation)
- Manager email + phone fields on homes

### Home Dashboard
- Resident list sorted Red → Yellow → Green
- Weekly Drug Test tracker (Mon–Sun calendar week)
  - Start testing session
  - Mark individual (result + substance if positive)
  - Mark everyone Negative at once
  - Auto-resets every Monday
- Bed capacity display

### Resident Profile
- Full profile: 7 tabs (Overview, Drug Tests, Chores, Notes, Medications, Meetings, Restrictions)
- Points counter (+/-)
- Status + flag management

### Dashboard (/dashboard)
- Today's date + stats
- Needs Attention (red flags)
- Drug Tests Overdue (not tested this calendar week)
- Tasks Due Today
- Recent Incidents

### Tasks (/tasks)
- Add tasks (title, priority, type, due date, home, assigned to)
- Select all + bulk mark done
- Bulk Drug Test flag (creates task per active resident)
- Filter by status + home

### Reports (/reports)
- Drug test compliance bar + table
- Resident status by home
- Flag distribution
- Incident log
- Date range filter + print

### Messages (/messages)
- House manager directory with email (mailto) + phone links
- Internal message compose (requires messages table)
- Message history with unread indicators

### Seed & Setup (/seed)
- 4 SQL blocks to run in Supabase
- Seed 3 test homes + 12 residents + drug tests + tasks + notes
- Clear all data button

## 📋 Planned / In Progress

### High Priority
- [ ] Edit resident profile (currently read-only after creation)
- [ ] Discharge / archive resident flow
- [ ] App redesign — premium color scheme (in progress)
- [ ] Profiles SQL block added to seed (Block 3)

### Medium Priority
- [ ] Calendar integration (stub built, needs Google Calendar API)
- [ ] Email integration (SendGrid or Resend for real email sending)
- [ ] All Residents view (/residents) — search + filter across all homes
- [ ] Analytics page (occupancy trends, sobriety milestones)
- [ ] Documents tab per resident (file uploads via Supabase Storage)

### Future / SaaS
- [ ] Supabase Auth full setup (email confirmation flow)
- [ ] Row Level Security (RLS) in Supabase
- [ ] Deploy to Vercel
- [ ] Multi-facility billing / subscription
- [ ] React Native mobile app (same Supabase backend)
- [ ] Push notifications
