"use client";
// Manager Dashboard — the daily operations hub
// Shows everything that needs attention TODAY: flagged residents, overdue drug tests, tasks, incidents
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, FlaskConical, CheckSquare, FileWarning, Building2, Users, BedDouble, DoorOpen, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

type FlaggedResident = {
  id: string;
  full_name: string;
  flag: string;
  status: string;
  home_id: string;
  home_name: string;
};

type OverdueTest = {
  id: string;
  full_name: string;
  home_id: string;
  home_name: string;
  last_test: string | null;
  days_since: number;
};

type Task = {
  id: string;
  title: string;
  priority: string;
  type: string;
  due_date: string | null;
  home_id: string | null;
  home_name: string | null;
  status: string;
};

type Incident = {
  id: string;
  body: string;
  created_at: string;
  resident_name: string;
  home_name: string;
};

type Stats = {
  homes: number;
  residents: number;
  openBeds: number;
  redFlags: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ homes: 0, residents: 0, openBeds: 0, redFlags: 0 });
  const [flagged, setFlagged] = useState<FlaggedResident[]>([]);
  const [overdueDrugTests, setOverdueDrugTests] = useState<OverdueTest[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [tasksAvailable, setTasksAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const todayDisplay = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    const supabase = createClient();

    // Load homes for stats
    const { data: homes } = await supabase.from("homes").select("id, bed_count, residents(id, flag, status, is_archived, full_name, home_id)");

    if (homes) {
      const activeResidents = homes.flatMap(h =>
        (h.residents as { id: string; flag: string; status: string; is_archived: boolean; full_name: string; home_id: string }[])
          .filter(r => !r.is_archived)
      );
      const totalBeds = homes.reduce((s, h) => s + (h.bed_count || 0), 0);
      const totalOccupied = activeResidents.length;
      const redFlags = activeResidents.filter(r => r.flag === "Red").length;

      setStats({
        homes: homes.length,
        residents: totalOccupied,
        openBeds: Math.max(0, totalBeds - totalOccupied),
        redFlags,
      });

      // Build flagged residents list with home names
      const homeMap: Record<string, string> = {};
      homes.forEach(h => {
        // We'll get names from a separate query
        homeMap[h.id] = h.id;
      });

      const { data: homeNames } = await supabase.from("homes").select("id, name");
      const nameMap: Record<string, string> = {};
      (homeNames ?? []).forEach((h: { id: string; name: string }) => { nameMap[h.id] = h.name; });

      const flaggedList: FlaggedResident[] = activeResidents
        .filter(r => r.flag === "Red")
        .map(r => ({
          id: r.id,
          full_name: r.full_name,
          flag: r.flag,
          status: r.status,
          home_id: r.home_id,
          home_name: nameMap[r.home_id] ?? "Unknown Home",
        }));
      setFlagged(flaggedList);
    }

    // Load residents NOT tested this calendar week (Monday–Sunday)
    // This auto-resets every Monday — no test records = needs testing this week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const weekMonday = monday.toISOString().split("T")[0];

    const { data: residents } = await supabase
      .from("residents")
      .select("id, full_name, home_id, homes(name)")
      .eq("is_archived", false)
      .eq("status", "Active");

    if (residents) {
      const overdueList: OverdueTest[] = [];
      for (const r of residents as { id: string; full_name: string; home_id: string; homes: { name: string } | null }[]) {
        // Check if they have any test THIS week (on or after Monday)
        const { data: thisWeekTest } = await supabase
          .from("drug_tests")
          .select("test_date")
          .eq("resident_id", r.id)
          .gte("test_date", weekMonday)
          .limit(1)
          .maybeSingle();

        if (!thisWeekTest) {
          // No test this week — get their last test ever for display purposes
          const { data: lastTest } = await supabase
            .from("drug_tests")
            .select("test_date")
            .eq("resident_id", r.id)
            .order("test_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          const lastDate = lastTest?.test_date ?? null;
          const daysSince = lastDate
            ? Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          overdueList.push({
            id: r.id,
            full_name: r.full_name,
            home_id: r.home_id,
            home_name: r.homes?.name ?? "Unknown",
            last_test: lastDate,
            days_since: daysSince,
          });
        }
      }
      setOverdueDrugTests(overdueList.slice(0, 10));
    }

    // Load tasks due today (graceful if tasks table doesn't exist)
    try {
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, priority, type, due_date, home_id, status")
        .eq("status", "Pending")
        .lte("due_date", today)
        .order("due_date");

      if (tasksError) {
        setTasksAvailable(false);
      } else if (tasks) {
        // Fetch home names for tasks
        const { data: homeNames } = await supabase.from("homes").select("id, name");
        const nameMap: Record<string, string> = {};
        (homeNames ?? []).forEach((h: { id: string; name: string }) => { nameMap[h.id] = h.name; });

        setTodayTasks(
          (tasks as { id: string; title: string; priority: string; type: string; due_date: string | null; home_id: string | null; status: string }[])
            .map(t => ({ ...t, home_name: t.home_id ? (nameMap[t.home_id] ?? null) : null }))
            .slice(0, 8)
        );
      }
    } catch {
      setTasksAvailable(false);
    }

    // Load recent incidents (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: incidents } = await supabase
      .from("notes")
      .select("id, body, created_at, resident_id, residents(full_name, home_id, homes(name))")
      .eq("type", "Incident")
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    if (incidents) {
      setRecentIncidents(
        (incidents as {
          id: string; body: string; created_at: string;
          residents: { full_name: string; homes: { name: string } | null } | null;
        }[]).map(i => ({
          id: i.id,
          body: i.body,
          created_at: i.created_at,
          resident_name: i.residents?.full_name ?? "Unknown",
          home_name: i.residents?.homes?.name ?? "Unknown",
        }))
      );
    }

    setLoading(false);
  }

  const priorityColor = (p: string) => {
    if (p === "Urgent") return { bg: "#FEE2E2", text: "#DC2626" };
    if (p === "High") return { bg: "#FEF3C7", text: "#D97706" };
    if (p === "Medium") return { bg: "#DBEAFE", text: "#2563EB" };
    return { bg: "#F1F5F9", text: "#64748B" };
  };

  const statCards = [
    { label: "Total Homes", value: stats.homes, icon: Building2, color: "#0284C7", bg: "#E8F4FD" },
    { label: "Residents", value: stats.residents, icon: Users, color: "#0B1F3A", bg: "#EEF2F7" },
    { label: "Open Beds", value: stats.openBeds, icon: DoorOpen, color: "#16A34A", bg: "#DCFCE7" },
    { label: "Red Flags", value: stats.redFlags, icon: AlertTriangle, color: stats.redFlags > 0 ? "#DC2626" : "#94A3B8", bg: stats.redFlags > 0 ? "#FEE2E2" : "#F1F5F9" },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 mt-2">
          {[1,2,3,4].map(i => <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B1F3A" }}>Dashboard</h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Calendar size={13} style={{ color: "#94A3B8" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>{todayDisplay}</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border rounded-2xl p-4" style={{ borderColor: "#DDE4ED" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={18} style={{ color }} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold leading-none" style={{ color: "#0B1F3A" }}>{value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "#64748B" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Flagged Residents */}
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: flagged.length > 0 ? "#FECACA" : "#DDE4ED" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FEE2E2" }}>
                <AlertTriangle size={14} style={{ color: "#DC2626" }} />
              </div>
              <span className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Needs Attention</span>
              {flagged.length > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#DC2626", color: "white" }}>
                  {flagged.length}
                </span>
              )}
            </div>
            <Link href="/residents" className="text-xs font-semibold" style={{ color: "#0284C7" }}>View all</Link>
          </div>
          {flagged.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold" style={{ color: "#16A34A" }}>All clear</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>No red-flagged residents right now</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {flagged.map(r => (
                <Link key={r.id} href={`/homes/${r.home_id}/residents/${r.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#0B1F3A" }}>{r.full_name}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{r.home_name} · {r.status}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: "#CBD5E1" }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Drug Tests Overdue */}
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#DDE4ED" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FEF3C7" }}>
                <FlaskConical size={14} style={{ color: "#D97706" }} />
              </div>
              <span className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Drug Tests Overdue</span>
              {overdueDrugTests.length > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#D97706", color: "white" }}>
                  {overdueDrugTests.length}
                </span>
              )}
            </div>
            <span className="text-xs" style={{ color: "#94A3B8" }}>This calendar week</span>
          </div>
          {overdueDrugTests.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold" style={{ color: "#16A34A" }}>All caught up</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>All active residents tested this week</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {overdueDrugTests.map(r => (
                <Link key={r.id} href={`/homes/${r.home_id}/residents/${r.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#0B1F3A" }}>{r.full_name}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>
                      {r.home_name} · {r.days_since >= 999 ? "Never tested" : r.days_since === 0 ? "Last tested today (different week)" : `Last tested ${r.days_since}d ago`}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: "#CBD5E1" }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Due */}
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#DDE4ED" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#EEF2F7" }}>
                <CheckSquare size={14} style={{ color: "#0B1F3A" }} />
              </div>
              <span className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Tasks Due</span>
              {todayTasks.length > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#0B1F3A", color: "white" }}>
                  {todayTasks.length}
                </span>
              )}
            </div>
            <Link href="/tasks" className="text-xs font-semibold" style={{ color: "#0284C7" }}>Manage tasks</Link>
          </div>
          {!tasksAvailable ? (
            <div className="px-5 py-6 text-center">
              <p className="text-xs font-semibold mb-1" style={{ color: "#D97706" }}>Tasks table not set up yet</p>
              <Link href="/seed" className="text-xs underline" style={{ color: "#0284C7" }}>Go to Setup page</Link>
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold" style={{ color: "#16A34A" }}>No tasks due</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Nothing overdue or due today</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {todayTasks.map(t => {
                const pc = priorityColor(t.priority);
                return (
                  <Link key={t.id} href="/tasks" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#0B1F3A" }}>{t.title}</p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{t.home_name ?? "All homes"}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: pc.bg, color: pc.text }}>
                      {t.priority}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Incidents */}
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#DDE4ED" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FEE2E2" }}>
                <FileWarning size={14} style={{ color: "#DC2626" }} />
              </div>
              <span className="font-bold text-sm" style={{ color: "#0B1F3A" }}>Recent Incidents</span>
            </div>
            <span className="text-xs" style={{ color: "#94A3B8" }}>Last 7 days</span>
          </div>
          {recentIncidents.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold" style={{ color: "#16A34A" }}>No incidents</p>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>No incidents reported this week</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {recentIncidents.map(i => (
                <div key={i.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold" style={{ color: "#0B1F3A" }}>{i.resident_name}</p>
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                      {new Date(i.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "#64748B" }}>{i.home_name}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "#94A3B8" }}>{i.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
