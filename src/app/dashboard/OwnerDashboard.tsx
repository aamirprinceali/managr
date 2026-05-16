"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Building2, Users, BedDouble, AlertTriangle, FlaskConical,
  Moon, ChevronRight, CheckCircle, XCircle, TrendingUp,
  ArrowUpRight, Activity, Shield
} from "lucide-react";
import Link from "next/link";

type HomeData = {
  id: string; name: string; bed_count: number;
  residentCount: number; flaggedCount: number; nightlySubmitted: boolean;
};
type FlaggedResident = { id: string; full_name: string; home_id: string; home_name: string };
type OverdueTest    = { id: string; full_name: string; home_id: string; home_name: string; days_since: number };

function DonutRing({ pct }: { pct: number }) {
  const r = 52; const circ = 2 * Math.PI * r;
  const fill  = Math.min((pct / 100) * circ, circ);
  const color = pct >= 90 ? "#DC2626" : pct >= 70 ? "#D97706" : "#1B6EF3";
  return (
    <svg width="136" height="136" viewBox="0 0 136 136">
      <circle cx="68" cy="68" r={r} fill="none" stroke="#E2E8F0" strokeWidth="14" />
      <circle cx="68" cy="68" r={r} fill="none"
        stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="68" y="62" textAnchor="middle" fill="#0F172A" fontSize="22" fontWeight="700"
        fontFamily="Manrope, sans-serif">{pct}%</text>
      <text x="68" y="78" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="600"
        fontFamily="IBM Plex Sans, sans-serif" letterSpacing="0.08em">OCCUPIED</text>
    </svg>
  );
}

function HomeBarChart({ homes }: { homes: HomeData[] }) {
  if (homes.length === 0) return (
    <div className="h-28 flex items-center justify-center">
      <p className="text-xs text-slate-400">No homes yet</p>
    </div>
  );
  const barW = Math.min(28, Math.floor(220 / homes.length) - 6);
  const gap  = Math.floor(220 / homes.length);
  return (
    <svg viewBox={`0 0 ${Math.max(220, homes.length * gap)} 100`} className="w-full" style={{ height: "100px" }}>
      {homes.map((h, i) => {
        const pct   = h.bed_count > 0 ? Math.round((h.residentCount / h.bed_count) * 100) : 0;
        const barH  = Math.max(4, (pct / 100) * 72);
        const x     = i * gap + (gap - barW) / 2;
        const color = h.flaggedCount > 0 ? "#DC2626" : "#1B6EF3";
        return (
          <g key={h.id}>
            <rect x={x} y="10" width={barW} height="72" rx="4" fill="#F1F5F9" />
            <rect x={x} y={82 - barH} width={barW} height={barH} rx="4" fill={color} opacity="0.85" />
            <text x={x + barW / 2} y="98" textAnchor="middle" fill="#94A3B8" fontSize="7"
              fontFamily="IBM Plex Sans, sans-serif">
              {h.name.split(" ")[0].slice(0, 6)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function OwnerDashboard() {
  const [homes,          setHomes]          = useState<HomeData[]>([]);
  const [flagged,        setFlagged]        = useState<FlaggedResident[]>([]);
  const [overdue,        setOverdue]        = useState<OverdueTest[]>([]);
  const [totalResidents, setTotalResidents] = useState(0);
  const [totalBeds,      setTotalBeds]      = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [nightlySetup,   setNightlySetup]   = useState(true);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  }).toUpperCase();

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data: homesRaw } = await supabase
      .from("homes")
      .select("id, name, bed_count, house_manager_email, residents(id, flag, status, is_archived, full_name, home_id)")
      .order("name");

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const nightlyByHome: Record<string, boolean> = {};
    try {
      const { data: ns } = await supabase
        .from("nightly_reports").select("home_id")
        .gte("submitted_at", todayStart.toISOString());
      (ns ?? []).forEach((n: { home_id: string }) => { nightlyByHome[n.home_id] = true; });
    } catch { setNightlySetup(false); }

    if (homesRaw) {
      type R = { id: string; flag: string; status: string; is_archived: boolean; full_name: string; home_id: string };
      const allActive = homesRaw.flatMap(h => (h.residents as R[]).filter(r => !r.is_archived));
      const beds = homesRaw.reduce((s, h) => s + (h.bed_count || 0), 0);
      setTotalResidents(allActive.length);
      setTotalBeds(beds);
      setHomes(homesRaw.map(h => {
        const active = (h.residents as R[]).filter(r => !r.is_archived);
        return {
          id: h.id, name: h.name, bed_count: h.bed_count || 0,
          residentCount: active.length,
          flaggedCount: active.filter(r => r.flag === "Red").length,
          nightlySubmitted: !!nightlyByHome[h.id],
        };
      }));
      const nameMap: Record<string, string> = {};
      homesRaw.forEach(h => { nameMap[h.id] = h.name; });
      setFlagged(allActive.filter(r => r.flag === "Red").map(r => ({
        id: r.id, full_name: r.full_name, home_id: r.home_id, home_name: nameMap[r.home_id] ?? "Unknown",
      })));
    }

    const now = new Date();
    const monday = new Date(now);
    const d = now.getDay();
    monday.setDate(now.getDate() + (d === 0 ? -6 : 1 - d));
    const weekMonday = monday.toISOString().split("T")[0];
    const { data: residents } = await supabase
      .from("residents").select("id, full_name, home_id, homes(name)")
      .eq("is_archived", false).eq("status", "Active");
    if (residents) {
      const list: OverdueTest[] = [];
      for (const r of residents as unknown as { id: string; full_name: string; home_id: string; homes: { name: string } | null }[]) {
        const { data: t } = await supabase.from("drug_tests").select("test_date")
          .eq("resident_id", r.id).gte("test_date", weekMonday).limit(1).maybeSingle();
        if (!t) {
          const { data: lt } = await supabase.from("drug_tests").select("test_date")
            .eq("resident_id", r.id).order("test_date", { ascending: false }).limit(1).maybeSingle();
          const days = lt?.test_date
            ? Math.floor((Date.now() - new Date(lt.test_date).getTime()) / 86400000) : 999;
          list.push({ id: r.id, full_name: r.full_name, home_id: r.home_id, home_name: r.homes?.name ?? "Unknown", days_since: days });
        }
      }
      setOverdue(list.slice(0, 6));
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-32 rounded animate-pulse bg-slate-200" />
          <div className="h-8 w-28 rounded-lg animate-pulse bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-56 rounded-2xl animate-pulse bg-slate-100 border border-slate-200" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-56 rounded-2xl animate-pulse bg-slate-100 border border-slate-200" />
          <div className="lg:col-span-2 h-56 rounded-2xl animate-pulse bg-slate-100 border border-slate-200" />
        </div>
      </div>
    );
  }

  const occ = totalBeds > 0 ? Math.round((totalResidents / totalBeds) * 100) : 0;
  const nightlyPending = homes.filter(h => !h.nightlySubmitted).length;
  const allClear = flagged.length === 0;

  return (
    <div className="max-w-7xl mx-auto fade-in">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-slate-500">This Week</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {todayDisplay}
          </span>
          <Link href="/reports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowUpRight size={12} />
            Export Report
          </Link>
        </div>
      </div>

      {/* Row 1: 3 stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Card 1: Occupancy donut */}
        <div className="dash-card p-5 flex flex-col">
          <p className="card-label mb-4">Occupancy Overview</p>
          <div className="flex items-center gap-5 flex-1">
            <DonutRing pct={occ} />
            <div className="space-y-3 flex-1">
              {[
                { label: "Total Homes",  value: homes.length,                              color: "#1B6EF3" },
                { label: "Residents",    value: totalResidents,                             color: "#64748B" },
                { label: "Open Beds",    value: Math.max(0, totalBeds - totalResidents),   color: "#16A34A" },
                { label: "Red Flags",    value: flagged.length, color: flagged.length > 0 ? "#DC2626" : "#94A3B8" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs text-slate-500">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: House Status */}
        <div className="dash-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="card-label">House Status</p>
            <Link href="/homes" className="text-[10px] font-semibold text-blue-500">View all</Link>
          </div>
          <div className="space-y-3 flex-1">
            {homes.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-6">
                <div>
                  <p className="text-sm text-center text-slate-400">No homes yet</p>
                  <Link href="/homes" className="text-xs block text-center mt-1 text-blue-500">Add a home</Link>
                </div>
              </div>
            ) : (
              homes.map(h => {
                const p = h.bed_count > 0 ? Math.round((h.residentCount / h.bed_count) * 100) : 0;
                const barColor = h.flaggedCount > 0 ? "#DC2626" : p >= 90 ? "#D97706" : "#1B6EF3";
                return (
                  <Link key={h.id} href={`/homes/${h.id}`} className="block group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                        {h.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {nightlySetup && (
                          h.nightlySubmitted
                            ? <CheckCircle size={11} className="text-green-500" strokeWidth={2.5} />
                            : <XCircle size={11} className="text-slate-300" strokeWidth={2} />
                        )}
                        {h.flaggedCount > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full pill-danger">
                            {h.flaggedCount} flagged
                          </span>
                        )}
                        <span className="text-xs font-bold" style={{ color: barColor }}>{p}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(p, 100)}%`, background: barColor }} />
                    </div>
                    <p className="text-[10px] mt-1 text-slate-400">{h.residentCount} of {h.bed_count} beds</p>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Card 3: Occupancy bar chart */}
        <div className="dash-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="card-label">Occupancy by Home</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-blue-500" />
                <span className="text-[9px] text-slate-400">OK</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-red-500" />
                <span className="text-[9px] text-slate-400">Flagged</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <HomeBarChart homes={homes} />
          </div>
          <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Overall occupancy</span>
            <span className="text-sm font-bold text-slate-800">{occ}%</span>
          </div>
        </div>

      </div>

      {/* Row 2: Flags accent card + Drug tests + Nightly */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Intentionally dark accent card — Flags & Alerts */}
        <div className="gradient-card lg:col-span-3 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.25)" }}>
                <Shield size={12} style={{ color: "#93C5FD" }} strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold" style={{ color: "#93C5FD" }}>Flags &amp; Alerts</span>
            </div>
            <ArrowUpRight size={14} style={{ color: "#475569" }} />
          </div>

          {allClear ? (
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-2xl font-bold mb-2" style={{ color: "#F1F5F9" }}>
                All houses are<br />operating normally.
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} style={{ color: "#22C55E" }} strokeWidth={2.5} />
                <span className="text-sm font-medium" style={{ color: "#22C55E" }}>No active flags</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <p className="text-xl font-bold mb-3" style={{ color: "#F1F5F9" }}>
                {flagged.length} resident{flagged.length !== 1 ? "s" : ""} need{flagged.length === 1 ? "s" : ""} your attention.
              </p>
              <div className="space-y-2 flex-1">
                {flagged.slice(0, 4).map(r => (
                  <Link key={r.id} href={`/homes/${r.home_id}/residents/${r.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                    style={{ background: "rgba(0,0,0,0.2)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.3)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.2)"}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#EF4444" }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{r.full_name}</span>
                      <span className="text-xs ml-2" style={{ color: "#64748B" }}>{r.home_name}</span>
                    </div>
                    <ChevronRight size={12} style={{ color: "#475569" }} />
                  </Link>
                ))}
                {flagged.length > 4 && (
                  <p className="text-xs pl-2" style={{ color: "#64748B" }}>+{flagged.length - 4} more flagged</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-4">
            <div className="w-4 h-1 rounded-full" style={{ background: "#3B82F6" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Drug tests overdue */}
          <div className="dash-card p-5 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FlaskConical size={13} strokeWidth={2}
                  className={overdue.length > 0 ? "text-amber-500" : "text-slate-400"} />
                <p className="card-label">Drug Tests</p>
                {overdue.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full pill-warning">
                    {overdue.length} overdue
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400">This week</span>
            </div>
            {overdue.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle size={18} className="text-green-500 mx-auto mb-1" strokeWidth={1.5} />
                  <p className="text-xs font-medium text-green-600">All tested this week</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 flex-1">
                {overdue.slice(0, 4).map(r => (
                  <Link key={r.id} href={`/homes/${r.home_id}/residents/${r.id}`}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{r.full_name}</p>
                      <p className="text-[10px] text-slate-400">{r.home_name}</p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
                      {r.days_since >= 999 ? "Never" : `${r.days_since}d`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Nightly reports */}
          <div className="dash-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon size={13} className="text-slate-400" strokeWidth={2} />
                <p className="card-label">Nightly Reports</p>
              </div>
              <Link href="/nightly" className="text-[10px] font-semibold text-blue-500">View all</Link>
            </div>
            <div className="space-y-1.5">
              {!nightlySetup ? (
                <p className="text-xs text-slate-400">Run Block 5 in Setup to enable</p>
              ) : homes.length === 0 ? (
                <p className="text-xs text-slate-400">No homes yet</p>
              ) : (
                homes.map(h => (
                  <Link key={h.id} href={`/nightly?home=${h.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{h.name}</p>
                    </div>
                    {h.nightlySubmitted
                      ? <div className="flex items-center gap-1">
                          <CheckCircle size={11} className="text-green-500" strokeWidth={2.5} />
                          <span className="text-[10px] font-medium text-green-600">Done</span>
                        </div>
                      : <div className="flex items-center gap-1">
                          <XCircle size={11} className="text-slate-300" strokeWidth={2} />
                          <span className="text-[10px] font-medium text-slate-400">Missing</span>
                        </div>
                    }
                  </Link>
                ))
              )}
            </div>
            {nightlySetup && homes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Submitted tonight</span>
                <span className="text-sm font-bold text-slate-800">
                  {homes.filter(h => h.nightlySubmitted).length}/{homes.length}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
