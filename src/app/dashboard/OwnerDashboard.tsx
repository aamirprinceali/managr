"use client";
// Owner Dashboard — Mike's command center, styled after NeuroBank reference
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Building2, Users, BedDouble, AlertTriangle, FlaskConical,
  Moon, ChevronRight, CheckCircle, XCircle, TrendingUp,
  ArrowUpRight, Activity, Shield
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type HomeData = {
  id: string; name: string; bed_count: number;
  residentCount: number; flaggedCount: number; nightlySubmitted: boolean;
};
type FlaggedResident = {
  id: string; full_name: string; home_id: string; home_name: string;
};
type OverdueTest = {
  id: string; full_name: string; home_id: string; home_name: string; days_since: number;
};

// ─── Donut Ring SVG ───────────────────────────────────────────────────────────
function DonutRing({ pct }: { pct: number }) {
  const r = 52; const circ = 2 * Math.PI * r;
  const fill = Math.min((pct / 100) * circ, circ);
  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#EAB308" : "#3B82F6";
  return (
    <svg width="136" height="136" viewBox="0 0 136 136">
      {/* Track */}
      <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
      {/* Fill */}
      <circle cx="68" cy="68" r={r} fill="none"
        stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      {/* Center */}
      <text x="68" y="62" textAnchor="middle" fill="#F1F5F9" fontSize="22" fontWeight="700"
        fontFamily="Plus Jakarta Sans, sans-serif">{pct}%</text>
      <text x="68" y="78" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="500"
        fontFamily="Plus Jakarta Sans, sans-serif" letterSpacing="0.08em">OCCUPIED</text>
    </svg>
  );
}

// ─── Mini Bar Chart SVG ───────────────────────────────────────────────────────
// Shows each home's occupancy as a vertical bar, like "Earning projections" in reference
function HomeBarChart({ homes }: { homes: HomeData[] }) {
  if (homes.length === 0) return (
    <div className="h-28 flex items-center justify-center">
      <p style={{ color: "#475569", fontSize: "0.75rem" }}>No homes yet</p>
    </div>
  );
  const maxBar = 100;
  const barW = Math.min(28, Math.floor(220 / homes.length) - 6);
  const gap = Math.floor(220 / homes.length);
  return (
    <svg viewBox={`0 0 ${Math.max(220, homes.length * gap)} 100`} className="w-full" style={{ height: "100px" }}>
      {homes.map((h, i) => {
        const pct = h.bed_count > 0 ? Math.round((h.residentCount / h.bed_count) * 100) : 0;
        const barH = Math.max(4, (pct / maxBar) * 72);
        const x = i * gap + (gap - barW) / 2;
        const color = h.flaggedCount > 0 ? "#EF4444" : "#3B82F6";
        return (
          <g key={h.id}>
            {/* Track */}
            <rect x={x} y="10" width={barW} height="72" rx="4" fill="rgba(255,255,255,0.04)" />
            {/* Bar */}
            <rect x={x} y={82 - barH} width={barW} height={barH} rx="4" fill={color} opacity="0.85" />
            {/* Label */}
            <text x={x + barW / 2} y="98" textAnchor="middle" fill="#334155" fontSize="7"
              fontFamily="Plus Jakarta Sans, sans-serif">
              {h.name.split(" ")[0].slice(0, 6)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Owner Dashboard ──────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [flagged, setFlagged] = useState<FlaggedResident[]>([]);
  const [overdue, setOverdue] = useState<OverdueTest[]>([]);
  const [totalResidents, setTotalResidents] = useState(0);
  const [totalBeds, setTotalBeds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nightlySetup, setNightlySetup] = useState(true);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  }).toUpperCase();

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();

    // Homes + residents
    const { data: homesRaw } = await supabase
      .from("homes")
      .select("id, name, bed_count, house_manager_email, residents(id, flag, status, is_archived, full_name, home_id)")
      .order("name");

    // Nightly status
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
        id: r.id, full_name: r.full_name, home_id: r.home_id,
        home_name: nameMap[r.home_id] ?? "Unknown",
      })));
    }

    // Drug tests overdue
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
            ? Math.floor((Date.now() - new Date(lt.test_date).getTime()) / 86400000)
            : 999;
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
          <div className="h-4 w-32 rounded animate-pulse" style={{ background: "#0F1523" }} />
          <div className="h-8 w-28 rounded-lg animate-pulse" style={{ background: "#0F1523" }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: "#0F1523" }} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-56 rounded-2xl animate-pulse" style={{ background: "#0F1523" }} />
          <div className="lg:col-span-2 h-56 rounded-2xl animate-pulse" style={{ background: "#0F1523" }} />
        </div>
      </div>
    );
  }

  const occ = totalBeds > 0 ? Math.round((totalResidents / totalBeds) * 100) : 0;
  const nightlyPending = homes.filter(h => !h.nightlySubmitted).length;
  const allClear = flagged.length === 0;

  return (
    <div className="max-w-7xl mx-auto fade-in">

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "#0F1523", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3B82F6" }} />
          <span className="text-xs font-semibold" style={{ color: "#94A3B8" }}>This Week</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#334155" }}>
            {todayDisplay}
          </span>
          <Link href="/reports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "#0F1523", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.06)" }}>
            <ArrowUpRight size={12} />
            Export Report
          </Link>
        </div>
      </div>

      {/* ── Row 1: 3 cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Card 1: Occupancy Overview — donut ring */}
        <div className="dash-card p-5 flex flex-col">
          <p className="card-label mb-4">Occupancy Overview</p>
          <div className="flex items-center gap-5 flex-1">
            <DonutRing pct={occ} />
            <div className="space-y-3 flex-1">
              {[
                { label: "Total Homes", value: homes.length, color: "#3B82F6" },
                { label: "Residents", value: totalResidents, color: "#94A3B8" },
                { label: "Open Beds", value: Math.max(0, totalBeds - totalResidents), color: "#22C55E" },
                { label: "Red Flags", value: flagged.length, color: flagged.length > 0 ? "#EF4444" : "#334155" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs" style={{ color: "#475569" }}>{s.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: House Status */}
        <div className="dash-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="card-label">House Status</p>
            <Link href="/homes" className="text-[10px] font-semibold" style={{ color: "#3B82F6" }}>
              View all
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {homes.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-6">
                <div>
                  <p className="text-sm text-center" style={{ color: "#334155" }}>No homes yet</p>
                  <Link href="/homes" className="text-xs block text-center mt-1" style={{ color: "#3B82F6" }}>
                    Add a home
                  </Link>
                </div>
              </div>
            ) : (
              homes.map(h => {
                const p = h.bed_count > 0 ? Math.round((h.residentCount / h.bed_count) * 100) : 0;
                const barColor = h.flaggedCount > 0 ? "#EF4444" : p >= 90 ? "#EAB308" : "#3B82F6";
                return (
                  <Link key={h.id} href={`/homes/${h.id}`} className="block group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors"
                        style={{ color: "#E2E8F0" }}>
                        {h.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {nightlySetup && (
                          h.nightlySubmitted
                            ? <CheckCircle size={11} style={{ color: "#22C55E" }} strokeWidth={2.5} />
                            : <XCircle size={11} style={{ color: "#334155" }} strokeWidth={2} />
                        )}
                        {h.flaggedCount > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>
                            {h.flaggedCount} flagged
                          </span>
                        )}
                        <span className="text-xs font-bold" style={{ color: barColor }}>{p}%</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(p, 100)}%`, background: barColor }} />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: "#334155" }}>
                      {h.residentCount} of {h.bed_count} beds
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Card 3: Occupancy by Home — bar chart like reference */}
        <div className="dash-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="card-label">Occupancy by Home</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: "#3B82F6" }} />
                <span className="text-[9px]" style={{ color: "#334155" }}>OK</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: "#EF4444" }} />
                <span className="text-[9px]" style={{ color: "#334155" }}>Flagged</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <HomeBarChart homes={homes} />
          </div>
          <div className="mt-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "#475569" }}>Overall occupancy</span>
              <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{occ}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Row 2: Gradient insights + Nightly/Drug tests ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Gradient card — like AI Insights in reference */}
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
                    className="flex items-center gap-3 px-3 py-2 rounded-lg row-hover"
                    style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#EF4444" }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{r.full_name}</span>
                      <span className="text-xs ml-2" style={{ color: "#64748B" }}>{r.home_name}</span>
                    </div>
                    <ChevronRight size={12} style={{ color: "#334155" }} />
                  </Link>
                ))}
                {flagged.length > 4 && (
                  <p className="text-xs pl-2" style={{ color: "#475569" }}>+{flagged.length - 4} more flagged</p>
                )}
              </div>
            </div>
          )}

          {/* Indicator dots */}
          <div className="flex items-center gap-1.5 mt-4">
            <div className="w-4 h-1 rounded-full" style={{ background: "#3B82F6" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
          </div>
        </div>

        {/* Right: Drug tests + nightly stacked */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Drug Tests Overdue */}
          <div className="dash-card p-5 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FlaskConical size={13} style={{ color: overdue.length > 0 ? "#EAB308" : "#334155" }} strokeWidth={2} />
                <p className="card-label">Drug Tests</p>
                {overdue.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(234,179,8,0.15)", color: "#EAB308" }}>
                    {overdue.length} overdue
                  </span>
                )}
              </div>
              <span className="text-[9px]" style={{ color: "#334155" }}>This week</span>
            </div>
            {overdue.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle size={18} style={{ color: "#22C55E" }} strokeWidth={1.5} className="mx-auto mb-1" />
                  <p className="text-xs font-medium" style={{ color: "#22C55E" }}>All tested</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 flex-1">
                {overdue.slice(0, 4).map(r => (
                  <Link key={r.id} href={`/homes/${r.home_id}/residents/${r.id}`}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg row-hover">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#EAB308" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#E2E8F0" }}>{r.full_name}</p>
                      <p className="text-[10px]" style={{ color: "#334155" }}>{r.home_name}</p>
                    </div>
                    <span className="text-[10px] font-medium flex-shrink-0" style={{ color: "#475569" }}>
                      {r.days_since >= 999 ? "Never" : `${r.days_since}d`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Nightly Reports */}
          <div className="dash-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon size={13} style={{ color: "#334155" }} strokeWidth={2} />
                <p className="card-label">Nightly Reports</p>
              </div>
              <Link href="/nightly" className="text-[10px] font-semibold" style={{ color: "#3B82F6" }}>
                View all
              </Link>
            </div>
            <div className="space-y-1.5">
              {!nightlySetup ? (
                <p className="text-xs" style={{ color: "#334155" }}>
                  Run Block 5 in Setup to enable
                </p>
              ) : homes.length === 0 ? (
                <p className="text-xs" style={{ color: "#334155" }}>No homes yet</p>
              ) : (
                homes.map(h => (
                  <Link key={h.id} href={`/nightly?home=${h.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg row-hover">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#E2E8F0" }}>{h.name}</p>
                    </div>
                    {h.nightlySubmitted
                      ? <div className="flex items-center gap-1">
                          <CheckCircle size={11} style={{ color: "#22C55E" }} strokeWidth={2.5} />
                          <span className="text-[10px] font-medium" style={{ color: "#22C55E" }}>Done</span>
                        </div>
                      : <div className="flex items-center gap-1">
                          <XCircle size={11} style={{ color: "#334155" }} strokeWidth={2} />
                          <span className="text-[10px] font-medium" style={{ color: "#475569" }}>Missing</span>
                        </div>
                    }
                  </Link>
                ))
              )}
            </div>
            {nightlySetup && homes.length > 0 && (
              <div className="mt-3 pt-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-[10px]" style={{ color: "#334155" }}>Submitted tonight</span>
                <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>
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
