"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users, FlaskConical, CheckSquare, Moon, ChevronRight,
  CheckCircle, MessageCircle, XCircle, Shield, ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/components/auth/UserProvider";

type Resident = {
  id: string; full_name: string; flag: string; status: string;
  sobriety_date: string | null; home_id: string;
};
type Message = {
  id: string; from_name: string; subject: string; body: string;
  is_read: boolean; created_at: string; is_from_owner: boolean;
};

function sobrietyDays(date: string | null) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function FlagDot({ flag }: { flag: string }) {
  const color = flag === "Red" ? "#DC2626" : flag === "Yellow" ? "#D97706" : "#16A34A";
  return <div className="flag-dot flex-shrink-0" style={{ background: color }} />;
}

const FLAG_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Active:     { bg: "#DCFCE7", color: "#15803D" },
  "On Pass":  { bg: "#DBEAFE", color: "#1D4ED8" },
  Discharged: { bg: "#F1F5F9", color: "#475569" },
};

export default function ManagerDashboard() {
  const { profile } = useProfile();
  const homeId    = profile?.home_id;
  const firstName = profile?.full_name?.split(" ")[0] ?? "Manager";

  const [homeName,         setHomeName]         = useState("");
  const [residents,        setResidents]        = useState<Resident[]>([]);
  const [messages,         setMessages]         = useState<Message[]>([]);
  const [drugTestsDue,     setDrugTestsDue]     = useState(0);
  const [choresOverdue,    setChoresOverdue]    = useState(0);
  const [nightlySubmitted, setNightlySubmitted] = useState(false);
  const [tasksPending,     setTasksPending]     = useState(0);
  const [assignedTasks,    setAssignedTasks]    = useState(0);
  const [loading,          setLoading]          = useState(true);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  }).toUpperCase();

  const hour = new Date().getHours();
  const showNightlyBanner = hour >= 20 && !nightlySubmitted;

  useEffect(() => { if (homeId) load(); }, [homeId]);

  async function load() {
    if (!homeId) return;
    const supabase = createClient();

    const { data: home } = await supabase.from("homes").select("name").eq("id", homeId).maybeSingle();
    setHomeName(home?.name ?? "Your Home");

    const { data: resData } = await supabase
      .from("residents")
      .select("id, full_name, flag, status, sobriety_date, home_id")
      .eq("home_id", homeId).eq("is_archived", false);

    const order = { Red: 0, Yellow: 1, Green: 2 };
    const sorted = (resData ?? []).sort((a, b) =>
      (order[a.flag as keyof typeof order] ?? 3) - (order[b.flag as keyof typeof order] ?? 3)
    );
    setResidents(sorted as Resident[]);
    const active = (resData ?? []).filter(r => (r as Resident).status === "Active");

    const now = new Date();
    const d = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + (d === 0 ? -6 : 1 - d));
    const weekMonday = monday.toISOString().split("T")[0];
    let due = 0;
    for (const r of active) {
      const { data: t } = await supabase.from("drug_tests").select("id")
        .eq("resident_id", r.id).gte("test_date", weekMonday).limit(1).maybeSingle();
      if (!t) due++;
    }
    setDrugTestsDue(due);

    const today = now.toISOString().split("T")[0];
    const { count } = await supabase.from("chores").select("id", { count: "exact", head: true })
      .in("resident_id", active.map(r => r.id))
      .eq("status", "Pending").lte("due_date", today);
    setChoresOverdue(count ?? 0);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    try {
      const { data: n } = await supabase.from("nightly_reports").select("id")
        .eq("home_id", homeId).gte("submitted_at", todayStart.toISOString()).limit(1).maybeSingle();
      setNightlySubmitted(!!n);
    } catch {}

    try {
      const { data: msgs } = await supabase.from("messages")
        .select("id, from_name, subject, body, is_read, created_at")
        .eq("to_home_id", homeId).eq("is_read", false)
        .order("created_at", { ascending: false }).limit(5);
      setMessages((msgs ?? []).map(m => ({
        ...m,
        is_from_owner: (m.from_name ?? "").toLowerCase().includes("mike") ||
                       (m.from_name ?? "").toLowerCase().includes("owner"),
      })) as Message[]);
    } catch {}

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: taskData } = await supabase.from("tasks")
        .select("id, status, is_recurring, last_completed_at, recurrence_type, task_type, assigned_by")
        .eq("home_id", homeId);
      if (taskData) {
        let pending = 0, assigned = 0;
        for (const t of taskData) {
          const isRec   = t.is_recurring as boolean;
          const status  = t.status as string;
          const last    = t.last_completed_at as string | null;
          const recType = t.recurrence_type as string | null;
          const ttype   = (t.task_type as string) ?? "standard";
          let isDue = false;
          if (ttype !== "standard")       isDue = !last || last.split("T")[0] < todayStr;
          else if (isRec)                 isDue = !last ? true : recType === "daily" ? last.split("T")[0] < todayStr : false;
          else                            isDue = status !== "Done";
          if (isDue) pending++;
          if (t.assigned_by) assigned++;
        }
        setTasksPending(pending);
        setAssignedTasks(assigned);
      }
    } catch {}

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 fade-in">
        <div className="h-12 rounded-xl animate-pulse bg-slate-100 border border-slate-200" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl animate-pulse bg-slate-100 border border-slate-200" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-64 rounded-xl animate-pulse bg-slate-100 border border-slate-200" />)}
        </div>
      </div>
    );
  }

  const openFlags = residents.filter(r => r.flag === "Red" || r.flag === "Yellow");

  return (
    <div className="max-w-6xl mx-auto fade-in">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-slate-600">{homeName}</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {todayDisplay}
        </span>
      </div>

      {/* Nightly banner */}
      {showNightlyBanner && (
        <Link href="/nightly"
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 fade-in bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <Moon size={15} className="text-amber-500" strokeWidth={2} />
            <div>
              <p className="text-sm font-semibold text-amber-700">Nightly report not submitted</p>
              <p className="text-xs text-amber-500">Tap to complete tonight&apos;s report</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-amber-400" />
        </Link>
      )}

      {nightlySubmitted && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 fade-in bg-green-50 border border-green-200">
          <CheckCircle size={14} className="text-green-500" strokeWidth={2.5} />
          <p className="text-sm font-semibold text-green-700">Nightly report submitted</p>
        </div>
      )}

      {/* Checklist stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Tests Due",      value: drugTestsDue,    icon: FlaskConical,  href: `/homes/${homeId}`, ok: drugTestsDue === 0,    accentOk: "#16A34A", accent: "#D97706" },
          { label: "Chores Overdue", value: choresOverdue,   icon: CheckSquare,   href: `/homes/${homeId}`, ok: choresOverdue === 0,   accentOk: "#16A34A", accent: "#DC2626" },
          { label: "Nightly",        value: nightlySubmitted ? "Done" : "Pending", icon: nightlySubmitted ? CheckCircle : Moon, href: "/nightly", ok: nightlySubmitted, accentOk: "#16A34A", accent: "#D97706", isText: true },
          { label: "Tasks",          value: tasksPending === 0 ? "All Done" : tasksPending, icon: ClipboardList, href: "/tasks", ok: tasksPending === 0, accentOk: "#16A34A", accent: "#1B6EF3", isText: tasksPending === 0 },
        ].map(card => {
          const color = card.ok ? card.accentOk : card.accent;
          const iconBg = card.ok ? "#DCFCE7" : card.label === "Tasks" && !card.ok ? "#DBEAFE" : card.label === "Tests Due" ? "#FEF3C7" : "#FEE2E2";
          return (
            <Link key={card.label} href={card.href} className="dash-card p-4 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
                  <card.icon size={15} strokeWidth={2} style={{ color }} />
                </div>
                {card.label === "Tasks" && assignedTasks > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full pill-blue">
                    {assignedTasks} assigned
                  </span>
                )}
              </div>
              <p className="text-xl font-bold" style={{ color }}>{card.value}</p>
              <p className="text-xs font-medium mt-0.5 text-slate-400">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Residents list */}
        <div className="dash-card lg:col-span-3 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users size={13} className="text-slate-400" strokeWidth={2} />
              <p className="card-label">Residents</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">
                {residents.length}
              </span>
            </div>
            <Link href={homeId ? `/homes/${homeId}` : "/homes"}
              className="text-[10px] font-semibold text-blue-500">
              Full view
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {residents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-slate-400">No residents yet</p>
              </div>
            ) : (
              residents.slice(0, 10).map(r => {
                const days  = sobrietyDays(r.sobriety_date);
                const sSty  = FLAG_STATUS_STYLE[r.status] ?? FLAG_STATUS_STYLE.Discharged;
                return (
                  <Link key={r.id}
                    href={homeId ? `/homes/${homeId}/residents/${r.id}` : "#"}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <FlagDot flag={r.flag} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{r.full_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {days !== null ? `${days}d sober` : "No sobriety date"}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: sSty.bg, color: sSty.color }}>
                      {r.status}
                    </span>
                    <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Messages */}
          <div className="dash-card flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageCircle size={13} className="text-slate-400" strokeWidth={2} />
                <p className="card-label">Messages</p>
                {messages.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
                    {messages.length}
                  </span>
                )}
              </div>
              <Link href="/messages" className="text-[10px] font-semibold text-blue-500">Inbox</Link>
            </div>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
                <MessageCircle size={20} className="text-slate-200 mb-2" strokeWidth={1.5} />
                <p className="text-xs text-slate-400">No unread messages</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 flex-1">
                {messages.map(msg => (
                  <Link key={msg.id} href="/messages"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    style={msg.is_from_owner ? { borderLeft: "3px solid #D97706" } : { borderLeft: "3px solid transparent" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-slate-800">{msg.from_name}</span>
                        {msg.is_from_owner && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded pill-warning">OWNER</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate font-medium">{msg.subject}</p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 bg-blue-500" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Flags card */}
          {openFlags.length > 0 ? (
            <div className="gradient-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={12} style={{ color: "#93C5FD" }} strokeWidth={2} />
                <span className="text-xs font-semibold" style={{ color: "#93C5FD" }}>Needs Attention</span>
              </div>
              <p className="text-lg font-bold mb-3" style={{ color: "#F1F5F9" }}>
                {openFlags.length} resident{openFlags.length !== 1 ? "s" : ""} flagged
              </p>
              <div className="space-y-1.5">
                {openFlags.slice(0, 3).map(r => (
                  <Link key={r.id} href={homeId ? `/homes/${homeId}/residents/${r.id}` : "#"}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{ background: "rgba(0,0,0,0.2)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.3)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.2)"}
                  >
                    <FlagDot flag={r.flag} />
                    <span className="text-xs font-semibold" style={{ color: "#F1F5F9" }}>{r.full_name}</span>
                    <ChevronRight size={11} style={{ color: "#64748B" }} className="ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="dash-card p-5 flex items-center gap-3">
              <CheckCircle size={18} className="text-green-500" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-green-600">All clear</p>
                <p className="text-xs text-slate-400">No flagged residents</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
