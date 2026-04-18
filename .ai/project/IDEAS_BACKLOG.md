# Managr — Ideas Backlog

## Aamir's Feature Ideas (Captured April 2026)

### Dual Dashboard System
- Owner (Mike) dashboard: command center, all houses visible, flags, metrics, nightly status
- House Manager dashboard: daily ops, resident list sorted by flag, quick actions
- Separate access/views for each role — same login system, different experience

### Messaging
- Mike messages any house manager or resident directly from the app
- Contextual: messages thread under flags/incidents (audit trail)
- Inbox for both owner and manager views

### Nightly Reports
- Native form (replacing Typeform — same questions)
- Submitting shows "Nightly Submitted ✓" with timestamp
- 9pm reminder banner if nightly not yet submitted
- Mike sees per-house nightly status on his dashboard
- Late submission flagged if after midnight
- Nightly history per house (archive)

### Flags & Alerts
- Mike sees all house flags on his dashboard
- Flag types: drug test fail, curfew, incident, restriction, manager-raised
- Click flag → full detail + message manager from that screen
- Flag status: Open / Acknowledged / Resolved

### Business Intelligence (Track from day 1)
- Resident retention rate (completed vs. left early)
- Drug test pass rate over time (per house, per manager)
- Average length of stay (by outcome)
- Time-to-fill vacant bed (revenue impact)
- Incident frequency by day/week/month
- Flag escalation trajectory (early warning system)
- Nightly report compliance rate per manager
- Re-admission rate
- Chore/task completion rate per house
- Sobriety milestone hit rates
- Referral source tracking (hospital, court, word of mouth, self)

### Predictive / Trend Ideas (Long-term)
- Resident risk score: flag pattern + drug test trend = early warning
- House health score: composite of all metrics
- Weekly summary report (PDF/email) auto-sent to Mike on Sundays
- "Residents who get flagged yellow in week 2 have X% relapse rate by week 6"

---

## Existing Product Ideas
- Sobriety milestone celebrations (auto-badge at 30/60/90/180/365 days)
- Curfew check-in system (resident texts in, app logs it)
- Drug test scheduling (auto-assign day + notify manager)
- Bulk discharge for when a house closes
- Resident intake form (shareable link, resident fills it out themselves)
- House rules / policy documents per home
- Timeline view per resident (all events in chronological order)
- Photo ID upload per resident
- Visitor log
- House inspection checklist
- Discharge reason + outcome type (graduated, voluntary, ejected, hospitalized)

## SaaS / Business Ideas
- Free tier (1 home, 10 residents) → paid per home
- White-label for treatment centers
- Integration with MAT (medication-assisted treatment) providers
- Integration with court systems for compliance reporting
- Weekly report PDF auto-emailed to owner every Sunday night
- Referral source tracking → marketing insights

## Tech Ideas
- React Native mobile app (house managers work on phones) — Phase 2
- Offline mode (log drug tests even without internet)
- Real-time notifications (Supabase Realtime)
- Audit log (who changed what, when)
- Two-factor auth for owner account
- Supabase RLS (before real user launch)
