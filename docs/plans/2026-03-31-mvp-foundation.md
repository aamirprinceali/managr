# Managr MVP Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the Managr Next.js app with Supabase connected, shadcn/ui installed, and the Homes screen fully built and displaying real data.

**Architecture:** Next.js 14 App Router for routing and server components. Supabase for database, auth, and file storage. shadcn/ui + Tailwind for a premium, consistent component system. Mobile-first layout that works beautifully in a phone browser.

**Tech Stack:** Next.js 14, Supabase, Tailwind CSS, shadcn/ui, TypeScript

---

## Task 1: Scaffold the Next.js App

**What this does:** Creates the entire project structure — the foundation everything else is built on.

**Files:**
- Create: `/Users/aamir/Desktop/dev/managr/` (entire Next.js project here)

**Step 1: Run the scaffolding command**

```bash
cd /Users/aamir/Desktop/dev/managr
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

Expected: Next.js project created with TypeScript, Tailwind, App Router, and src/ directory.

**Step 2: Verify it runs**

```bash
npm run dev
```

Open browser to http://localhost:3000 — should see default Next.js welcome page.

**Step 3: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js app with TypeScript and Tailwind"
git push
```

---

## Task 2: Install shadcn/ui

**What this does:** Adds a premium component library — pre-built buttons, cards, modals, forms, badges. Saves hundreds of hours of styling work.

**Files:**
- Modify: `components.json` (auto-created)
- Create: `src/components/ui/` (auto-created by shadcn)

**Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted, choose:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

**Step 2: Install the core components we'll use throughout the app**

```bash
npx shadcn@latest add button card badge input label dialog sheet select textarea avatar separator tabs
```

**Step 3: Verify components exist**

```bash
ls src/components/ui/
```

Expected: button.tsx, card.tsx, badge.tsx, input.tsx, etc.

**Step 4: Commit**

```bash
git add .
git commit -m "feat: install shadcn/ui with core components"
git push
```

---

## Task 3: Set Up Global Layout and Design Tokens

**What this does:** Creates the shell of the app — the sidebar/nav, the color system, and the page wrapper that every screen shares. This is what makes the app look premium and consistent.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/MobileNav.tsx`

**Step 1: Set custom design tokens in globals.css**

Replace the CSS variables section in `src/app/globals.css` with Managr's color system:

```css
@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --primary: 222 47% 18%;
    --primary-foreground: 0 0% 98%;
    --secondary: 43 96% 56%;
    --secondary-foreground: 222 47% 11%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 46%;
    --accent: 43 96% 56%;
    --accent-foreground: 222 47% 11%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 222 47% 18%;
    --radius: 0.75rem;

    /* Managr status colors */
    --flag-green: 142 71% 45%;
    --flag-yellow: 43 96% 56%;
    --flag-red: 0 84% 60%;
  }
}
```

**Step 2: Create the AppShell component**

Create `src/components/layout/AppShell.tsx`:

```tsx
// AppShell wraps every page — handles the sidebar on desktop and bottom nav on mobile
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — visible on desktop, hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom nav — visible on mobile, hidden on desktop */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
```

**Step 3: Create the Sidebar component**

Create `src/components/layout/Sidebar.tsx`:

```tsx
// Sidebar navigation for desktop view
import Link from "next/link";
import { Home, Users, FileText, Settings } from "lucide-react";

const navItems = [
  { href: "/homes", label: "Homes", icon: Home },
  { href: "/residents", label: "Residents", icon: Users },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-primary flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">
          Managr
        </h1>
        <p className="text-xs text-primary-foreground/60 mt-1">Recovery Housing</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors mb-1"
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom user area */}
      <div className="px-6 py-6 border-t border-primary-foreground/20">
        <p className="text-xs text-primary-foreground/50">Managr v1.0</p>
      </div>
    </aside>
  );
}
```

**Step 4: Create the MobileNav component**

Create `src/components/layout/MobileNav.tsx`:

```tsx
// Bottom navigation bar for mobile — the main way house managers navigate
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/homes", label: "Homes", icon: Home },
  { href: "/residents", label: "Residents", icon: Users },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 5: Install lucide-react (icons)**

```bash
npm install lucide-react
```

**Step 6: Update root layout to use AppShell**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Managr — Recovery Housing",
  description: "Sober living operations management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

**Step 7: Verify it looks right**

```bash
npm run dev
```

Open http://localhost:3000 — should see the dark sidebar on desktop, and on mobile (resize browser) the bottom nav should appear.

**Step 8: Commit**

```bash
git add .
git commit -m "feat: add app shell layout with sidebar and mobile nav"
git push
```

---

## Task 4: Set Up Supabase

**What this does:** Creates the database that stores all homes, residents, chores, tests, etc. Supabase is free and handles everything — database, login, and file uploads.

**Step 1: Create a Supabase account and project**

1. Go to https://supabase.com and sign up (free)
2. Click "New Project"
3. Name it: `managr`
4. Set a strong database password (save it somewhere)
5. Region: US East
6. Click "Create new project" — wait ~2 minutes

**Step 2: Get your project credentials**

In Supabase dashboard:
- Go to Settings → API
- Copy: **Project URL** and **anon public key**

**Step 3: Create .env.local file**

Create `/Users/aamir/Desktop/dev/managr/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Step 4: Install Supabase client**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Step 5: Create Supabase client utility**

Create `src/lib/supabase/client.ts`:

```ts
// Client-side Supabase connection — used in React components
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/server.ts`:

```ts
// Server-side Supabase connection — used in server components and API routes
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

**Step 6: Create the database tables in Supabase**

In Supabase dashboard → SQL Editor, run this SQL:

```sql
-- Homes table
create table homes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  notes text,
  bed_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Residents table
create table residents (
  id uuid default gen_random_uuid() primary key,
  home_id uuid references homes(id) on delete set null,
  full_name text not null,
  photo_url text,
  move_in_date date,
  move_out_date date,
  status text default 'Active' check (status in ('Active', 'On Pass', 'Discharged')),
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  points integer default 0,
  flag text default 'Green' check (flag in ('Green', 'Yellow', 'Red')),
  sobriety_date date,
  drug_of_choice text,
  risk_level text default 'Low' check (risk_level in ('Low', 'Medium', 'High')),
  is_archived boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (protects data)
alter table homes enable row level security;
alter table residents enable row level security;

-- Allow all operations for now (we'll tighten this with auth later)
create policy "Allow all" on homes for all using (true);
create policy "Allow all" on residents for all using (true);
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: connect Supabase and create homes/residents tables"
git push
```

---

## Task 5: Build the Homes Screen

**What this does:** The main landing screen after login. Shows all houses as cards. House managers can see at a glance how full each home is and which residents are flagged.

**Files:**
- Create: `src/app/homes/page.tsx`
- Create: `src/components/homes/HomeCard.tsx`
- Create: `src/components/homes/AddHomeDialog.tsx`
- Modify: `src/app/page.tsx` (redirect to /homes)

**Step 1: Create the HomeCard component**

Create `src/components/homes/HomeCard.tsx`:

```tsx
// A single home displayed as a card on the Homes screen
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";
import Link from "next/link";

type HomeCardProps = {
  id: string;
  name: string;
  address: string | null;
  residentCount: number;
  flaggedCount: number;
};

export default function HomeCard({ id, name, address, residentCount, flaggedCount }: HomeCardProps) {
  return (
    <Link href={`/homes/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-border">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg text-foreground">{name}</h3>
            {flaggedCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {flaggedCount} flagged
              </Badge>
            )}
          </div>
          {address && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin size={13} />
              <span>{address}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={15} />
            <span>{residentCount} resident{residentCount !== 1 ? "s" : ""}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 2: Create the AddHomeDialog component**

Create `src/components/homes/AddHomeDialog.tsx`:

```tsx
// Modal dialog to add a new home — taps the + button on the Homes screen
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AddHomeDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", notes: "", bed_count: "" });
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Insert the new home into Supabase
    const { error } = await supabase.from("homes").insert({
      name: form.name,
      address: form.address || null,
      notes: form.notes || null,
      bed_count: form.bed_count ? parseInt(form.bed_count) : 0,
    });

    if (!error) {
      setOpen(false);
      setForm({ name: "", address: "", notes: "", bed_count: "" });
      router.refresh(); // Reload the page to show the new home
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={18} />
          Add Home
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a New Home</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Home Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Oak House"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, Plano TX"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bed_count">Number of Beds</Label>
            <Input
              id="bed_count"
              type="number"
              placeholder="6"
              value={form.bed_count}
              onChange={e => setForm({ ...form, bed_count: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this home..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Home"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Create the Homes page**

Create `src/app/homes/page.tsx`:

```tsx
// Main Homes screen — lists all homes, lets admin add new ones
import { createClient } from "@/lib/supabase/server";
import HomeCard from "@/components/homes/HomeCard";
import AddHomeDialog from "@/components/homes/AddHomeDialog";
import { Building2 } from "lucide-react";

export default async function HomesPage() {
  const supabase = await createClient();

  // Fetch all homes with resident counts
  const { data: homes } = await supabase
    .from("homes")
    .select("*, residents(id, flag)")
    .order("name");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Homes</h1>
          <p className="text-muted-foreground mt-1">
            {homes?.length ?? 0} house{homes?.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <AddHomeDialog />
      </div>

      {/* Homes grid */}
      {homes && homes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {homes.map(home => {
            const residents = home.residents ?? [];
            const flaggedCount = residents.filter((r: any) => r.flag === "Red").length;
            return (
              <HomeCard
                key={home.id}
                id={home.id}
                name={home.name}
                address={home.address}
                residentCount={residents.length}
                flaggedCount={flaggedCount}
              />
            );
          })}
        </div>
      ) : (
        // Empty state — shown when no homes have been added yet
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No homes yet</h3>
          <p className="text-muted-foreground mb-6">Add your first home to get started.</p>
          <AddHomeDialog />
        </div>
      )}
    </div>
  );
}
```

**Step 4: Redirect root page to /homes**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/homes");
}
```

**Step 5: Verify everything works**

```bash
npm run dev
```

- Open http://localhost:3000 — should redirect to /homes
- Should see "No homes yet" empty state
- Click "Add Home" — dialog should open
- Fill in a name and submit — new home card should appear
- Home card should link to /homes/[id] (will build next)

**Step 6: Commit**

```bash
git add .
git commit -m "feat: build Homes screen with list and add home dialog"
git push
```

---

## Task 6: Build the Home Dashboard

**What this does:** The screen you see after tapping a home card. Shows that home's residents sorted by flag color — red residents are always shown first so managers see who needs attention immediately.

**Files:**
- Create: `src/app/homes/[id]/page.tsx`
- Create: `src/components/residents/ResidentRow.tsx`

**Step 1: Create the ResidentRow component**

Create `src/components/residents/ResidentRow.tsx`:

```tsx
// A single resident shown in the list on the Home Dashboard
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type ResidentRowProps = {
  id: string;
  homeId: string;
  fullName: string;
  status: string;
  flag: string;
  points: number;
  sobrietyDate: string | null;
};

// Maps flag color name to Tailwind CSS class
const flagColors = {
  Green: "bg-green-500",
  Yellow: "bg-yellow-400",
  Red: "bg-red-500",
};

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  Active: "default",
  "On Pass": "secondary",
  Discharged: "outline",
};

export default function ResidentRow({ id, homeId, fullName, status, flag, points, sobrietyDate }: ResidentRowProps) {
  // Calculate days sober from sobriety date
  const daysSober = sobrietyDate
    ? Math.floor((Date.now() - new Date(sobrietyDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link href={`/homes/${homeId}/residents/${id}`}>
      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-shadow cursor-pointer">
        {/* Flag color dot */}
        <div className={cn("w-3 h-3 rounded-full flex-shrink-0", flagColors[flag as keyof typeof flagColors] ?? "bg-gray-400")} />

        {/* Resident info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{fullName}</p>
          <div className="flex items-center gap-2 mt-1">
            {daysSober !== null && (
              <span className="text-xs text-muted-foreground">{daysSober}d sober</span>
            )}
            <span className="text-xs text-muted-foreground">· {points} pts</span>
          </div>
        </div>

        {/* Status badge */}
        <Badge variant={statusVariants[status] ?? "outline"} className="flex-shrink-0 text-xs">
          {status}
        </Badge>

        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  );
}
```

**Step 2: Create the Home Dashboard page**

Create `src/app/homes/[id]/page.tsx`:

```tsx
// Home Dashboard — shows everything about one specific home and its residents
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ResidentRow from "@/components/residents/ResidentRow";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Plus } from "lucide-react";
import Link from "next/link";

export default async function HomeDashboard({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Fetch the home
  const { data: home } = await supabase
    .from("homes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!home) notFound();

  // Fetch residents sorted by flag (Red first, then Yellow, then Green)
  const { data: residents } = await supabase
    .from("residents")
    .select("*")
    .eq("home_id", params.id)
    .eq("is_archived", false)
    .order("flag", { ascending: true }); // Red comes before Yellow and Green alphabetically — we sort manually below

  // Sort: Red → Yellow → Green → others
  const flagOrder = { Red: 0, Yellow: 1, Green: 2 };
  const sorted = (residents ?? []).sort((a, b) =>
    (flagOrder[a.flag as keyof typeof flagOrder] ?? 3) - (flagOrder[b.flag as keyof typeof flagOrder] ?? 3)
  );

  const activeCount = sorted.filter(r => r.status === "Active").length;
  const onPassCount = sorted.filter(r => r.status === "On Pass").length;
  const flaggedCount = sorted.filter(r => r.flag === "Red").length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <Link href="/homes" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={18} />
        <span className="text-sm">All Homes</span>
      </Link>

      {/* Home header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{home.name}</h1>
        {home.address && <p className="text-muted-foreground mt-1">{home.address}</p>}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Active</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{onPassCount}</p>
          <p className="text-xs text-muted-foreground mt-1">On Pass</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className={`text-2xl font-bold ${flaggedCount > 0 ? "text-red-500" : "text-foreground"}`}>{flaggedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Flagged</p>
        </div>
      </div>

      {/* Residents header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users size={20} />
          Residents
        </h2>
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          Add Resident
        </Button>
      </div>

      {/* Residents list */}
      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map(r => (
            <ResidentRow
              key={r.id}
              id={r.id}
              homeId={home.id}
              fullName={r.full_name}
              status={r.status}
              flag={r.flag}
              points={r.points}
              sobrietyDate={r.sobriety_date}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={40} className="text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No residents in this home yet.</p>
          <Button className="mt-4 gap-2">
            <Plus size={16} />
            Add First Resident
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify**

```bash
npm run dev
```

- Add a home → click into it → should see the Home Dashboard
- Stats row should show 0/0/0
- Empty state should show "No residents yet"

**Step 4: Commit**

```bash
git add .
git commit -m "feat: build Home Dashboard with resident list and stats"
git push
```

---

## Session 1 Complete

After these 6 tasks, you will have:
- ✅ Next.js app running locally
- ✅ shadcn/ui installed with premium components
- ✅ Sidebar (desktop) + bottom nav (mobile) layout
- ✅ Supabase database connected with homes + residents tables
- ✅ Homes screen — list, add, empty state
- ✅ Home Dashboard — stats, resident list, sorted by flag

**Next session:** Add Resident form + Resident Profile screen
