# Managr — Tools & Stack Reference

This file lists every tool used in this project, what it is, and what it's doing here.
Update this whenever a new tool is added.

---

## Frontend (what you see)

### Next.js 14
**What it is:** A web framework built on top of React. Think of it as the engine that runs your app.
**What it does here:** Handles all the pages, routing, and server-side logic. When you go to `/tasks` or `/dashboard`, Next.js is what shows the right page.
**Key concept:** "App Router" — each folder in `src/app/` is a URL route in your app.

### React
**What it is:** The JavaScript library that Next.js is built on. It builds the UI out of reusable "components" (like LEGO bricks — a button, a card, a sidebar).
**What it does here:** Every page and UI element you see is a React component.

### TypeScript
**What it is:** JavaScript with type labels added. Instead of just writing a variable, you say what kind of data it holds.
**What it does here:** Catches bugs before they happen. If you try to pass a number where a name is expected, TypeScript flags it before you even run the code.

### Tailwind CSS
**What it is:** A styling system where you add classes directly to HTML elements instead of writing a separate CSS file.
**What it does here:** All the spacing, colors, sizing, and layout. Classes like `px-4 py-3 rounded-xl` handle the visual styling.

### shadcn/ui
**What it is:** A library of pre-built, pre-styled UI components (buttons, modals, inputs, dropdowns).
**What it does here:** Provides the dialogs, buttons, inputs, and labels used throughout the app — especially in forms.

### Lucide React
**What it is:** An icon library — thousands of clean icons available as React components.
**What it does here:** Every icon in the app (the clipboard, pill, moon, flask, etc.) comes from Lucide.

---

## Backend / Database

### Supabase
**What it is:** A hosted database service built on PostgreSQL (the world's most popular open-source database). It gives you a real database, user auth, and file storage — all accessible through a web dashboard and API.
**What it does here:** Stores ALL of your app's data — homes, residents, drug tests, medications, tasks, messages, nightly reports. Every time a manager adds a resident or checks off a task, that data goes into Supabase.
**Key concepts:**
- **Tables** = filing cabinets (one per data type — `residents`, `tasks`, `homes`, etc.)
- **Rows** = individual records (one resident = one row)
- **Columns** = the labeled slots in each row (name, flag, status, etc.)
- **SQL** = the language used to create tables and query data
- **RLS** = Row Level Security — locks down who can read/write data (off during dev, on before going live)
- **Anon key** = the public connection key your app uses to talk to Supabase (in `.env.local`)

### PostgreSQL (via Supabase)
**What it is:** The actual database engine Supabase runs on. SQL you write in the Supabase dashboard goes directly here.
**What it does here:** Physically stores and retrieves all data.

---

## Auth

### Supabase Auth
**What it is:** Supabase's built-in user authentication system — handles sign-up, login, sessions.
**What it does here:** Will power the real login (email + password) when dev bypass is turned off. Already wired up — just disabled for now.
**Status:** Bypassed in dev mode. Two files to flip when ready: `src/middleware.ts` and `src/components/auth/UserProvider.tsx`.

---

## Deployment (planned)

### Vercel
**What it is:** A hosting platform built specifically for Next.js apps. You connect it to GitHub and it auto-deploys every time you push code.
**What it does here:** Will host the live version of Managr once ready to ship. Free tier works for early-stage apps.

### GitHub
**What it is:** Cloud storage for code. Tracks every change ever made (version history), lets you work on branches without breaking the main version.
**What it does here:** Stores the codebase. Repo: `github.com/aamirprinceali/managr`

---

## Dev Tools

### Node.js / npm
**What it is:** Node.js runs JavaScript outside the browser (on your computer/server). npm is its package manager — it installs all the libraries your app depends on.
**What it does here:** Runs `npm run dev` to start the local development server. All the packages in `node_modules/` were installed by npm.

### `.env.local`
**What it is:** A hidden file that stores secret config values (API keys, database URLs). Never committed to GitHub.
**What it does here:** Holds your Supabase URL and anon key so the app can connect to the database.

---

## Database Tables (what's in Supabase)

| Table | What it stores |
|---|---|
| `homes` | Each sober living house (name, address, bed count, manager) |
| `residents` | Full resident records (name, flag, status, sobriety date, contacts, etc.) |
| `drug_tests` | Individual drug test results per resident |
| `chores` | Chore assignments per resident |
| `notes` | Notes and incident reports per resident |
| `medications` | Medication records per resident (name, dosage, frequency) |
| `weekly_meetings` | Meeting logs per resident |
| `restrictions` | Active restrictions per resident |
| `profiles` | User accounts (owner, managers) with roles |
| `tasks` | All tasks — standard and group (meds, drug tests) |
| `task_group_completions` | Per-resident daily check-offs for group tasks |
| `messages` | Internal messages between owner and managers |
| `nightly_reports` | Daily nightly report submissions per home |
